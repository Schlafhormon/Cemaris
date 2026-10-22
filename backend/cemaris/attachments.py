"""Contract files derived from Sunrise CMS at 451ce034 (MIT).

Source helpers/attachments.helpers, database/*ContractAttachment and four
contracts handlers; see licenses/Sunrise-LICENSE.md. Soft deletion retains
bytes. Collisions use the sanitized basename and atomic exclusive creation:
the source reintroduces unsafe characters on its second filename attempt.
"""

from datetime import datetime
import math
from pathlib import Path
import re

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import sqlalchemy as sa
from sqlalchemy.exc import DataError, IntegrityError
from starlette.datastructures import UploadFile
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.formparsers import MultiPartException

from cemaris.burial_sites import _validate_values
from cemaris.catalogs import _catalog_error
from cemaris.contract_items import _integer
from cemaris.contracts import _audit, _children, _raw
from cemaris.db.schema import TABLES
from cemaris.preferences import now_millis, transaction


class AttachmentOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    attachments_path: Path = Path("data/attachments")
    max_attachment_file_size: float = Field(default=20, gt=0, allow_inf_nan=False)

    @property
    def max_bytes(self):
        return math.floor(self.max_attachment_file_size * 1024 * 1024)


def sanitize_filename(value):
    """sanitize-filename 1.6.4's default replacement and UTF-8 byte limit.

    Derived from Parsha Pourkhomami's ISC-licensed implementation; see
    licenses/sanitize-filename-LICENSE.md.
    """
    if not isinstance(value, str):
        raise ValueError("Filename must be text")
    value = re.sub(r'[/?<>\\:*|"\x00-\x1f\x80-\x9f]', "", value)
    if re.fullmatch(r"\.+", value) or re.match(r"^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$", value, re.I):
        value = ""
    value = re.sub(r"[. ]+$", "", value)
    return value.encode("utf-8")[:255].decode("utf-8", errors="ignore")


def upload_filename(value):
    """Busboy basename plus Multer 2.4.0's three WHATWG filename escapes.

    Starlette decodes UTF-8 filenames correctly; the source's Latin-1 mojibake
    is an explicit correction. Do not URL-decode other literal percent values.
    """
    if not value:
        return ""
    name = re.split(r"[/\\]", value)[-1]
    replacements = {"%0a": "\n", "%0d": "\r", "%22": '"'}
    return re.sub(r"%0a|%0d|%22", lambda match: replacements[match.group().lower()], name, flags=re.I)


def _inside(root, path):
    root = Path(root).resolve()
    resolved = Path(path).resolve()
    if not resolved.is_relative_to(root):
        raise ValueError("Attachment path is outside the configured storage directory")
    return resolved


def write_attachment(file_name, file_data, *, options=None, current_datetime=None):
    options = options if options is not None else AttachmentOptions()
    # The source's size limit belongs to the HTTP upload parser. Direct
    # writers (including later workflow downloads) have no upload-size limit.
    current = current_datetime if current_datetime is not None else datetime.now()
    root = options.attachments_path.resolve()
    folder = _inside(root, root / current.strftime("%Y-%m"))
    folder.mkdir(parents=True, exist_ok=True)
    name = sanitize_filename(file_name) or f"attachment-{current:%Y%m%d}"
    # SQL Server enforces the source's declared VARCHAR(100), unlike SQLite.
    _validate_values(TABLES["ContractAttachments"], {"fileName": name, "filePath": str(folder)})
    suffix = Path(name).suffix
    stem = name[:-len(suffix)] if suffix else name
    counter = 0
    while True:
        candidate = name if counter == 0 else f"{stem} ({counter}){suffix}"
        _validate_values(TABLES["ContractAttachments"], {"fileName": candidate})
        target = _inside(root, folder / candidate)
        try:
            with target.open("xb") as stream:
                try:
                    stream.write(file_data)
                except BaseException:
                    target.unlink(missing_ok=True)
                    raise
            return {"fileName": candidate, "filePath": str(folder)}
        except FileExistsError:
            counter += 1


def _attachment_row(connection, identifier, *, active=False):
    table = TABLES["ContractAttachments"]
    query = sa.select(table).where(table.c.contractAttachmentId == _integer(identifier, required=True))
    if active:
        query = query.where(table.c.recordDelete_timeMillis.is_(None))
    row = connection.execute(query).mappings().first()
    return dict(row) if row is not None else None


def get_contract_attachment(database, identifier):
    with transaction(database) as connection:
        row = _attachment_row(connection, identifier, active=True)
        return None if row is None else {key: row[key] for key in ("contractAttachmentId", "contractId", "attachmentTitle",
            "attachmentDetails", "fileName", "filePath", "recordCreate_timeMillis")}


def get_contract_attachments(database, identifier):
    with transaction(database) as connection:
        return _children(connection, _integer(identifier, required=True), "attachments")


def _text_values(form, *, adding=False):
    values = {key: form.get(key) if form.get(key) is not None else
        (form["fileName"] if adding and key == "attachmentTitle" else "") for key in ("attachmentTitle", "attachmentDetails")}
    if any(not isinstance(value, str) for value in values.values()):
        raise ValueError("Attachment title and details must be text")
    _validate_values(TABLES["ContractAttachments"], values)
    return values


def add_contract_attachment(database, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        table = TABLES["ContractAttachments"]
        identifier = _integer(form["contractId"], required=True)
        values = {**_text_values(form, adding=True), **{key: form[key] for key in ("fileName", "filePath")}}
        if any(not isinstance(value, str) for value in values.values()):
            raise ValueError("Attachment fields must be text")
        _validate_values(table, values)
        now = now_millis()
        result = connection.execute(table.insert().values(contractId=identifier, **values, recordCreate_username=actor,
            recordCreate_timeMillis=now, recordUpdate_username=actor, recordUpdate_timeMillis=now))
        attachment_id = result.inserted_primary_key[0]
        if audit_enabled:
            _audit(connection, identifier, actor, "created", None, _attachment_row(connection, attachment_id), "ContractAttachments", attachment_id)
        return attachment_id


def update_contract_attachment(database, identifier, form, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        table = TABLES["ContractAttachments"]
        identifier = _integer(identifier, required=True)
        before = _attachment_row(connection, identifier, active=True)
        result = connection.execute(table.update().where(table.c.contractAttachmentId == identifier,
            table.c.recordDelete_timeMillis.is_(None)).values(**_text_values(form), recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, before["contractId"], actor, "updated", before, _attachment_row(connection, identifier), "ContractAttachments", identifier)
        return bool(result.rowcount)


def delete_contract_attachment(database, identifier, actor, *, audit_enabled=False):
    with transaction(database) as connection:
        table = TABLES["ContractAttachments"]
        identifier = _integer(identifier, required=True)
        before = _attachment_row(connection, identifier, active=True)
        result = connection.execute(table.update().where(table.c.contractAttachmentId == identifier,
            table.c.recordDelete_timeMillis.is_(None)).values(recordDelete_username=actor, recordDelete_timeMillis=now_millis()))
        if audit_enabled and result.rowcount:
            _audit(connection, before["contractId"], actor, "deleted", before, None, "ContractAttachments", identifier)
        return bool(result.rowcount)


def attachment_file_path(attachment, options):
    name = attachment["fileName"]
    if not isinstance(name, str) or not name or any(character in name for character in ('/', '\\', '\x00')) or name in {".", ".."}:
        raise ValueError("Invalid attachment filename")
    folder = Path(attachment["filePath"])
    # Source stores paths relative to process.cwd() or absolute paths.
    target = _inside(options.attachments_path, folder / name)
    if not target.is_file():
        raise FileNotFoundError("Attachment file not found")
    return target


def install_attachments(app, options=None):
    from cemaris.auth import current_user, require_update_contracts
    from cemaris.dependencies import get_engine
    app.state.attachment_options = options if options is not None else AttachmentOptions()
    router = APIRouter(prefix="/api", tags=["contract attachments"])

    @router.get("/attachments/options")
    def attachment_options(request: Request, user=Depends(current_user)):
        return {"maxAttachmentFileSize": request.app.state.attachment_options.max_attachment_file_size}

    @router.get("/contracts/attachment/{attachment_id}")
    def download(attachment_id: int, request: Request, user=Depends(current_user)):
        row = get_contract_attachment(get_engine(request), attachment_id)
        if row is None:
            raise HTTPException(404, "Attachment not found")
        try:
            target = attachment_file_path(row, request.app.state.attachment_options)
        except (ValueError, FileNotFoundError, OSError):
            raise HTTPException(404, "Attachment file not found") from None
        return FileResponse(target, filename=row["fileName"], headers={"X-Content-Type-Options": "nosniff"})

    @router.post("/contracts/doUploadContractAttachment")
    async def upload(request: Request, user=Depends(require_update_contracts)):
        options = request.app.state.attachment_options
        written = None
        committed = False
        # Bound the incoming multipart stream before Starlette parses/spools it.
        # Its max_part_size limits fields only, not file bodies. Permit 1 MiB of
        # form/framing overhead in addition to the exact configured file limit.
        receive = request.receive
        received = 0

        async def bounded_receive():
            nonlocal received
            message = await receive()
            received += len(message.get("body", b""))
            if received > options.max_bytes + 1024 * 1024:
                # Starlette closes files already spooled when this exception is
                # raised. Its Request wrapper translates it to HTTP 400; below
                # we retain the upload-specific HTTP 413 status.
                raise MultiPartException("Attachment request exceeds the maximum size limit")
            return message

        bounded_request = Request(request.scope, bounded_receive)
        try:
            async with bounded_request.form(max_files=1, max_fields=4, max_part_size=256 * 1024) as form:
                file = form.get("file")
                original_name = upload_filename(file.filename) if isinstance(file, UploadFile) else ""
                if not original_name:
                    return {"success": False, "errorMessage": "No file uploaded."}
                identifier = _integer(form.get("contractId"), required=True)
                with get_engine(request).begin() as connection:
                    if _raw(connection, "Contracts", identifier, active=True) is None:
                        return {"success": False, "errorMessage": "Contract not found."}
                    data = await file.read(options.max_bytes + 1)
                    if len(data) > options.max_bytes:
                        return _catalog_error(request, 413, "attachment_too_large", "File exceeds the maximum size limit.")
                    # Preflight metadata before writing bytes, then compensate for
                    # a failed SQL transaction without leaving an orphan file.
                    values = {"contractId": identifier, "attachmentTitle": form.get("attachmentTitle", original_name),
                        "attachmentDetails": form.get("attachmentDetails", ""), "fileName": original_name}
                    _text_values(values, adding=True)
                    written = write_attachment(original_name, data, options=options)
                    attachment_id = add_contract_attachment(connection, {**values, **written}, user["username"],
                        audit_enabled=request.app.state.preference_options.audit_writes_enabled)
                    result = {"success": True, "attachmentId": attachment_id, "contractAttachments": get_contract_attachments(connection, identifier)}
                committed = True
                return result
        except StarletteHTTPException:
            if received > options.max_bytes + 1024 * 1024:
                return _catalog_error(request, 413, "attachment_too_large", "Attachment request exceeds the maximum size limit")
            raise
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_attachment", str(error))
        except (DataError, IntegrityError):
            return _catalog_error(request, 400, "attachment_constraint", "The attachment violates a database constraint")
        except OSError:
            return _catalog_error(request, 500, "attachment_storage", "The attachment file could not be stored")
        finally:
            if written is not None and not committed:
                (Path(written["filePath"]) / written["fileName"]).unlink(missing_ok=True)

    def mutate(request, form, user, action):
        try:
            with get_engine(request).begin() as connection:
                identifier = _integer(form.get("contractAttachmentId"), required=True)
                attachment = get_contract_attachment(connection, identifier)
                if attachment is None:
                    return {"success": False, "errorMessage": "Attachment not found."}
                if _raw(connection, "Contracts", attachment["contractId"], active=True) is None:
                    return {"success": False, "errorMessage": "Contract not found."}
                kwargs = {"audit_enabled": request.app.state.preference_options.audit_writes_enabled}
                success = update_contract_attachment(connection, identifier, form, user["username"], **kwargs) if action == "update" else delete_contract_attachment(connection, identifier, user["username"], **kwargs)
                if not success:
                    return {"success": False, "errorMessage": f"Failed to {action} attachment."}
                return {"success": True, "contractAttachments": get_contract_attachments(connection, attachment["contractId"])}
        except (ValueError, KeyError, TypeError, OverflowError) as error:
            return _catalog_error(request, 400, "invalid_attachment", str(error))
        except (DataError, IntegrityError):
            return _catalog_error(request, 400, "attachment_constraint", "The attachment violates a database constraint")

    @router.post("/contracts/doUpdateContractAttachment")
    def update(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        return mutate(request, form, user, "update")

    @router.post("/contracts/doDeleteContractAttachment")
    def delete(request: Request, form: dict = Body(...), user=Depends(require_update_contracts)):
        return mutate(request, form, user, "delete")

    app.include_router(router)

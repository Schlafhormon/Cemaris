"""Executed attachment reference pairs, SQL persistence and HTTP file access."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import hashlib
import json
from pathlib import Path

from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.attachments import (AttachmentOptions, add_contract_attachment, attachment_file_path,
    delete_contract_attachment, get_contract_attachment, get_contract_attachments, sanitize_filename,
    update_contract_attachment, write_attachment)
from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.contracts import add_contract, delete_contract, get_contract
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.preferences import PreferenceOptions

REFERENCE = json.loads((Path(__file__).parent / "fixtures/attachments-reference.json").read_text(encoding="utf-8"))
ACTOR = "synthetic-attachments"


def options(path, **kwargs):
    return AttachmentOptions(_env_file=None, attachments_path=path, **kwargs)


@pytest.mark.parametrize("case", REFERENCE["sanitizer"])
def test_sanitizer_matches_executed_locked_original(case):
    assert sanitize_filename(case["input"]) == case["expected"]


def test_storage_original_names_bytes_fallback_and_explicit_collision_correction(tmp_path):
    configured = options(tmp_path)
    for case in REFERENCE["writes"]:
        result = write_attachment(case["input"], ("Synthetic attachment <literal>\n" + case["input"]).encode(),
            options=configured, current_datetime=datetime(2026, 10, 20, 9, 5, 42))
        expected = case["result"]["fileName"]
        if case["input"] == "a:b.txt" and expected == "a:b (1).txt":
            expected = "ab (1).txt"  # Source reintroduces an unsafe colon.
        if case["input"] == "../escape.txt" and expected == "escape (1).txt":
            expected = "..escape (1).txt"  # Preserve the sanitized basename.
        if case["input"] == "CON" and expected == "CON (1)":
            expected = "attachment-20261020 (1)"
        assert result["fileName"] == expected
        assert Path(result["filePath"]) == tmp_path / "2026-10"
        stored = Path(result["filePath"]) / result["fileName"]
        assert hashlib.sha256(stored.read_bytes()).hexdigest() == case["content_sha256"]
        assert stored.resolve().is_relative_to(tmp_path.resolve())


def test_storage_atomic_collision_allocation_and_zero_byte_files(tmp_path):
    configured = options(tmp_path)
    def write(number):
        return write_attachment("same.txt", str(number).encode(), options=configured)
    with ThreadPoolExecutor(max_workers=6) as executor:
        results = list(executor.map(write, range(12)))
    assert len({row["fileName"] for row in results}) == 12
    assert sorted(int((Path(row["filePath"]) / row["fileName"]).read_bytes()) for row in results) == list(range(12))
    empty = write_attachment("empty.txt", b"", options=configured)
    assert (Path(empty["filePath"]) / empty["fileName"]).read_bytes() == b""


def test_storage_sql_length_month_separation_and_source_upload_limit_boundary(tmp_path):
    configured = options(tmp_path, max_attachment_file_size=4 / (1024 * 1024))
    first = write_attachment("small.txt", b"1234", options=configured, current_datetime=datetime(2026, 10, 31))
    second = write_attachment("small.txt", b"1234", options=configured, current_datetime=datetime(2026, 11, 1))
    assert first["fileName"] == second["fileName"] == "small.txt"
    assert first["filePath"] != second["filePath"]
    # The original storage helper is also called for workflow downloads;
    # only the HTTP upload path applies maxAttachmentFileSize.
    direct = write_attachment("large.txt", b"12345", options=configured)
    assert (Path(direct["filePath"]) / direct["fileName"]).read_bytes() == b"12345"
    with pytest.raises(ValueError, match="fileName exceeds"):
        write_attachment("x" * 101, b"", options=configured)
    assert len(list(tmp_path.rglob("*.txt"))) == 3


@pytest.mark.parametrize("name", ["../outside.txt", "a/b", "a\\b", "\x00", "..", ".", ""])
def test_download_filename_cannot_escape_root(tmp_path, name):
    with pytest.raises(ValueError):
        attachment_file_path({"fileName": name, "filePath": str(tmp_path)}, options(tmp_path))


def test_download_stored_folder_and_symlink_cannot_escape_root(tmp_path):
    root = tmp_path / "root"
    root.mkdir()
    other = tmp_path / "other"
    other.mkdir()
    (other / "private.txt").write_text("Synthetic private data")
    with pytest.raises(ValueError):
        attachment_file_path({"fileName": "private.txt", "filePath": str(other)}, options(root))
    try:
        (root / "linked").symlink_to(other, target_is_directory=True)
    except OSError:
        return  # Windows symlinks may require OS privilege; above containment runs.
    with pytest.raises(ValueError):
        attachment_file_path({"fileName": "private.txt", "filePath": str(root / "linked")}, options(root))
    (root / "2026-10").symlink_to(other, target_is_directory=True)
    with pytest.raises(ValueError):
        write_attachment("escape.txt", b"blocked", options=options(root), current_datetime=datetime(2026, 10, 20))


def insert(connection, table_name, **values):
    table = TABLES[table_name]
    result = connection.execute(table.insert().values(recordCreate_username=ACTOR, recordCreate_timeMillis=1,
        recordUpdate_username=ACTOR, recordUpdate_timeMillis=1, **values))
    return result.inserted_primary_key[0]


def setup(connection):
    type_id = insert(connection, "ContractTypes", contractType="Synthetic attachment contract type")
    return [add_contract(connection, {"contractTypeId": type_id, "contractStartDateString": "2026-10-20",
        "contractNumber": f"SYN-ATTACH-{number}", "purchaserName": "Synthetic purchaser"}, ACTOR) for number in (1, 2)]


def normalized(value, identifiers, attachment_id):
    if isinstance(value, list):
        return [normalized(item, identifiers, attachment_id) for item in value]
    if isinstance(value, dict):
        result = {}
        for key, item in value.items():
            if key.startswith("record") and key not in {"recordUpdate_username", "recordIndex"}:
                continue
            if key == "contractId":
                item = identifiers.index(item) + 1
            elif key == "contractAttachmentId":
                item = 1 if item == attachment_id else item
            elif key == "mainRecordId":
                item = str(identifiers.index(int(item)) + 1)
            elif key == "recordIndex":
                item = "1" if item == str(attachment_id) else item
            result[key] = normalized(item, identifiers, attachment_id)
        return result
    return value


def audit(connection, identifiers, attachment_id):
    table = TABLES["AuditLog"]
    rows = connection.execute(sa.select(table).where(table.c.updateTable == "ContractAttachments").order_by(table.c.logMillis)).mappings()
    output = []
    for row in rows:
        item = {key: row[key] for key in ("mainRecordType", "mainRecordId", "updateTable", "recordIndex", "updateField", "updateType", "updateUsername")}
        item.update({key: None if row[key] is None else json.loads(row[key]) for key in ("fromValue", "toValue")})
        output.append(normalized(item, identifiers, attachment_id))
    return output


@pytest.mark.parametrize("case", REFERENCE["defaults"])
def test_sql_defaults_retrieval_and_created_audit_match_executed_original(sql_connection, case):
    connection, _ = sql_connection
    identifiers = setup(connection)
    form = {**case["form"], "contractId": identifiers[case["form"]["contractId"] - 1]}
    attachment_id = add_contract_attachment(connection, form, ACTOR, audit_enabled=True)
    assert normalized(get_contract_attachment(connection, attachment_id), identifiers, attachment_id) == case["expected"]
    assert normalized(get_contract_attachments(connection, form["contractId"]), identifiers, attachment_id) == case["listed"]
    assert audit(connection, identifiers, attachment_id) == case["audit"]


def test_sql_lifecycle_audit_parent_and_other_children_match_original(sql_connection, tmp_path):
    connection, _ = sql_connection
    identifiers = setup(connection)
    parent = get_contract(connection, identifiers[0])
    form = {**REFERENCE["initial"], "contractId": identifiers[0]}
    attachment_id = add_contract_attachment(connection, form, ACTOR, audit_enabled=True)
    for case in REFERENCE["lifecycle"]:
        if case["action"] == "update":
            result = update_contract_attachment(connection, attachment_id, case["form"], "synthetic-editor", audit_enabled=True)
        else:
            result = delete_contract_attachment(connection, attachment_id, "synthetic-editor", audit_enabled=True)
        assert result == case["result"]
        assert normalized(get_contract_attachment(connection, attachment_id), identifiers, attachment_id) == case["retrieved"]
        assert normalized(get_contract_attachments(connection, identifiers[0]), identifiers, attachment_id) == case["listed"]
    assert audit(connection, identifiers, attachment_id) == REFERENCE["lifecycleAudit"]
    assert get_contract_attachments(connection, identifiers[1]) == []
    after = get_contract(connection, identifiers[0])
    for key in ("purchaserName", "contractNumber", "recordUpdate_timeMillis", "contractStartDate"):
        assert after[key] == parent[key]
    for table_name in ("ContractFees", "ContractComments", "ContractTransactions", "ContractFields", "ContractInterments", "WorkOrderContracts"):
        assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES[table_name])) == 0


@pytest.fixture
def attachment_app(migrated_sql_database, tmp_path):
    engine, _ = migrated_sql_database
    with engine.begin() as connection:
        for table in reversed(TABLES["Contracts"].metadata.sorted_tables):
            connection.execute(table.delete())
        identifiers = setup(connection)
    names = ["admin", "reader", "updater", "cemetery", "contract", "work"]
    auth = AuthSettings(_env_file=None, type="plainText", config={"users": {"\\" + name: "synthetic-password" for name in names}},
        session_directory=tmp_path / "sessions", can_login=names, is_admin=["admin"], can_update=["updater"],
        can_update_cemeteries=["cemetery"], can_update_contracts=["contract"], can_update_work_orders=["work"])
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=auth,
        preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True),
        attachment_options=options(tmp_path / "attachments", max_attachment_file_size=1))
    app.state.db_engine = engine
    app.state.test_contract_ids = identifiers
    return app


def login(client, name):
    token = client.get("/api/session").json()["csrfToken"]
    response = client.post("/api/login", json={"username": name, "password": "synthetic-password"}, headers={"X-CSRF-Token": token})
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrfToken"]}


@pytest.mark.parametrize("name,can_update", [("admin", False), ("reader", False), ("updater", True), ("cemetery", False), ("contract", True), ("work", False)])
def test_http_reader_download_independent_contract_roles_and_csrf(attachment_app, name, can_update):
    identifier = attachment_app.state.test_contract_ids[0]
    with TestClient(attachment_app) as client:
        assert client.get("/api/attachments/options").status_code == 401
        assert client.get("/api/contracts/attachment/1").status_code == 401
        headers = login(client, name)
        assert client.get("/api/attachments/options").json() == {"maxAttachmentFileSize": 1}
        response = client.post("/api/contracts/doUploadContractAttachment", data={"contractId": identifier}, files={"file": ("report.txt", b"Synthetic bytes")})
        assert response.status_code == 403
        response = client.post("/api/contracts/doUploadContractAttachment", headers=headers,
            data={"contractId": identifier}, files={"file": ("report.txt", b"Synthetic bytes")})
        assert response.status_code == (200 if can_update else 403), response.text
        attachment_id = response.json().get("attachmentId", 1)
        for action in ("Update", "Delete"):
            url = "/api/contracts/do" + action + "ContractAttachment"
            assert client.post(url, json={"contractAttachmentId": attachment_id}).status_code == 403
            response = client.post(url, json={"contractAttachmentId": attachment_id, "attachmentTitle": "Edited"}, headers=headers)
            assert response.status_code == (200 if can_update else 403), response.text


def test_http_upload_download_unicode_metadata_edit_delete_bytes_retained_and_parent_deleted(attachment_app):
    identifier = attachment_app.state.test_contract_ids[0]
    contents = b"%PDF-1.4\nSynthetic <literal> attachment\n"
    with TestClient(attachment_app) as client:
        headers = login(client, "contract")
        ids = []
        for _ in range(2):
            response = client.post("/api/contracts/doUploadContractAttachment", headers=headers,
                data={"contractId": identifier, "attachmentTitle": "", "attachmentDetails": "<literal>\nGrüße"}, files={"file": ("Grüße 🪦.pdf", contents, "application/pdf")})
            assert response.status_code == 200 and response.json()["success"], response.text
            ids.append(response.json()["attachmentId"])
        rows = response.json()["contractAttachments"]
        assert [row["fileName"] for row in rows] == ["Grüße 🪦.pdf", "Grüße 🪦 (1).pdf"]
        assert "filePath" not in rows[0] and rows[0]["attachmentTitle"] == ""
        assert rows[0]["attachmentDetails"] == "<literal>\nGrüße" and rows[0]["recordCreate_timeMillis"] > 0
        response = client.post("/api/contracts/doUpdateContractAttachment", json={"contractAttachmentId": ids[0], "attachmentTitle": "Edited", "attachmentDetails": "Next"}, headers=headers)
        assert response.json()["contractAttachments"][0]["attachmentTitle"] == "Edited"
        assert client.get(f"/api/contracts/{identifier}").json()["contract"]["contractAttachments"] == response.json()["contractAttachments"]
        login(client, "reader")
        download = client.get(f"/api/contracts/attachment/{ids[0]}")
        assert download.status_code == 200 and download.content == contents
        assert "filename*=utf-8''" in download.headers["content-disposition"]
        assert download.headers["content-type"].startswith("application/pdf")
        headers = login(client, "contract")
        assert client.post("/api/contracts/doDeleteContractAttachment", json={"contractAttachmentId": ids[0]}, headers=headers).json()["success"]
        assert client.get(f"/api/contracts/attachment/{ids[0]}").status_code == 404
        assert client.post("/api/contracts/doDeleteContractAttachment", json={"contractAttachmentId": ids[0]}, headers=headers).json() == {"success": False, "errorMessage": "Attachment not found."}
        with attachment_app.state.db_engine.begin() as connection:
            assert delete_contract(connection, identifier, "deleter")
        # Source permits downloading active files of soft-deleted contracts.
        assert client.get(f"/api/contracts/attachment/{ids[1]}").content == contents
        for action in ("Update", "Delete"):
            assert client.post("/api/contracts/do" + action + "ContractAttachment", headers=headers, json={"contractAttachmentId": ids[1]}).json() == {"success": False, "errorMessage": "Contract not found."}
        assert len(list(attachment_app.state.attachment_options.attachments_path.rglob("*.pdf"))) == 2


@pytest.mark.parametrize("case", REFERENCE["handlers"])
def test_http_source_handler_input_output_pairs(attachment_app, case):
    identifiers = attachment_app.state.test_contract_ids
    body = dict(case["body"])
    if "contractId" in body and body["contractId"] != "999":
        body["contractId"] = str(identifiers[int(body["contractId"]) - 1])
    attachment_id = None
    with attachment_app.state.db_engine.begin() as connection:
        if case["existing"]:
            attachment_id = add_contract_attachment(connection, {**REFERENCE["initial"], "contractId": identifiers[0]}, ACTOR)
            body["contractAttachmentId"] = attachment_id
        if case["parentDeleted"]:
            delete_contract(connection, identifiers[0], ACTOR)
    with TestClient(attachment_app) as client:
        headers = login(client, "contract")
        if case["name"] == "doUploadContractAttachment":
            kwargs = {"data": body, **({"files": {"file": (case["file"], b"Synthetic uploaded file")}} if case["file"] else {})}
        else:
            kwargs = {"json": body}
        response = client.post("/api/contracts/" + case["name"], headers=headers, **kwargs)
        assert response.status_code == case["expected"]["status"], response.text
        result = response.json()
        if result.get("attachmentId") is not None:
            attachment_id = result["attachmentId"]
            result["attachmentId"] = 1
        assert normalized(result, identifiers, attachment_id) == case["expected"]["body"]


@pytest.mark.parametrize("mode", ["exact", "file_over", "stream_over", "chunked", "metadata", "path", "double_file"])
def test_http_size_limits_malformed_parts_and_no_orphan_metadata_or_bytes(attachment_app, mode):
    identifier = attachment_app.state.test_contract_ids[0]
    with TestClient(attachment_app) as client:
        headers = login(client, "contract")
        data = {"contractId": identifier}
        files = {"file": ("test.bin", b"x" * (1024 * 1024 if mode == "exact" else 1024 * 1024 + 1))}
        if mode == "metadata":
            data["attachmentTitle"] = "x" * 101
            files = {"file": ("small.txt", b"small")}
        elif mode == "path":
            files = {"file": ("x" * 101, b"small")}
        elif mode == "double_file":
            files = [("file", ("one.txt", b"one")), ("file", ("two.txt", b"two"))]
        if mode in {"stream_over", "chunked"}:
            prefix = b'--test\r\nContent-Disposition: form-data; name="file"; filename="large.bin"\r\n\r\n'
            def chunks():
                yield prefix
                for _ in range(40):
                    yield b"x" * 65536
                yield b"\r\n--test--\r\n"
            stream_headers = {**headers, "Content-Type": "multipart/form-data; boundary=test"}
            response = client.post("/api/contracts/doUploadContractAttachment", headers=stream_headers,
                content=chunks() if mode == "chunked" else b"".join(chunks()))
        else:
            response = client.post("/api/contracts/doUploadContractAttachment", headers=headers, data=data, files=files)
        expected = 200 if mode == "exact" else 413 if mode in {"file_over", "stream_over", "chunked"} else 400
        assert response.status_code == expected, response.text
        with attachment_app.state.db_engine.connect() as connection:
            assert len(get_contract_attachments(connection, identifier)) == (1 if mode == "exact" else 0)
        assert len(list(attachment_app.state.attachment_options.attachments_path.rglob("*.*"))) == (1 if mode == "exact" else 0)


def test_http_storage_rollback_and_outside_path_are_controlled(attachment_app, monkeypatch, tmp_path):
    identifier = attachment_app.state.test_contract_ids[0]
    with TestClient(attachment_app) as client:
        headers = login(client, "contract")
        import cemaris.attachments as module
        actual = module.add_contract_attachment
        def failure(*args, **kwargs):
            actual(*args, **kwargs)
            raise ValueError("Synthetic SQL transaction failure")
        monkeypatch.setattr(module, "add_contract_attachment", failure)
        response = client.post("/api/contracts/doUploadContractAttachment", headers=headers,
            data={"contractId": identifier}, files={"file": ("rollback.txt", b"rollback")})
        assert response.status_code == 400
        assert list(attachment_app.state.attachment_options.attachments_path.rglob("*.txt")) == []
        outside = tmp_path / "private.txt"
        outside.write_bytes(b"Synthetic private data")
        with attachment_app.state.db_engine.begin() as connection:
            assert get_contract_attachments(connection, identifier) == []
            assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["AuditLog"])) == 0
            attachment_id = actual(connection, {"contractId": identifier, "fileName": outside.name, "filePath": str(outside.parent)}, ACTOR)
        assert client.get(f"/api/contracts/attachment/{attachment_id}").status_code == 404
        assert client.get("/api/contracts/attachment/999999").status_code == 404

"""User resolution and local-user administration ported from Sunrise CMS (MIT).

Sources: helpers/user.helpers.ts, database/{add,get,update,delete}User*.ts,
database/createAuditLogEntries.ts and handlers/admin{Get,Post}/*User*.ts,
commit 451ce034863b16502484367044f3e9b65370111a. See licenses/Sunrise-LICENSE.md.
"""

from __future__ import annotations

from datetime import datetime
import json
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, BeforeValidator, Field
import sqlalchemy as sa
from sqlalchemy.engine import Connection, Engine

from cemaris.db.schema import TABLE_AuditLog as AUDIT, TABLE_Users as USERS
from cemaris.db.semantics import _JS_WHITESPACE
from cemaris.preferences import get_user_settings, now_millis, transaction


PERMISSION_FIELDS = ("isActive", "canUpdateCemeteries", "canUpdateContracts", "canUpdateWorkOrders", "isAdmin")
ROLE_FIELDS = PERMISSION_FIELDS[1:]
USER_COLUMNS = [column for column in USERS.c if not column.name.startswith("recordDelete_")]
CONFIG_ROLES = {
    "canLogin": "can_login", "canUpdate": "can_update", "canUpdateCemeteries": "can_update_cemeteries",
    "canUpdateContracts": "can_update_contracts", "canUpdateWorkOrders": "can_update_work_orders", "isAdmin": "is_admin",
}


def get_local_user(database: Engine | Connection, username: str) -> dict | None:
    with transaction(database) as connection:
        row = connection.execute(sa.select(*USER_COLUMNS).where(USERS.c.username == username, USERS.c.recordDelete_timeMillis.is_(None))).mappings().first()
    return None if row is None else dict(row)


def get_users(database: Engine | Connection) -> list[dict]:
    with transaction(database) as connection:
        return [dict(row) for row in connection.execute(sa.select(*USER_COLUMNS).where(USERS.c.recordDelete_timeMillis.is_(None)).order_by(USERS.c.username)).mappings()]


def get_user(database: Engine | Connection, username: str, role_config) -> dict | None:
    username_lower = username.lower()
    with transaction(database) as connection:
        local_user = get_local_user(connection, username_lower)
        if local_user is not None:
            if not local_user["isActive"]:
                return None
            properties = {key: bool(local_user[key]) for key in ROLE_FIELDS}
        else:
            roles = {key: {name.lower() for name in getattr(role_config, attr)} for key, attr in CONFIG_ROLES.items()}
            if username_lower not in roles["canLogin"]:
                return None
            properties = {
                key: username_lower in roles["canUpdate"] or username_lower in roles[key]
                for key in ROLE_FIELDS if key != "isAdmin"
            }
            properties["isAdmin"] = username_lower in roles["isAdmin"]
        # Source normalizes the identity but queries settings with original input.
        values = get_user_settings(connection, username)
        return {"username": username_lower, "userProperties": properties, "userSettings": values}


def _audit_value(value):
    if isinstance(value, bool):
        return int(value)  # SQLite source record values are numeric 0/1.
    if isinstance(value, dict):
        return {key: _audit_value(item) for key, item in value.items()}
    return value


def _audit(connection: Connection, username: str, actor: str, field: str, kind: str, before, after) -> None:
    now = datetime.now().astimezone()
    connection.execute(AUDIT.insert().values(
        logMillis=now_millis(), logDate=int(now.strftime("%Y%m%d")), logTime=int(now.strftime("%H%M")),
        mainRecordType="user", mainRecordId=username, updateTable="Users", recordIndex=None,
        updateField=field, updateType=kind, updateUsername=actor,
        fromValue=None if before is None else json.dumps(_audit_value(before), ensure_ascii=False, separators=(",", ":")),
        toValue=None if after is None else json.dumps(_audit_value(after), ensure_ascii=False, separators=(",", ":")),
    ))


def add_user(database: Engine | Connection, username: str, permissions: dict, actor: str, *, audit_enabled: bool = False) -> bool:
    with transaction(database) as connection:
        existing = connection.execute(sa.select(USERS.c.recordDelete_timeMillis).where(USERS.c.username == username)).first()
        if existing is not None and existing[0] is None:
            return False
        now = now_millis()
        values = {field: bool(permissions.get(field, False)) for field in ROLE_FIELDS}
        values.update(isActive=True, recordUpdate_username=actor, recordUpdate_timeMillis=now)
        if existing is None:
            connection.execute(USERS.insert().values(username=username, **values, recordCreate_username=actor, recordCreate_timeMillis=now))
        else:
            connection.execute(USERS.update().where(USERS.c.username == username).values(**values, recordDelete_username=None, recordDelete_timeMillis=None))
        if audit_enabled:
            _audit(connection, username, actor, "*", "created", None, get_local_user(connection, username))
    return True


def update_user(database: Engine | Connection, username: str, permissions: dict, actor: str, *, audit_enabled: bool = False) -> bool:
    with transaction(database) as connection:
        before = get_local_user(connection, username) if audit_enabled else None
        values = {field: bool(permissions.get(field, False)) for field in PERMISSION_FIELDS}
        result = connection.execute(USERS.update().where(USERS.c.username == username, USERS.c.recordDelete_timeMillis.is_(None)).values(
            **values, recordUpdate_username=actor, recordUpdate_timeMillis=now_millis(),
        ))
        if audit_enabled and result.rowcount:
            after = get_local_user(connection, username)
            for field in USER_COLUMNS:
                key = field.name
                if key not in {"recordCreate_timeMillis", "recordCreate_username", "recordUpdate_timeMillis"} and before[key] != after[key]:
                    _audit(connection, username, actor, key, "updated", before[key], after[key])
    return bool(result.rowcount)


def delete_user(database: Engine | Connection, username: str, actor: str, *, audit_enabled: bool = False) -> bool:
    with transaction(database) as connection:
        before = get_local_user(connection, username) if audit_enabled else None
        result = connection.execute(USERS.update().where(USERS.c.username == username, USERS.c.recordDelete_timeMillis.is_(None)).values(
            recordDelete_username=actor, recordDelete_timeMillis=now_millis(),
        ))
        if audit_enabled and result.rowcount:
            _audit(connection, username, actor, "*", "deleted", before, None)
    return bool(result.rowcount)


# Internal JSON uses booleans. Existing source form values keep their exact
# '1' => true rule; arbitrary nonempty strings do not grant permissions.
FormBoolean = Annotated[bool, BeforeValidator(lambda value: value if isinstance(value, bool) else value == "1")]


class AddUserForm(BaseModel):
    username: str = Field(min_length=1, max_length=30)
    canUpdateCemeteries: FormBoolean = False
    canUpdateContracts: FormBoolean = False
    canUpdateWorkOrders: FormBoolean = False
    isAdmin: FormBoolean = False


class UpdateUserForm(AddUserForm):
    isActive: FormBoolean = False


class TogglePermissionForm(BaseModel):
    username: str = Field(max_length=30)
    permissionField: str


class DeleteUserForm(BaseModel):
    username: str = Field(max_length=30)


def install_accounts(app) -> None:
    from cemaris.auth import require_admin
    from cemaris.dependencies import get_engine

    router = APIRouter(prefix="/api/admin/users", tags=["users"])

    def auditing(request: Request) -> bool:
        return request.app.state.preference_options.audit_writes_enabled

    @router.get("")
    def list_users(request: Request, user=Depends(require_admin)):
        config = request.app.state.auth_settings
        config_users = {key: list(getattr(config, attr)) for key, attr in CONFIG_ROLES.items()}
        return {"users": get_users(get_engine(request)), "configUsers": config_users, "hasConfigUsers": any(config_users.values()), "domain": config.domain}

    @router.post("/add")
    def create_user(form: AddUserForm, request: Request, user=Depends(require_admin)):
        with get_engine(request).begin() as connection:
            if not add_user(connection, form.username, form.model_dump(), user["username"], audit_enabled=auditing(request)):
                return JSONResponse({"success": False, "errorMessage": "User name already exists"}, status_code=400)
            return {"success": True, "users": get_users(connection)}

    @router.post("/update")
    def save_user(form: UpdateUserForm, request: Request, user=Depends(require_admin)):
        success = update_user(get_engine(request), form.username, form.model_dump(), user["username"], audit_enabled=auditing(request))
        return JSONResponse({"success": success, "message": "User updated successfully" if success else "User not found"}, status_code=200 if success else 404)

    @router.post("/toggle")
    def toggle_permission(form: TogglePermissionForm, request: Request, user=Depends(require_admin)):
        if not form.username or not form.permissionField:
            return JSONResponse({"success": False, "message": "User name and permission field are required"}, status_code=400)
        if form.permissionField not in PERMISSION_FIELDS:
            return JSONResponse({"success": False, "message": "Invalid permission field"}, status_code=400)
        with get_engine(request).begin() as connection:
            current = get_local_user(connection, form.username)
            if current is None:
                return JSONResponse({"success": False, "message": "User not found"}, status_code=404)
            current[form.permissionField] = not current[form.permissionField]
            update_user(connection, form.username, current, user["username"], audit_enabled=auditing(request))
            return {"success": True, "message": "Permission updated successfully", "users": get_users(connection)}

    @router.post("/delete")
    def remove_user(form: DeleteUserForm, request: Request, user=Depends(require_admin)):
        username = form.username.strip(_JS_WHITESPACE)
        if username == "":
            return JSONResponse({"success": False, "message": "User name is required"}, status_code=400)
        with get_engine(request).begin() as connection:
            if not delete_user(connection, username, user["username"], audit_enabled=auditing(request)):
                return JSONResponse({"success": False, "message": "User not found"}, status_code=404)
            return {"success": True, "message": "User deleted successfully", "users": get_users(connection)}

    app.include_router(router)

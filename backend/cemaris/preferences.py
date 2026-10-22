"""Application and user settings, derived from Sunrise CMS (MIT).

Source: database/*Setting*.ts, types/setting.types.ts and
helpers/settings.helpers.ts at 451ce034863b16502484367044f3e9b65370111a.
See licenses/Sunrise-LICENSE.md. Values deliberately remain untrimmed strings;
the source's numeric setting controls are text inputs, not numeric validators.
"""

from __future__ import annotations

from contextlib import contextmanager
import json
import math
from pathlib import Path
import secrets
import time
from uuid import uuid4

from fastapi import APIRouter, Depends, Request
from pydantic import AliasChoices, BaseModel, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import sqlalchemy as sa
from sqlalchemy.engine import Connection, Engine

from cemaris.db.schema import TABLE_CemarisSettings as SETTINGS, TABLE_UserSettings as USER_SETTINGS
from cemaris.db.semantics import js_number


SETTING_PROPERTIES = json.loads((Path(__file__).parent / "data/settings.json").read_text(encoding="utf-8"))
SETTING_BY_KEY = {setting["settingKey"]: setting for setting in SETTING_PROPERTIES}


class PreferenceOptions(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CEMARIS_", env_file=".env", env_ignore_empty=True, extra="ignore")
    audit_log_enabled: bool = False
    disable_audit_log: bool = Field(default=False, validation_alias=AliasChoices("CEMARIS_DISABLE_AUDIT_LOG", "DISABLE_AUDIT_LOG", "disable_audit_log"))

    @field_validator("disable_audit_log", mode="before")
    @classmethod
    def source_disable_flag(cls, value):
        return value if isinstance(value, bool) else value == "true"

    @property
    def audit_writes_enabled(self):
        return self.audit_log_enabled and not self.disable_audit_log


@contextmanager
def transaction(database: Engine | Connection):
    """Borrow an existing transaction, or commit a short application operation."""
    if isinstance(database, Connection):
        yield database
    else:
        with database.begin() as connection:
            yield connection


def now_millis() -> int:
    return time.time_ns() // 1_000_000


def get_settings(database: Engine | Connection) -> list[dict]:
    with transaction(database) as connection:
        stored = {row["settingKey"]: dict(row) for row in connection.execute(sa.select(SETTINGS)).mappings()}
    # The source lists descriptors only; unknown internal settings remain stored.
    return [{**descriptor, **stored.get(descriptor["settingKey"], {})} for descriptor in SETTING_PROPERTIES]


def get_setting_value(database: Engine | Connection, key: str) -> str:
    setting = next((setting for setting in get_settings(database) if setting["settingKey"] == key), None)
    return "" if setting is None else (setting.get("settingValue") or setting["defaultValue"])


def update_setting(database: Engine | Connection, key: str, value: str) -> bool:
    with transaction(database) as connection:
        result = connection.execute(SETTINGS.update().where(SETTINGS.c.settingKey == key).values(
            settingValue=value, previousSettingValue=SETTINGS.c.settingValue, recordUpdate_timeMillis=now_millis(),
        ))
        if not result.rowcount:
            connection.execute(SETTINGS.insert().values(settingKey=key, settingValue=value, recordUpdate_timeMillis=now_millis()))
    # No process cache: reads immediately observe committed settings in every worker.
    return True


def get_csrf_secret(database: Engine | Connection) -> str:
    with transaction(database) as connection:
        secret = get_setting_value(connection, "application.csrfSecret")
        if not secret:
            secret = secrets.token_hex(64)
            update_setting(connection, "application.csrfSecret", secret)
    return secret


def get_work_order_work_day_ranges(database: Engine | Connection) -> dict[int, dict[str, int | float]]:
    settings = {row["settingKey"]: row.get("settingValue") or row["defaultValue"] for row in get_settings(database)}
    result = {}
    for day in range(7):
        result[day] = {}
        for part in ("startHour", "endHour"):
            value = settings[f"workOrder.workDay.{day}.{part}"]
            number = js_number(value)
            result[day][part] = -1 if value == "" else (math.trunc(number) if math.isfinite(number) else number)
    return result


def update_user_setting(database: Engine | Connection, username: str, key: str, value: str) -> bool:
    with transaction(database) as connection:
        predicate = sa.and_(USER_SETTINGS.c.username == username, USER_SETTINGS.c.settingKey == key)
        result = connection.execute(USER_SETTINGS.update().where(predicate).values(
            settingValue=value, previousSettingValue=USER_SETTINGS.c.settingValue, recordUpdate_timeMillis=now_millis(),
        ))
        if not result.rowcount:
            connection.execute(USER_SETTINGS.insert().values(username=username, settingKey=key, settingValue=value, recordUpdate_timeMillis=now_millis()))
    return True


def reset_api_key(database: Engine | Connection, username: str) -> str:
    if username == "":
        raise ValueError("Cannot update API key for empty user name")
    key = f"{username}-{uuid4()}-{now_millis()}"
    update_user_setting(database, username, "apiKey", key)
    return key


def get_user_settings(database: Engine | Connection, username: str) -> dict[str, str]:
    with transaction(database) as connection:
        values = dict(connection.execute(sa.select(USER_SETTINGS.c.settingKey, USER_SETTINGS.c.settingValue).where(USER_SETTINGS.c.username == username, USER_SETTINGS.c.settingKey == "apiKey")).all())
        if not values.get("apiKey"):
            values["apiKey"] = reset_api_key(connection, username)
    return values


def get_api_keys(database: Engine | Connection, can_login: list[str] | tuple[str, ...]) -> dict[str, str]:
    with transaction(database) as connection:
        rows = connection.execute(sa.select(USER_SETTINGS.c.username, USER_SETTINGS.c.settingValue).where(USER_SETTINGS.c.settingKey == "apiKey")).all()
    # Quirk retained: the database API-key loader tests exact config membership;
    # the later user helper performs a second, case-insensitive canLogin check.
    return {username: key for username, key in rows if username in can_login}


def is_api_key_valid(database: Engine | Connection, api_key: str | None, role_config) -> bool:
    if api_key is None:
        return False
    username = get_username_from_api_key(database, api_key, role_config.can_login)
    return username is not None and username.lower() in {name.lower() for name in role_config.can_login}


def get_api_key_by_username(database: Engine | Connection, username: str, can_login) -> str | None:
    return get_api_keys(database, can_login).get(username)


def get_username_from_api_key(database: Engine | Connection, api_key: str, can_login) -> str | None:
    return next((username for username, key in get_api_keys(database, can_login).items() if key == api_key), None)


class SettingForm(BaseModel):
    # Source admin POST also accepts internal/unknown keys. Keep the storage
    # contract and descriptor filtering; only enforce existing SQL type bounds.
    settingKey: str = Field(max_length=100)
    settingValue: str = Field(max_length=500)


def install_preferences(app, options: PreferenceOptions | None = None) -> None:
    from cemaris.auth import current_user, require_admin
    from cemaris.dependencies import get_engine

    options = options if options is not None else PreferenceOptions()
    app.state.preference_options = options
    router = APIRouter(tags=["settings"])

    @router.get("/api/admin/settings")
    def list_settings(request: Request, user=Depends(require_admin)):
        return {"settings": [{**setting, **({"settingName": setting["settingNameEn"], "description": setting["descriptionEn"]} if request.state.language == "en" else {})}
            for setting in get_settings(get_engine(request)) if setting["isUserConfigurable"]]}

    @router.post("/api/admin/settings")
    def save_setting(form: SettingForm, request: Request, user=Depends(require_admin)):
        return {"success": update_setting(get_engine(request), form.settingKey, form.settingValue)}

    @router.get("/api/user-settings")
    def user_settings(request: Request, user=Depends(current_user)):
        from cemaris.auth import public_user
        return {"userSettings": public_user(user)["userSettings"]}

    @router.post("/api/user-settings/reset-api-key")
    def reset_user_api_key(request: Request, user=Depends(current_user)):
        engine = get_engine(request)
        with engine.begin() as connection:
            api_key = reset_api_key(connection, user["username"])
            values = get_user_settings(connection, user["username"])
        request.state.session["user"]["userSettings"] = values
        return {"success": True, "apiKey": api_key}

    app.include_router(router)

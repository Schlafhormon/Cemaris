"""Authentication configuration, preserving the four Sunrise adapter contracts.

JSON configuration contains credentials and must never be sent to the browser.
See docs/TECHNIK.md for the environment variables and provider examples.
"""

from pathlib import Path
import re
from typing import Any, Literal

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Keep in sync with Vite and deploy/render-nginx.mjs; the public-path tests
# compare all three lists. A first segment shared with an internal route is
# ambiguous after the reverse proxy strips the mount.
RESERVED_PREFIX_SEGMENTS = frozenset({
    "admin", "api", "assets", "branding", "burialsites", "cemeteries", "contracts",
    "dashboard", "funeralhomes", "healthz", "index.html", "licenses", "locales",
    "login", "print", "public-internal", "reports", "robots.txt", "src",
    "third-party-notices.txt", "third_party_notices.md", "workorders",
})


class AuthSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CEMARIS_AUTH_", env_file=".env", env_ignore_empty=True,
        extra="ignore", populate_by_name=True,
    )

    type: Literal["plainText", "function", "activeDirectory", "adWebAuth"] | None = None
    config: dict[str, Any] = Field(default_factory=dict, repr=False)
    domain: str = ""
    cookie_name: str = "cemaris-user-sid"
    cookie_secure: bool = False
    max_age_millis: int = Field(default=3_600_000, gt=0)
    do_keep_alive: bool = False
    session_directory: Path = Path("data/sessions")
    url_prefix: str = Field(default="", validation_alias=AliasChoices("CEMARIS_URL_PREFIX", "CEMARIS_AUTH_URL_PREFIX"))
    traffic_is_forwarded: bool = False
    disable_rate_limit: bool = False
    use_test_databases: bool = False

    can_login: list[str] = Field(default_factory=lambda: ["administrator"])
    can_update: list[str] = Field(default_factory=list)
    can_update_cemeteries: list[str] = Field(default_factory=list)
    can_update_contracts: list[str] = Field(default_factory=list)
    can_update_work_orders: list[str] = Field(default_factory=list)
    is_admin: list[str] = Field(default_factory=lambda: ["administrator"])
    testing: list[str] = Field(default_factory=list)

    @field_validator("url_prefix")
    @classmethod
    def safe_prefix(cls, value: str) -> str:
        value = value.rstrip("/")
        if value and (not re.fullmatch(r"/(?:[A-Za-z0-9._-]+)(?:/[A-Za-z0-9._-]+)*", value) or
                      any(part in {".", ".."} for part in value.split("/"))):
            raise ValueError("URL prefix must contain absolute local path segments without dot segments")
        if value and value.split("/")[1].lower() in RESERVED_PREFIX_SEGMENTS:
            raise ValueError("URL prefix starts with a reserved application route or asset segment")
        return value

    @field_validator("cookie_name")
    @classmethod
    def safe_cookie_name(cls, value: str) -> str:
        if not value or any(not (c.isascii() and (c.isalnum() or c in "-_")) for c in value):
            raise ValueError("Cookie name must contain letters, digits, hyphens or underscores")
        return value

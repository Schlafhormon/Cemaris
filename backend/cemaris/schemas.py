"""Public contracts shared by the health check, web client and error handlers."""

from typing import Literal

from pydantic import BaseModel

from cemaris import __version__


class PublicConfig(BaseModel):
    application: Literal["Cemaris"] = "Cemaris"
    version: str = __version__
    supported_languages: tuple[str, ...] = ("en", "de")


class Health(BaseModel):
    status: Literal["ok"] = "ok"
    application: Literal["Cemaris"] = "Cemaris"
    version: str = __version__


class ValidationIssue(BaseModel):
    location: list[str | int]
    message: str
    type: str


class ErrorInfo(BaseModel):
    code: str
    message: str
    details: list[ValidationIssue]
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorInfo

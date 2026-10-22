"""Uniform JSON errors without request input or internal exception details."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from cemaris.schemas import ErrorInfo, ErrorResponse, ValidationIssue

logger = logging.getLogger("cemaris.errors")


def error_response(
    request: Request,
    status: int,
    code: str,
    message: str,
    details: list[ValidationIssue] | None = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    request_id = request.state.request_id
    body = ErrorResponse(
        error=ErrorInfo(
            code=code, message=message, details=details or [], request_id=request_id
        )
    )
    return JSONResponse(
        status_code=status,
        content=body.model_dump(),
        headers={**(headers or {}), "X-Request-ID": request_id},
    )


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_error(request: Request, exc: HTTPException) -> JSONResponse:
        return error_response(
            request, exc.status_code, f"http_{exc.status_code}", str(exc.detail),
            headers=exc.headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details = [
            ValidationIssue(
                location=list(issue["loc"]), message=issue["msg"], type=issue["type"]
            )
            for issue in exc.errors()
        ]
        return error_response(
            request, 422, "validation_error", "Request validation failed", details
        )

    @app.exception_handler(Exception)
    async def unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "Unhandled error; request_id=%s", request.state.request_id,
            exc_info=(type(exc), exc, exc.__traceback__),
        )
        return error_response(request, 500, "internal_error", "Internal server error")

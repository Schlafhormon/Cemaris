"""Route paths after the reverse proxy has removed the configured mount path."""

from fastapi import Request
from urllib.parse import urlsplit


class PublicPathMiddleware:
    """Restore a stripped prefix so framework redirects retain the public URL.

    Uvicorn's --root-path already restores it; a stripping proxy plus FastAPI's
    root_path does not. Support both without adding the mount a second time.
    """

    def __init__(self, app, prefix: str, public_url: str | None = None):
        self.app, self.prefix = app, prefix
        self.public_origin = urlsplit(public_url) if public_url else None

    async def __call__(self, scope, receive, send):
        if scope["type"] in {"http", "websocket"}:
            if self.public_origin:
                # This URL is operator configuration. Untrusted forwarding
                # headers cannot change redirect origins or HTTPS detection.
                origin = self.public_origin
                scheme = origin.scheme if scope["type"] == "http" else "wss" if origin.scheme == "https" else "ws"
                scope = {**scope, "scheme": scheme,
                         "server": (origin.hostname, origin.port or (443 if origin.scheme == "https" else 80)),
                         "headers": [(key, value) for key, value in scope["headers"] if key.lower() != b"host"]
                                    + [(b"host", origin.netloc.encode("idna"))]}
            path = scope["path"]
            if self.prefix and path != self.prefix and not path.startswith(self.prefix + "/"):
                scope = {**scope, "path": self.prefix + path}
                if "raw_path" in scope:
                    scope["raw_path"] = self.prefix.encode("ascii") + scope["raw_path"]
        await self.app(scope, receive, send)


def route_path(request: Request) -> str:
    """Handle both stripped proxy scopes and ASGI servers restoring root_path."""
    path = request.scope["path"]
    prefix = request.scope.get("root_path", "").rstrip("/")
    if prefix and (path == prefix or path.startswith(prefix + "/")):
        return path[len(prefix):] or "/"
    return path

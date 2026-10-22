"""Verify a running Cemaris web/API pair, locally or through Compose's proxy."""

import json
from pathlib import Path
import sys
from urllib.error import HTTPError
from urllib.request import urlopen
from uuid import UUID


def main() -> None:
    base = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
    root = Path(__file__).resolve().parents[1]

    def fetch(path: str):
        try:
            response = urlopen(base + path, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            return response.status, response.headers, response.read()

    status, _, body = fetch("/")
    assert status == 200 and b"Cemaris" in body and b'id="root"' in body
    for path in ("/api/health", "/api/config"):
        status, headers, body = fetch(path)
        assert status == 200 and "application/json" in headers["Content-Type"]
        data = json.loads(body)
        assert data["application"] == "Cemaris" and data["version"] == "0.1.0"
        assert UUID(headers["X-Request-ID"]).version == 4
        if path.endswith("health"):
            assert data["status"] == "ok"
        else:
            assert data["supported_languages"] == ["en", "de"]

    status, headers, body = fetch("/api/not-implemented")
    assert status == 404 and "application/json" in headers["Content-Type"]
    error = json.loads(body)["error"]
    assert error["code"] == "http_404"
    assert error["request_id"] == headers["X-Request-ID"]

    for name in ("cemaris-icon.png", "cemaris-logo.png"):
        status, headers, body = fetch("/branding/" + name)
        assert status == 200 and headers["Content-Type"].startswith("image/png")
        assert body == (root / "frontend/public/branding" / name).read_bytes()

    status, _, body = fetch("/THIRD-PARTY-NOTICES.txt")
    assert status == 200 and b"The Corporation of the City of Sault Ste. Marie" in body
    print("PASS: web shell, API contracts/errors, unchanged branding and Sunrise notice")


if __name__ == "__main__":
    main()

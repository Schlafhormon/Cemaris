"""Real target upload route versus executed locked Multer multipart fixtures.

Only the SQL connection/metadata boundary is replaced; FastAPI, Starlette,
python-multipart, bounded receive, file size check and physical storage execute.
The actual SQL metadata/audit boundary has separate disposable SQL tests.
"""
from contextlib import nullcontext
import hashlib
import json
from pathlib import Path
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from cemaris import attachments
from cemaris.auth import require_update_contracts
from cemaris.errors import install_error_handlers

REFERENCE = json.loads((Path(__file__).parent / "fixtures/upload-multipart-reference.json").read_text(encoding="utf-8"))


def multipart(case):
    boundary = REFERENCE["boundary"]
    buffers = []
    for name, value in case["fields"].items():
        buffers.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode())
    for file in case["files"]:
        buffers.extend([f'--{boundary}\r\nContent-Disposition: form-data; name="{file["field"]}"; filename="{file["filename"]}"\r\nContent-Type: {file.get("content_type", "application/octet-stream")}\r\n\r\n'.encode(),
            bytes.fromhex(file["content_hex"]), b"\r\n"])
    buffers.append(f"--{boundary}--\r\n".encode())
    return b"".join(buffers)


@pytest.fixture
def parser_app(tmp_path, monkeypatch):
    app = FastAPI()
    from cemaris.preferences import PreferenceOptions
    app.state.preference_options = PreferenceOptions(_env_file=None, audit_log_enabled=False)
    app.dependency_overrides[require_update_contracts] = lambda: {"username": "synthetic-parser"}
    # The parsed file must reach the real bounded storage path before the SQL
    # boundary captures metadata. No SQLite or application DB acts as a fixture.
    import cemaris.dependencies
    monkeypatch.setattr(cemaris.dependencies, "get_engine", lambda request: SimpleNamespace(begin=lambda: nullcontext(object())))
    monkeypatch.setattr(attachments, "_raw", lambda *args, **kwargs: {"contractId": 1})
    captures = []
    monkeypatch.setattr(attachments, "add_contract_attachment", lambda connection, form, actor, **kwargs: captures.append(dict(form)) or 1)
    monkeypatch.setattr(attachments, "get_contract_attachments", lambda *args: [])
    attachments.install_attachments(app, attachments.AttachmentOptions(_env_file=None, attachments_path=tmp_path / "attachments",
        max_attachment_file_size=REFERENCE["file_size_limit_bytes"] / (1024 * 1024)))

    @app.middleware("http")
    async def request_id(request, call_next):
        request.state.request_id = "synthetic-multipart-reference"
        return await call_next(request)

    install_error_handlers(app)
    return app, captures


@pytest.mark.parametrize("case", REFERENCE["cases"], ids=lambda case: case["name"])
def test_actual_upload_route_matches_original_multipart_contract(parser_app, case):
    app, captures = parser_app
    body = multipart(case)
    headers = {"Content-Type": f'multipart/form-data; boundary={REFERENCE["boundary"]}'}
    if case.get("chunked"):
        def chunks():
            for offset in range(0, len(body), case["chunk_size"]):
                yield body[offset:offset + case["chunk_size"]]
        content = chunks()
        headers["Transfer-Encoding"] = "chunked"
    else:
        content = body
        headers["Content-Length"] = str(len(body))
    with TestClient(app) as client:
        response = client.post("/api/contracts/doUploadContractAttachment", content=content, headers=headers)
    expected = case["expected"]
    if expected.get("error"):
        if expected["error"]["code"] == "LIMIT_FILE_SIZE":
            assert response.status_code == 413, response.text
        elif case["name"] == "unexpected-field":
            # Multer raises LIMIT_UNEXPECTED_FILE before its handler; target
            # finds no file named 'file' and returns the source handler error.
            assert response.status_code == 200
            assert response.json() == {"success": False, "errorMessage": "No file uploaded."}
        else:
            assert response.status_code == 400, response.text
        assert captures == []
    elif expected["file"] is None:
        assert response.status_code == 200
        assert response.json() == {"success": False, "errorMessage": "No file uploaded."}
        assert captures == []
    else:
        assert response.status_code == 200 and response.json()["success"], response.text
        assert len(captures) == 1
        saved = captures[0]
        original_name = expected["file"]["originalname"]
        if case["name"] == "unicode-filename":
            # Explicit encoding correction: UTF-8 instead of Busboy's default
            # Latin-1 interpretation of multipart filename parameter bytes.
            assert original_name == case["files"][0]["filename"].encode("utf-8").decode("latin-1")
            original_name = case["files"][0]["filename"]
        assert saved["fileName"] == attachments.sanitize_filename(original_name)
        assert saved["attachmentTitle"] == expected["fields"].get("attachmentTitle", original_name)
        assert saved["attachmentDetails"] == expected["fields"].get("attachmentDetails", "")
        assert saved["contractId"] == int(expected["fields"]["contractId"])
        data = (Path(saved["filePath"]) / saved["fileName"]).read_bytes()
        assert len(data) == expected["file"]["size"]
        assert data.hex() == expected["file"]["content_hex"]
        assert hashlib.sha256(data).hexdigest() == expected["file"]["content_sha256"]
    if not captures:
        assert list(app.state.attachment_options.attachments_path.rglob("*")) == []

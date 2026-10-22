"""Run Step-03 browser QA against a fresh, disposable SQL Server database.

Requires the backend development dependencies, built frontend and external
Playwright/Chromium. Uses the same guarded CREATE/DROP harness as SQL tests.
Existing application/development databases are never used as fixtures.
"""

import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.request import urlopen
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(ROOT / "backend/tests"))
from conftest import disposable_sql_database, migration_config  # noqa: E402
from alembic import command  # noqa: E402


def wait_for(url, process):
    for _ in range(100):
        if process.poll() is not None:
            raise RuntimeError("QA server exited; see the selected .local/qa-stepXX logs")
        try:
            with urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return
        except OSError:
            time.sleep(0.2)
    raise RuntimeError("QA server did not become ready")


def main(step="03", browser_script="frontend/scripts/smoke-browser.mjs", environment_overrides=None, prepare_database=None, api_command=None, shutdown_api=None):
    if not os.environ.get("CEMARIS_SQL_TEST_ADMIN_URL"):
        raise SystemExit("Set CEMARIS_SQL_TEST_ADMIN_URL explicitly targeting SQL Server master")
    for port in (8000, 4173):
        with socket.socket() as probe:
            if probe.connect_ex(("127.0.0.1", port)) == 0:
                raise SystemExit(f"QA port {port} is already in use; existing processes are preserved")
    qa = ROOT / f".local/qa-step{step}"
    qa.mkdir(parents=True, exist_ok=True)
    create_database = disposable_sql_database.__wrapped__()
    with create_database() as (engine, name):
        with engine.begin() as connection:
            command.upgrade(migration_config(connection), "head")
            prepared_environment = prepare_database(connection) if prepare_database else {}
        environment = dict(os.environ)
        environment.update({
            "CEMARIS_ENVIRONMENT": "test",
            "CEMARIS_DATABASE_URL": engine.url.render_as_string(hide_password=False),
            "CEMARIS_AUTH_TYPE": "plainText", "CEMARIS_AUTH_DOMAIN": "",
            "CEMARIS_AUTH_CONFIG": json.dumps({"users": {"\\qa-admin": "synthetic-qa-password", "\\qa-reader": "synthetic-reader-password"}}),
            "CEMARIS_AUTH_CAN_LOGIN": '["qa-admin","qa-reader"]',
            "CEMARIS_AUTH_IS_ADMIN": '["qa-admin"]',
            "CEMARIS_AUTH_CAN_UPDATE": "[]", "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": "[]",
            "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": "[]", "CEMARIS_AUTH_CAN_UPDATE_WORK_ORDERS": "[]",
            "CEMARIS_AUTH_COOKIE_SECURE": "false", "CEMARIS_AUTH_COOKIE_NAME": "cemaris-user-sid",
            "CEMARIS_AUTH_SESSION_DIRECTORY": str(qa / ("sessions-" + uuid4().hex)),
            "CEMARIS_AUTH_DO_KEEP_ALIVE": "false", "CEMARIS_AUTH_URL_PREFIX": "",
            "CEMARIS_AUTH_USE_TEST_DATABASES": "false", "CEMARIS_AUTH_TRAFFIC_IS_FORWARDED": "false",
            "CEMARIS_AUTH_DISABLE_RATE_LIMIT": "false", "CEMARIS_AUDIT_LOG_ENABLED": "true",
            "CEMARIS_QA_USERNAME": "qa-admin", "CEMARIS_QA_PASSWORD": "synthetic-qa-password",
            "CEMARIS_QA_READER_USERNAME": "qa-reader", "CEMARIS_QA_READER_PASSWORD": "synthetic-reader-password",
            "CEMARIS_SMOKE_URL": "http://127.0.0.1:4173/",
            "CEMARIS_QA_DIRECTORY": str(qa),
        })
        environment.update(environment_overrides or {})
        environment.update(prepared_environment)
        processes = []
        flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        try:
            with (qa / "api.log").open("w", encoding="utf-8") as api_log, (qa / "web.log").open("w", encoding="utf-8") as web_log:
                api = subprocess.Popen(api_command or [sys.executable, "-m", "uvicorn", "--app-dir", "backend", "cemaris.main:app", "--host", "127.0.0.1", "--port", "8000"],
                                       cwd=ROOT, env=environment, stdout=api_log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, creationflags=flags)
                processes.append(api)
                wait_for("http://127.0.0.1:8000/api/health", api)
                web = subprocess.Popen(["node", "node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
                                       cwd=ROOT / "frontend", env=environment, stdout=web_log, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, creationflags=flags)
                processes.append(web)
                wait_for("http://127.0.0.1:4173/", web)
                print(f"QA database created: {name}", flush=True)
                subprocess.run(["node", browser_script], cwd=ROOT, env=environment, check=True)
                subprocess.run([sys.executable, "scripts/smoke_http.py", "http://127.0.0.1:4173"], cwd=ROOT, env=environment, check=True)
        finally:
            try:
                if shutdown_api and processes and processes[0].poll() is None:
                    shutdown_api(processes[0])
            finally:
                for process in reversed(processes):
                    if process.poll() is not None:
                        continue
                    process.terminate()
                    try:
                        process.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=5)
    print("QA complete; disposable SQL database removed; server processes stopped.")


if __name__ == "__main__":
    main()

"""Real HTTPS -> nginx -> API/SQL acceptance at / and /cemaris.

Requires an external nginx binary, OpenSSL and Playwright. All SQL writes use
the existing guarded disposable-database harness. Never deploys a service.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
sys.path[:0] = [str(ROOT / "backend"), str(ROOT / "backend/tests")]
from conftest import disposable_sql_database, migration_config
from alembic import command
from cemaris.db.fixtures import load_synthetic_fixtures
from cemaris.db.schema import TABLES
import sqlalchemy as sa


def run(*args, env=None, cwd=ROOT, log=None):
    subprocess.run(list(args), cwd=cwd, env=env, check=True, stdout=log,
                   stderr=subprocess.STDOUT if log else None)


def wait_for(url, process):
    for _ in range(100):
        if process.poll() is not None:
            raise RuntimeError("Acceptance server exited; inspect .local/qa-step16/proxy")
        try:
            with urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return
        except OSError:
            time.sleep(0.2)
    raise RuntimeError("Acceptance server readiness timed out")


def main():
    nginx = str(Path(os.environ["CEMARIS_NGINX_EXECUTABLE"]).resolve())
    openssl = shutil.which("openssl")
    if not openssl or not os.environ.get("CEMARIS_SQL_TEST_ADMIN_URL"):
        raise SystemExit("Requires OpenSSL and explicit SQL test administration URL to master")
    for port in (8000, 4173, 4174):
        with socket.socket() as probe:
            if probe.connect_ex(("127.0.0.1", port)) == 0:
                raise SystemExit(f"Acceptance port {port} is in use; preserving existing processes")
    output = ROOT / ".local/qa-step16/proxy"
    output.mkdir(parents=True, exist_ok=True)
    with (output / "certificate.log").open("w", encoding="utf-8") as log:
        run(openssl, "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "2",
            "-subj", "/CN=127.0.0.1", "-addext", "subjectAltName=IP:127.0.0.1",
            "-keyout", str(output / "key.pem"), "-out", str(output / "cert.pem"), log=log)
    results = []
    for prefix in ("", "/cemaris"):
        qa = output / ("subpath" if prefix else "root")
        qa.mkdir(parents=True, exist_ok=True)
        (qa / "logs").mkdir(exist_ok=True)
        (qa / "temp").mkdir(exist_ok=True)
        with disposable_sql_database.__wrapped__()() as (engine, name):
            with engine.begin() as connection:
                command.upgrade(migration_config(connection), "head")
                ids = load_synthetic_fixtures(connection, expected_database=name).ids
                connection.execute(TABLES["ContractAttachments"].delete())
                connection.execute(TABLES["WorkOrderMilestones"].update().values(
                    workOrderMilestoneDate=int(time.strftime("%Y%m%d"))))
            env = dict(os.environ)
            env.update({
                "CEMARIS_ENVIRONMENT": "test", "CEMARIS_URL_PREFIX": prefix,
                "CEMARIS_AUTH_URL_PREFIX": prefix, "CEMARIS_AUTH_TYPE": "plainText",
                "CEMARIS_AUTH_DOMAIN": "", "CEMARIS_AUTH_CONFIG": json.dumps({"users": {
                    "\\qa-admin": "synthetic-qa-password", "\\qa-reader": "synthetic-reader-password"}}),
                "CEMARIS_DATABASE_URL": engine.url.render_as_string(hide_password=False),
                "CEMARIS_AUTH_CAN_LOGIN": '["qa-admin","qa-reader"]',
                "CEMARIS_AUTH_IS_ADMIN": '["qa-admin"]', "CEMARIS_AUTH_CAN_UPDATE": "[]",
                "CEMARIS_AUTH_CAN_UPDATE_CONTRACTS": '["qa-admin"]',
                "CEMARIS_AUTH_CAN_UPDATE_CEMETERIES": '["qa-admin"]',
                "CEMARIS_AUTH_CAN_UPDATE_WORK_ORDERS": '["qa-admin"]',
                "CEMARIS_AUTH_COOKIE_SECURE": "true", "CEMARIS_AUTH_DO_KEEP_ALIVE": "false",
                "CEMARIS_AUTH_TRAFFIC_IS_FORWARDED": "true",
                "CEMARIS_AUTH_SESSION_DIRECTORY": str(qa / "sessions"),
                "CEMARIS_ATTACHMENTS_PATH": str(qa / "attachments"),
                "CEMARIS_CUSTOMIZATIONS_PATH": str(ROOT / "backend/tests/fixtures/printing-customizations"),
                "CEMARIS_AUDIT_LOG_ENABLED": "true", "CEMARIS_BACKUP_TASK_ENABLED": "false",
                "CEMARIS_APP_URL": "https://127.0.0.1:4174" + prefix,
                "CEMARIS_SMOKE_URL": "https://127.0.0.1:4174" + prefix + "/",
                "CEMARIS_QA_DIRECTORY": str(qa), "CEMARIS_QA_IDS": json.dumps(ids),
            })
            with (qa / "build.log").open("w", encoding="utf-8") as log:
                run("npm.cmd" if os.name == "nt" else "npm", "--prefix", "frontend", "run", "build", env=env, log=log)
            run("node", "deploy/render-nginx.mjs", "deploy/nginx.conf", str(qa / "server.conf"), prefix, "127.0.0.1")
            server = (qa / "server.conf").read_text(encoding="utf-8")
            server = server.replace("listen 8080;", "listen 127.0.0.1:4173;")
            server = server.replace("root /usr/share/nginx/html;", f'root "{(ROOT / "frontend/dist").as_posix()}";')
            server = server.replace("http://api:8000", "http://127.0.0.1:8000")
            # QA-only echo proves real-IP trust/outer-header replacement without
            # adding any diagnostic endpoint to the shipped application.
            server = server.replace("    index index.html;", '''    index index.html;
                location = /_qa-client { default_type text/plain; return 200 "$remote_addr"; }''')
            outer = f'''server {{
                listen 127.0.0.1:4174 ssl;
                ssl_certificate "{(output / 'cert.pem').as_posix()}";
                ssl_certificate_key "{(output / 'key.pem').as_posix()}";
                access_log off;
                location / {{
                    proxy_pass http://127.0.0.1:4173;
                    proxy_set_header Host $http_host;
                    proxy_set_header X-Real-IP $remote_addr;
                    proxy_set_header X-Forwarded-For $remote_addr;
                    proxy_set_header X-Forwarded-Proto $scheme;
                }}
            }}'''
            mime = Path(nginx).parent / "conf/mime.types"
            conf = f'worker_processes 1;\npid logs/nginx.pid;\nerror_log logs/error.log;\nevents {{ worker_connections 128; }}\nhttp {{ include "{mime.as_posix()}"; {server}\n{outer}\n}}\n'
            (qa / "nginx.conf").write_text(conf, encoding="utf-8")
            nginx_args = [nginx, "-p", qa.as_posix() + "/", "-c", "nginx.conf"]
            run(*nginx_args, "-t")
            flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            processes = []
            with (qa / "api.log").open("w", encoding="utf-8") as api_log, (qa / "nginx.log").open("w", encoding="utf-8") as nginx_log:
                try:
                    api = subprocess.Popen([sys.executable, "-m", "uvicorn", "--app-dir", "backend", "cemaris.main:app", "--host", "127.0.0.1", "--port", "8000", "--no-proxy-headers"], cwd=ROOT, env=env, stdout=api_log, stderr=subprocess.STDOUT, creationflags=flags)
                    processes.append(api)
                    wait_for("http://127.0.0.1:8000/api/health", api)
                    proxy = subprocess.Popen(nginx_args + ["-g", "daemon off;"], cwd=qa, stdout=nginx_log, stderr=subprocess.STDOUT, creationflags=flags)
                    processes.append(proxy)
                    wait_for("http://127.0.0.1:4173/healthz", proxy)
                    run("node", "frontend/scripts/deployment-browser.mjs", env=env)
                    with engine.connect() as connection:
                        assert connection.scalar(sa.select(TABLES["Contracts"].c.purchaserName).where(TABLES["Contracts"].c.contractId == ids["contract"])) == "Synthetic Proxy Purchaser 🪦"
                        assert connection.scalar(sa.select(sa.func.count()).select_from(TABLES["ContractAttachments"])) == 1
                    results.append({"prefix": prefix, "database": name, "passed": True})
                finally:
                    if len(processes) > 1 and processes[1].poll() is None:
                        subprocess.run(nginx_args + ["-s", "quit"], cwd=qa, stdout=nginx_log, stderr=subprocess.STDOUT, timeout=10)
                    for process in reversed(processes):
                        if process.poll() is None:
                            try:
                                process.wait(timeout=3)
                            except subprocess.TimeoutExpired:
                                process.terminate()
                                process.wait(timeout=10)
    (output / "results.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print("PASS: Root and subpath HTTPS/nginx/browser/SQL; disposable databases removed and processes stopped")


if __name__ == "__main__":
    main()

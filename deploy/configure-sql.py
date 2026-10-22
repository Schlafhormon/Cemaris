#!/usr/bin/env python3
"""Import the protected server-side SQL login JSON into this server's .env."""

import argparse
import json
import os
from pathlib import Path
import sys
from urllib.parse import quote, urlencode


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=root / ".local/deployment/sql-login.json")
    args = parser.parse_args()
    if args.input.stat().st_mode & 0o077:
        raise ValueError("SQL input must be readable by its owner only (chmod 600)")
    data = json.loads(args.input.read_text())
    server, database, username = (data[key] for key in ("server", "database", "username"))
    password = data["password"]
    if not all(isinstance(value, str) and value for value in (server, database, username, password)):
        raise ValueError("Server, database, username and password are required")
    if database.casefold() in {"master", "model", "msdb", "tempdb"}:
        raise ValueError("A dedicated Cemaris database is required")
    if any(character in server for character in "/@?#\r\n"):
        raise ValueError("Use a plain SQL server hostname")
    port = int(data.get("port", 1433))
    if not 0 < port < 65536:
        raise ValueError("Invalid SQL port")
    trust = data.get("trust_server_certificate", False)
    if not isinstance(trust, bool):
        raise ValueError("trust_server_certificate must be a JSON boolean")
    query = urlencode({"driver": "ODBC Driver 18 for SQL Server", "Encrypt": "yes",
                       "TrustServerCertificate": "yes" if trust else "no"})
    url = (f"mssql+pyodbc://{quote(username, safe='')}:{quote(password, safe='')}"
           f"@{server}:{port}/{quote(database, safe='')}?{query}")
    path = root / ".env"
    # Preserve every other setting and avoid conflicting duplicate SQL keys.
    lines = [line for line in path.read_text().splitlines()
             if not line.startswith("CEMARIS_DATABASE_URL=")]
    lines.append("CEMARIS_DATABASE_URL=" + url)
    os.umask(0o077)
    temporary = path.with_name(".env.configure.tmp")
    try:
        with temporary.open("x") as stream:
            stream.write("\n".join(lines) + "\n")
        os.chmod(temporary, 0o600)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)
    print("Protected SQL connection imported; encryption enabled; certificate verification "
          + ("disabled by server configuration." if trust else "enabled."))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print("SQL configuration incomplete; check protected input, required fields and file permissions.",
              file=sys.stderr)
        raise SystemExit(1)

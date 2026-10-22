"""Read-only deployment check: SQL Server and the image's Alembic revision.

The public /api/health route remains process liveness. This script is used by
the container healthcheck and startup; it never migrates or seeds a database.
"""

from pathlib import Path
import sys
from urllib.request import urlopen

APPLICATION = Path(__file__).resolve().parents[1]
if (APPLICATION / "backend" / "alembic.ini").is_file():
    APPLICATION = APPLICATION / "backend"
sys.path.insert(0, str(APPLICATION))

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import text

from cemaris.db.engine import create_database_engine


SYSTEM_DATABASES = frozenset({"master", "model", "msdb", "tempdb"})


def migration_config() -> Config:
    config = Config(str(APPLICATION / "alembic.ini"))
    config.set_main_option("script_location", str(APPLICATION / "migrations"))
    return config


def application_database(connection) -> str:
    name = connection.scalar(text("SELECT DB_NAME()"))
    if not isinstance(name, str) or not name or name.casefold() in SYSTEM_DATABASES:
        raise RuntimeError("A dedicated application database is required")
    return name


def check_database(engine=None, *, config=None) -> None:
    owned = engine is None
    engine = create_database_engine() if owned else engine
    try:
        expected = set(ScriptDirectory.from_config(config or migration_config()).get_heads())
        with engine.connect() as connection:
            application_database(connection)
            current = set(connection.scalars(text("SELECT version_num FROM dbo.alembic_version")))
            if not expected or current != expected:
                raise RuntimeError("Application schema does not match this image's migrations")
    finally:
        if owned:
            engine.dispose()


def main(*, probe_http=False) -> int:
    try:
        if probe_http:
            with urlopen("http://127.0.0.1:8000/api/health", timeout=3) as response:
                if response.status != 200:
                    raise RuntimeError("HTTP process is unavailable")
        check_database()
    except Exception:
        # ODBC exceptions can include server names and connection attributes.
        print("Cemaris database readiness failed; check SQL connectivity, permissions and migration status", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(probe_http="--http" in sys.argv))

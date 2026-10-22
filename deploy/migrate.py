"""One-shot migration job. No web server, fixtures, users or integrations."""

import sys

from alembic import command

from readiness import application_database, check_database, migration_config
from cemaris.db.engine import create_database_engine


def migrate(engine=None, *, config=None) -> None:
    owned = engine is None
    engine = create_database_engine() if owned else engine
    config = config or migration_config()
    try:
        with engine.connect() as connection:
            application_database(connection)
            connection.rollback()
            config.attributes["connection"] = connection
            try:
                command.upgrade(config, "head")
            finally:
                config.attributes.pop("connection", None)
        check_database(engine, config=config)
    finally:
        if owned:
            engine.dispose()


def main() -> int:
    try:
        migrate()
    except Exception:
        print("Cemaris migration failed; check SQL connectivity, dedicated database, permissions and migration history", file=sys.stderr)
        return 1
    print("Cemaris schema is at the image's migration head")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

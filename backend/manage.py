"""Explicit database administration commands; run from the repository root."""

import argparse

from sqlalchemy import text

from cemaris.db.engine import create_database_engine
from cemaris.db.seed import seed_default_catalogs
from cemaris.catalogs import CatalogOptions, initialize_catalogs
from cemaris.preferences import PreferenceOptions


def main() -> None:
    parser = argparse.ArgumentParser(description="Cemaris SQL Server administration")
    parser.add_argument("command", choices=["info", "seed-catalogs", "initialize-catalogs"])
    args = parser.parse_args()
    engine = create_database_engine()
    try:
        with engine.begin() as connection:
            name = connection.scalar(text("SELECT DB_NAME()"))
            if args.command == "info":
                version = connection.scalar(text("SELECT CAST(SERVERPROPERTY('ProductVersion') AS varchar(50))"))
                print(f"Cemaris database: {name}; SQL Server: {version}")
            elif args.command == "seed-catalogs":
                counts = seed_default_catalogs(connection)
                print(f"Cemaris database: {name}; inserted {sum(counts.values())} catalog records")
            else:
                counts = initialize_catalogs(connection, options=CatalogOptions(),
                                             audit_enabled=PreferenceOptions().audit_log_enabled)
                print(f"Cemaris database: {name}; initialized order numbers; inserted {sum(counts.values())} catalog records")
    finally:
        engine.dispose()


if __name__ == "__main__":
    main()

"""Alembic environment for the SQL Server application database."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection

from cemaris.db.engine import create_database_engine
from cemaris.db.schema import metadata, metadata_for_comparison

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)


def configure(connection: Connection) -> None:
    if connection.dialect.name != "mssql":
        raise RuntimeError("Cemaris migrations require Microsoft SQL Server")
    # MSSQL reflection reports the current default schema as None, including
    # the referred schema of FKs. Compare equivalent names without modifying
    # the dbo-qualified application model or any historical migration.
    default_schema = connection.dialect.default_schema_name
    context.configure(
        connection=connection,
        target_metadata=metadata_for_comparison(default_schema),
        include_schemas=True,
        version_table_schema=None if default_schema == "dbo" else "dbo",
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    supplied_connection = config.attributes.get("connection")
    if supplied_connection is not None:
        configure(supplied_connection)
        return
    engine = create_database_engine()
    try:
        with engine.connect() as connection:
            configure(connection)
    finally:
        engine.dispose()


def run_migrations_offline() -> None:
    # No secret or live connection is necessary to review SQL Server DDL.
    context.configure(
        dialect_name="mssql",
        target_metadata=metadata,
        include_schemas=True,
        version_table_schema="dbo",
        literal_binds=True,
    )
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

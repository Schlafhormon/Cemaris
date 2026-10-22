"""Create lazy SQL Server engines; importing this module never connects."""

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine, URL, make_url

from cemaris.config import Settings


def create_database_engine(database_url: str | URL | None = None) -> Engine:
    if database_url is None:
        configured = Settings().database_url
        if configured is None:
            raise ValueError("CEMARIS_DATABASE_URL is required for database operations")
        database_url = configured.get_secret_value()
    url = make_url(database_url)
    if url.drivername != "mssql+pyodbc" or not url.database:
        raise ValueError("Expected mssql+pyodbc and an explicit database name")
    # No echo: bound values can include personal information or credentials.
    engine = create_engine(
        url,
        pool_pre_ping=True,
        hide_parameters=True,
        connect_args={"timeout": 10},
    )
    @event.listens_for(engine, "connect")
    def set_statement_timeout(dbapi_connection, _):
        dbapi_connection.timeout = 30

    return engine

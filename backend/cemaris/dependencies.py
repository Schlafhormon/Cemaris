"""Shared lazy SQL Server access for HTTP services.

Tests may supply their own disposable Engine on app.state.db_engine. Public
process checks and anonymous sessions never create a database connection.
"""

from fastapi import HTTPException, Request
from sqlalchemy.engine import Engine

from cemaris.db.engine import create_database_engine


def get_engine(request: Request) -> Engine:
    engine = getattr(request.app.state, "db_engine", None)
    if engine is not None:
        return engine
    with request.app.state.db_engine_lock:
        engine = getattr(request.app.state, "db_engine", None)
        if engine is None:
            configured = request.app.state.settings.database_url
            if configured is None:
                raise HTTPException(503, "Application database is not configured")
            engine = create_database_engine(configured.get_secret_value())
            request.app.state.db_engine = engine
            request.app.state.owns_db_engine = True
    return engine

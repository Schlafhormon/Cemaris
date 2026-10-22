"""Cemaris HTTP application and coordinated worker lifecycle."""

from contextlib import asynccontextmanager
import asyncio
import logging
from threading import Lock, Thread
from uuid import uuid4

from fastapi import FastAPI, Request

from cemaris import __version__
from cemaris.config import Settings
from cemaris.errors import install_error_handlers
from cemaris.paths import PublicPathMiddleware
from cemaris.schemas import ErrorResponse, Health, PublicConfig


def create_app(settings: Settings | None = None, *, auth_settings=None, preference_options=None, catalog_options=None, burial_site_options=None, contract_options=None, work_order_options=None, attachment_options=None, print_options=None, operations_options=None) -> FastAPI:
    from cemaris.accounts import install_accounts
    from cemaris.auth import install_auth
    from cemaris.preferences import install_preferences
    from cemaris.catalogs import install_catalogs
    from cemaris.cemeteries import install_cemeteries
    from cemaris.burial_sites import install_burial_sites
    from cemaris.places_audit import install_place_audit
    from cemaris.geography import install_geography
    from cemaris.contracts import install_contracts
    from cemaris.contract_items import install_contract_items
    from cemaris.contract_finance import install_contract_finance
    from cemaris.funeral_homes import install_funeral_homes
    from cemaris.work_orders import install_work_orders
    from cemaris.attachments import install_attachments
    from cemaris.printing import install_printing
    from cemaris.reports import install_reports
    from cemaris.dashboard import install_dashboard
    from cemaris.operations import install_operations

    settings = settings if settings is not None else Settings()
    logging.getLogger("cemaris").setLevel(settings.log_level.upper())

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        try:
            app.state.backup_task.start()
            yield
        finally:
            stopped = False
            try:
                stopped = await asyncio.to_thread(app.state.backup_task.stop)
            finally:
                if getattr(app.state, "owns_db_engine", False):
                    engine = app.state.db_engine
                    if stopped is False:
                        logging.getLogger("cemaris").warning("Backup worker is still stopping; waiting before database disposal")
                        def dispose_after_backup():
                            app.state.backup_task.wait()
                            engine.dispose()
                        Thread(target=dispose_after_backup, name="cemaris-backup-shutdown", daemon=True).start()
                    else:
                        engine.dispose()

    app = FastAPI(
        title="Cemaris API",
        version=__version__,
        debug=False,
        docs_url="/api/docs" if settings.environment != "production" else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if settings.environment != "production" else None,
        responses={"default": {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.db_engine_lock = Lock()
    install_auth(app, auth_settings=auth_settings)
    app.root_path = app.state.auth_settings.url_prefix
    app.add_middleware(PublicPathMiddleware, prefix=app.root_path, public_url=settings.app_url)
    install_preferences(app, options=preference_options)
    install_accounts(app)
    install_catalogs(app, options=catalog_options)
    install_burial_sites(app, options=burial_site_options)
    install_cemeteries(app)
    install_place_audit(app)
    install_geography(app)
    install_contracts(app, options=contract_options)
    install_contract_items(app)
    install_contract_finance(app)
    install_funeral_homes(app)
    install_work_orders(app, options=work_order_options)
    install_attachments(app, options=attachment_options)
    install_printing(app, options=print_options)
    install_reports(app)
    install_dashboard(app)
    install_operations(app, options=operations_options)

    @app.middleware("http")
    async def request_id(request: Request, call_next):
        request.state.request_id = uuid4().hex
        response = await call_next(request)
        response.headers["X-Request-ID"] = request.state.request_id
        return response

    install_error_handlers(app)

    @app.get("/api/health", response_model=Health, tags=["system"])
    async def health() -> Health:
        """Process liveness; deployment readiness separately checks SQL/schema."""
        return Health()

    @app.get("/api/config", response_model=PublicConfig, tags=["system"])
    async def public_config() -> PublicConfig:
        """Only public application metadata, never credentials or server settings."""
        return PublicConfig()

    return app


app = create_app()

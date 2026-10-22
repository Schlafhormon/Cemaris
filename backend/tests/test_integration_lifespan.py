"""Database ownership while the optional backup worker is stopping."""
from threading import Event, Thread

from fastapi.testclient import TestClient

from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.main import create_app


def test_database_disposal_waits_for_backup_worker():
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=AuthSettings(_env_file=None))
    release, disposed = Event(), Event()

    class Backup:
        thread = Thread(target=release.wait, daemon=True)
        def start(self):
            self.thread.start()
        def stop(self):
            return False
        def wait(self):
            self.thread.join()

    class Engine:
        def dispose(self):
            disposed.set()

    app.state.backup_task = Backup()
    app.state.db_engine, app.state.owns_db_engine = Engine(), True
    try:
        with TestClient(app):
            pass
        assert not disposed.is_set()
        release.set()
        assert disposed.wait(timeout=2)
    finally:
        release.set()


def test_enabled_backup_finishes_before_normal_application_shutdown(monkeypatch):
    from cemaris.operations import OperationsOptions
    from cemaris import sql_backup
    started, release, finished, disposed = Event(), Event(), Event(), Event()
    app = create_app(Settings(_env_file=None, environment="test"), auth_settings=AuthSettings(_env_file=None),
        operations_options=OperationsOptions(_env_file=None, backup_task_enabled=True))
    class Engine:
        def dispose(self):
            assert finished.is_set()
            disposed.set()
    app.state.db_engine, app.state.owns_db_engine = Engine(), True
    monkeypatch.setattr(sql_backup, "database_backup_info", lambda engine: {"elapsedLastBackupMillis": None})
    def backup(**kwargs):
        started.set()
        release.wait(timeout=2)
        finished.set()
        return False
    monkeypatch.setattr(app.state.backup_task, "backup", backup)
    try:
        with TestClient(app):
            assert started.wait(timeout=2)
            release.set()
        assert finished.is_set() and disposed.is_set()
        assert not app.state.backup_task.thread.is_alive()
    finally:
        release.set()

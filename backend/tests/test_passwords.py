"""Password flows over HTTP and persisted credentials on disposable SQL Server."""
from alembic import command
from fastapi.testclient import TestClient
import pytest
import sqlalchemy as sa

from cemaris.accounts import add_user
from cemaris.auth_config import AuthSettings
from cemaris.config import Settings
from cemaris.db.schema import TABLES
from cemaris.main import create_app
from cemaris.passwords import hash_password, verify_password, replace_password
from cemaris.preferences import PreferenceOptions
from conftest import migration_config


def test_scrypt_salts_and_malformed_hashes():
    password = 'Synthetic long password 🪦'
    one, two = hash_password(password), hash_password(password)
    assert one != two and password not in one
    assert verify_password(password, one)
    assert not verify_password('wrong', one)
    for malformed in ('', 'scrypt$999999999999$8$1$aa$aa', 'scrypt$32768$8$1$aa$aa', 'garbage'):
        assert not verify_password(password, malformed)


@pytest.fixture
def password_app(disposable_sql_database, tmp_path):
    with disposable_sql_database() as (engine, _):
        with engine.begin() as connection:
            command.upgrade(migration_config(connection), 'head')
        app = create_app(Settings(_env_file=None, environment='test'), auth_settings=AuthSettings(
            _env_file=None, type='plainText', config={'users': {'\\admin': 'Synthetic admin password'}},
            can_login=['admin'], is_admin=['admin'], session_directory=tmp_path / 'sessions',
        ), preference_options=PreferenceOptions(_env_file=None, audit_log_enabled=True))
        app.state.db_engine = engine
        yield app


def post(client, path, body):
    csrf = client.get('/api/session').json()['csrfToken']
    return client.post(path, json=body, headers={'x-csrf-token': csrf})


def login(client, username, password):
    return post(client, '/api/login', {'username': username, 'password': password})


def change(client, old, new='Synthetic changed password', confirmation=None):
    return post(client, '/api/password/change', {'currentPassword': old, 'newPassword': new,
                                               'confirmPassword': new if confirmation is None else confirmation})


def test_first_login_change_reset_revokes_sessions_and_persists(password_app):
    engine = password_app.state.db_engine
    with TestClient(password_app) as admin, TestClient(password_app) as member, TestClient(password_app) as second:
        assert login(admin, 'admin', 'Synthetic admin password').status_code == 200
        added = post(admin, '/api/admin/users/add', {'username': 'NewMember', 'canUpdateContracts': True})
        assert added.status_code == 200
        assert 'passwordHash' not in added.text and 'scrypt$' not in added.text
        assert login(member, 'NewMember', 'wrong').status_code == 401
        initial = login(member, 'NewMember', 'NewMember')
        assert initial.status_code == 200 and initial.json()['user']['mustChangePassword']
        assert initial.json()['redirect'].endswith('/password/change')
        assert member.get('/api/cemeteries').status_code == 403
        assert member.get('/api/admin/users').status_code == 403
        assert post(member, '/api/user-settings/reset-api-key', {}).status_code == 403
        assert member.post('/api/password/change', json={}).status_code == 403  # CSRF
        assert change(member, 'wrong').status_code == 400
        assert change(member, 'NewMember', 'short').status_code == 400
        assert change(member, 'NewMember', confirmation='different').status_code == 400
        assert change(member, 'NewMember', 'NewMember').status_code == 400
        assert post(member, '/api/admin/users/reset-password', {'username': 'admin'}).status_code == 403
        changed = change(member, 'NewMember')
        assert changed.status_code == 200 and not changed.json()['user']['mustChangePassword']
        assert member.get('/api/cemeteries').status_code == 200
        assert member.get('/api/admin/users').status_code == 403
        assert login(second, 'NewMember', 'NewMember').status_code == 401
        assert login(second, 'NewMember', 'Synthetic changed password').status_code == 200
        assert change(member, 'Synthetic changed password', 'Another synthetic password').status_code == 200
        assert second.get('/api/cemeteries').status_code == 401
        assert login(second, 'NewMember', 'Another synthetic password').status_code == 200
        reset = post(admin, '/api/admin/users/reset-password', {'username': 'NewMember'})
        assert reset.status_code == 200
        assert member.get('/api/session').json()['user'] is None
        assert second.get('/api/cemeteries').status_code == 401
        assert login(member, 'NewMember', 'Another synthetic password').status_code == 401
        assert login(member, 'NewMember', 'NewMember').json()['user']['mustChangePassword']
        assert change(member, 'NewMember', 'Final synthetic password').status_code == 200
        engine.dispose()
        assert login(second, 'NewMember', 'Final synthetic password').status_code == 200
        assert post(admin, '/api/admin/users/reset-password', {'username': 'missing'}).status_code == 404
        with engine.connect() as connection:
            row = connection.execute(sa.select(TABLES['Users']).where(TABLES['Users'].c.username == 'NewMember')).mappings().one()
            assert verify_password('Final synthetic password', row['passwordHash'])
            audit = '\n'.join(str(tuple(r)) for r in connection.execute(sa.select(TABLES['AuditLog'])))
            assert 'scrypt$' not in audit and 'Final synthetic password' not in audit


def test_legacy_user_and_configured_admin_keep_access_and_can_change(password_app):
    engine = password_app.state.db_engine
    with engine.begin() as connection:
        add_user(connection, 'legacy', {}, 'test-synthetic')
        add_user(connection, 'admin', {'isAdmin': True}, 'test-synthetic')
    with TestClient(password_app) as admin, TestClient(password_app) as old_admin, TestClient(password_app) as legacy:
        assert login(admin, 'admin', 'admin').status_code == 401
        assert login(admin, 'admin', 'Synthetic admin password').status_code == 200
        assert login(old_admin, 'admin', 'Synthetic admin password').status_code == 200
        assert change(admin, 'Synthetic admin password', 'Local administrator password').status_code == 200
        assert old_admin.get('/api/admin/users').status_code == 401
        assert login(old_admin, 'admin', 'Synthetic admin password').status_code == 401
        assert login(old_admin, 'admin', 'Local administrator password').status_code == 200
        assert login(legacy, 'legacy', 'legacy').json()['user']['mustChangePassword']
        assert change(legacy, 'legacy').status_code == 200
        # Disabled users remain disabled after a reset; credentials do not grant roles.
        post(admin, '/api/admin/users/toggle', {'username': 'legacy', 'permissionField': 'isActive'})
        assert post(admin, '/api/admin/users/reset-password', {'username': 'legacy'}).status_code == 200
        assert login(legacy, 'legacy', 'legacy').status_code == 401


def test_config_only_account_materializes_without_changing_rights_and_self_reset(password_app):
    with TestClient(password_app) as admin:
        original = login(admin, 'admin', 'Synthetic admin password').json()['user']
        changed = change(admin, 'Synthetic admin password', 'Local administrator password')
        assert changed.status_code == 200
        assert changed.json()['user']['userProperties'] == original['userProperties']
        assert post(admin, '/api/admin/users/reset-password', {'username': 'admin'}).json()['reauthenticate']
        assert admin.get('/api/admin/users').status_code == 401
        assert login(admin, 'admin', 'admin').json()['user']['mustChangePassword']


def test_upgrade_preserves_users_and_password_writes_are_conditional(disposable_sql_database):
    with disposable_sql_database() as (engine, _):
        with engine.begin() as connection:
            command.upgrade(migration_config(connection), '0003')
            connection.execute(sa.text("""INSERT INTO dbo.[Users]
                (username,isAdmin,recordCreate_username,recordCreate_timeMillis,recordUpdate_username,recordUpdate_timeMillis)
                VALUES ('legacy',1,'test-synthetic',1,'test-synthetic',1)"""))
            command.upgrade(migration_config(connection), 'head')
            row = connection.execute(sa.select(TABLES['Users'])).mappings().one()
            assert row['isAdmin'] and row['passwordHash'] is None and row['passwordVersion'] == 0
            replace_password(connection, 'legacy', 'Synthetic updated password', expected_version=0, must_change=False, actor='legacy')
            from fastapi import HTTPException
            with pytest.raises(HTTPException) as error:
                replace_password(connection, 'legacy', 'Lost concurrent update', expected_version=0, must_change=True, actor='legacy')
            assert error.value.status_code == 409
            command.check(migration_config(connection))


def test_reset_blocks_calendar_token_and_first_login_does_not_expose_it(password_app):
    with TestClient(password_app) as admin, TestClient(password_app) as anonymous:
        initial = login(admin, 'admin', 'Synthetic admin password')
        key = initial.json()['user']['userSettings']['apiKey']
        assert anonymous.get(f'/api/{key}/milestoneICS').status_code == 200
        assert change(admin, 'Synthetic admin password', 'Local administrator password').status_code == 200
        assert post(admin, '/api/admin/users/reset-password', {'username': 'admin'}).status_code == 200
        assert anonymous.get(f'/api/{key}/milestoneICS').status_code == 401
        first = login(admin, 'admin', 'admin').json()
        assert first['user']['mustChangePassword'] and first['user']['userSettings'] == {}
        assert change(admin, 'admin', 'Final administrator password').status_code == 200


def test_password_failures_are_throttled_and_deleted_users_cannot_fallback(password_app):
    with TestClient(password_app) as admin, TestClient(password_app) as member:
        login(admin, 'admin', 'Synthetic admin password')
        post(admin, '/api/admin/users/add', {'username': 'member'})
        login(member, 'member', 'member')
        for _ in range(5):
            assert change(member, 'incorrect password').status_code == 400
        assert change(member, 'member').status_code == 429
        password_app.state.login_abuse.clear('testclient')
        assert change(member, 'member').status_code == 200
        assert post(admin, '/api/admin/users/delete', {'username': 'member'}).status_code == 200
        assert member.get('/api/cemeteries').status_code == 401
        assert login(member, 'member', 'Synthetic changed password').status_code == 401
        assert post(admin, '/api/admin/users/add', {'username': 'member'}).status_code == 200
        assert login(member, 'member', 'member').json()['user']['mustChangePassword']


def test_configured_mixed_case_account_can_change_password(password_app):
    password_app.state.auth_settings.config['users']['\\AdminCase'] = 'Synthetic configured password'
    password_app.state.auth_settings.can_login.append('admincase')
    with TestClient(password_app) as client:
        assert login(client, 'AdminCase', 'Synthetic configured password').status_code == 200
        assert change(client, 'Synthetic configured password').status_code == 200
        assert login(client, 'AdminCase', 'Synthetic configured password').status_code == 401
        assert login(client, 'AdminCase', 'Synthetic changed password').status_code == 200

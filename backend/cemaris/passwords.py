"""Local credential lifecycle. Passwords never enter user/audit responses."""

import hashlib
import hmac
import secrets

from fastapi import HTTPException
import sqlalchemy as sa

from cemaris.db.schema import TABLE_Users as USERS
from cemaris.preferences import now_millis, transaction

PASSWORD_COLUMNS = frozenset({'passwordHash', 'passwordMustChange', 'passwordVersion'})


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode('utf-8'), salt=salt, n=131072, r=8, p=1,
                            maxmem=256 * 1024 * 1024, dklen=32)
    return f'scrypt$131072$8$1${salt.hex()}${digest.hex()}'


def verify_password(password: str, encoded: str) -> bool:
    if len(password) > 128:
        return False
    try:
        kind, n, r, p, salt, expected = encoded.split('$')
        if (kind, n, r, p) != ('scrypt', '131072', '8', '1'):
            return False
        salt_bytes, digest_bytes = bytes.fromhex(salt), bytes.fromhex(expected)
        if len(salt_bytes) != 16 or len(digest_bytes) != 32:
            return False
        actual = hashlib.scrypt(password.encode('utf-8'), salt=salt_bytes, n=131072, r=8, p=1,
                                maxmem=256 * 1024 * 1024, dklen=32)
        return hmac.compare_digest(actual, digest_bytes)
    except (ValueError, TypeError):
        return False


def credential(database, username: str):
    """Prefer the exact stored identity; support historical mixed-case names."""
    with transaction(database) as connection:
        for name in dict.fromkeys((username, username.lower())):
            row = connection.execute(sa.select(USERS).where(USERS.c.username == name)).mappings().first()
            if row is not None:
                return dict(row)
    return None


def configured_password(settings, username: str) -> str | None:
    if settings.type != 'plainText':
        return None
    return settings.config.get('users', {}).get(settings.domain + '\\' + username)


def local_login(database, settings, username: str, password: str):
    """Return (handled, valid, revision). An existing local hash always beats adapters.

    Old users without adapter credentials get the requested initial password.
    Configured passwords keep working until changed locally.
    """
    row = credential(database, username)
    if row is None:
        return False, False, 0
    if row['passwordHash']:
        return True, bool(row['isActive'] and row['recordDelete_timeMillis'] is None
                          and verify_password(password, row['passwordHash'])), row['passwordVersion']
    if row['recordDelete_timeMillis'] is not None:
        return False, False, row['passwordVersion']
    if configured_password(settings, row['username']) is not None or settings.type not in (None, 'plainText'):
        return False, False, row['passwordVersion']
    valid = row['isActive'] and hmac.compare_digest(password.encode(), row['username'].encode())
    if valid:
        # The revision only adds columns. Provision on verified first use, using
        # a conditional write so simultaneous requests cannot replace a password.
        with transaction(database) as connection:
            result = connection.execute(USERS.update().where(
                USERS.c.username == row['username'], USERS.c.passwordHash.is_(None),
                USERS.c.passwordVersion == row['passwordVersion'], USERS.c.isActive == True,
                USERS.c.recordDelete_timeMillis.is_(None),
            ).values(passwordHash=hash_password(row['username']), passwordMustChange=True,
                     passwordVersion=USERS.c.passwordVersion + 1))
            valid = result.rowcount == 1
    return True, bool(valid), row['passwordVersion'] + (1 if valid else 0)


def session_properties(database, settings, username: str) -> dict:
    row = credential(database, username)
    local = row is not None and bool(row['passwordHash'])
    unprovisioned = (row is not None and not local and settings.type in (None, 'plainText')
                    and configured_password(settings, row['username']) is None)
    return {'passwordVersion': row['passwordVersion'] if row else 0,
            'mustChangePassword': bool(row and (row['passwordMustChange'] or unprovisioned)),
            'canChangePassword': local or unprovisioned or settings.type == 'plainText'}


def validate_new_password(username: str, old: str, new: str, confirmation: str):
    if new != confirmation:
        raise HTTPException(400, 'passwordMismatch')
    if len(new) < 12 or len(new) > 128 or new.isspace():
        raise HTTPException(400, 'passwordLength')
    if new.casefold() == username.casefold() or hmac.compare_digest(old.encode(), new.encode()):
        raise HTTPException(400, 'passwordDifferent')


def replace_password(database, username: str, password: str, *, expected_version: int,
                     must_change: bool, actor: str):
    with transaction(database) as connection:
        result = connection.execute(USERS.update().where(
            USERS.c.username == username, USERS.c.recordDelete_timeMillis.is_(None),
            USERS.c.passwordVersion == expected_version,
        ).values(passwordHash=hash_password(password), passwordMustChange=must_change,
                 passwordVersion=USERS.c.passwordVersion + 1,
                 recordUpdate_username=actor, recordUpdate_timeMillis=now_millis()))
        if result.rowcount != 1:
            raise HTTPException(409, 'passwordChangedConcurrently')

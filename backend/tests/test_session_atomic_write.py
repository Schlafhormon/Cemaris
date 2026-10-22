"""Regression for an actual Windows sharing error during the step-10 browser."""
import json

import pytest

import cemaris.auth as auth


@pytest.mark.parametrize("persistent", [False, True])
def test_session_atomic_write_retries_transient_access_error_preserves_old_on_failure(tmp_path, monkeypatch, persistent):
    store = auth.FileSessionStore(tmp_path, 60_000, clock=lambda: 1000)
    sid, session = store.new()
    store.save(sid, session)
    original = (tmp_path / (sid + ".json")).read_bytes()
    replace = auth.os.replace
    calls, waits = [], []

    def locked_destination(source, destination):
        calls.append((source, destination))
        # The previous complete snapshot remains readable until replacement.
        assert destination.read_bytes() == original
        if persistent or len(calls) < 3:
            raise PermissionError(13, "Synthetic Windows sharing violation")
        replace(source, destination)

    monkeypatch.setattr(auth.os, "replace", locked_destination)
    monkeypatch.setattr(auth.time, "sleep", waits.append)
    session["user"] = {"username": "synthetic-writer"}
    if persistent:
        with pytest.raises(PermissionError):
            store.save(sid, session)
        assert len(calls) == 6 and sum(waits) == pytest.approx(0.3)
        assert (tmp_path / (sid + ".json")).read_bytes() == original
    else:
        store.save(sid, session)
        assert len(calls) == 3 and sum(waits) == pytest.approx(0.06)
        assert json.loads((tmp_path / (sid + ".json")).read_text(encoding="utf-8"))["user"] == session["user"]
    assert list(tmp_path.glob("*.tmp")) == []

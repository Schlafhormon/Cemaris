"""Actual keyed subscriptions, revocation and content on disposable SQL Server."""
from fastapi.testclient import TestClient
import pytest

from cemaris.preferences import update_user_setting
from cemaris.config import Settings
from cemaris.work_orders import get_work_order_milestones
from cemaris.work_order_calendar import build_calendar
from test_work_orders import login, work_order_app  # Reuse the six independent-role fixture.
from test_work_order_calendar import normalize


def test_keyed_calendar_without_session_revocation_and_login_configuration(work_order_app):
    app = work_order_app
    identifier = app.state.test_ids["order"]
    with TestClient(app) as writer, TestClient(app) as subscription:
        assert subscription.get("/api/work-orders/ical").status_code == 401
        assert subscription.get("/api/milestoneICS").status_code == 401
        headers = login(writer)
        key = writer.get("/api/session").json()["user"]["userSettings"]["apiKey"]
        path = f"/api/{key}/milestoneICS?workOrderId={identifier}"
        result = subscription.get(path)
        assert result.status_code == 200, result.text
        assert result.headers["content-type"] == "text/calendar; charset=utf-8"
        assert result.headers["content-disposition"] == "inline; filename=calendar.ics"
        assert "PRODID:-//cityssm.github.io//Cemaris//EN" in result.text
        with app.state.db_engine.connect() as connection:
            milestones = get_work_order_milestones(connection, {"workOrderId": identifier,
                "workOrderMilestoneDateFilter": "notBlank"}, include_work_orders=True)
        assert normalize(result.text) == normalize(build_calendar(milestones, "http://testserver",
            work_order_id=str(identifier), prints=app.state.work_order_options.work_order_calendar_prints))
        slash = subscription.get(f"/api/{key}/milestoneICS/?workOrderId={identifier}", follow_redirects=False)
        assert slash.status_code == 200 and "location" not in slash.headers
        for session_path in ("/api/milestoneICS/", "/api/work-orders/ical/"):
            assert writer.get(session_path, follow_redirects=False).status_code == 200
        assert writer.get("/api/invalid-key/milestoneICS").status_code == 401
        reset = writer.post("/api/user-settings/reset-api-key", json={}, headers=headers)
        assert reset.status_code == 200
        new_key = reset.json()["apiKey"]
        assert new_key != key
        assert writer.get("/api/work-orders/options").json()["options"]["apiKey"] == new_key
        assert subscription.get(path).status_code == 401
        assert subscription.get(f"/api/{new_key}/milestoneICS").status_code == 200
        # The source's API loader tests exact configured membership, then the
        # helper tests case-insensitive membership. It doesn't grant keys to
        # users merely because their browser session is still active.
        allowed = app.state.auth_settings.can_login
        app.state.auth_settings.can_login = ["WORK"]
        assert subscription.get(f"/api/{new_key}/milestoneICS").status_code == 401
        app.state.auth_settings.can_login = allowed
        assert subscription.get(f"/api/{new_key}/milestoneICS").status_code == 200


@pytest.mark.parametrize("name", ["reader", "contract", "cemetery", "admin"])
def test_calendar_reading_needs_no_work_order_update_role(work_order_app, name):
    with TestClient(work_order_app) as client:
        login(client, name)
        assert client.get("/api/work-orders/ical").status_code == 200
        assert client.get("/api/milestoneICS").status_code == 200
        key = client.get("/api/session").json()["user"]["userSettings"]["apiKey"]
        assert client.get(f"/api/{key}/milestoneICS").status_code == 200


def test_subscription_filters_and_invalid_values_have_controlled_results(work_order_app):
    app = work_order_app
    with TestClient(app) as client:
        login(client)
        assert "BEGIN:VEVENT" not in client.get("/api/work-orders/ical?workOrderTypeIds=999999").text
        assert "BEGIN:VEVENT" not in client.get("/api/work-orders/ical?workOrderMilestoneTypeIds=999999").text
        # Invalid CSV syntax is ignored like the original regex, without SQL
        # interpolation. Invalid integral identifiers produce structured 400s.
        assert "BEGIN:VEVENT" in client.get("/api/work-orders/ical?workOrderTypeIds=1;DROP").text
        assert client.get("/api/work-orders/ical?workOrderId=bad").status_code == 400
        assert "BEGIN:VEVENT" not in client.get("/api/work-orders/ical?workOrderId=999999").text
        with app.state.db_engine.begin() as connection:
            update_user_setting(connection, "work", "apiKey", "synthetic-empty-window")
        assert client.get("/api/synthetic-empty-window/milestoneICS").status_code == 200


def test_calendar_uses_configured_public_origin_for_proxy_and_prefix_links(work_order_app):
    app = work_order_app
    app.state.settings = Settings(_env_file=None, environment="test", app_url="https://cemaris.example.invalid/public/")
    identifier = app.state.test_ids["order"]
    with TestClient(app) as client:
        login(client)
        assert client.get("/api/work-orders/options").json()["options"]["appUrl"] == "https://cemaris.example.invalid/public"
        value = normalize(client.get(f"/api/work-orders/ical?workOrderId={identifier}").text)
        assert f"DESCRIPTION:https://cemaris.example.invalid/public/workOrders/{identifier}" in value
        assert f"https://cemaris.example.invalid/public/print/pdf/workOrder/?workOrderId={identifier}" in value
        assert "testserver" not in value


@pytest.mark.parametrize("value", ["relative/path", "ftp://cemaris.example.invalid", "https://user:secret@example.invalid", "https://example.invalid/?token=bad", "https://example.invalid/#fragment"])
def test_public_application_url_rejects_non_http_or_credential_urls(value):
    with pytest.raises(ValueError):
        Settings(_env_file=None, app_url=value)

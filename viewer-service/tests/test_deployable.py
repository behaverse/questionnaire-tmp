from datetime import datetime, timezone, timedelta
import pytest
from viewer_service.deployments import (
    check_deployable, DeploymentClosed, NotYetOpen, QuotaExhausted)

NOW = datetime(2026, 6, 11, 12, 0, 0, tzinfo=timezone.utc)


def _dep(**over):
    d = {"active_from": None, "active_until": None, "quota": None}
    d.update(over)
    return d


def test_open_deployment_passes():
    check_deployable(_dep(), NOW, session_count=0)  # no raise


def test_past_active_until_raises_closed():
    with pytest.raises(DeploymentClosed):
        check_deployable(_dep(active_until=NOW - timedelta(hours=1)), NOW, 0)


def test_before_active_from_raises_not_yet_open():
    with pytest.raises(NotYetOpen):
        check_deployable(_dep(active_from=NOW + timedelta(hours=1)), NOW, 0)


def test_quota_reached_raises():
    with pytest.raises(QuotaExhausted):
        check_deployable(_dep(quota={"max_sessions": 5}), NOW, session_count=5)


def test_quota_under_cap_passes():
    check_deployable(_dep(quota={"max_sessions": 5}), NOW, session_count=4)


def test_no_max_sessions_key_ignores_quota():
    check_deployable(_dep(quota={}), NOW, session_count=999)  # no raise

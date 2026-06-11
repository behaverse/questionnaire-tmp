from datetime import datetime


class DeploymentClosed(Exception):
    """now > active_until — new sessions refused (resume is still allowed, OD-14 sub-q5)."""


class NotYetOpen(Exception):
    """now < active_from — deployment not yet accepting sessions."""


class QuotaExhausted(Exception):
    """The per-deployment max_sessions cap has been reached."""


def check_deployable(deployment: dict, now: datetime, session_count: int) -> None:
    """Gate a NEW session mint against the deployment's active window + quota. Pure;
    the caller supplies `now` and the deployment's current session_count."""
    active_until = deployment.get("active_until")
    if active_until is not None and now > active_until:
        raise DeploymentClosed()
    active_from = deployment.get("active_from")
    if active_from is not None and now < active_from:
        raise NotYetOpen()
    quota = deployment.get("quota")
    if quota and quota.get("max_sessions") is not None and session_count >= quota["max_sessions"]:
        raise QuotaExhausted()

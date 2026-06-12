import uuid
from datetime import datetime, timezone

from .runtime import mint_runtime
from . import tokens
from . import deployments as deploy_svc
from .store import sessions as session_store
from .store import deployments as dep_store
from .store import viewers as viewer_store
from .store import themes as themes_store


def new_session(conn, deployment: dict, viewer: dict, viewer_id: str, viewer_version: str,
                requested_locale: str | None) -> dict:
    """Gate against the active window + quota, mint the runtime, allocate session + token."""
    session_count = session_store.count_for_deployment(conn, deployment["deployment_id"])
    deploy_svc.check_deployable(deployment, datetime.now(timezone.utc), session_count)
    runtime = mint_runtime(conn, deployment, viewer, requested_locale)
    locale = runtime["locale"]
    session_id = str(uuid.uuid4())
    token = tokens.mint_token()
    agent_id = "agent_" + uuid.uuid4().hex[:8]
    qst_id, _, qst_version = deployment["questionnaire_ref"].partition("@")
    ephemeral = (deployment.get("dimensions") or {}).get("persistence") == "ephemeral"
    session_store.insert_session(
        conn, ephemeral=ephemeral, session_id=session_id, session_index=1,
        deployment_id=deployment["deployment_id"], viewer_id=viewer_id,
        viewer_version=viewer_version, agent_id=agent_id, instrument_id=qst_id,
        instrument_version=qst_version, status="in_progress", token_hash=tokens.hash_token(token),
        initial_locale=locale, last_active_locale=locale)
    conn.commit()
    theme = themes_store.get_theme(conn, deployment["theme_id"]) if deployment.get("theme_id") else None
    return {"session_id": session_id, "session_token": token, "runtime": runtime, "theme": theme,
            "agent_id": agent_id, "session_index": 1, "ephemeral": ephemeral}


def session_runtime(conn, session: dict) -> dict:
    """Re-mint (cache hit) the runtime for a session in its last_active_locale."""
    deployment = dep_store.get_deployment(conn, session["deployment_id"])
    viewer = viewer_store.get_viewer(conn, session["viewer_id"], session["viewer_version"])
    return mint_runtime(conn, deployment, viewer, session["last_active_locale"])


class LocaleNotAvailable(Exception):
    pass


def switch_locale(conn, session: dict, locale: str) -> dict:
    """Update last_active_locale and re-mint the runtime in the new locale."""
    deployment = dep_store.get_deployment(conn, session["deployment_id"])
    if locale not in deployment["available_locales"]:
        raise LocaleNotAvailable(locale)
    session_store.set_locale(conn, session["session_id"], locale)
    conn.commit()
    viewer = viewer_store.get_viewer(conn, session["viewer_id"], session["viewer_version"])
    return mint_runtime(conn, deployment, viewer, locale)

import uuid

from .runtime import mint_runtime
from . import tokens
from .store import sessions as session_store
from .store import deployments as dep_store
from .store import viewers as viewer_store


def new_session(conn, deployment: dict, viewer: dict, viewer_id: str, viewer_version: str,
                requested_locale: str | None) -> dict:
    """Mint the runtime (VS-A), allocate a session + opaque token, persist the session."""
    runtime = mint_runtime(conn, deployment, viewer, requested_locale)
    locale = runtime["locale"]
    session_id = str(uuid.uuid4())
    token = tokens.mint_token()
    agent_id = "agent_" + uuid.uuid4().hex[:8]
    qst_id, _, qst_version = deployment["questionnaire_ref"].partition("@")
    session_store.insert_session(
        conn, session_id=session_id, session_index=1, deployment_id=deployment["deployment_id"],
        viewer_id=viewer_id, viewer_version=viewer_version, agent_id=agent_id,
        instrument_id=qst_id, instrument_version=qst_version, status="in_progress",
        token_hash=tokens.hash_token(token), initial_locale=locale, last_active_locale=locale)
    conn.commit()
    return {"session_id": session_id, "session_token": token, "runtime": runtime}


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

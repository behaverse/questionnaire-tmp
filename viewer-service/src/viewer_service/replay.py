from . import sessions as sessions_svc
from .store import export as export_store


def build_replay_bundle(conn, session: dict) -> dict:
    """Assemble the RP1 replay bundle for a session: the re-minted runtime + its flattened event
    statements + its flattened mouse samples."""
    runtime = sessions_svc.session_runtime(conn, session)
    statements: list = []
    for payload in export_store.iter_event_rows_for_session(conn, session["session_id"]):
        evs = payload.get("events") if isinstance(payload, dict) else None
        if isinstance(evs, list):
            statements.extend(evs)
    mouse: list = []
    for payload in export_store.iter_recording_rows_for_session(conn, session["session_id"]):
        samples = payload.get("samples") if isinstance(payload, dict) else None
        if isinstance(samples, list):
            mouse.extend(samples)
    return {"runtime": runtime, "statements": statements, "mouse": mouse}

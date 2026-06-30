from denormaliser import canonical_hash

from .config import get_settings
from .validation import validate_response, validate_events
from .store import outbox as outbox_store


class OutboxFull(Exception):
    pass


def _depth(conn) -> int:
    return outbox_store.depth(conn)


def submit_recording(conn, session_id: str, payload: dict, ephemeral: bool = False) -> int | None:
    """Enqueue a behavioural-channel recording (kind='recording'). NO Schema 4a/5 validation —
    the payload is a {channel, samples} envelope shape-checked by the caller. Ephemeral (demo)
    session -> None (no data leaves VS). Raises OutboxFull on the hard cap."""
    if ephemeral:
        return None
    if _depth(conn) >= get_settings().outbox_hard_threshold:
        raise OutboxFull()
    oid = outbox_store.enqueue(conn, session_id, "recording", payload, canonical_hash(payload))
    conn.commit()
    return oid


def submit(conn, session_id: str, kind: str, payload: dict, schemas_dir, ephemeral: bool = False) -> int | None:
    """Validate the payload (Schema 5 / 4a). For an ephemeral (demo) session, return None
    WITHOUT enqueuing ('no data leaves VS'). Otherwise bounds-check + enqueue + return the
    outbox id. Raises jsonschema.ValidationError (bad body) or OutboxFull (hard cap)."""
    if kind == "responses":
        validate_response(payload, schemas_dir)
    else:
        validate_events(payload, schemas_dir)
    if ephemeral:
        return None
    if _depth(conn) >= get_settings().outbox_hard_threshold:
        raise OutboxFull()
    oid = outbox_store.enqueue(conn, session_id, kind, payload, canonical_hash(payload))
    conn.commit()
    return oid

from denormaliser import canonical_hash

from .config import get_settings
from .validation import validate_response, validate_events
from .store import outbox as outbox_store


class OutboxFull(Exception):
    pass


def _depth(conn) -> int:
    return outbox_store.depth(conn)


def submit(conn, session_id: str, kind: str, payload: dict, schemas_dir) -> int:
    """Validate the payload (Schema 5 / 4a), bounds-check the outbox, enqueue. Returns the
    outbox id. Raises jsonschema.ValidationError (bad body) or OutboxFull (hard cap)."""
    if _depth(conn) >= get_settings().outbox_hard_threshold:
        raise OutboxFull()
    if kind == "responses":
        validate_response(payload, schemas_dir)
    else:
        validate_events(payload, schemas_dir)
    oid = outbox_store.enqueue(conn, session_id, kind, payload, canonical_hash(payload))
    conn.commit()
    return oid

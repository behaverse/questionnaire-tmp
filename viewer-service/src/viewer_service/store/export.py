import psycopg
from collections.abc import Iterator


def iter_response_rows(conn: psycopg.Connection, deployment_id: str) -> Iterator[dict]:
    """Yield every Schema 5 Response collected for a deployment, flattened from the outbox.
    Reads only kind='responses' rows for the deployment's sessions, in insertion order. A
    ResponseSet payload ({session_id, responses[]}) yields each of its responses; a bare
    Response payload yields itself. Demo/ephemeral sessions have no outbox rows -> excluded."""
    cur = conn.execute(
        "SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id "
        "WHERE s.deployment_id = %s AND o.kind = 'responses' ORDER BY o.id", (deployment_id,))
    for (payload,) in cur:
        if isinstance(payload, dict) and "responses" in payload:
            yield from payload["responses"]
        else:
            yield payload

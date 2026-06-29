import psycopg
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from .deps import get_conn
from .identity import require_participant
from ..config import get_settings
from .. import export_csv
from ..store import sessions as session_store
from ..store import export as export_store

router = APIRouter()


@router.get("/me/sessions")
def my_sessions(conn=Depends(get_conn), claims=Depends(require_participant)):
    rows = session_store.list_sessions_for_participant(conn, claims["sub"])
    return {"sessions": [{
        "session_id": r["session_id"], "instrument_id": r["instrument_id"],
        "instrument_version": r["instrument_version"], "deployment_id": r["deployment_id"],
        "status": r["status"], "session_index": r["session_index"],
        "started_at": r["started_at"].isoformat() if r["started_at"] else None,
        "completed_at": r["completed_at"].isoformat() if r["completed_at"] else None,
        "submitted_at": r["submitted_at"].isoformat() if r["submitted_at"] else None,
        "score_display": r["score_display"],
    } for r in rows]}


@router.get("/me/responses.csv")
def my_responses(claims=Depends(require_participant)):
    sub = claims["sub"]
    columns = export_csv.response_columns(str(get_settings().schemas_dir))

    def stream():
        with psycopg.connect(get_settings().database_url) as c:
            yield from export_csv.to_csv(export_store.iter_response_rows_for_participant(c, sub), columns)

    return StreamingResponse(stream(), media_type="text/csv", headers={
        "Content-Disposition": 'attachment; filename="my_responses.csv"'})

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from jsonschema.exceptions import ValidationError
from .deps import get_conn, require_session
from ..config import get_settings
from ..store import sessions as session_store
from .. import submission as submission_svc

router = APIRouter()


def _enqueue(session_id: str, kind: str, payload: dict, conn):
    try:
        oid = submission_svc.submit(conn, session_id, kind, payload, get_settings().schemas_dir)
    except submission_svc.OutboxFull:
        return JSONResponse(status_code=503, content={"error": {
            "code": "service_unavailable", "message": "submission queue is full; try again later"}})
    except ValidationError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "invalid_submission", "message": e.message}})
    return JSONResponse(status_code=202, content={"enqueued": oid})


@router.post("/sessions/{session_id}/responses")
def responses(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    return _enqueue(session_id, "responses", payload, conn)


@router.post("/sessions/{session_id}/events")
def events(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    return _enqueue(session_id, "events", payload, conn)


@router.post("/sessions/{session_id}/complete")
def complete(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    session_store.set_submitted(conn, session_id)
    conn.commit()
    return {"status": "submitted"}

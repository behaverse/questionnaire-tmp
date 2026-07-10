from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from .deps import get_conn, require_session
from .identity import require_participant, require_researcher
from .authz import require_owned_deployment
from .. import submission as submission_svc
from ..store import export as export_store

router = APIRouter()

_CHANNELS = {"mouse", "keyboard"}


@router.post("/sessions/{session_id}/recordings")
def post_recording(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    channel = payload.get("channel")
    samples = payload.get("samples")
    if channel not in _CHANNELS or not isinstance(samples, list):
        return JSONResponse(status_code=400, content={"error": {
            "code": "bad_recording",
            "message": "channel must be one of mouse|keyboard and samples must be a list"}})
    try:
        oid = submission_svc.submit_recording(conn, session_id, {"channel": channel, "samples": samples},
                                              session["ephemeral"])
    except submission_svc.OutboxFull:
        return JSONResponse(status_code=503, content={"error": {
            "code": "service_unavailable", "message": "submission queue is full; try again later"}})
    if oid is None:
        return JSONResponse(status_code=202, content={"ephemeral": True})
    return JSONResponse(status_code=202, content={"enqueued": oid})


@router.get("/me/recordings")
def my_recordings(conn=Depends(get_conn), claims=Depends(require_participant)):
    """Download the caller's behavioural-channel recordings (mouse/keyboard sample sets)."""
    recs = list(export_store.iter_recording_rows_for_participant(conn, claims["sub"]))
    return JSONResponse(content={"recordings": recs},
                        headers={"Content-Disposition": 'attachment; filename="my_recordings.json"'})


@router.get("/deployments/{deployment_id}/recordings")
def list_recordings(deployment_id: str, conn=Depends(get_conn), claims=Depends(require_researcher)):
    require_owned_deployment(conn, deployment_id, claims)
    return {"recordings": list(export_store.iter_recording_rows(conn, deployment_id))}

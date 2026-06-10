from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import PreflightError
from .deps import get_conn, require_session
from ..models import SessionNew, LocaleSwitch
from ..library_client import LibraryError
from ..store import deployments as dep_store
from ..store import viewers as viewer_store
from ..store import outbox as outbox_store
from .. import sessions as sessions_svc

router = APIRouter()


@router.post("/sessions/new", status_code=201)
def new(body: SessionNew, conn=Depends(get_conn)):
    dep = dep_store.get_deployment(conn, body.deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    viewer = viewer_store.get_viewer(conn, body.viewer_id, body.viewer_version)
    if viewer is None:
        raise HTTPException(status_code=404, detail="viewer not registered")
    try:
        return sessions_svc.new_session(conn, dep, viewer, body.viewer_id, body.viewer_version, body.locale)
    except PreflightError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "preflight_failed", "message": "runtime pre-flight failed",
            "detail": [{"kind": p.kind, "where": p.where, "detail": p.detail} for p in e.problems]}})
    except LibraryError as e:
        raise HTTPException(status_code=e.status, detail=e.message)


@router.get("/sessions/{session_id}")
def get(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    return {"status": session["status"], "last_active_locale": session["last_active_locale"],
            "outbox": outbox_store.counts_for_session(conn, session_id)}


@router.get("/sessions/{session_id}/runtime")
def runtime(session_id: str, session=Depends(require_session), conn=Depends(get_conn)):
    return sessions_svc.session_runtime(conn, session)


@router.post("/sessions/{session_id}/locale")
def locale(session_id: str, body: LocaleSwitch, session=Depends(require_session), conn=Depends(get_conn)):
    try:
        return {"runtime": sessions_svc.switch_locale(conn, session, body.locale)}
    except sessions_svc.LocaleNotAvailable:
        return JSONResponse(status_code=422, content={"error": {
            "code": "invalid", "message": f"locale '{body.locale}' not in deployment.available_locales"}})

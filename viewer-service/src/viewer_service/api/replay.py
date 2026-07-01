from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from denormaliser import PreflightError
from .deps import get_conn
from .identity import require_researcher
from .sessions import _preflight_422
from ..config import get_settings
from ..library_client import LibraryError
from ..replay_links import mint_replay, verify_replay
from ..replay import build_replay_bundle
from ..store import sessions as session_store
from ..store import deployments as dep_store

router = APIRouter()


@router.post("/deployments/{deployment_id}/sessions/{session_id}/replay-link")
def mint_link(deployment_id: str, session_id: str, request: Request, conn=Depends(get_conn),
              claims=Depends(require_researcher)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    session = session_store.get_session(conn, session_id)
    if session is None or session["deployment_id"] != deployment_id:
        raise HTTPException(status_code=404, detail="session not found in this deployment")
    s = get_settings()
    token = mint_replay(s.invite_signing_secret, deployment_id=deployment_id, session_id=session_id,
                        ttl=s.replay_link_ttl_seconds)
    base = (s.public_base_url or str(request.base_url)).rstrip("/")
    bundle_url = f"{base}/v1/replay?token={token}"
    replay_url = f"{s.web_viewer_base_url.rstrip('/')}/?replay={quote(bundle_url, safe='')}" if s.web_viewer_base_url else None
    return {"token": token, "bundle_url": bundle_url, "replay_url": replay_url}


@router.get("/replay")
def bundle(token: str, conn=Depends(get_conn)):
    s = get_settings()
    payload = verify_replay(s.invite_signing_secret, token)
    if payload is None:
        return JSONResponse(status_code=401, content={"error": {"code": "invalid_replay_token",
            "message": "the replay token is missing, invalid, or expired"}})
    session = session_store.get_session(conn, payload["session_id"])
    if session is None or session["deployment_id"] != payload["deployment_id"]:
        raise HTTPException(status_code=404, detail="session not found")
    try:
        return build_replay_bundle(conn, session)
    except PreflightError as e:            # a session whose runtime no longer preflights → 422, not 500
        return _preflight_422(e)
    except LibraryError as e:              # Library unreachable on a cache miss → surface upstream status
        raise HTTPException(status_code=e.status, detail=e.message)

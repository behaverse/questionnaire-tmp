from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .deps import get_conn
from .identity import require_researcher
from ..config import get_settings
from ..models import InviteCreate
from .. import invites as invites_svc
from ..store import deployments as dep_store

router = APIRouter()


@router.post("/deployments/{deployment_id}/invites", status_code=201)
def create_invite(deployment_id: str, body: InviteCreate, conn=Depends(get_conn),
                  claims=Depends(require_researcher)):
    s = get_settings()
    if not s.invite_signing_secret:
        return JSONResponse(status_code=503, content={"error": {
            "code": "invites_unavailable", "message": "INVITE_SIGNING_SECRET is not configured"}})
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    pid = (body.participant_id or "").strip()
    if not pid:
        raise HTTPException(status_code=422, detail="participant_id must not be empty")
    ttl = body.ttl_seconds or s.invite_default_ttl_seconds
    token = invites_svc.mint_invite(s.invite_signing_secret, participant_id=pid,
                                    deployment_id=deployment_id, ttl=ttl)
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=ttl)).isoformat()
    base = s.public_base_url
    url = (f"{base}/?deployment={deployment_id}&invite={token}" if base
           else f"?deployment={deployment_id}&invite={token}")
    return {"invite_token": token, "participant_id": pid, "deployment_id": deployment_id,
            "expires_at": expires_at, "url": url}

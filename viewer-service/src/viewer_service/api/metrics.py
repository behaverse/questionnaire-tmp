from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from .deps import get_conn
from .identity import require_researcher
from ..config import get_settings
from ..metrics import deployment_metrics
from ..store import deployments as dep_store

router = APIRouter()


@router.get("/deployments/{deployment_id}/metrics")
def metrics(deployment_id: str, conn=Depends(get_conn),
            claims=Depends(require_researcher)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return deployment_metrics(conn, deployment_id,
                              soft_threshold=get_settings().outbox_soft_threshold,
                              now=datetime.now(timezone.utc))

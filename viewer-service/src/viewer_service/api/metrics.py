from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from .deps import get_conn
from .identity import require_researcher
from .authz import require_owned_deployment
from ..config import get_settings
from ..metrics import deployment_metrics

router = APIRouter()


@router.get("/deployments/{deployment_id}/metrics")
def metrics(deployment_id: str, conn=Depends(get_conn),
            claims=Depends(require_researcher)):
    require_owned_deployment(conn, deployment_id, claims)
    return deployment_metrics(conn, deployment_id,
                              soft_threshold=get_settings().outbox_soft_threshold,
                              now=datetime.now(timezone.utc))

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from .deps import get_conn
from ..store import deployments as dep_store
from ..store import sessions as session_store
from .. import deployments as deploy_svc

router = APIRouter()


@router.get("/catalogue")
def catalogue(conn=Depends(get_conn)):
    now = datetime.now(timezone.utc)
    items = []
    for dep in dep_store.list_catalogue_candidates(conn):
        count = session_store.count_for_deployment(conn, dep["deployment_id"])
        try:
            deploy_svc.check_deployable(dep, now, count)
        except (deploy_svc.DeploymentClosed, deploy_svc.NotYetOpen, deploy_svc.QuotaExhausted):
            continue
        items.append({
            "deployment_id": dep["deployment_id"],
            "title": dep["title"] or dep["questionnaire_ref"],
            "description": dep["description"],
            "questionnaire_ref": dep["questionnaire_ref"],
            "auth": (dep["dimensions"] or {}).get("auth"),
        })
    return {"items": items}

import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import RuntimePolicy
from .deps import get_conn
from ..models import DeploymentCreate
from ..store import deployments as store

router = APIRouter()


@router.post("/deployments", status_code=201)
def create(body: DeploymentCreate, conn=Depends(get_conn)):
    try:
        policy = RuntimePolicy(**body.runtime_policy).to_canonical_dict()
    except TypeError as e:
        return JSONResponse(status_code=422, content={
            "error": {"code": "invalid", "message": f"invalid runtime_policy: {e}"}})
    deployment_id = "dep_" + uuid.uuid4().hex[:8]
    store.insert_deployment(conn, deployment_id, body.questionnaire_ref, policy,
                            body.default_locale, body.available_locales, body.theme_id)
    return {"deployment_id": deployment_id}


@router.get("/deployments/{deployment_id}")
def get(deployment_id: str, conn=Depends(get_conn)):
    dep = store.get_deployment(conn, deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return dep

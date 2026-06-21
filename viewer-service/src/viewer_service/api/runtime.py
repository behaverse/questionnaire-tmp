from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import PreflightError
from .deps import get_conn
from .identity import require_researcher
from ..models import RuntimeRequest
from ..library_client import LibraryError
from ..store import deployments as dep_store
from ..store import viewers as viewer_store
from ..runtime import mint_runtime

router = APIRouter()


@router.post("/deployments/{deployment_id}/runtime")
def mint(deployment_id: str, body: RuntimeRequest, conn=Depends(get_conn), claims=Depends(require_researcher)):
    dep = dep_store.get_deployment(conn, deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    viewer = viewer_store.get_viewer(conn, body.viewer_id, body.viewer_version)
    if viewer is None:
        raise HTTPException(status_code=404, detail="viewer not registered")
    try:
        return mint_runtime(conn, dep, viewer, body.locale)
    except PreflightError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "preflight_failed", "message": "runtime pre-flight failed",
            "detail": [{"kind": p.kind, "where": p.where, "detail": p.detail} for p in e.problems]}})
    except LibraryError as e:
        raise HTTPException(status_code=e.status, detail=e.message)

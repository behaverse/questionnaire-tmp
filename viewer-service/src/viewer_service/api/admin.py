from fastapi import APIRouter, Depends
from .deps import get_conn
from .identity import require_admin
from ..store import runtime_cache as cache

router = APIRouter()


@router.delete("/runtime_cache")
def purge(deployment_id: str | None = None, conn=Depends(get_conn),
          claims=Depends(require_admin)):
    n = cache.purge(conn, deployment_id=deployment_id)
    return {"purged": n}

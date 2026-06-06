from fastapi import APIRouter, Depends, HTTPException, Query
from .deps import get_conn
from .. import query
from ..models import Paginated, EntitySummary
from ..entity_types import ENTITY_TYPES

router = APIRouter()

@router.get("/entities/{etype}", response_model=Paginated)
def list_entities(etype: str, q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    if etype not in ENTITY_TYPES:
        raise HTTPException(status_code=404, detail="unknown entity type")
    rows, total = query.list_entries(conn, etype, q=q, limit=limit, offset=offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/entities/{etype}/{eid}/versions/{version}/dependents", response_model=Paginated)
def dependents(etype: str, eid: str, version: str, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    rows, total = query.dependents_of(conn, eid, version, limit, offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

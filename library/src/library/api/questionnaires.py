from fastapi import APIRouter, Depends, HTTPException, Query
from .deps import get_conn
from .. import query
from ..models import Paginated, EntitySummary

router = APIRouter()

@router.get("/questionnaires", response_model=Paginated)
def list_questionnaires(q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    rows, total = query.list_entries(conn, "questionnaire", q=q, limit=limit, offset=offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/questionnaires/{qid}", response_model=EntitySummary)
def detail(qid: str, conn=Depends(get_conn)):
    published = [v for v in query.get_versions(conn, qid) if v["status"] == "published"]
    if not published:
        raise HTTPException(status_code=404, detail="questionnaire not found")
    return EntitySummary(**max(published, key=lambda v: v["version"]))

@router.get("/questionnaires/{qid}/versions", response_model=list[EntitySummary])
def versions(qid: str, conn=Depends(get_conn)):
    vs = query.get_versions(conn, qid)
    if not vs:
        raise HTTPException(status_code=404, detail="questionnaire not found")
    return [EntitySummary(**v) for v in vs]

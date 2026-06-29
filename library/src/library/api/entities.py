from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from .deps import get_conn
from .. import query
from ..models import Paginated, EntitySummary, PaginatedQuestions, QuestionHit
from ..entity_types import ENTITY_TYPES

router = APIRouter()

@router.get("/questions/search", response_model=PaginatedQuestions)
def search_questions(q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    """Search individual question-text entities (prompts) by content/id, returning each hit with
    its prompt text — the 'search for questions' feature (vs. whole-questionnaire search)."""
    rows, total = query.search_questions(conn, q=q, limit=limit, offset=offset)
    return PaginatedQuestions(items=[QuestionHit(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/questions", response_model=Paginated)
def list_questions(q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    rows, total = query.list_entries(conn, "question", q=q, limit=limit, offset=offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/options", response_model=Paginated)
def list_options(q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    rows, total = query.list_entries(conn, "option", q=q, limit=limit, offset=offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/entities/{etype}", response_model=Paginated)
def list_entities(etype: str, q: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    if etype not in ENTITY_TYPES:
        raise HTTPException(status_code=404, detail="unknown entity type")
    rows, total = query.list_entries(conn, etype, q=q, limit=limit, offset=offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

@router.get("/entities/{etype}/{eid}", response_model=EntitySummary)
def get_entity(etype: str, eid: str, conn=Depends(get_conn)):
    if etype not in ENTITY_TYPES:
        raise HTTPException(status_code=404, detail="unknown entity type")
    versions = query.get_versions(conn, eid)
    published = [v for v in versions if v["status"] == "published"]
    if not published:
        raise HTTPException(status_code=404, detail="entity not found")
    return EntitySummary(**max(published, key=lambda v: v["version"]))

@router.get("/entities/{etype}/{eid}/versions/{version}", response_model=EntitySummary)
def get_entity_version(etype: str, eid: str, version: str, conn=Depends(get_conn)):
    if etype not in ENTITY_TYPES:
        raise HTTPException(status_code=404, detail="unknown entity type")
    row = query.get_version(conn, eid, version)
    if row is None:
        raise HTTPException(status_code=404, detail="entity version not found")
    return EntitySummary(**row)

@router.get("/entities/{etype}/{eid}/versions/{version}/definition")
def entity_definition(etype: str, eid: str, version: str, conn=Depends(get_conn)):
    if etype not in ENTITY_TYPES:
        raise HTTPException(status_code=404, detail="unknown entity type")
    row = conn.execute(
        "SELECT status, content_json, withdrawn_at FROM entity WHERE id=%s AND version=%s",
        (eid, version)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="not found")
    status, content_json, withdrawn_at = row
    if status == "withdrawn" or content_json is None:
        return JSONResponse(status_code=410, content={
            "error": {"code": "gone", "message": "withdrawn",
                      "withdrawn_at": withdrawn_at.isoformat() if withdrawn_at else None}})
    return content_json

@router.get("/entities/{etype}/{eid}/versions/{version}/dependents", response_model=Paginated)
def dependents(etype: str, eid: str, version: str, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    rows, total = query.dependents_of(conn, eid, version, limit, offset)
    return Paginated(items=[EntitySummary(**r) for r in rows], total=total, limit=limit, offset=offset)

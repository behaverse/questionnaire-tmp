from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from .deps import get_conn
from .resolve import resolve_definition, build_resolution_bundle
from .. import query
from ..models import EntitySummary, CatalogueCard, VersionInfo, InstrumentGroup, PaginatedGroups

router = APIRouter()

@router.get("/questionnaires", response_model=PaginatedGroups)
def list_questionnaires(
    q: str | None = None, domain: str | None = None, population: str | None = None,
    language: str | None = None, license: str | None = None, instrument: str | None = None,
    min_items: int | None = None, max_items: int | None = None, sort: str | None = None,
    limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn),
):
    groups, total = query.list_instrument_groups(
        conn, q=q, domain=domain, population=population, language=language, license=license,
        instrument=instrument, min_items=min_items, max_items=max_items, sort=sort,
        limit=limit, offset=offset,
    )
    return PaginatedGroups(
        items=[InstrumentGroup(**{**g, "forms": [CatalogueCard(**f) for f in g["forms"]]}) for g in groups],
        total=total, limit=limit, offset=offset,
    )

@router.get("/questionnaires/{qid}", response_model=EntitySummary)
def detail(qid: str, conn=Depends(get_conn)):
    published = [v for v in query.get_versions(conn, qid) if v["status"] == "published"]
    if not published:
        raise HTTPException(status_code=404, detail="questionnaire not found")
    return EntitySummary(**max(published, key=lambda v: v["version"]))

@router.get("/questionnaires/{qid}/versions", response_model=list[VersionInfo])
def versions(qid: str, conn=Depends(get_conn)):
    vs = query.get_version_history(conn, qid)
    if not vs:
        raise HTTPException(status_code=404, detail="questionnaire not found")
    return [VersionInfo(**v) for v in vs]

@router.get("/questionnaires/{qid}/versions/{version}", response_model=EntitySummary)
def get_version(qid: str, version: str, conn=Depends(get_conn)):
    row = query.get_version(conn, qid, version)
    if row is None:
        raise HTTPException(status_code=404, detail="questionnaire version not found")
    return EntitySummary(**row)

@router.get("/questionnaires/{qid}/versions/{version}/definition")
def definition(qid: str, version: str, resolved: bool = False, conn=Depends(get_conn)):
    row = conn.execute(
        "SELECT status, content_json, withdrawn_at FROM entity WHERE id=%s AND version=%s",
        (qid, version)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="not found")
    status, content_json, withdrawn_at = row
    if status == "withdrawn" or content_json is None:
        return JSONResponse(status_code=410, content={
            "error": {"code": "gone", "message": "withdrawn",
                      "withdrawn_at": withdrawn_at.isoformat() if withdrawn_at else None}})
    if resolved:
        return resolve_definition(conn, content_json)
    return content_json


@router.get("/questionnaires/{qid}/versions/{version}/resolution-bundle")
def resolution_bundle(qid: str, version: str, conn=Depends(get_conn)):
    row = conn.execute(
        "SELECT status, content_json, withdrawn_at FROM entity WHERE id=%s AND version=%s",
        (qid, version)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="not found")
    status, content_json, withdrawn_at = row
    if status == "withdrawn" or content_json is None:
        return JSONResponse(status_code=410, content={
            "error": {"code": "gone", "message": "withdrawn",
                      "withdrawn_at": withdrawn_at.isoformat() if withdrawn_at else None}})
    return build_resolution_bundle(conn, content_json)

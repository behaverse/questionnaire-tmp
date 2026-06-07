from fastapi import APIRouter, Depends, HTTPException, Query
from .deps import get_conn
from ..models import PaginatedCards, CatalogueCard
from ..entity_types import ENTITY_TYPES
from ..query import _CARD_COLS

_VALID_FACET_TYPES = {"domain", "population", "administration_mode", "tag"}

router = APIRouter()

@router.get("/search", response_model=PaginatedCards)
def search(q: str, type: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    if type is not None and type not in ENTITY_TYPES:
        raise HTTPException(status_code=422, detail=f"unknown type: {type!r}; must be one of {ENTITY_TYPES}")
    where = ["c.status='published'", "c.search_tsv @@ websearch_to_tsquery('english', %s)"]
    params: list = [q]
    if type:
        where.append("c.entity_type=%s"); params.append(type)
    w = " AND ".join(where)
    total = conn.execute(f"SELECT count(*) FROM catalogue_entry c WHERE {w}", params).fetchone()[0]
    rows = conn.execute(
        "SELECT c.id, c.version, c.entity_type, c.title, c.short_title, c.description, "
        "c.status, c.effective_license, c.language, c.available_languages, "
        "c.item_count, c.estimated_minutes, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='domain'), '{}') AS domain, "
        "COALESCE((SELECT array_agg(value ORDER BY value) FROM facet f "
        " WHERE f.id=c.id AND f.version=c.version AND f.facet_type='population'), '{}') AS population "
        f"FROM catalogue_entry c WHERE {w} "
        "ORDER BY ts_rank(c.search_tsv, websearch_to_tsquery('english', %s)) DESC LIMIT %s OFFSET %s",
        params + [q, limit, offset]).fetchall()
    items = [CatalogueCard(**dict(zip(_CARD_COLS, r))) for r in rows]
    return PaginatedCards(items=items, total=total, limit=limit, offset=offset)

@router.get("/facets")
def facets(facet_type: str, conn=Depends(get_conn)):
    if facet_type not in _VALID_FACET_TYPES:
        raise HTTPException(status_code=422, detail=f"unknown facet_type: {facet_type!r}; must be one of {sorted(_VALID_FACET_TYPES)}")
    rows = conn.execute(
        "SELECT value, count(*) FROM facet WHERE facet_type=%s GROUP BY value ORDER BY count(*) DESC",
        (facet_type,)).fetchall()
    return {"facet_type": facet_type, "values": [{"value": v, "count": c} for v, c in rows]}

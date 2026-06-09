from fastapi import APIRouter, Depends, HTTPException, Query
from .deps import get_conn
from ..models import PaginatedCards, CatalogueCard
from ..entity_types import ENTITY_TYPES
from ..query import _CARD_COLS

_TABLE_FACETS = {"domain", "population", "administration_mode", "tag"}
_COLUMN_FACETS = {"license": "effective_license"}  # language handled separately (array column)

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
        "c.item_count, c.estimated_minutes, c.instrument_id, c.variant, "
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
    if facet_type in _TABLE_FACETS:
        rows = conn.execute(
            "SELECT value, count(*) FROM facet WHERE facet_type=%s GROUP BY value ORDER BY count(*) DESC",
            (facet_type,)).fetchall()
    elif facet_type == "language":
        # count by the languages a questionnaire is AVAILABLE in (unnest available_languages),
        # falling back to the primary language when available_languages is unset.
        rows = conn.execute(
            "SELECT lang, count(*) FROM catalogue_entry c, "
            "unnest(coalesce(c.available_languages, ARRAY[c.language])) AS lang "
            "WHERE c.status='published' AND c.entity_type='questionnaire' AND lang IS NOT NULL "
            "GROUP BY lang ORDER BY count(*) DESC"
        ).fetchall()
    elif facet_type in _COLUMN_FACETS:
        col = _COLUMN_FACETS[facet_type]   # fixed allow-list value, not user input -> safe to interpolate
        rows = conn.execute(
            f"SELECT {col}, count(*) FROM catalogue_entry "
            f"WHERE status='published' AND {col} IS NOT NULL GROUP BY {col} ORDER BY count(*) DESC"
        ).fetchall()
    else:
        allowed = sorted(_TABLE_FACETS | set(_COLUMN_FACETS) | {"language"})
        raise HTTPException(status_code=422, detail=f"unknown facet_type: {facet_type!r}; must be one of {allowed}")
    return {"facet_type": facet_type, "values": [{"value": v, "count": c} for v, c in rows]}

from fastapi import APIRouter, Depends, Query
from .deps import get_conn
from ..models import Paginated, EntitySummary

router = APIRouter()

@router.get("/search", response_model=Paginated)
def search(q: str, type: str | None = None, limit: int = Query(20, le=100), offset: int = 0, conn=Depends(get_conn)):
    where = ["status='published'", "search_tsv @@ websearch_to_tsquery('english', %s)"]
    params: list = [q]
    if type:
        where.append("entity_type=%s"); params.append(type)
    w = " AND ".join(where)
    total = conn.execute(f"SELECT count(*) FROM catalogue_entry WHERE {w}", params).fetchone()[0]
    rows = conn.execute(
        f"SELECT id, version, entity_type, title, status, effective_license FROM catalogue_entry "
        f"WHERE {w} ORDER BY ts_rank(search_tsv, websearch_to_tsquery('english', %s)) DESC LIMIT %s OFFSET %s",
        params + [q, limit, offset]).fetchall()
    cols = ["id", "version", "entity_type", "title", "status", "effective_license"]
    items = [EntitySummary(**dict(zip(cols, r))) for r in rows]
    return Paginated(items=items, total=total, limit=limit, offset=offset)

@router.get("/facets")
def facets(facet_type: str, conn=Depends(get_conn)):
    rows = conn.execute(
        "SELECT value, count(*) FROM facet WHERE facet_type=%s GROUP BY value ORDER BY count(*) DESC",
        (facet_type,)).fetchall()
    return {"facet_type": facet_type, "values": [{"value": v, "count": c} for v, c in rows]}

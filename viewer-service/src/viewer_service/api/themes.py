import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .deps import get_conn
from ..models import ThemeCreate
from ..themes import check_accessibility, ThemeAccessibilityError
from ..store import themes as store

router = APIRouter()


@router.post("/themes", status_code=201)
def create(body: ThemeCreate, conn=Depends(get_conn)):
    try:
        check_accessibility(body.palette, body.typography)
    except ThemeAccessibilityError as e:
        return JSONResponse(status_code=422, content={"error": {
            "code": "theme_inaccessible", "message": "theme failed the accessibility check",
            "detail": e.failures}})
    theme_id = "thm_" + uuid.uuid4().hex[:8]
    store.insert_theme(conn, theme_id=theme_id, name=body.name, palette=body.palette,
                       typography=body.typography, spacing=body.spacing,
                       logo_url=body.logo_url, custom_css=body.custom_css)
    return {"theme_id": theme_id}


@router.get("/themes")
def list_(conn=Depends(get_conn)):
    return {"items": store.list_themes(conn)}


@router.get("/themes/{theme_id}")
def get(theme_id: str, conn=Depends(get_conn)):
    t = store.get_theme(conn, theme_id)
    if t is None:
        raise HTTPException(status_code=404, detail="theme not found")
    return t

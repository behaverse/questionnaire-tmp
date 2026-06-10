from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from jsonschema.exceptions import ValidationError
from denormaliser import canonical_hash
from .deps import get_conn
from ..config import get_settings
from ..validation import validate_manifest
from ..store import viewers as store

router = APIRouter()


@router.post("/viewers", status_code=201)
def register(manifest: dict, conn=Depends(get_conn)):
    try:
        validate_manifest(manifest, get_settings().schemas_dir)
    except ValidationError as e:
        return JSONResponse(status_code=422, content={
            "error": {"code": "invalid_manifest", "message": e.message}})
    viewer_id = manifest["viewer_id"]
    viewer_version = manifest["viewer_version"]
    manifest_hash = canonical_hash(manifest)
    store.upsert_viewer(conn, viewer_id, viewer_version, manifest, manifest_hash)
    return {"viewer_id": viewer_id, "viewer_version": viewer_version, "manifest_hash": manifest_hash}


@router.get("/viewers/{viewer_id}/{viewer_version}")
def get(viewer_id: str, viewer_version: str, conn=Depends(get_conn)):
    v = store.get_viewer(conn, viewer_id, viewer_version)
    if v is None:
        raise HTTPException(status_code=404, detail="viewer not registered")
    return v

import re
from pathlib import PurePosixPath
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from ..config import get_settings

router = APIRouter()

_REF = re.compile(r"^scr_[a-z0-9_]+@v\d{2}\.\d{4}$")


@router.get("/scorers/{ref}/impl.wasm")
def get_scorer_wasm(ref: str):
    if not _REF.match(ref):
        raise HTTPException(status_code=404, detail="unknown scorer")
    settings = get_settings()
    filename = settings.scorer_map.get(ref, f"{ref}.wasm")
    # filename must be a bare name (no traversal / separators) — mapped values are operator config but stay safe.
    if filename != PurePosixPath(filename).name or filename in ("", ".", ".."):
        raise HTTPException(status_code=404, detail="unknown scorer")
    path = settings.scorer_dir / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="unknown scorer")
    return Response(content=path.read_bytes(), media_type="application/wasm")

import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from ..config import get_settings

router = APIRouter()

_REF = re.compile(r"^scr_[a-z0-9_]+@v\d{2}\.\d{4}$")


@router.get("/scorers/{ref}/impl.wasm")
def get_scorer_wasm(ref: str):
    if not _REF.match(ref):
        raise HTTPException(status_code=404, detail="unknown scorer")
    path = get_settings().scorer_dir / f"{ref}.wasm"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="unknown scorer")
    return Response(content=path.read_bytes(), media_type="application/wasm")

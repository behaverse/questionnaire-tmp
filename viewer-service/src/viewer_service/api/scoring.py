import json
from functools import lru_cache
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
from .deps import get_conn, require_session
from ..config import get_settings
from ..store import sessions as session_store

router = APIRouter()


@lru_cache(maxsize=1)
def _validator() -> Draft202012Validator:
    schema = json.loads((get_settings().schemas_dir / "session" / "schema.json").read_text())
    return Draft202012Validator(schema["properties"]["scorer_outputs"])


@router.post("/sessions/{session_id}/scorer_outputs")
def post_scorer_outputs(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    display = payload.pop("x_score_display", None) if isinstance(payload, dict) else None
    try:
        _validator().validate(payload)
    except ValidationError as e:
        return JSONResponse(status_code=422, content={"error": {"code": "invalid_submission", "message": e.message}})
    if session["ephemeral"]:
        return JSONResponse(status_code=202, content={"ephemeral": True})
    session_store.set_scorer_outputs(conn, session_id, payload)
    if isinstance(display, list):
        session_store.set_score_display(conn, session_id, display)
    conn.commit()
    return JSONResponse(status_code=202, content={"stored": True})

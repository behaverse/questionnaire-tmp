"""Per-question participant comments (QA) — owner request #5/#6.

POST is on the participant path (anonymous session token); GET is researcher-gated.
Comments are commentary ABOUT a question, stored out-of-band from Schema-5 responses.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from .deps import get_conn, require_session
from .identity import require_researcher
from ..store import comments as comment_store
from ..store import deployments as dep_store

router = APIRouter()

_COMMENT_MAX = 2000


def _validate(body: dict) -> str | None:
    """Return an error message, or None if the body is acceptable."""
    if not isinstance(body, dict):
        return "body must be an object"
    comment = body.get("comment")
    stars = body.get("stars")
    if comment is not None:
        if not isinstance(comment, str):
            return "comment must be a string"
        if len(comment) > _COMMENT_MAX:
            return f"comment exceeds {_COMMENT_MAX} characters"
    if stars is not None:
        if not isinstance(stars, int) or isinstance(stars, bool) or not (1 <= stars <= 5):
            return "stars must be an integer 1–5"
    has_comment = isinstance(comment, str) and comment.strip() != ""
    if not has_comment and stars is None:
        return "a comment or a star rating is required"
    return None


@router.post("/sessions/{session_id}/comments")
def post_comment(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    err = _validate(payload)
    if err is not None:
        return JSONResponse(status_code=422, content={"error": {"code": "invalid_comment", "message": err}})
    if session["ephemeral"]:
        return JSONResponse(status_code=202, content={"ephemeral": True})
    comment_store.insert_comment(conn, session, payload)
    conn.commit()
    return JSONResponse(status_code=202, content={"stored": True})


@router.get("/deployments/{deployment_id}/comments")
def list_comments(deployment_id: str, conn=Depends(get_conn), claims=Depends(require_researcher)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return {"comments": comment_store.list_comments(conn, deployment_id)}

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from .deps import get_conn
from .identity import require_user, optional_user
from ..store import community as store

router = APIRouter()


class CommentIn(BaseModel):
    body: str
    parent_id: str | None = None


def _author_name(claims: dict) -> str:
    return claims.get("name") or claims.get("display_name") or claims["sub"]


@router.post("/questionnaires/{qid}/comments", status_code=201)
def post_comment(qid: str, body: CommentIn, conn=Depends(get_conn), claims=Depends(require_user)):
    if not store.questionnaire_exists(conn, qid):
        raise HTTPException(status_code=404, detail="questionnaire not found")
    text = (body.body or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="comment body must not be empty")
    if body.parent_id is not None:
        try:
            uuid.UUID(body.parent_id)
        except ValueError:
            raise HTTPException(status_code=422, detail="invalid parent_id")
        parent = store.get_comment(conn, body.parent_id)
        if parent is None or parent["questionnaire_id"] != qid:
            raise HTTPException(status_code=422, detail="invalid parent_id")
        if parent["parent_id"] is not None:
            raise HTTPException(status_code=422, detail="replies may only target a top-level comment")
    out = store.add_comment(conn, qid=qid, author_sub=claims["sub"],
                            author_name=_author_name(claims), body=text, parent_id=body.parent_id)
    conn.commit()
    return out


@router.get("/questionnaires/{qid}/comments")
def get_comments(qid: str, conn=Depends(get_conn)):
    return {"comments": store.list_comments(conn, qid)}


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: str, conn=Depends(get_conn), claims=Depends(require_user)):
    try:
        uuid.UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="comment not found")
    c = store.get_comment(conn, comment_id)
    if c is None:
        raise HTTPException(status_code=404, detail="comment not found")
    is_admin = "administrator" in claims.get("roles", [])
    if c["author_sub"] != claims["sub"] and not is_admin:
        raise HTTPException(status_code=403, detail="not the author")
    store.soft_delete_comment(conn, comment_id)
    conn.commit()


class RatingIn(BaseModel):
    score: int = Field(ge=1, le=5)


@router.put("/questionnaires/{qid}/rating")
def put_rating(qid: str, body: RatingIn, conn=Depends(get_conn), claims=Depends(require_user)):
    if not store.questionnaire_exists(conn, qid):
        raise HTTPException(status_code=404, detail="questionnaire not found")
    store.upsert_rating(conn, qid=qid, author_sub=claims["sub"], score=body.score)
    conn.commit()
    return store.rating_summary(conn, qid)


@router.get("/questionnaires/{qid}/rating")
def get_rating(qid: str, conn=Depends(get_conn), claims=Depends(optional_user)):
    summary = store.rating_summary(conn, qid)
    if claims is not None:
        summary["my_score"] = store.caller_rating(conn, qid, claims["sub"])
    return summary


@router.delete("/questionnaires/{qid}/rating")
def delete_rating(qid: str, conn=Depends(get_conn), claims=Depends(require_user)):
    store.delete_rating(conn, qid, claims["sub"])
    conn.commit()
    return store.rating_summary(conn, qid)


@router.delete("/me/community-data")
def erase_my_community_data(conn=Depends(get_conn), claims=Depends(require_user)):
    res = store.purge_user_community_data(conn, claims["sub"])
    conn.commit()
    return res

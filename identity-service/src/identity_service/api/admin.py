from fastapi import APIRouter, Depends, HTTPException
from .deps import get_conn, require_admin
from ..models import RoleIn, ClientIn
from ..roles import is_valid
from ..store import users as ustore, clients as cstore

router = APIRouter()


@router.get("/v1/admin/users")
def list_users(limit: int = 50, offset: int = 0, _=Depends(require_admin),
               conn=Depends(get_conn)):
    rows = ustore.list_all(conn, limit=limit, offset=offset)
    return {"users": [{"id": str(u["id"]), "email": u["email"],
                       "display_name": u["display_name"], "status": u["status"],
                       "email_verified": u["email_verified"]} for u in rows]}


@router.get("/v1/admin/users/{user_id}")
def get_user(user_id: str, _=Depends(require_admin), conn=Depends(get_conn)):
    u = ustore.by_id(conn, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="user not found")
    roles: dict[str, list[str]] = {}
    for c in cstore.list_all(conn):
        rs = ustore.roles_for(conn, u["id"], c["id"])
        if rs:
            roles[c["slug"]] = rs
    return {"id": str(u["id"]), "email": u["email"], "display_name": u["display_name"],
            "status": u["status"], "email_verified": u["email_verified"], "roles": roles}


@router.post("/v1/admin/users/{user_id}/roles", status_code=204)
def grant_role(user_id: str, body: RoleIn, _=Depends(require_admin), conn=Depends(get_conn)):
    if not is_valid(body.role):
        raise HTTPException(status_code=422, detail="unknown role")
    client = cstore.by_slug(conn, body.client)
    if client is None:
        raise HTTPException(status_code=404, detail="unknown client")
    if ustore.by_id(conn, user_id) is None:
        raise HTTPException(status_code=404, detail="user not found")
    ustore.grant_role(conn, user_id, client["id"], body.role)
    conn.commit()


@router.delete("/v1/admin/users/{user_id}/roles", status_code=204)
def revoke_role(user_id: str, body: RoleIn, _=Depends(require_admin), conn=Depends(get_conn)):
    client = cstore.by_slug(conn, body.client)
    if client is None:
        raise HTTPException(status_code=404, detail="unknown client")
    ustore.revoke_role(conn, user_id, client["id"], body.role)
    conn.commit()


@router.get("/v1/admin/clients")
def list_clients(_=Depends(require_admin), conn=Depends(get_conn)):
    return {"clients": [{"id": str(c["id"]), "slug": c["slug"], "name": c["name"]}
                        for c in cstore.list_all(conn)]}


@router.post("/v1/admin/clients", status_code=201)
def create_client(body: ClientIn, _=Depends(require_admin), conn=Depends(get_conn)):
    if cstore.by_slug(conn, body.slug) is not None:
        raise HTTPException(status_code=409, detail="client slug already exists")
    cid = cstore.create(conn, body.slug, body.name)
    conn.commit()
    return {"id": str(cid), "slug": body.slug, "name": body.name}

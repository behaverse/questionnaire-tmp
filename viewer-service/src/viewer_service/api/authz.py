"""Per-owner authorization for deployment-addressed researcher routes.

`require_researcher` only proves the caller holds a research role — it does NOT prove the caller
owns the deployment being addressed. Without this, any researcher token can read/export/mint links
for EVERY researcher's deployment (cross-tenant IDOR over participant PII). Every route that takes a
`{deployment_id}` and is researcher-gated must resolve the deployment through `require_owned_deployment`
so access is scoped to the creator (or an administrator).

A caller who is neither the owner nor an administrator gets **404**, not 403 — existence of another
researcher's deployment id must not be confirmable.
"""
from fastapi import HTTPException
from ..store import deployments as dep_store


def is_admin(claims: dict) -> bool:
    return "administrator" in claims.get("roles", [])


def owns(deployment: dict, claims: dict) -> bool:
    """True if the caller created this deployment. A NULL `created_by` (legacy rows created before
    ownership tracking) is owned by nobody — reachable only via the admin override."""
    owner = deployment.get("created_by")
    return owner is not None and owner == claims.get("sub")


def require_owned_deployment(conn, deployment_id: str, claims: dict) -> dict:
    """Fetch the deployment and enforce ownership. Returns the deployment dict, or raises 404 when it
    does not exist OR the caller is neither its owner nor an administrator."""
    dep = dep_store.get_deployment(conn, deployment_id)
    if dep is None or not (owns(dep, claims) or is_admin(claims)):
        raise HTTPException(status_code=404, detail="deployment not found")
    return dep

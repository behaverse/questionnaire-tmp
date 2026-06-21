from ..store import keys as kstore


def public_jwks(conn) -> dict:
    """The public JWKS document — active public keys only, never private material."""
    return {"keys": [k["public_jwk"] for k in kstore.active_keys(conn)]}

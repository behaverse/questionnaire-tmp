from fastapi import APIRouter, Depends
from .deps import get_conn
from ..service import jwks

router = APIRouter()


@router.get("/.well-known/jwks.json")
def jwks_doc(conn=Depends(get_conn)):
    return jwks.public_jwks(conn)

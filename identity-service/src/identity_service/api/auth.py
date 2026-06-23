from fastapi import APIRouter, Depends, HTTPException
from .deps import get_conn, require_access
from ..config import get_settings
from ..mailer import make_mailer
from ..service import auth
from ..models import (RegisterIn, LoginIn, RefreshIn, LogoutIn, VerifyEmailIn,
                      RequestResetIn, ResetPasswordIn, ChangePasswordIn)

router = APIRouter()


def _handle(fn):
    try:
        return fn()
    except auth.AuthError as e:
        raise HTTPException(status_code=e.status, detail={"code": e.code, "message": e.message})


@router.post("/v1/auth/register", status_code=201)
def register(body: RegisterIn, conn=Depends(get_conn)):
    s = get_settings()
    def go():
        out = auth.register(conn, s, make_mailer(s), email=body.email, password=body.password,
                            display_name=body.display_name, audience=body.audience)
        conn.commit()
        return out
    return _handle(go)


@router.post("/v1/auth/login")
def login(body: LoginIn, conn=Depends(get_conn)):
    s = get_settings()
    def go():
        out = auth.login(conn, s, email=body.email, password=body.password,
                         audience=body.audience)
        conn.commit()
        return out
    return _handle(go)


@router.post("/v1/auth/refresh")
def refresh(body: RefreshIn, conn=Depends(get_conn)):
    s = get_settings()
    def go():
        out = auth.refresh(conn, s, refresh_token=body.refresh_token)
        conn.commit()
        return out
    return _handle(go)


@router.post("/v1/auth/logout", status_code=204)
def logout(body: LogoutIn, conn=Depends(get_conn)):
    auth.logout(conn, refresh_token=body.refresh_token, all_sessions=body.all_sessions)
    conn.commit()


@router.get("/v1/auth/me")
def me(claims=Depends(require_access), conn=Depends(get_conn)):
    return auth.profile(conn, user_id=claims["sub"], audience=claims["aud"])


@router.post("/v1/auth/verify-email", status_code=204)
def verify_email(body: VerifyEmailIn, conn=Depends(get_conn)):
    def go():
        auth.verify_email(conn, token=body.token); conn.commit()
    return _handle(go)


@router.post("/v1/auth/request-password-reset", status_code=202)
def request_reset(body: RequestResetIn, conn=Depends(get_conn)):
    s = get_settings()
    auth.request_password_reset(conn, s, make_mailer(s), email=body.email)
    conn.commit()
    return {"status": "accepted"}


@router.post("/v1/auth/reset-password", status_code=204)
def reset_password(body: ResetPasswordIn, conn=Depends(get_conn)):
    def go():
        auth.reset_password(conn, token=body.token, new_password=body.new_password)
        conn.commit()
    return _handle(go)


@router.post("/v1/auth/change-password", status_code=204)
def change_password(body: ChangePasswordIn, claims=Depends(require_access), conn=Depends(get_conn)):
    def go():
        auth.change_password(conn, user_id=claims["sub"], old_password=body.old_password,
                             new_password=body.new_password)
        conn.commit()
    return _handle(go)

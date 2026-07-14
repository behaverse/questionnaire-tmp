from fastapi import APIRouter, Depends, HTTPException
from .deps import get_conn, require_access
from .ratelimit import rate_limit
from ..config import get_settings
from ..mailer import make_mailer
from ..service import auth
from ..models import (RegisterIn, LoginIn, RefreshIn, LogoutIn, VerifyEmailIn,
                      RequestResetIn, ResetPasswordIn, ChangePasswordIn, HandoffExchangeIn)

router = APIRouter()


def _handle(fn):
    try:
        return fn()
    except auth.AuthError as e:
        raise HTTPException(status_code=e.status, detail={"code": e.code, "message": e.message})


@router.post("/v1/auth/register", status_code=202, dependencies=[Depends(rate_limit("register"))])
def register(body: RegisterIn, conn=Depends(get_conn)):
    # Uniform 202 whether or not the email already exists (enumeration-resistant) — the response body
    # carries no account info. The client then logs in with the submitted credentials.
    s = get_settings()
    def go():
        auth.register(conn, s, make_mailer(s), email=body.email, password=body.password,
                      display_name=body.display_name, audience=body.audience)
        conn.commit()
        return {"status": "accepted"}
    return _handle(go)


@router.post("/v1/auth/login", dependencies=[Depends(rate_limit("login"))])
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


@router.post("/v1/auth/verify-email", status_code=204,
             dependencies=[Depends(rate_limit("verify"))])
def verify_email(body: VerifyEmailIn, conn=Depends(get_conn)):
    def go():
        auth.verify_email(conn, token=body.token); conn.commit()
    return _handle(go)


@router.post("/v1/auth/request-password-reset", status_code=202,
             dependencies=[Depends(rate_limit("reset"))])
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


@router.post("/v1/auth/handoff")
def handoff(claims=Depends(require_access), conn=Depends(get_conn)):
    """Mint a single-use SSO handoff code for the signed-in participant (used by the portal to launch
    the player on another origin without a re-login). Bound to the caller's user + audience."""
    s = get_settings()
    def go():
        out = auth.mint_handoff(conn, s, user_id=claims["sub"], audience=claims["aud"])
        conn.commit()
        return out
    return _handle(go)


@router.post("/v1/auth/handoff/exchange")
def handoff_exchange(body: HandoffExchangeIn, conn=Depends(get_conn)):
    """Public — exchange a handoff code (single-use) for a fresh token pair on this origin."""
    s = get_settings()
    def go():
        out = auth.exchange_handoff(conn, s, code=body.handoff_code)
        conn.commit()
        return out
    return _handle(go)

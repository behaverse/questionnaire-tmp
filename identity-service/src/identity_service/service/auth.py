import uuid
from datetime import datetime, timedelta, timezone

from .. import tokens, passwords
from ..store import users as ustore, clients as cstore, refresh as rstore
from ..store import keys as kstore, email_tokens as etstore


class AuthError(Exception):
    code = "auth_error"; status = 400


class InvalidCredentials(AuthError):
    code = "invalid_credentials"; status = 401


class ReuseDetected(AuthError):
    code = "refresh_reuse"; status = 401


class UnknownClient(AuthError):
    code = "unknown_client"; status = 400


class EmailInUse(AuthError):
    code = "email_in_use"; status = 409


class NoSigningKey(AuthError):
    code = "no_signing_key"; status = 500


class InvalidToken(AuthError):
    code = "invalid_token"; status = 400


def _client_or_raise(conn, slug):
    c = cstore.by_slug(conn, slug)
    if c is None:
        raise UnknownClient(slug)
    return c


def _now():
    return datetime.now(timezone.utc)


def _issue_tokens(conn, settings, user, client) -> dict:
    key = kstore.signing_key(conn)
    if key is None:
        raise NoSigningKey()
    roles = ustore.roles_for(conn, user["id"], client["id"])
    access = tokens.sign_access(
        private_pem=key["private_pem"], kid=key["kid"], sub=str(user["id"]),
        aud=client["slug"], roles=roles, issuer=settings.issuer, ttl=settings.access_ttl)
    raw_refresh = tokens.mint_refresh()
    rstore.issue(conn, user["id"], client["id"], tokens.hash_token(raw_refresh),
                 uuid.uuid4(), _now() + timedelta(seconds=settings.refresh_ttl))
    return {"access_token": access, "refresh_token": raw_refresh,
            "expires_in": settings.access_ttl, "token_type": "Bearer"}


def register(conn, settings, mailer, *, email, password, display_name, audience) -> dict:
    client = _client_or_raise(conn, audience)
    if ustore.by_email(conn, email) is not None:
        raise EmailInUse(email)
    uid = ustore.create(conn, email, passwords.hash_password(password), display_name)
    ustore.grant_role(conn, uid, client["id"], settings.default_register_role)
    raw = tokens.mint_refresh()
    etstore.issue(conn, uid, "verify", tokens.hash_token(raw),
                  _now() + timedelta(seconds=settings.verify_token_ttl))
    mailer.send(email, "Verify your email", f"verify token: {raw}")
    return profile(conn, user_id=uid, audience=audience)


def login(conn, settings, *, email, password, audience) -> dict:
    client = _client_or_raise(conn, audience)
    user = ustore.by_email(conn, email)
    if user is None or user["status"] != "active" \
            or not passwords.verify_password(password, user["password_hash"]):
        raise InvalidCredentials()
    return _issue_tokens(conn, settings, user, client)


def refresh(conn, settings, *, refresh_token) -> dict:
    row = rstore.lookup(conn, tokens.hash_token(refresh_token))
    if row is None:
        raise InvalidToken()
    if rstore.is_reuse(row):
        rstore.revoke_family(conn, row["family_id"])    # theft mitigation
        raise ReuseDetected()
    if row["expires_at"] <= _now():
        raise InvalidToken()
    user = ustore.by_id(conn, row["user_id"])
    key = kstore.signing_key(conn)
    if key is None:
        raise NoSigningKey()
    client = next(c for c in cstore.list_all(conn) if c["id"] == row["client_id"])
    roles = ustore.roles_for(conn, user["id"], client["id"])
    access = tokens.sign_access(
        private_pem=key["private_pem"], kid=key["kid"], sub=str(user["id"]),
        aud=client["slug"], roles=roles, issuer=settings.issuer, ttl=settings.access_ttl)
    new_raw = tokens.mint_refresh()
    rstore.rotate(conn, row, tokens.hash_token(new_raw),
                  _now() + timedelta(seconds=settings.refresh_ttl))
    return {"access_token": access, "refresh_token": new_raw,
            "expires_in": settings.access_ttl, "token_type": "Bearer"}


def logout(conn, *, refresh_token, all_sessions=False) -> None:
    row = rstore.lookup(conn, tokens.hash_token(refresh_token))
    if row is None:
        return
    if all_sessions:
        rstore.revoke_family(conn, row["family_id"])
    else:
        conn.execute("UPDATE refresh_tokens SET revoked_at = now() "
                     "WHERE id = %s AND revoked_at IS NULL", (row["id"],))


def profile(conn, *, user_id, audience) -> dict:
    user = ustore.by_id(conn, user_id)
    client = _client_or_raise(conn, audience)
    return {"id": str(user["id"]), "email": user["email"],
            "display_name": user["display_name"], "email_verified": user["email_verified"],
            "roles": ustore.roles_for(conn, user["id"], client["id"])}


def verify_email(conn, *, token) -> None:
    row = etstore.consume(conn, "verify", tokens.hash_token(token))
    if row is None:
        raise InvalidToken()
    ustore.set_email_verified(conn, row["user_id"])


def request_password_reset(conn, settings, mailer, *, email) -> None:
    user = ustore.by_email(conn, email)
    if user is None:
        return                                          # no account enumeration
    raw = tokens.mint_refresh()
    etstore.issue(conn, user["id"], "reset", tokens.hash_token(raw),
                  _now() + timedelta(seconds=settings.reset_token_ttl))
    mailer.send(email, "Reset your password", f"reset token: {raw}")


def reset_password(conn, *, token, new_password) -> None:
    row = etstore.consume(conn, "reset", tokens.hash_token(token))
    if row is None:
        raise InvalidToken()
    ustore.set_password(conn, row["user_id"], passwords.hash_password(new_password))
    conn.execute("UPDATE refresh_tokens SET revoked_at = now() "
                 "WHERE user_id = %s AND revoked_at IS NULL", (row["user_id"],))

import uuid
import psycopg


def _one(cur):
    if cur.description is None:
        return None
    r = cur.fetchone()
    if r is None:
        return None
    return dict(zip([d.name for d in cur.description], r))


_USER_COLS = "id, email, password_hash, display_name, status, email_verified"


def create(conn: psycopg.Connection, email: str, password_hash: str,
           display_name: str = "") -> uuid.UUID:
    uid = uuid.uuid4()
    conn.execute(
        "INSERT INTO users (id, email, password_hash, display_name) VALUES (%s,%s,%s,%s)",
        (uid, email, password_hash, display_name))
    return uid


def by_email(conn: psycopg.Connection, email: str) -> dict | None:
    return _one(conn.execute(f"SELECT {_USER_COLS} FROM users WHERE email = %s", (email,)))


def by_id(conn: psycopg.Connection, user_id) -> dict | None:
    return _one(conn.execute(f"SELECT {_USER_COLS} FROM users WHERE id = %s", (user_id,)))


def list_all(conn: psycopg.Connection, limit: int = 50, offset: int = 0) -> list[dict]:
    cur = conn.execute(
        f"SELECT {_USER_COLS} FROM users ORDER BY created_at DESC LIMIT %s OFFSET %s",
        (limit, offset))
    cols = [d.name for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def list_in_client(conn: psycopg.Connection, client_id, limit: int = 50, offset: int = 0) -> list[dict]:
    """Users holding at least one role in the given client/audience — the scope an administrator
    of that audience is allowed to enumerate (admin reads must not span other clients)."""
    cur = conn.execute(
        f"SELECT DISTINCT {', '.join('u.' + c for c in _USER_COLS.split(', '))}, u.created_at "
        "FROM users u JOIN user_roles r ON r.user_id = u.id "
        "WHERE r.client_id = %s ORDER BY u.created_at DESC LIMIT %s OFFSET %s",
        (client_id, limit, offset))
    cols = [d.name for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def set_email_verified(conn: psycopg.Connection, user_id) -> None:
    conn.execute("UPDATE users SET email_verified = true, updated_at = now() WHERE id = %s",
                 (user_id,))


def set_password(conn: psycopg.Connection, user_id, password_hash: str) -> None:
    conn.execute("UPDATE users SET password_hash = %s, updated_at = now() WHERE id = %s",
                 (password_hash, user_id))


def grant_role(conn: psycopg.Connection, user_id, client_id, role: str) -> None:
    conn.execute(
        "INSERT INTO user_roles (user_id, client_id, role) VALUES (%s,%s,%s) "
        "ON CONFLICT DO NOTHING", (user_id, client_id, role))


def revoke_role(conn: psycopg.Connection, user_id, client_id, role: str) -> None:
    conn.execute(
        "DELETE FROM user_roles WHERE user_id=%s AND client_id=%s AND role=%s",
        (user_id, client_id, role))


def roles_for(conn: psycopg.Connection, user_id, client_id) -> list[str]:
    cur = conn.execute(
        "SELECT role FROM user_roles WHERE user_id=%s AND client_id=%s", (user_id, client_id))
    return [r[0] for r in cur.fetchall()]

import sys
import psycopg

from .config import get_settings
from .store.migrate import apply_schema
from .store import clients as cstore, users as ustore, keys as kstore
from .keys import generate_keypair
from .service import maintenance
from . import passwords

_USAGE = ("usage: identity {migrate | generate-key [--retire-others] | "
          "create-client --slug S [--name N] | "
          "create-admin --email E --password P [--audience A] | "
          "reap [--grace-seconds N]}")


def _opt(argv, name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print(_USAGE)
        return 2
    cmd, url = argv[0], get_settings().database_url

    if cmd == "migrate":
        with psycopg.connect(url) as conn:
            apply_schema(conn)
            if cstore.by_slug(conn, "questionnaire-apps") is None:
                cstore.create(conn, "questionnaire-apps", "Questionnaire Apps")
            conn.commit()
        print("schema applied")
        return 0

    if cmd == "generate-key":
        kid, jwk, pem = generate_keypair()
        with psycopg.connect(url) as conn:
            kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
            if "--retire-others" in argv:
                kstore.retire_others(conn, keep_kid=kid)
            conn.commit()
        print(f"signing key {kid} created")
        return 0

    if cmd == "create-client":
        slug = _opt(argv, "--slug")
        if not slug:
            print(_USAGE); return 2
        with psycopg.connect(url) as conn:
            if cstore.by_slug(conn, slug) is None:
                cstore.create(conn, slug, _opt(argv, "--name", ""))
                conn.commit()
        print(f"client {slug} ready")
        return 0

    if cmd == "create-admin":
        email, pw = _opt(argv, "--email"), _opt(argv, "--password")
        audience = _opt(argv, "--audience", "questionnaire-apps")
        if not email or not pw:
            print(_USAGE); return 2
        with psycopg.connect(url) as conn:
            client = cstore.by_slug(conn, audience)
            if client is None:
                print(f"unknown client: {audience}"); return 1
            user = ustore.by_email(conn, email)
            uid = user["id"] if user else ustore.create(conn, email,
                                                         passwords.hash_password(pw))
            ustore.grant_role(conn, uid, client["id"], "administrator")
            conn.commit()
        print(f"admin {email} ready in {audience}")
        return 0

    if cmd == "reap":
        grace = int(_opt(argv, "--grace-seconds", "0"))
        with psycopg.connect(url) as conn:
            counts = maintenance.reap_expired(conn, grace_seconds=grace)
            conn.commit()
        total = sum(counts.values())
        print(f"reaped {total} expired rows ("
              + ", ".join(f"{k}={v}" for k, v in counts.items()) + ")")
        return 0

    print(_USAGE)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

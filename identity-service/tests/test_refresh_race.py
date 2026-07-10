"""Concurrent refresh of the same token must not fork the family into two valid tokens: exactly one
refresh succeeds; the other is caught by reuse-detection (serialized via SELECT ... FOR UPDATE)."""
import threading
import psycopg
from identity_service.config import get_settings
from identity_service.mailer import NullMailer
from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore, clients as cstore
from identity_service.service import auth


def _seed(pg_url):
    with psycopg.connect(pg_url) as c:
        kid, jwk, pem = generate_keypair()
        kstore.insert_key(c, kid, "EdDSA", jwk, pem)
        cstore.create(c, "questionnaire-apps", "QA")
        auth.register(c, get_settings(), NullMailer(), email="race@e.com", password="password1",
                      display_name="R", audience="questionnaire-apps")
        toks = auth.login(c, get_settings(), email="race@e.com", password="password1",
                          audience="questionnaire-apps")
        c.commit()
        return toks["refresh_token"]


def test_concurrent_refresh_of_same_token_forks_no_family(pg_url, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", pg_url)
    refresh_token = _seed(pg_url)
    s = get_settings()
    barrier = threading.Barrier(2)
    results: list = [None, None]

    def worker(i):
        try:
            with psycopg.connect(pg_url, autocommit=False) as c:
                barrier.wait()
                out = auth.refresh(c, s, refresh_token=refresh_token)
                c.commit()
                results[i] = ("ok", out["refresh_token"])
        except auth.AuthError as e:
            results[i] = ("err", e.code)

    ts = [threading.Thread(target=worker, args=(i,)) for i in range(2)]
    for t in ts: t.start()
    for t in ts: t.join()

    kinds = sorted(r[0] for r in results)
    assert kinds == ["err", "ok"], f"expected exactly one success + one reuse, got {results}"
    err = next(r for r in results if r[0] == "err")
    assert err[1] == "refresh_reuse"    # the loser is caught by reuse-detection, not a 500

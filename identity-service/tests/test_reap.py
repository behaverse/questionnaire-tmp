import uuid
from datetime import datetime, timezone, timedelta
import psycopg
from identity_service.store import clients as cstore, users as ustore, handoff as hstore, \
    email_tokens as etstore, refresh as rstore
from identity_service.service import maintenance
from identity_service import tokens, passwords, cli

_TABLES = ("handoff_codes", "email_tokens", "refresh_tokens")


def _seed(pg_url):
    """One already-expired row + one still-live row in each token table."""
    past = datetime.now(timezone.utc) - timedelta(hours=1)
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    with psycopg.connect(pg_url) as c:
        cid = cstore.create(c, "reap-test", "T")
        uid = ustore.create(c, "a@e.com", passwords.hash_password("password1"))
        hstore.issue(c, uid, cid, tokens.hash_token("h_old"), past)
        hstore.issue(c, uid, cid, tokens.hash_token("h_new"), future)
        etstore.issue(c, uid, "verify", tokens.hash_token("e_old"), past)
        etstore.issue(c, uid, "verify", tokens.hash_token("e_new"), future)
        rstore.issue(c, uid, cid, tokens.hash_token("r_old"), uuid.uuid4(), past)
        rstore.issue(c, uid, cid, tokens.hash_token("r_new"), uuid.uuid4(), future)
        c.commit()


def _counts(pg_url):
    with psycopg.connect(pg_url) as c:
        return {t: c.execute(f"SELECT count(*) FROM {t}").fetchone()[0] for t in _TABLES}


def test_reap_deletes_expired_rows_and_keeps_live_ones(pg_url):
    _seed(pg_url)
    with psycopg.connect(pg_url) as c:
        deleted = maintenance.reap_expired(c, grace_seconds=0)
        c.commit()
    assert deleted == {"handoff_codes": 1, "email_tokens": 1, "refresh_tokens": 1}
    assert _counts(pg_url) == {"handoff_codes": 1, "email_tokens": 1, "refresh_tokens": 1}  # the live rows


def test_reap_grace_window_spares_recently_expired_rows(pg_url):
    _seed(pg_url)  # the 'old' rows expired 1h ago
    with psycopg.connect(pg_url) as c:
        deleted = maintenance.reap_expired(c, grace_seconds=7200)  # 2h grace → nothing yet
        c.commit()
    assert deleted == {"handoff_codes": 0, "email_tokens": 0, "refresh_tokens": 0}
    assert _counts(pg_url) == {"handoff_codes": 2, "email_tokens": 2, "refresh_tokens": 2}


def test_reap_cli_runs_and_reports(pg_url, monkeypatch, capsys):
    _seed(pg_url)
    monkeypatch.setenv("DATABASE_URL", pg_url)
    assert cli.main(["reap"]) == 0
    out = capsys.readouterr().out
    assert "reaped 3 expired rows" in out
    assert _counts(pg_url) == {"handoff_codes": 1, "email_tokens": 1, "refresh_tokens": 1}

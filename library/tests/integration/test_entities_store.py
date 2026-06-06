import pytest
from datetime import datetime, timezone
from pathlib import Path
from library.loader import Artifact
from library.store.entities import upsert_entity, get_entity, withdraw_entity, ImmutabilityError

def _art(content):
    return Artifact("prompt", "pr_x", "v26.0528",
                    {"id": "pr_x", "version": "v26.0528", "license": "cc0", **content},
                    Path("pr_x.json"))

def test_upsert_then_get(conn):
    upsert_entity(conn, _art({"a": 1}), "deadbeef"); conn.commit()
    row = get_entity(conn, "pr_x", "v26.0528")
    assert row["content_json"]["a"] == 1 and row["license"] == "cc0"

def test_idempotent_reingest_is_noop(conn):
    upsert_entity(conn, _art({"a": 1}), "c1"); conn.commit()
    upsert_entity(conn, _art({"a": 1}), "c2"); conn.commit()  # identical content
    assert get_entity(conn, "pr_x", "v26.0528")["content_json"]["a"] == 1

def test_changed_content_same_version_rejected(conn):
    upsert_entity(conn, _art({"a": 1}), "c1"); conn.commit()
    with pytest.raises(ImmutabilityError):
        upsert_entity(conn, _art({"a": 2}), "c2")

def test_withdraw_stubs_content(conn):
    upsert_entity(conn, _art({"a": 1}), "c1"); conn.commit()
    withdraw_entity(conn, "pr_x", "v26.0528", datetime(2026, 6, 5, tzinfo=timezone.utc)); conn.commit()
    row = get_entity(conn, "pr_x", "v26.0528")
    assert row["status"] == "withdrawn" and row["content_json"] is None

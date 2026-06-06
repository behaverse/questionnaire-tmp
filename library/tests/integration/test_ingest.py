import json
from pathlib import Path
import pytest
from library.ingest import ingest_tree, UnresolvedRefError
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"
S = get_settings()

def _reg():
    return build_registry(S.schemas_dir)

def test_ingest_fixture_tree(conn):
    report = ingest_tree(conn, FIXTURE, "abc123", registry=_reg(), schemas_dir=S.schemas_dir, release="v26.0601")
    conn.commit()
    assert report.errors == []
    assert report.ingested == 6
    n = conn.execute("SELECT count(*) FROM catalogue_entry").fetchone()[0]
    assert n == report.ingested

def test_reingest_is_idempotent(conn):
    ingest_tree(conn, FIXTURE, "c1", registry=_reg(), schemas_dir=S.schemas_dir, release="v26.0601"); conn.commit()
    before = conn.execute("SELECT count(*) FROM entity").fetchone()[0]
    rep2 = ingest_tree(conn, FIXTURE, "c2", registry=_reg(), schemas_dir=S.schemas_dir, release="v26.0601"); conn.commit()
    after = conn.execute("SELECT count(*) FROM entity").fetchone()[0]
    assert before == after == 6
    assert rep2.ingested == 0 and rep2.skipped == 6

def test_unresolved_ref_raises(conn, tmp_path):
    d = tmp_path / "items"; d.mkdir(parents=True)
    (d / "it_bad.json").write_text(json.dumps(
        {"id": "it_bad", "question": {"ref": "q_missing@v26.0601"}, "option": {"ref": "opt_missing@v26.0601"}}))
    with pytest.raises(UnresolvedRefError):
        ingest_tree(conn, tmp_path, "c1", registry=_reg(), schemas_dir=S.schemas_dir, release="v26.0601", validate=False)

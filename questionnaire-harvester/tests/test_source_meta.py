import json
from pathlib import Path
from types import SimpleNamespace
from harvester.source_meta import write_source_metadata

def _rq(**kw):
    base = dict(qst_id="qst_x", source_url="https://psychology-tools.com/test/x",
                source_meta={"meta_description": "d", "keywords": ["a"], "og": {"title": "T"},
                             "introduction": ["p1", "p2"]})
    base.update(kw)
    return SimpleNamespace(**base)

def test_write_source_metadata_writes_flagged_json(tmp_path):
    p = write_source_metadata(_rq(), tmp_path)
    assert p == tmp_path / "qst_x.json"
    d = json.loads(p.read_text())
    assert "_notice" in d and "NOT for redistribution" in d["_notice"]
    assert d["id"] == "qst_x" and d["source_url"].endswith("/test/x")
    assert d["meta_description"] == "d" and d["keywords"] == ["a"]
    assert d["og"]["title"] == "T" and d["introduction"] == ["p1", "p2"]

def test_write_source_metadata_skips_when_none(tmp_path):
    assert write_source_metadata(_rq(source_meta=None), tmp_path) is None
    assert list(tmp_path.glob("*.json")) == []

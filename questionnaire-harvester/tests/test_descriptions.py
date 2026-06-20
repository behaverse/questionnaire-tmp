from types import SimpleNamespace
from harvester.descriptions import load_authored, apply_authored_description

def test_load_authored_reads_md_files(tmp_path):
    (tmp_path / "qst_a.md").write_text("Desc A.\n")
    (tmp_path / "qst_b.md").write_text("  Desc B.  ")
    (tmp_path / "qst_empty.md").write_text("   ")
    m = load_authored(tmp_path)
    assert m == {"qst_a": "Desc A.", "qst_b": "Desc B."}

def test_load_authored_missing_dir(tmp_path):
    assert load_authored(tmp_path / "nope") == {}

def test_apply_authored_sets_description_and_source(tmp_path):
    (tmp_path / "qst_x.md").write_text("The X (X) is a 3-item demo. It is used to test.")
    rq = SimpleNamespace(qst_id="qst_x", description="old scraped", description_source=None)
    assert apply_authored_description(rq, tmp_path) is True
    assert rq.description == "The X (X) is a 3-item demo. It is used to test."
    assert rq.description_source == "authored"

def test_apply_authored_noop_when_absent(tmp_path):
    rq = SimpleNamespace(qst_id="qst_y", description="old", description_source=None)
    assert apply_authored_description(rq, tmp_path) is False
    assert rq.description == "old" and rq.description_source is None

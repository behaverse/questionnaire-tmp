from pathlib import Path
from harvester.tracking import upsert_register_row, write_questions
from harvester.raw import RawQuestionnaire
from harvester.licensing import LicenseFlag
from harvester.draft import DraftResult

def test_register_is_idempotent_by_id(tmp_path):
    reg = tmp_path / "register.md"
    upsert_register_row(reg, "qst_gad7", "psytoolkit", "high", "drafted", 2, "unknown")
    upsert_register_row(reg, "qst_gad7", "psytoolkit", "high", "ready", 0, "unknown")
    body = reg.read_text()
    assert body.count("qst_gad7") == 1
    assert "ready" in body and "drafted" not in body

def test_questions_flags_unknown_license(tmp_path):
    rq = RawQuestionnaire(qst_id="qst_gad7", title="GAD-7", short_title="GAD-7", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x",
        instruction_text="…", scale={"input_data_type":"choice","measurement_type":"ordinal",
        "selection":"single","dimension":"frequency","anchors":["a"],"values":[0.0]},
        items=[{"text":"x"}], license=LicenseFlag.unknown("https://x"), domain=["anxiety"], population=["adults"])
    qs = write_questions(tmp_path, rq, DraftResult(entities={}, reused=["opt_phq_frequency_4"], minted=[]), [])
    assert any("license" in q.lower() for q in qs)
    assert any("citation" in q.lower() for q in qs)        # empty citation flagged
    assert (tmp_path / "qst_gad7.md").exists()

import json
from library.importers.survey_db.loss import LossReport

def test_accumulate_and_write(tmp_path):
    lr = LossReport()
    lr.add("dropped", "surveys.scoring_code", "url not convertible to Scorer")
    lr.add("warning", "surveys.acs.license", "NULL -> unknown")
    lr.preserve("prompts", 793)
    lr.write(tmp_path)
    data = json.loads((tmp_path / "loss_report.json").read_text())
    assert data["preserved"]["prompts"] == 793
    cats = {e["category"] for e in data["entries"]}
    assert cats == {"dropped", "warning"}
    md = (tmp_path / "loss_report.md").read_text()
    assert "dropped" in md and "prompts: 793" in md

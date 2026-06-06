import json
from library.importers.survey_db.writer import write_entity

def test_writes_to_plural_dir(tmp_path):
    p = write_entity(tmp_path, "prompt", {"id": "pr_x", "content": {}})
    assert p == tmp_path / "prompts" / "pr_x.json"
    assert json.loads(p.read_text())["id"] == "pr_x"

def test_questionnaire_dir(tmp_path):
    p = write_entity(tmp_path, "questionnaire", {"metadata": {"id": "qst_x"}})
    assert p == tmp_path / "questionnaires" / "qst_x.json"

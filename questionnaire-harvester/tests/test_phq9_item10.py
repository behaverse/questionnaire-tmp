import json
from pathlib import Path

OUT = Path("questionnaire-harvester/output")

def test_phq9_has_impairment_item_10():
    q = json.loads((OUT / "questionnaires" / "qst_phq9.json").read_text())
    els = q["pages"][0]["elements"]
    assert len(els) == 10
    assert q["metadata"]["psychometrics"]["item_count"] == 10
    last = els[-1]
    pr = json.loads((OUT / "prompts" / (last["question"]["prompt"]["ref"].split("@")[0] + ".json")).read_text())
    assert "how difficult" in pr["content"]["en"]["text"].lower()
    opt = json.loads((OUT / "options" / (last["option"]["ref"].split("@")[0] + ".json")).read_text())
    anchors = [c["text"] for c in opt["content"]["en"]["options"]]
    assert anchors == ["Not difficult at all", "Somewhat difficult", "Very difficult", "Extremely difficult"]
    assert opt.get("x_scored") is False

import json
from pathlib import Path
from harvester import cli

REPO = Path(__file__).resolve().parents[2]

def test_gad7_harvest_reuses_phq_scale_and_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_gad7.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    # seed dedup index with the PHQ frequency scale so GAD-7 must reuse it
    idx = REPO / "questionnaire-harvester" / "dedup" / "scales-index.json"
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
                   "--out", str(out), "--scales-index", str(idx),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0617"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_gad7.json").read_text())
    refs = {e["option"]["ref"] for e in qst["pages"][0]["elements"]}
    assert refs == {"opt_phq_frequency_4@v26.0617"}          # reused PHQ-9 scale
    assert not (out / "options").exists() or not list((out / "options").glob("*.json"))  # nothing minted
    # temporal frame split off into a faithfully-minted Context (verbatim "2 weeks", not "two")
    ctx_refs = {e["question"]["context"]["ref"] for e in qst["pages"][0]["elements"]}
    assert ctx_refs == {"ctx_over_the_last_2_weeks@v26.0617"}
    minted_ctx = json.loads((out / "contexts" / "ctx_over_the_last_2_weeks.json").read_text())
    assert minted_ctx["content"]["en"]["text"] == "Over the last 2 weeks,"
    assert (tmp_path / "questions" / "qst_gad7.md").exists()


def test_id_override_resolves_collision(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_gad7.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    idx = REPO / "questionnaire-harvester" / "dedup" / "scales-index.json"
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
                   "--id", "qst_custom",
                   "--out", str(out), "--scales-index", str(idx),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0617"])
    assert rc == 0
    assert (out / "questionnaires" / "qst_custom.json").exists()
    assert not (out / "questionnaires" / "qst_gad7.json").exists()
    assert (tmp_path / "questions" / "qst_custom.md").exists()


def test_range_slider_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_range.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/happiness-shs.html",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_shs.json").read_text())
    assert len(qst["pages"][0]["elements"]) == 4
    # slider options are numbers with endpoint labels; identical ones dedup
    opt_files = list((out / "options").glob("*.json"))
    assert opt_files, "expected minted slider options"
    one = json.loads(opt_files[0].read_text())
    assert one["input_data_type"] == "number"
    assert "min_label" in one and "max_label" in one


def test_multiradio_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_multiradio.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/narcism-npi16.html",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    # h1 "Narcissism (NPI-16)" -> acronym "(NPI-16)" sanitizes to qst_npi16
    qst = json.loads((out / "questionnaires" / "qst_npi16.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # all elements share one prompt; no instruction
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 1
    assert all("instruction" not in e["question"] for e in els)
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["randomize"] is True

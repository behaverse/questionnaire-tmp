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
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"), "--scales-index", str(idx),
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
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"), "--scales-index", str(idx),
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
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
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
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
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


def test_radio_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_radio.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/depression-epds.html",
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    # h1 "Postnatal Depression (EPDS)" -> qst_epds
    qst = json.loads((out / "questionnaires" / "qst_epds.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # per-item distinct prompts; no instruction; per-item choice options
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 2
    assert all("instruction" not in e["question"] for e in els)
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "single"


def test_check_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_check.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/children-happiness.html",
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    # h1 "Children's Happiness Scale" (no acronym) -> URL slug "happiness" -> qst_happiness
    qst = json.loads((out / "questionnaires" / "qst_happiness.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 1
    assert "instruction" not in els[0]["question"]
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "multiple"
    assert opt["measurement_type"] == "nominal"


def test_psychology_tools_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_test.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-worry-questionnaire",
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_dwq.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # per-item distinct prompts; identical 3-point scale dedups to one option
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 2
    assert len({e["option"]["ref"] for e in els}) == 1
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "single"


def test_psychology_tools_alt_layout_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_alt.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-mania-rating-scale",
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_dmrs.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 2
    # identical 3-point scale dedups to one option
    assert len({e["option"]["ref"] for e in els}) == 1
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "single"


def test_psychology_tools_references_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_sources.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-worry-scale",
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    md = json.loads((out / "questionnaires" / "qst_dws.json").read_text())["metadata"]
    assert md["publication"]["year"] == 2011
    assert "A Demo, B Tester" in md["publication"]["citation"]
    assert md["x_references"] == [{"citation": md["publication"]["citation"]}]


def test_psychology_tools_stemless_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_stemless.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-eating-scale",
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_des.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # one shared prompt referenced by every element; no per-item instruction
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 1
    assert all("instruction" not in e["question"] for e in els)
    # the two items have distinct option-sets (different content)
    assert len({e["option"]["ref"] for e in els}) == 2
    prompt = json.loads(next((out / "prompts").glob("*_shared.json")).read_text())
    assert "Below are groups of statements" in prompt["content"]["en"]["text"]


def test_psychology_tools_dimension_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_dimension.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-two-dimension-scale",
                   "--out", str(out), "--source-metadata", str(out.parent / "source_metadata"),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_dtds.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 4                                        # 2 items x 2 dimensions
    opt_refs = {e["option"]["ref"].split("@")[0] for e in els}
    assert len(opt_refs) == 2                                   # fear + avoidance scales dedup to 2
    dims = sorted(json.loads((out / "options" / f"{r}.json").read_text())["dimension"]
                  for r in opt_refs)
    assert dims == ["avoidance", "fear"]


def test_document_scoring_cli_lsas(tmp_path):
    from harvester import cli
    sc = tmp_path / "scoring"
    rc = cli.main(["document-scoring", "--out", "questionnaire-harvester/output",
                   "--scoring", str(sc), "--id", "qst_lsas"])
    assert rc == 0
    block = json.loads((sc / "qst_lsas.md").read_text().split("```json", 1)[1].split("```", 1)[0])
    assert block["item_count"] == 48
    assert block["dimensions"] == ["avoidance", "fear"]
    assert len(block["option_scales"]) == 2
    assert block["uniform_scale"] is False

def test_document_scoring_cli_uniform(tmp_path):
    from harvester import cli
    sc = tmp_path / "scoring"
    assert cli.main(["document-scoring", "--out", "questionnaire-harvester/output",
                     "--scoring", str(sc), "--id", "qst_gad7"]) == 0
    block = json.loads((sc / "qst_gad7.md").read_text().split("```json", 1)[1].split("```", 1)[0])
    assert block["uniform_scale"] is True
    assert block["option_scales"][0]["values"] == [0, 1, 2, 3]


def test_review_export_cli_lsas(tmp_path):
    from harvester import cli
    rev = tmp_path / "import_review"
    assert cli.main(["review-export", "--out", "questionnaire-harvester/output",
                     "--review-dir", str(rev), "--id", "qst_lsas"]) == 0
    doc = (rev / "qst_lsas.md").read_text()
    assert "psychology-tools.com/test/liebowitz-social-anxiety-scale" in doc
    assert "1. **" in doc and "48. **" in doc
    assert "dimension: fear" in doc and "dimension: avoidance" in doc
    readme = (rev / "README.md").read_text()
    assert readme.count("- [ ]") == 158

def test_review_export_cli_gad7(tmp_path):
    from harvester import cli
    rev = tmp_path / "import_review"
    assert cli.main(["review-export", "--out", "questionnaire-harvester/output",
                     "--review-dir", str(rev), "--id", "qst_gad7"]) == 0
    doc = (rev / "qst_gad7.md").read_text()
    assert "## Items" in doc
    assert "[score: 0]" in doc          # a choice option line rendered with weights


def test_psychology_tools_meta_capture_e2e(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_meta.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    sm = tmp_path / "source_metadata"
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-screening",
                   "--out", str(out), "--scales-index", str(tmp_path / "missing.json"),
                   "--register", str(tmp_path / "register.md"), "--questions", str(tmp_path / "questions"),
                   "--source-metadata", str(sm),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qid = "qst_demo"
    md = json.loads((out / "questionnaires" / f"{qid}.json").read_text())["metadata"]
    assert md["x_keywords"] == ["DEMO", "demo", "screening"]
    assert md["x_description_source"] == "site_meta"
    sidecar = json.loads((sm / f"{qid}.json").read_text())
    assert sidecar["introduction"][0].startswith("The DEMO is a demonstration")
    assert "NOT for redistribution" in sidecar["_notice"]

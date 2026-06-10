from denormaliser import RuntimePolicy, denormalise
from tests.fixtures import mini_phq


def _run(schemas_dir, **policy_kw):
    policy = RuntimePolicy(scorer_impl_preference=["wasm", "http"], **policy_kw)
    return denormalise(
        mini_phq.questionnaire(),
        locale="en",
        runtime_policy=policy,
        viewer_manifest=mini_phq.VIEWER_MANIFEST,
        resolve_entity=mini_phq.resolve_entity,
        generated_at="2026-06-10T12:00:00Z",
        denormaliser_version="v26.0610",
        schemas_dir=schemas_dir,
    )


def test_refs_inlined_and_locale_trimmed(schemas_dir):
    rt = _run(schemas_dir)
    opt = rt["pages"][0]["elements"][0]["option"]
    # Faithful projection: Schema 2 vocabulary + structure preserved.
    assert opt["input_data_type"] == "choice"
    assert opt["options"] == [{"index": 1, "value": 0}, {"index": 2, "value": 1},
                              {"index": 3, "value": 2}, {"index": 4, "value": 3}]
    # Locale trimmed to en only.
    assert set(opt["content"].keys()) == {"en"}
    assert opt["content"]["en"]["label"] == "Frequency"
    prompt = rt["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["content"] == {"en": {"status": "validated", "text": "Little interest or pleasure in doing things"}}
    assert rt["available_locales"] == ["en", "pt"]


def test_scorer_pinned_to_wasm(schemas_dir):
    rt = _run(schemas_dir)
    total = next(s for s in rt["scores"] if s["id"] == "mini_total")
    assert total["impl"]["kind"] == "wasm"
    assert total["impl"]["sha256"] == "a" * 64


def test_display_only_score_stripped_when_show_score_false(schemas_dir):
    rt = _run(schemas_dir, show_score=False)
    # mini_total is branching-required (in the LogicRule); mini_label is display-only.
    assert {s["id"] for s in rt["scores"]} == {"mini_total"}
    assert rt["provenance"]["stripped_scorer_refs"] == ["scr_mini@v26.0609"]


def test_show_score_true_keeps_both(schemas_dir):
    rt = _run(schemas_dir, show_score=True)
    assert {s["id"] for s in rt["scores"]} == {"mini_total", "mini_label"}
    assert "stripped_scorer_refs" not in rt["provenance"]


def test_disable_in_session_scoring_strips_all(schemas_dir):
    rt = _run(schemas_dir, disable_in_session_scoring=True)
    assert rt["scores"] == []
    assert rt["logic"] == []
    assert rt["provenance"]["stripped_logic_rule_ids"] == ["branch_high"]


def test_pt_locale_runtime(schemas_dir):
    policy = RuntimePolicy(scorer_impl_preference=["wasm", "http"])
    rt = denormalise(
        mini_phq.questionnaire(), locale="pt", runtime_policy=policy,
        viewer_manifest=mini_phq.VIEWER_MANIFEST, resolve_entity=mini_phq.resolve_entity,
        generated_at="2026-06-10T12:00:00Z", schemas_dir=schemas_dir,
    )
    prompt = rt["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["content"]["pt"]["text"] == "Pouco interesse ou prazer em fazer as coisas"
    assert rt["metadata"]["language"] == "pt"

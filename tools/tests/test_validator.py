"""Tests for the schema validator harness.

These tests build tiny in-memory schemas and instances; they don't depend
on the actual Schemas 1 and 2 being authored yet.
"""
import json
from pathlib import Path

import pytest

from tools.validate_schemas import (
    discover_examples,
    load_schema,
    validate_instance,
    main,
    walk_library_examples,
    check_score_paths,
    check_scorer_conformance,
    check_stimulus_id_decomposable,
    check_scorer_outputs_against_schema,
    check_pinned_scorer_consistency,
    check_runtime_provenance_completeness,
)


@pytest.fixture
def tmp_schemas_dir(tmp_path):
    """A throwaway schemas/ tree with one minimal schema + one example."""
    schemas = tmp_path / "schemas"
    inst = schemas / "instrument"
    (inst / "examples").mkdir(parents=True)

    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://behaverse.org/schemas/instrument/v26.0528/schema.json",
        "type": "object",
        "required": ["id"],
        "properties": {"id": {"type": "string"}},
        "additionalProperties": False,
    }
    (inst / "schema.json").write_text(json.dumps(schema))

    valid = {"id": "qst_ok"}
    (inst / "examples" / "ok.json").write_text(json.dumps(valid))

    invalid = {"id": 42}
    (inst / "examples" / "bad.json").write_text(json.dumps(invalid))

    return schemas


def test_load_schema_returns_dict(tmp_schemas_dir):
    schema = load_schema(tmp_schemas_dir / "instrument" / "schema.json")
    assert schema["$id"].endswith("/instrument/v26.0528/schema.json")


def test_discover_examples_finds_each_file(tmp_schemas_dir):
    examples = discover_examples(tmp_schemas_dir)
    paths = {p.name for (_, p) in examples}
    assert paths == {"ok.json", "bad.json"}


def test_validate_instance_passes_valid(tmp_schemas_dir):
    schema = load_schema(tmp_schemas_dir / "instrument" / "schema.json")
    instance = json.loads(
        (tmp_schemas_dir / "instrument" / "examples" / "ok.json").read_text()
    )
    errors = validate_instance(schema, instance)
    assert errors == []


def test_validate_instance_returns_errors_on_invalid(tmp_schemas_dir):
    schema = load_schema(tmp_schemas_dir / "instrument" / "schema.json")
    instance = json.loads(
        (tmp_schemas_dir / "instrument" / "examples" / "bad.json").read_text()
    )
    errors = validate_instance(schema, instance)
    assert len(errors) >= 1
    assert any("integer" in e or "type" in e for e in errors)


def test_main_exits_nonzero_when_any_example_invalid(tmp_schemas_dir, capsys):
    with pytest.raises(SystemExit) as exc:
        main(tmp_schemas_dir)
    assert exc.value.code == 1
    out = capsys.readouterr().out
    assert "FAIL" in out
    assert "PASS" in out  # the ok.json still passes


def test_load_schema_raises_with_path_on_malformed_json(tmp_path):
    bad = tmp_path / "bad.json"
    bad.write_text("{this is not json")
    with pytest.raises(ValueError, match=str(bad)):
        load_schema(bad)


def test_walk_library_examples_finds_per_entity_files(tmp_path):
    """Library example files under examples/library_examples/<type>/*.json
    validate against the right $def, across multiple entity types."""
    import json
    from tools.validate_schemas import walk_library_examples
    schemas = tmp_path / "schemas"
    q = schemas / "questionnaire"

    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://behaverse.org/schemas/questionnaire/v26.0602/schema.json",
        "type": "object",
        "$defs": {
            "Message": {
                "type": "object",
                "required": ["id"],
                "properties": {"id": {"type": "string", "pattern": "^msg_"}}
            },
            "Subscale": {
                "type": "object",
                "required": ["id"],
                "properties": {"id": {"type": "string", "pattern": "^scl_"}}
            },
            "Scorer": {
                "type": "object",
                "required": ["id"],
                "properties": {"id": {"type": "string", "pattern": "^scr_"}}
            }
        }
    }
    (q).mkdir(parents=True)
    (q / "schema.json").write_text(json.dumps(schema))

    (q / "examples" / "library_examples" / "messages").mkdir(parents=True)
    (q / "examples" / "library_examples" / "messages" / "msg_ok.json").write_text(
        json.dumps({"id": "msg_ok"})
    )
    (q / "examples" / "library_examples" / "messages" / "msg_bad.json").write_text(
        json.dumps({"id": "not_msg_prefix"})
    )

    (q / "examples" / "library_examples" / "subscales").mkdir(parents=True)
    (q / "examples" / "library_examples" / "subscales" / "scl_ok.json").write_text(
        json.dumps({"id": "scl_ok"})
    )

    (q / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (q / "examples" / "library_examples" / "scorers" / "scr_ok.json").write_text(
        json.dumps({"id": "scr_ok"})
    )

    results = walk_library_examples(schemas)
    paths = {p.name: errors for (p, _, errors) in results}
    assert paths["msg_ok.json"] == []
    assert len(paths["msg_bad.json"]) >= 1
    assert paths["scl_ok.json"] == []
    assert paths["scr_ok.json"] == []


def test_check_score_paths_passes_for_valid(tmp_path):
    schemas = tmp_path / "schemas"
    q = schemas / "questionnaire"
    (q / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (q / "examples" / "library_examples" / "scorers" / "scr_x.json").write_text(json.dumps({
        "id": "scr_x",
        "output_schema": {
            "type": "object",
            "properties": {
                "total": {"type": "integer"},
                "band":  {"type": "object", "properties": {"label": {"type": "string"}}}
            }
        }
    }))
    (q / "examples" / "qst.json").write_text(json.dumps({
        "scores": [
            {"id": "t", "scorer": "scr_x@v26.0602", "path": "/total"},
            {"id": "l", "scorer": "scr_x@v26.0602", "path": "/band/label"}
        ]
    }))
    results = check_score_paths(schemas)
    # qst.json was checked
    assert len(results) >= 1
    assert any(p.name == "qst.json" and errs == [] for (p, _, errs) in results)


def test_check_score_paths_reports_unresolved_scorer(tmp_path):
    schemas = tmp_path / "schemas"
    q = schemas / "questionnaire"
    (q / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (q / "examples" / "qst.json").write_text(json.dumps({
        "scores": [
            {"id": "t", "scorer": "scr_missing@v26.0602", "path": "/total"}
        ]
    }))
    results = check_score_paths(schemas)
    qst_results = [r for r in results if r[0].name == "qst.json"]
    assert len(qst_results) == 1
    errs = qst_results[0][2]
    assert any("UNRESOLVED_SCORER" in e for e in errs)


def test_check_score_paths_reports_path_not_found(tmp_path):
    schemas = tmp_path / "schemas"
    q = schemas / "questionnaire"
    (q / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (q / "examples" / "library_examples" / "scorers" / "scr_x.json").write_text(json.dumps({
        "id": "scr_x",
        "output_schema": {"type": "object", "properties": {"total": {"type": "integer"}}}
    }))
    (q / "examples" / "qst.json").write_text(json.dumps({
        "scores": [{"id": "t", "scorer": "scr_x@v26.0602", "path": "/nonexistent"}]
    }))
    results = check_score_paths(schemas)
    qst_results = [r for r in results if r[0].name == "qst.json"]
    errs = qst_results[0][2]
    assert any("PATH_NOT_FOUND" in e for e in errs)


def test_check_scorer_conformance_skips_all(tmp_path):
    schemas = tmp_path / "schemas"
    q = schemas / "questionnaire"
    (q / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (q / "examples" / "library_examples" / "scorers" / "scr_x.json").write_text(json.dumps({
        "id": "scr_x",
        "implementations": [{"kind": "http", "url": "https://x.example.org"}],
        "test_cases": [
            {"name": "case-1", "input": {}, "expected": {}},
            {"name": "case-2", "input": {}, "expected": {}}
        ]
    }))
    results = check_scorer_conformance(schemas)
    assert len(results) == 1
    scorer_path, statuses = results[0]
    assert all(s["status"] == "SKIPPED" for s in statuses)
    assert len(statuses) == 2  # 1 impl × 2 test cases


def test_check_stimulus_id_decomposable_passes_valid(tmp_path):
    import json
    schemas = tmp_path / "schemas"
    (schemas / "response" / "examples").mkdir(parents=True)
    (schemas / "response" / "examples" / "ok.json").write_text(json.dumps({
        "responses": [
            {"stimulus_id": "pr_phq9_1"},
            {"stimulus_id": "ctx_intro+ins_likert+pr_phq9_2"},
            {"stimulus_id": "msg_welcome"}
        ]
    }))
    results = check_stimulus_id_decomposable(schemas)
    assert all(errs == [] for (_, _, errs) in results)


def test_check_stimulus_id_decomposable_reports_malformed(tmp_path):
    import json
    schemas = tmp_path / "schemas"
    (schemas / "response" / "examples").mkdir(parents=True)
    (schemas / "response" / "examples" / "bad.json").write_text(json.dumps({
        "responses": [{"stimulus_id": "xyz_phq9_1"}]
    }))
    results = check_stimulus_id_decomposable(schemas)
    errs = results[0][2]
    assert any("STIMULUS_ID_MALFORMED" in e for e in errs)


def test_check_scorer_outputs_validates(tmp_path):
    import json
    schemas = tmp_path / "schemas"
    (schemas / "questionnaire" / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (schemas / "questionnaire" / "examples" / "library_examples" / "scorers" / "scr_x.json").write_text(json.dumps({
        "id": "scr_x",
        "output_schema": {
            "type": "object",
            "properties": {"total": {"type": "integer"}},
            "required": ["total"]
        }
    }))
    (schemas / "session" / "examples").mkdir(parents=True)
    (schemas / "session" / "examples" / "ok.json").write_text(json.dumps({
        "scorer_outputs": {"scr_x@v26.0603": {"total": 5}}
    }))
    results = check_scorer_outputs_against_schema(schemas)
    assert all(errs == [] for (_, _, errs) in results)


def test_check_scorer_outputs_reports_unresolved(tmp_path):
    import json
    schemas = tmp_path / "schemas"
    (schemas / "questionnaire" / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (schemas / "session" / "examples").mkdir(parents=True)
    (schemas / "session" / "examples" / "ok.json").write_text(json.dumps({
        "scorer_outputs": {"scr_missing@v26.0603": {"total": 5}}
    }))
    results = check_scorer_outputs_against_schema(schemas)
    errs = results[0][2]
    assert any("UNRESOLVED_SCORER" in e for e in errs)


def test_check_pinned_scorer_consistency_valid(tmp_path):
    import json
    from tools.validate_schemas import check_pinned_scorer_consistency
    schemas = tmp_path / "schemas"
    (schemas / "questionnaire" / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (schemas / "questionnaire" / "examples" / "library_examples" / "scorers" / "scr_x.json").write_text(json.dumps({
        "id": "scr_x",
        "implementations": [{"kind": "wasm", "url": "x", "sha256": "a"}, {"kind": "http", "url": "y"}]
    }))
    (schemas / "runtime" / "examples").mkdir(parents=True)
    (schemas / "runtime" / "examples" / "ok.json").write_text(json.dumps({
        "scores": [{"id": "x", "scorer": "scr_x@v26.0603", "path": "/total", "impl": {"kind": "wasm"}}]
    }))
    results = check_pinned_scorer_consistency(schemas)
    assert all(errs == [] for (_, _, errs) in results)


def test_check_pinned_scorer_consistency_kind_mismatch(tmp_path):
    import json
    from tools.validate_schemas import check_pinned_scorer_consistency
    schemas = tmp_path / "schemas"
    (schemas / "questionnaire" / "examples" / "library_examples" / "scorers").mkdir(parents=True)
    (schemas / "questionnaire" / "examples" / "library_examples" / "scorers" / "scr_x.json").write_text(json.dumps({
        "id": "scr_x",
        "implementations": [{"kind": "wasm"}]
    }))
    (schemas / "runtime" / "examples").mkdir(parents=True)
    (schemas / "runtime" / "examples" / "bad.json").write_text(json.dumps({
        "scores": [{"id": "x", "scorer": "scr_x@v26.0603", "path": "/total", "impl": {"kind": "http"}}]
    }))
    results = check_pinned_scorer_consistency(schemas)
    errs = results[0][2]
    assert any("IMPL_KIND_NOT_DECLARED" in e for e in errs)


def test_check_runtime_provenance_completeness_valid(tmp_path):
    import json
    from tools.validate_schemas import check_runtime_provenance_completeness
    schemas = tmp_path / "schemas"
    (schemas / "runtime" / "examples").mkdir(parents=True)
    (schemas / "runtime" / "examples" / "ok.json").write_text(json.dumps({
        "provenance": {
            "source_questionnaire_id":        "qst_x",
            "source_questionnaire_version":   "v26.0602",
            "locale":                         "en",
            "viewer_conformance_hash":        "a" * 64,
            "deployment_runtime_policy_hash": "b" * 64,
            "generated_at":                   "2026-06-03T14:30:00Z",
            "denormaliser_version":           "v26.0603"
        }
    }))
    results = check_runtime_provenance_completeness(schemas)
    assert all(errs == [] for (_, _, errs) in results)


def test_check_runtime_provenance_completeness_missing_fields(tmp_path):
    import json
    from tools.validate_schemas import check_runtime_provenance_completeness
    schemas = tmp_path / "schemas"
    (schemas / "runtime" / "examples").mkdir(parents=True)
    (schemas / "runtime" / "examples" / "bad.json").write_text(json.dumps({
        "provenance": {
            "source_questionnaire_id": "qst_x",
            "locale":                  "en"
        }
    }))
    results = check_runtime_provenance_completeness(schemas)
    errs = results[0][2]
    assert any("PROVENANCE_MISSING" in e for e in errs)

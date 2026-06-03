"""Tests for Schema 3 (Questionnaire Runtime, v26.0603)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "runtime" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0603(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/runtime/v26.0603/schema.json"


def _minimal_provenance():
    return {
        "source_questionnaire_id":       "qst_x",
        "source_questionnaire_version":  "v26.0602",
        "locale":                        "en",
        "viewer_conformance_hash":       "a" * 64,
        "deployment_runtime_policy_hash":"b" * 64,
        "generated_at":                  "2026-06-03T14:30:00Z",
        "denormaliser_version":          "v26.0603"
    }


def _minimal_runtime():
    return {
        "provenance": _minimal_provenance(),
        "metadata":   {"id": "qst_x", "title": "X", "language": "en"},
        "pages":      [{"id": "page_only", "elements": []}]
    }


def test_minimal_runtime_validates(schema):
    Draft202012Validator(schema).validate(_minimal_runtime())


def test_runtime_full_runtime(schema):
    instance = _minimal_runtime()
    instance["locale"] = "en"
    instance["scores"] = [{
        "id":     "phq9_total",
        "scorer": "scr_phq9@v26.0602",
        "path":   "/total",
        "impl":   {"kind": "wasm", "url": "https://x.example.org/s.wasm", "sha256": "0" * 64}
    }]
    instance["lock_show_score_timing"] = True
    Draft202012Validator(schema).validate(instance)


def test_runtime_requires_provenance(schema):
    bad = {"metadata": {"id": "qst_x", "title": "X", "language": "en"}, "pages": [{}]}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("provenance" in e.message for e in errors)


def test_runtime_provenance_requires_hashes(schema):
    bad = _minimal_runtime()
    bad["provenance"] = {k: v for k, v in bad["provenance"].items()
                         if k not in {"viewer_conformance_hash", "deployment_runtime_policy_hash"}}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("viewer_conformance_hash" in e.message or "deployment_runtime_policy_hash" in e.message for e in errors)


def test_runtime_provenance_hash_format(schema):
    bad = _minimal_runtime()
    bad["provenance"]["viewer_conformance_hash"] = "not-a-hash"
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("does not match" in e.message.lower() or "pattern" in e.message.lower() for e in errors)


def test_runtime_pinned_score_requires_impl(schema):
    bad = _minimal_runtime()
    bad["scores"] = [{"id": "x", "scorer": "scr_x@v26.0602", "path": "/total"}]
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("impl" in e.message for e in errors)


def test_runtime_pinned_impl_kinds(schema):
    impls = [
        {"kind": "wasm",   "url": "https://x.example.org/s.wasm", "sha256": "0" * 64},
        {"kind": "http",   "url": "https://x.example.org/scorer"},
        {"kind": "python", "package": "behaverse-scorer-phq9==26.0602"},
        {"kind": "r",      "package": "behaverse-scorer-phq9"}
    ]
    for impl in impls:
        instance = _minimal_runtime()
        instance["scores"] = [{"id": "x", "scorer": "scr_x@v26.0602", "path": "/total", "impl": impl}]
        Draft202012Validator(schema).validate(instance)


def test_runtime_unknown_root_property_rejected(schema):
    bad = _minimal_runtime()
    bad["unknown_root"] = "x"
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any(
        "additional" in e.message.lower() or "does not match" in e.message.lower()
        for e in errors
    )


def test_runtime_x_prefixed_extension_allowed(schema):
    instance = _minimal_runtime()
    instance["x_lab_field"] = "ok"
    Draft202012Validator(schema).validate(instance)

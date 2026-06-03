"""Tests for Schema 7 (Viewer Conformance Manifest, v26.0603)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "viewer_conformance" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0603(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/viewer_conformance/v26.0603/schema.json"


def test_minimal_manifest_validates(schema):
    Draft202012Validator(schema).validate({
        "viewer_id":         "minimal-viewer",
        "viewer_version":    "v26.0603",
        "schema_support":    { "questionnaire": ["v26.0602"], "instrument": ["v26.0528"] },
        "evaluator":         { "language_version": "v1.0", "functions": ["score"] },
        "widgets":           ["choice.ordinal.single"],
        "scorer_impl_kinds": ["wasm"]
    })


def test_manifest_web_viewer_full(schema):
    instance = {
        "viewer_id":      "behaverse-web-viewer",
        "viewer_version": "v26.0603",
        "viewer_url":     "https://viewers.behaverse.org/web-viewer/v26.0603/conformance.json",
        "schema_support": {
            "questionnaire": ["v26.0528", "v26.0601", "v26.0602"],
            "instrument":    ["v26.0528"],
            "runtime":       ["v26.0603"],
            "response":      ["v26.0603"],
            "session":       ["v26.0603"]
        },
        "evaluator": {
            "language_version": "v1.0",
            "functions":        ["if", "and", "or", "not", "==", "!=", ">=", "<=", "score"]
        },
        "widgets":              ["choice.ordinal.single", "choice.nominal.single"],
        "behavioural_channels": ["response_time", "mouse", "keyboard"],
        "scorer_impl_kinds":    ["wasm", "http"],
        "logic_actions":        ["skip", "visibility", "piping", "branch"],
        "locale_switching":     True,
        "resume":               True,
        "max_session_duration_minutes": 180
    }
    Draft202012Validator(schema).validate(instance)


def test_manifest_viewer_version_pattern(schema):
    bad = {
        "viewer_id":      "x",
        "viewer_version": "1.0",
        "schema_support": {"questionnaire": ["v26.0602"], "instrument": ["v26.0528"]},
        "evaluator":      {"language_version": "v1.0", "functions": ["score"]},
        "widgets":        ["choice.ordinal.single"],
        "scorer_impl_kinds": ["wasm"]
    }
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("does not match" in e.message.lower() or "pattern" in e.message.lower() for e in errors)


def test_manifest_widgets_minItems(schema):
    bad = {
        "viewer_id":      "x",
        "viewer_version": "v26.0603",
        "schema_support": {"questionnaire": ["v26.0602"], "instrument": ["v26.0528"]},
        "evaluator":      {"language_version": "v1.0", "functions": ["score"]},
        "widgets":        [],
        "scorer_impl_kinds": ["wasm"]
    }
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("minItems" in e.message or "non-empty" in e.message.lower() or "too short" in e.message.lower() for e in errors)


def test_manifest_scorer_impl_kinds_enum(schema):
    bad = {
        "viewer_id":      "x",
        "viewer_version": "v26.0603",
        "schema_support": {"questionnaire": ["v26.0602"], "instrument": ["v26.0528"]},
        "evaluator":      {"language_version": "v1.0", "functions": ["score"]},
        "widgets":        ["choice.ordinal.single"],
        "scorer_impl_kinds": ["ruby"]
    }
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_manifest_behavioural_channels_enum(schema):
    bad = {
        "viewer_id":      "x",
        "viewer_version": "v26.0603",
        "schema_support": {"questionnaire": ["v26.0602"], "instrument": ["v26.0528"]},
        "evaluator":      {"language_version": "v1.0", "functions": ["score"]},
        "widgets":              ["choice.ordinal.single"],
        "scorer_impl_kinds":    ["wasm"],
        "behavioural_channels": ["gamepad"]
    }
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_manifest_schema_support_questionnaire_version_pattern(schema):
    bad = {
        "viewer_id":      "x",
        "viewer_version": "v26.0603",
        "schema_support": {"questionnaire": ["1.0.0"], "instrument": ["v26.0528"]},
        "evaluator":      {"language_version": "v1.0", "functions": ["score"]},
        "widgets":        ["choice.ordinal.single"],
        "scorer_impl_kinds": ["wasm"]
    }
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("does not match" in e.message.lower() or "pattern" in e.message.lower() for e in errors)


def test_manifest_unknown_root_property_rejected(schema):
    bad = {
        "viewer_id":      "x",
        "viewer_version": "v26.0603",
        "schema_support": {"questionnaire": ["v26.0602"], "instrument": ["v26.0528"]},
        "evaluator":      {"language_version": "v1.0", "functions": ["score"]},
        "widgets":           ["choice.ordinal.single"],
        "scorer_impl_kinds": ["wasm"],
        "unknown_field":     "x"
    }
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("additional" in e.message.lower() or "does not match" in e.message.lower() for e in errors)


def test_manifest_x_prefixed_extension_allowed(schema):
    instance = {
        "viewer_id":      "x",
        "viewer_version": "v26.0603",
        "schema_support": {"questionnaire": ["v26.0602"], "instrument": ["v26.0528"]},
        "evaluator":      {"language_version": "v1.0", "functions": ["score"]},
        "widgets":           ["choice.ordinal.single"],
        "scorer_impl_kinds": ["wasm"],
        "x_release_channel": "stable"
    }
    Draft202012Validator(schema).validate(instance)

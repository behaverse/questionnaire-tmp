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

"""Tests for schemas/instrument/schema.json.

Each fixture builds the smallest variation that exercises one decision.
The schema file grows task-by-task; tests grow with it.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from tools.validate_schemas import load_schema, validate_instance


REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = REPO_ROOT / "schemas" / "instrument" / "schema.json"


@pytest.fixture(scope="module")
def schema() -> dict:
    return load_schema(SCHEMA_PATH)


# ---------- required-floor tests ----------

def test_minimal_valid_instrument(schema):
    instance = {
        "id": "qst_minimal",
        "title": "Minimal instrument",
        "description": "Smallest valid instrument for testing.",
        "language": "en",
    }
    assert validate_instance(schema, instance) == []


def test_missing_id_fails(schema):
    instance = {"title": "X", "description": "Y", "language": "en"}
    errors = validate_instance(schema, instance)
    assert any("id" in e for e in errors)


def test_missing_title_fails(schema):
    instance = {"id": "qst_x", "description": "Y", "language": "en"}
    errors = validate_instance(schema, instance)
    assert any("title" in e for e in errors)


def test_missing_description_fails(schema):
    instance = {"id": "qst_x", "title": "Y", "language": "en"}
    errors = validate_instance(schema, instance)
    assert any("description" in e for e in errors)


def test_missing_language_fails(schema):
    instance = {"id": "qst_x", "title": "Y", "description": "Z"}
    errors = validate_instance(schema, instance)
    assert any("language" in e for e in errors)


# ---------- id prefix tests ----------

def test_id_permissive_prefix_accepts_tsk(schema):
    instance = {
        "id": "tsk_n_back",
        "title": "N-back task",
        "description": "Working-memory paradigm.",
        "language": "en",
    }
    assert validate_instance(schema, instance) == []


def test_id_with_uppercase_letters_fails(schema):
    instance = {
        "id": "QST_phq9",
        "title": "X", "description": "Y", "language": "en",
    }
    errors = validate_instance(schema, instance)
    assert any("id" in e for e in errors)


def test_id_without_underscore_fails(schema):
    instance = {
        "id": "phq9",
        "title": "X", "description": "Y", "language": "en",
    }
    errors = validate_instance(schema, instance)
    assert any("id" in e for e in errors)


# ---------- BCP-47 LanguageCode tests ----------

def test_language_en_passes(schema):
    instance = {"id": "qst_x", "title": "X", "description": "Y", "language": "en"}
    assert validate_instance(schema, instance) == []


def test_language_pt_br_passes(schema):
    instance = {"id": "qst_x", "title": "X", "description": "Y", "language": "pt-BR"}
    assert validate_instance(schema, instance) == []


def test_language_zh_hans_passes(schema):
    instance = {"id": "qst_x", "title": "X", "description": "Y", "language": "zh-Hans"}
    assert validate_instance(schema, instance) == []


def test_language_zh_hans_cn_passes(schema):
    instance = {"id": "qst_x", "title": "X", "description": "Y", "language": "zh-Hans-CN"}
    assert validate_instance(schema, instance) == []


def test_language_uppercase_base_fails(schema):
    instance = {"id": "qst_x", "title": "X", "description": "Y", "language": "EN"}
    errors = validate_instance(schema, instance)
    assert any("language" in e for e in errors)


def test_language_with_region_lowercase_fails(schema):
    instance = {"id": "qst_x", "title": "X", "description": "Y", "language": "pt-br"}
    errors = validate_instance(schema, instance)
    assert any("language" in e for e in errors)

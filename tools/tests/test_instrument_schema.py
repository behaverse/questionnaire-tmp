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


# ---------- optional fields ----------

def test_short_title_accepted(schema):
    instance = {
        "id": "qst_phq9", "title": "PHQ-9", "description": "X", "language": "en",
        "short_title": "PHQ-9",
    }
    assert validate_instance(schema, instance) == []


def test_version_valid(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "version": "v26.0528",
    }
    assert validate_instance(schema, instance) == []


def test_version_dev_suffix_valid(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "version": "v26.0528.dev2",
    }
    assert validate_instance(schema, instance) == []


def test_version_semver_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "version": "1.0.0",
    }
    errors = validate_instance(schema, instance)
    assert any("version" in e for e in errors)


def test_authors_minimal(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "authors": [{"name": "Aaron T. Beck"}],
    }
    assert validate_instance(schema, instance) == []


def test_authors_full(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "authors": [{
            "name": "Aaron T. Beck",
            "orcid": "0000-0001-2345-678X",
            "affiliation": "University of Pennsylvania",
            "email": "beck@example.edu",
        }],
    }
    assert validate_instance(schema, instance) == []


def test_authors_missing_name_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "authors": [{"orcid": "0000-0001-2345-6789"}],
    }
    errors = validate_instance(schema, instance)
    assert any("name" in e for e in errors)


def test_authors_bad_orcid_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "authors": [{"name": "X", "orcid": "not-an-orcid"}],
    }
    errors = validate_instance(schema, instance)
    assert any("orcid" in e for e in errors)


def test_available_languages_accepts_bcp47_mix(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "available_languages": ["en", "pt", "pt-BR", "zh-Hans"],
    }
    assert validate_instance(schema, instance) == []


def test_available_languages_rejects_duplicates(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "available_languages": ["en", "en"],
    }
    errors = validate_instance(schema, instance)
    assert any("unique" in e.lower() or "duplicate" in e.lower() for e in errors)


def test_timestamps_iso8601(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "timestamps": {
            "created": "2026-01-15T10:00:00Z",
            "modified": "2026-05-28T14:30:00Z",
        },
    }
    assert validate_instance(schema, instance) == []

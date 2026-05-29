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


# ---------- publication ----------

def test_publication_with_required_inner_fields(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "publication": {
            "year": 2001,
            "citation": "Kroenke K et al. PHQ-9. J Gen Intern Med. 2001;16:606.",
        },
    }
    assert validate_instance(schema, instance) == []


def test_publication_full(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "publication": {
            "year": 2001,
            "citation": "Kroenke K et al.",
            "doi": "10.1046/j.1525-1497.2001.016009606.x",
            "isbn": "978-0-1234-5678-9",
            "publisher": "Pfizer Inc.",
            "url": "https://example.org/phq9",
        },
    }
    assert validate_instance(schema, instance) == []


def test_publication_missing_year_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "publication": {"citation": "X"},
    }
    errors = validate_instance(schema, instance)
    assert any("year" in e for e in errors)


def test_publication_missing_citation_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "publication": {"year": 2001},
    }
    errors = validate_instance(schema, instance)
    assert any("citation" in e for e in errors)


def test_publication_license_field_rejected(schema):
    """publication.license is removed; it duplicates top-level license."""
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "publication": {
            "year": 2001, "citation": "X",
            "license": "cc_by",
        },
    }
    errors = validate_instance(schema, instance)
    assert any("license" in e for e in errors)


def test_publication_bad_doi_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "publication": {"year": 2001, "citation": "X", "doi": "not-a-doi"},
    }
    errors = validate_instance(schema, instance)
    assert any("doi" in e for e in errors)


def test_publication_year_out_of_range_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "publication": {"year": 1500, "citation": "X"},
    }
    errors = validate_instance(schema, instance)
    assert any("year" in e or "minimum" in e for e in errors)


# ---------- license vocabulary ----------

@pytest.mark.parametrize("license_tag", [
    "public_domain", "cc0", "cc_by", "cc_by_nc", "cc_by_sa",
    "proprietary_open_redistribution", "proprietary_restricted",
    "unknown", "mixed_see_components",
])
def test_license_enum_accepts(schema, license_tag):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "license": license_tag,
    }
    assert validate_instance(schema, instance) == []


def test_license_enum_rejects_unknown_value(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "license": "MIT",
    }
    errors = validate_instance(schema, instance)
    assert any("license" in e for e in errors)


# ---------- usage, provenance ----------

def test_usage_full(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "usage": {
            "requires_permission": True,
            "cost": "paid",
            "clinical_use_only": False,
            "training_required": False,
        },
    }
    assert validate_instance(schema, instance) == []


def test_usage_cost_enum_rejects(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "usage": {"cost": "expensive"},
    }
    errors = validate_instance(schema, instance)
    assert any("cost" in e for e in errors)


def test_provenance_imported(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "provenance": {
            "source": "survey_database/2025",
            "source_version": "v25.0901",
            "imported_at": "2026-05-01T08:00:00Z",
            "imported_by": "migration-bot",
        },
    }
    assert validate_instance(schema, instance) == []


# ---------- classification ----------

def test_classification_full(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "classification": {
            "domain": ["depression", "screening"],
            "population": ["adults", "primary_care"],
            "tags": ["self-report", "9-item"],
            "age_range": [18, 99],
            "administration_mode": ["self_report"],
        },
    }
    assert validate_instance(schema, instance) == []


def test_classification_domain_open(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "classification": {"domain": ["emerging_novel_construct"]},
    }
    assert validate_instance(schema, instance) == []


def test_classification_administration_mode_closed(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "classification": {"administration_mode": ["telepathic"]},
    }
    errors = validate_instance(schema, instance)
    assert any("administration_mode" in e or "enum" in e for e in errors)


@pytest.mark.parametrize("mode", [
    "self_report", "interviewer", "observer", "informant", "performance"
])
def test_classification_administration_mode_each_value(schema, mode):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "classification": {"administration_mode": [mode]},
    }
    assert validate_instance(schema, instance) == []


def test_classification_age_range_tuple(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "classification": {"age_range": [18, 99]},
    }
    assert validate_instance(schema, instance) == []


def test_classification_age_range_wrong_length_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "classification": {"age_range": [18, 99, 120]},
    }
    errors = validate_instance(schema, instance)
    assert any("age_range" in e or "items" in e.lower() for e in errors)


def test_classification_age_range_out_of_bounds_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "classification": {"age_range": [18, 200]},
    }
    errors = validate_instance(schema, instance)
    assert any("age_range" in e or "maximum" in e for e in errors)


# ---------- psychometrics ----------

def test_psychometrics_full(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "psychometrics": {
            "item_count": 9,
            "estimated_minutes": 5,
            "reliability": [
                {"type": "cronbach_alpha", "value": 0.89, "population": "primary care",
                 "sample_size": 6000, "ci_lower": 0.85, "ci_upper": 0.93,
                 "citation": "Kroenke 2001"}
            ],
            "validity": [
                {"type": "criterion_concurrent", "value": 0.71, "comparator": "HAM-D"}
            ],
            "norms": [
                {"population": "primary_care", "n": 6000, "mean": 6.5, "sd": 5.5,
                 "median": 5, "percentiles": {"p25": 3, "p50": 5, "p75": 9, "p95": 17}}
            ],
        },
    }
    assert validate_instance(schema, instance) == []


def test_psychometrics_reliability_requires_type_and_value(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "psychometrics": {"reliability": [{"population": "X"}]},
    }
    errors = validate_instance(schema, instance)
    assert any("type" in e or "value" in e for e in errors)


def test_psychometrics_open_reliability_type(schema):
    """Emerging methods like 'mcdonald_omega' should pass."""
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "psychometrics": {
            "reliability": [{"type": "mcdonald_omega", "value": 0.92}],
        },
    }
    assert validate_instance(schema, instance) == []


def test_psychometrics_norms_require_population(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "psychometrics": {"norms": [{"mean": 5, "sd": 3}]},
    }
    errors = validate_instance(schema, instance)
    assert any("population" in e for e in errors)


def test_psychometrics_percentile_keys_pattern(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "psychometrics": {
            "norms": [{"population": "X", "percentiles": {"p_25": 3}}]
        },
    }
    errors = validate_instance(schema, instance)
    assert len(errors) >= 1


# ---------- inline translations on Instrument ----------

def test_translations_pt_validated(schema):
    instance = {
        "id": "qst_x", "title": "Test", "description": "D", "language": "en",
        "translations": {
            "pt": {
                "status": "validated",
                "fields": {"title": "Teste", "description": "D-pt"},
            }
        },
    }
    assert validate_instance(schema, instance) == []


def test_translations_bcp47_key_pt_br(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "translations": {
            "pt-BR": {"status": "draft", "fields": {"title": "Teste BR"}},
        },
    }
    assert validate_instance(schema, instance) == []


def test_translations_invalid_status_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "translations": {
            "pt": {"status": "approved", "fields": {}},
        },
    }
    errors = validate_instance(schema, instance)
    assert any("status" in e or "enum" in e for e in errors)


def test_translations_missing_status_fails(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "translations": {
            "pt": {"fields": {"title": "Teste"}},
        },
    }
    errors = validate_instance(schema, instance)
    assert any("status" in e for e in errors)


def test_translations_bad_lang_key_rejected(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "translations": {
            "EN": {"status": "validated", "fields": {}},
        },
    }
    errors = validate_instance(schema, instance)
    assert len(errors) >= 1


# ---------- extensions + x_ policy ----------

def test_extensions_object_accepted(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "extensions": {"any": "thing", "even": {"nested": 42}},
    }
    assert validate_instance(schema, instance) == []


def test_x_prefix_field_accepted(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "x_internal_note": "private",
    }
    assert validate_instance(schema, instance) == []


def test_unknown_top_level_field_rejected(schema):
    instance = {
        "id": "qst_x", "title": "T", "description": "D", "language": "en",
        "autors": [{"name": "Beck"}],  # typo
    }
    errors = validate_instance(schema, instance)
    assert any("autors" in e or "Additional" in e for e in errors)

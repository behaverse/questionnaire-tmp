"""Tests for schemas/questionnaire/schema.json.

The schema embeds Instrument metadata via cross-schema $ref. Tests rely
on the validator harness's local URI resolver.
"""
from __future__ import annotations

from pathlib import Path

import pytest

from tools.validate_schemas import build_registry, load_schema, validate_instance


REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMAS_ROOT = REPO_ROOT / "schemas"
SCHEMA_PATH = SCHEMAS_ROOT / "questionnaire" / "schema.json"


@pytest.fixture(scope="module")
def schema() -> dict:
    return load_schema(SCHEMA_PATH)


@pytest.fixture(scope="module")
def registry():
    return build_registry(SCHEMAS_ROOT)


def base_metadata() -> dict:
    return {
        "id": "qst_test",
        "title": "Test Questionnaire",
        "description": "Smallest valid questionnaire for unit tests.",
        "language": "en",
    }


def radio_question(qid: str = "q_test", prompt: str = "Test?") -> dict:
    return {
        "id": qid,
        "type": "radio",
        "prompt": prompt,
        "properties": {
            "option_set": {
                "options": [
                    {"value": 0, "text": "No"},
                    {"value": 1, "text": "Yes"},
                ]
            }
        },
    }


# ---------- minimal valid questionnaire ----------

def test_minimal_valid_questionnaire(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [
            {"id": "page_only", "entries": [radio_question()]}
        ],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_missing_metadata_fails(schema, registry):
    instance = {"pages": [{"id": "page_only", "entries": [radio_question()]}]}
    errors = validate_instance(schema, instance, registry=registry)
    assert any("metadata" in e for e in errors)


def test_missing_pages_fails(schema, registry):
    instance = {"metadata": base_metadata()}
    errors = validate_instance(schema, instance, registry=registry)
    assert any("pages" in e for e in errors)


def test_empty_pages_fails(schema, registry):
    instance = {"metadata": base_metadata(), "pages": []}
    errors = validate_instance(schema, instance, registry=registry)
    assert any("page" in e.lower() or "minItems" in e for e in errors)


# ---------- metadata.id is narrowed to qst_* ----------

def test_metadata_id_must_be_qst_prefix(schema, registry):
    md = base_metadata()
    md["id"] = "tsk_n_back"  # valid in Instrument; rejected in Questionnaire
    instance = {
        "metadata": md,
        "pages": [{"id": "page_only", "entries": [radio_question()]}],
    }
    errors = validate_instance(schema, instance, registry=registry)
    assert any("id" in e or "qst_" in e for e in errors)


# ---------- page structural rules ----------

def test_page_requires_id_and_entries(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"entries": [radio_question()]}],
    }
    errors = validate_instance(schema, instance, registry=registry)
    assert any("id" in e for e in errors)


def test_page_id_pattern(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "PAGE_X", "entries": [radio_question()]}],
    }
    errors = validate_instance(schema, instance, registry=registry)
    assert len(errors) >= 1


# ---------- radio question shape ----------

def test_radio_question_with_inline_option_set(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "entries": [radio_question()]}],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_radio_question_missing_prompt_fails(schema, registry):
    bad = radio_question()
    del bad["prompt"]
    instance = {"metadata": base_metadata(), "pages": [{"id": "page_x", "entries": [bad]}]}
    errors = validate_instance(schema, instance, registry=registry)
    # Under a oneOf discriminator the top-level error reports "not valid under any of the
    # given schemas" rather than naming the missing field directly; both forms are acceptable.
    assert any("prompt" in e or "not valid" in e or "oneOf" in e for e in errors)


def test_radio_question_missing_options_fails(schema, registry):
    bad = {"id": "q_x", "type": "radio", "prompt": "?", "properties": {}}
    instance = {"metadata": base_metadata(), "pages": [{"id": "page_x", "entries": [bad]}]}
    errors = validate_instance(schema, instance, registry=registry)
    # Under a oneOf discriminator the top-level error reports "not valid under any of the
    # given schemas" rather than naming the missing field directly; both forms are acceptable.
    assert any("option_set" in e or "required" in e or "not valid" in e or "oneOf" in e for e in errors)


# ---------- non-radio Question types ----------

def _wrap(question: dict) -> dict:
    return {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "entries": [question]}],
    }


def test_text_question(schema, registry):
    q = {"id": "q_name", "type": "text", "prompt": "Your name?",
         "properties": {"placeholder": "Full name"}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_textarea_question(schema, registry):
    q = {"id": "q_essay", "type": "textarea", "prompt": "Describe.",
         "properties": {"rows": 5}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_checkbox_question_inline_options(schema, registry):
    q = {"id": "q_topics", "type": "checkbox", "prompt": "Topics:",
         "properties": {"option_set": {
             "options": [{"value": "a", "text": "A"}, {"value": "b", "text": "B"}]
         }}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_slider_question(schema, registry):
    q = {"id": "q_mood", "type": "slider", "prompt": "Mood?",
         "properties": {"min": 0, "max": 100, "step": 1,
                        "anchors": [{"value": 0, "label": "Low"},
                                    {"value": 100, "label": "High"}]}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_ranking_question(schema, registry):
    q = {"id": "q_pref", "type": "ranking", "prompt": "Rank these:",
         "properties": {"option_set": {
             "options": [{"value": "a", "text": "A"}, {"value": "b", "text": "B"},
                         {"value": "c", "text": "C"}]
         }}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_date_question(schema, registry):
    q = {"id": "q_dob", "type": "date", "prompt": "Date of birth?",
         "properties": {"granularity": "date", "min": "1900-01-01"}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_file_question(schema, registry):
    q = {"id": "q_upload", "type": "file", "prompt": "Upload report:",
         "properties": {"accept": ["application/pdf"], "max_size_mb": 10}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_display_question(schema, registry):
    q = {"id": "q_intro", "type": "display", "prompt": "Welcome.",
         "properties": {"media": {"url": "https://example.org/intro.mp4",
                                  "kind": "video"}}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_question_extension_iri_type(schema, registry):
    q = {"id": "q_nback", "type": "https://behaverse.org/types/n_back",
         "prompt": "N-back task",
         "properties": {"n": 2, "trials": 50}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


def test_question_extension_bad_iri_fails(schema, registry):
    q = {"id": "q_x", "type": "https://example.com/types/foo",
         "prompt": "?", "properties": {}}
    errors = validate_instance(schema, _wrap(q), registry=registry)
    assert len(errors) >= 1


def test_question_unknown_type_fails(schema, registry):
    q = {"id": "q_x", "type": "matrix", "prompt": "?", "properties": {}}
    errors = validate_instance(schema, _wrap(q), registry=registry)
    assert len(errors) >= 1


# ---------- entity references ----------

def test_question_reference_minimal(schema, registry):
    q_ref = {"ref": "q_depression_1@v26.0528"}
    assert validate_instance(schema, _wrap(q_ref), registry=registry) == []


def test_question_reference_with_required_override(schema, registry):
    q_ref = {"ref": "q_depression_1@v26.0528", "required": False}
    assert validate_instance(schema, _wrap(q_ref), registry=registry) == []


def test_question_reference_with_show_if_override(schema, registry):
    q_ref = {"ref": "q_depression_1@v26.0528", "show_if": "q_prev > 2"}
    assert validate_instance(schema, _wrap(q_ref), registry=registry) == []


def test_question_reference_rejects_inline_prompt_override(schema, registry):
    """OD-05: prompt is not overridable on a reference. Schema enforces via additionalProperties:false."""
    q_ref = {"ref": "q_depression_1@v26.0528", "prompt": "override"}
    errors = validate_instance(schema, _wrap(q_ref), registry=registry)
    assert len(errors) >= 1


def test_question_reference_rejects_validation_override(schema, registry):
    q_ref = {"ref": "q_depression_1@v26.0528",
             "validation": {"format": ".*"}}
    errors = validate_instance(schema, _wrap(q_ref), registry=registry)
    assert len(errors) >= 1


def test_question_reference_bad_pattern_fails(schema, registry):
    q_ref = {"ref": "depression_1@v26.0528"}  # missing q_ prefix
    errors = validate_instance(schema, _wrap(q_ref), registry=registry)
    assert len(errors) >= 1


def test_question_reference_missing_version_fails(schema, registry):
    q_ref = {"ref": "q_depression_1"}  # no version
    errors = validate_instance(schema, _wrap(q_ref), registry=registry)
    assert len(errors) >= 1


def test_option_set_reference_in_radio(schema, registry):
    q = {"id": "q_mood", "type": "radio", "prompt": "Mood?",
         "properties": {"option_set": {"ref": "os_likert5@v26.0528"}}}
    assert validate_instance(schema, _wrap(q), registry=registry) == []


# ---------- Section ----------

def test_section_minimal(schema, registry):
    section = {
        "id": "sec_cluster",
        "questions": [radio_question("q_1", "Q1?"), radio_question("q_2", "Q2?")],
    }
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "entries": [section]}],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_section_with_shared_option_set_ref(schema, registry):
    section = {
        "id": "sec_likert",
        "shared_option_set": {"ref": "os_likert5@v26.0528"},
        "questions": [
            {"id": "q_1", "type": "radio", "prompt": "Q1?",
             "properties": {"option_set": {"ref": "os_likert5@v26.0528"}}},
        ],
    }
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "entries": [section]}],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_section_cannot_nest(schema, registry):
    nested = {
        "id": "sec_outer",
        "questions": [
            {"id": "sec_inner", "questions": [radio_question()]}  # not a Question
        ],
    }
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "entries": [nested]}],
    }
    errors = validate_instance(schema, instance, registry=registry)
    assert len(errors) >= 1


# ---------- Block ----------

def test_block_minimal(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [
            {"id": "page_a", "entries": [radio_question()]},
            {"id": "page_b", "entries": [radio_question("q_y", "Q?")]},
        ],
        "blocks": [
            {"id": "blk_main", "page_ids": ["page_a", "page_b"]}
        ],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_block_with_randomize(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [
            {"id": "page_a", "entries": [radio_question()]},
            {"id": "page_b", "entries": [radio_question("q_y", "Q?")]},
        ],
        "blocks": [
            {"id": "blk_main", "page_ids": ["page_a", "page_b"], "randomize": True}
        ],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_block_id_pattern(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_a", "entries": [radio_question()]}],
        "blocks": [{"id": "BLOCK_X", "page_ids": ["page_a"]}],
    }
    errors = validate_instance(schema, instance, registry=registry)
    assert len(errors) >= 1


# ---------- Subscale ----------

def test_subscale_minimal(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "entries": [radio_question("q_a"), radio_question("q_b")]}],
        "subscales": [
            {"id": "scl_total", "name": "Total", "question_ids": ["q_a", "q_b"]}
        ],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_subscale_with_weights(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "entries": [radio_question("q_a"), radio_question("q_b")]}],
        "subscales": [
            {"id": "scl_total", "name": "Total",
             "question_ids": ["q_a", "q_b"],
             "weight_per_question": {"q_a": 1.0, "q_b": 2.0}}
        ],
    }
    assert validate_instance(schema, instance, registry=registry) == []

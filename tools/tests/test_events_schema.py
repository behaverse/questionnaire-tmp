"""Tests for Schema 4a (Event Data, v26.0605)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "events" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0605(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/events/v26.0605/schema.json"


def test_minimal_event_validates(schema):
    instance = {
        "timestamp": "2026-06-05T14:30:00Z",
        "actor":     {"objectType": "bdm:Agent", "id": "agent_001"},
        "verb":      "bdm:initialized",
        "object":    {"objectType": "bdm:RuntimeInstance", "id": "rt_550e8400"}
    }
    Draft202012Validator(schema).validate(instance)


def _minimal_event():
    return {
        "timestamp": "2026-06-05T14:30:00Z",
        "actor":     {"objectType": "bdm:Agent", "id": "agent_001"},
        "verb":      "bdm:initialized",
        "object":    {"objectType": "bdm:RuntimeInstance", "id": "rt_x"}
    }


def _has_validation_error(errors):
    """Return True if any error indicates a value/structure rejection."""
    keywords = ("enum", "is not one of", "additional", "does not match",
                "not valid under any", "required")
    return any(any(kw in e.message.lower() for kw in keywords) for e in errors)


def test_event_actor_objecttype_enum(schema):
    bad = _minimal_event()
    bad["actor"]["objectType"] = "bdm:Robot"
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert _has_validation_error(errors)


def test_event_actor_all_types_valid(schema):
    for atype in ["bdm:Agent", "bdm:Group", "bdm:Engine", "bdm:Orchestrator", "bdm:Researcher"]:
        e = _minimal_event()
        e["actor"]["objectType"] = atype
        Draft202012Validator(schema).validate(e)


def test_event_verb_enum(schema):
    bad = _minimal_event()
    bad["verb"] = "bdm:floogled"
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert _has_validation_error(errors)


def test_event_all_24_verbs_valid(schema):
    verbs = [
        "bdm:initialized", "bdm:started", "bdm:paused", "bdm:resumed",
        "bdm:completed", "bdm:submitted", "bdm:abandoned",
        "bdm:presented",
        "bdm:clicked", "bdm:drag_and_dropped", "bdm:key_pressed", "bdm:typed",
        "bdm:selected", "bdm:deselected", "bdm:adjusted",
        "bdm:got_focus", "bdm:lost_focus", "bdm:consented",
        "bdm:trial_started", "bdm:trial_ended", "bdm:state_changed",
        "bdm:recording_started", "bdm:recording_ended",
        "bdm:navigated"
    ]
    assert len(verbs) == 24
    for v in verbs:
        e = _minimal_event()
        e["verb"] = v
        Draft202012Validator(schema).validate(e)


def test_event_object_objecttype_enum(schema):
    bad = _minimal_event()
    bad["object"]["objectType"] = "bdm:Widget"
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert _has_validation_error(errors)


def test_event_all_15_object_types_valid(schema):
    types = [
        "bdm:RuntimeInstance", "bdm:Screen", "bdm:Panel", "bdm:Stimulus",
        "bdm:Option", "bdm:Trial", "bdm:UIComponent", "bdm:Window",
        "bdm:Feedback", "bdm:ConsentForm", "bdm:Consent",
        "bdm:Recording", "bdm:Timer", "bdm:Scorer", "bdm:LocaleSwitch"
    ]
    assert len(types) == 15
    for t in types:
        e = _minimal_event()
        e["object"]["objectType"] = t
        Draft202012Validator(schema).validate(e)


def test_event_required_fields(schema):
    for missing in ["actor", "verb", "object", "timestamp"]:
        bad = _minimal_event()
        del bad[missing]
        errors = list(Draft202012Validator(schema).iter_errors(bad))
        assert errors, f"Should require {missing}"


def test_event_unknown_root_property_rejected(schema):
    bad = _minimal_event()
    bad["unknown"] = "x"
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert _has_validation_error(errors)


def test_event_x_extension_allowed(schema):
    e = _minimal_event()
    e["x_lab_field"] = "ok"
    Draft202012Validator(schema).validate(e)


def test_event_with_result_extensions(schema):
    e = _minimal_event()
    e["result"] = {"extensions": {"bdm:response_id": 42, "bdm:response_time": 4.2}}
    Draft202012Validator(schema).validate(e)


def test_event_result_extensions_rejects_non_bdm_key(schema):
    e = _minimal_event()
    e["result"] = {"extensions": {"xapi:response_id": 42}}
    errors = list(Draft202012Validator(schema).iter_errors(e))
    assert _has_validation_error(errors)


def test_event_with_context_extensions(schema):
    e = _minimal_event()
    e["context"] = {"extensions": {
        "bdm:session_id":    "study_session_42",
        "bdm:activity_index": 1,
        "bdm:runtime_id":    "rt_xyz",
        "bdm:trial_index":   "1",
        "bdm:block_index":   1,
        "bdm:locale":        {"language": "en"}
    }}
    Draft202012Validator(schema).validate(e)


def test_event_batch_minimal(schema):
    instance = {"events": [_minimal_event()]}
    Draft202012Validator(schema).validate(instance)


def test_event_batch_with_batch_id(schema):
    instance = {"batch_id": "test_batch", "events": [_minimal_event()]}
    Draft202012Validator(schema).validate(instance)


def test_event_batch_requires_events(schema):
    errors = list(Draft202012Validator(schema).iter_errors({"batch_id": "test"}))
    assert len(errors) >= 1

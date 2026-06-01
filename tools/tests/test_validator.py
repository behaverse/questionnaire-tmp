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
    """Library example files under examples/library_examples/<type>/*.json validate against the right $def."""
    import json
    from tools.validate_schemas import walk_library_examples
    schemas = tmp_path / "schemas"
    q = schemas / "questionnaire"
    (q / "examples" / "library_examples" / "messages").mkdir(parents=True)
    schema = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://behaverse.org/schemas/questionnaire/v26.0601/schema.json",
        "type": "object",
        "$defs": {
            "Message": {
                "type": "object",
                "required": ["id"],
                "properties": {"id": {"type": "string", "pattern": "^msg_"}}
            }
        }
    }
    (q / "schema.json").write_text(json.dumps(schema))
    (q / "examples" / "library_examples" / "messages" / "msg_ok.json").write_text(
        json.dumps({"id": "msg_ok"})
    )
    (q / "examples" / "library_examples" / "messages" / "msg_bad.json").write_text(
        json.dumps({"id": "not_msg_prefix"})
    )
    results = walk_library_examples(schemas)
    paths = {p.name: errors for (p, _, errors) in results}
    assert paths["msg_ok.json"] == []
    assert len(paths["msg_bad.json"]) >= 1

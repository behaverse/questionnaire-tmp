import json
from functools import lru_cache
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource

_STRICT_SCHEMA = Path(__file__).with_name("strict_runtime_schema.json")


@lru_cache(maxsize=8)
def _registry(schemas_dir_str: str) -> Registry:
    registry = Registry()
    for schema_path in Path(schemas_dir_str).glob("**/schema.json"):
        schema = json.loads(schema_path.read_text())
        if "$id" in schema:
            registry = registry.with_resource(schema["$id"], Resource.from_contents(schema))
    return registry


@lru_cache(maxsize=8)
def _schema(schemas_dir_str: str, name: str) -> dict:
    return json.loads((Path(schemas_dir_str) / name / "schema.json").read_text())


@lru_cache(maxsize=1)
def _strict_schema() -> dict:
    return json.loads(_STRICT_SCHEMA.read_text())


def validate_input(questionnaire: dict, schemas_dir: Path) -> None:
    sd = str(schemas_dir)
    validator = Draft202012Validator(_schema(sd, "questionnaire"), registry=_registry(sd))
    validator.validate(questionnaire)


def validate_output(runtime: dict, schemas_dir: Path) -> None:
    sd = str(schemas_dir)
    Draft202012Validator(_schema(sd, "runtime"), registry=_registry(sd)).validate(runtime)
    Draft202012Validator(_strict_schema()).validate(runtime)

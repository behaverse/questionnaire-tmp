import json
from functools import lru_cache
from pathlib import Path

from jsonschema import Draft202012Validator
from referencing import Registry, Resource


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


def validate_manifest(manifest: dict, schemas_dir: Path) -> None:
    """Validate a viewer conformance manifest against Schema 7. Raises ValidationError."""
    sd = str(schemas_dir)
    Draft202012Validator(_schema(sd, "viewer_conformance"), registry=_registry(sd)).validate(manifest)

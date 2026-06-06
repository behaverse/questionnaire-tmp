import json
from functools import lru_cache
from pathlib import Path
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from .loader import Artifact

class SchemaInvalidError(Exception):
    pass

# entity_type -> $def name in the questionnaire schema's $defs
DEF_BY_TYPE = {
    "message": "Message", "context": "Context", "instruction": "Instruction",
    "prompt": "Prompt", "option": "Option", "placeholder": "Placeholder",
    "help": "Help", "regex": "RegEx", "question": "Question", "item": "Item",
    "solution": "Solution", "subscale": "Subscale", "scorer": "Scorer",
}

def build_registry(schemas_dir: Path) -> Registry:
    resources = []
    for schema_path in schemas_dir.glob("**/schema.json"):
        doc = json.loads(schema_path.read_text())
        if "$id" in doc:
            resources.append((doc["$id"], Resource.from_contents(doc)))
    return Registry().with_resources(resources)

@lru_cache(maxsize=8)
def _questionnaire_schema(schemas_dir_str: str) -> dict:
    return json.loads((Path(schemas_dir_str) / "questionnaire" / "schema.json").read_text())

def _schema_for(art: Artifact, q_schema: dict) -> dict:
    if art.entity_type == "questionnaire":
        return q_schema
    defs = q_schema.get("$defs", {})
    def_name = DEF_BY_TYPE[art.entity_type]
    return {**defs[def_name], "$defs": defs}

def validate_artifact(art: Artifact, registry: Registry, schemas_dir: Path) -> None:
    q_schema = _questionnaire_schema(str(schemas_dir))
    schema = _schema_for(art, q_schema)
    validator = Draft202012Validator(schema, registry=registry)
    errors = sorted(validator.iter_errors(art.data), key=str)
    if errors:
        raise SchemaInvalidError(f"{art.id}@{art.version}: {errors[0].message}")

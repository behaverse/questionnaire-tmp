#!/usr/bin/env python3
"""Validate every example in schemas/{instrument,questionnaire}/examples/
against its schema. Exit non-zero on any failure.

Cross-schema $ref (Schema 2's metadata field referencing Schema 1) is resolved
locally via a URI -> file-path mapping registered with the referencing
library's Registry.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012


REPO_ROOT = Path(__file__).resolve().parent.parent


def load_schema(path: Path) -> dict:
    """Load a JSON Schema file from disk."""
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON in {path}: {exc}") from exc


def discover_examples(schemas_root: Path) -> list[tuple[str, Path]]:
    """Yield (schema_name, example_path) for every example file.

    schema_name is the directory under schemas/ ("instrument" or "questionnaire").
    """
    out = []
    for schema_dir in sorted(schemas_root.iterdir()):
        if not schema_dir.is_dir():
            continue
        examples_dir = schema_dir / "examples"
        if not examples_dir.is_dir():
            continue
        for example in sorted(examples_dir.glob("*.json")):
            out.append((schema_dir.name, example))
    return out


def build_registry(schemas_root: Path) -> Registry:
    """Register every schema's $id -> local file mapping so cross-schema $ref resolves."""
    registry = Registry()
    for schema_dir in sorted(schemas_root.iterdir()):
        if not schema_dir.is_dir():
            continue
        schema_path = schema_dir / "schema.json"
        if not schema_path.is_file():
            continue
        schema = load_schema(schema_path)
        resource = Resource(contents=schema, specification=DRAFT202012)
        registry = registry.with_resource(uri=schema["$id"], resource=resource)
    return registry


def validate_instance(schema: dict, instance: dict, registry: Registry | None = None) -> list[str]:
    """Return a list of human-readable error messages (empty list = valid)."""
    validator = Draft202012Validator(
        schema,
        registry=registry or Registry(),
        format_checker=Draft202012Validator.FORMAT_CHECKER,
    )
    errors = sorted(validator.iter_errors(instance), key=lambda e: e.path)
    return [
        f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}"
        for e in errors
    ]


LIBRARY_ENTITY_DIRS = {
    "messages":     "Message",
    "contexts":     "Context",
    "instructions": "Instruction",
    "prompts":      "Prompt",
    "options":      "Option",
    "placeholders": "Placeholder",
    "helps":        "Help",
    "regexes":      "RegEx",
    "questions":    "Question",
    "items":        "Item",
    "solutions":    "Solution",
    "subscales":    "Subscale",
    "scorers":      "Scorer",
}


def walk_library_examples(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each file under schemas/questionnaire/examples/library_examples/<type>/*.json,
    validate the file against the matching $def from schemas/questionnaire/schema.json.

    Returns a list of (path, def_name, errors) tuples.
    """
    out = []
    q_schema_path = schemas_root / "questionnaire" / "schema.json"
    if not q_schema_path.is_file():
        return out
    schema = load_schema(q_schema_path)
    library_root = schemas_root / "questionnaire" / "examples" / "library_examples"
    if not library_root.is_dir():
        return out
    registry = build_registry(schemas_root)
    defs = schema.get("$defs", {})
    for type_dir in sorted(library_root.iterdir()):
        if not type_dir.is_dir():
            continue
        def_name = LIBRARY_ENTITY_DIRS.get(type_dir.name)
        if def_name is None:
            continue
        def_schema = defs.get(def_name)
        if def_schema is None:
            continue
        # Build a standalone schema for this $def (so $refs resolve)
        standalone = {**def_schema, "$defs": defs}
        for example_path in sorted(type_dir.glob("*.json")):
            instance = json.loads(example_path.read_text())
            errors = validate_instance(standalone, instance, registry=registry)
            out.append((example_path, def_name, errors))
    return out


def main(schemas_root: Path) -> None:
    """Validate every example in schemas_root/*/examples/ against the matching schema.
    Exits non-zero on failure.
    """
    registry = build_registry(schemas_root)

    failed = 0
    examples = discover_examples(schemas_root)
    if not examples:
        print(f"No examples found under {schemas_root}")
        sys.exit(1)

    for schema_name, example_path in examples:
        schema_path = schemas_root / schema_name / "schema.json"
        schema = load_schema(schema_path)
        instance = json.loads(example_path.read_text())
        errors = validate_instance(schema, instance, registry=registry)
        rel = example_path.relative_to(
            schemas_root.parent if schemas_root.parent.name else schemas_root
        )
        if errors:
            failed += 1
            print(f"FAIL  {rel}")
            for err in errors:
                print(f"      {err}")
        else:
            print(f"PASS  {rel}")

    # Validate per-entity library examples
    lib_results = walk_library_examples(schemas_root)
    for path, def_name, errs in lib_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (against $defs.{def_name})")
            for e in errs:
                print(f"      {e}")
        else:
            print(f"PASS  {rel} (against $defs.{def_name})")

    total = len(examples) + len(lib_results)
    if failed:
        print(f"\n{failed} example(s) failed.")
        sys.exit(1)
    print(f"\nAll {total} example(s) passed.")


def _cli() -> None:
    parser = argparse.ArgumentParser(description="Validate schemas and their examples.")
    parser.add_argument("--schemas-root", type=Path, default=REPO_ROOT / "schemas")
    args = parser.parse_args()
    main(args.schemas_root)


if __name__ == "__main__":
    _cli()

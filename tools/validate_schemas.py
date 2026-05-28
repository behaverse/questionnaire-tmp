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

from jsonschema import Draft202012Validator
from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012


REPO_ROOT = Path(__file__).resolve().parent.parent


def load_schema(path: Path) -> dict:
    """Load a JSON Schema file from disk."""
    return json.loads(path.read_text())


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
    for schema_dir in schemas_root.iterdir():
        schema_path = schema_dir / "schema.json"
        if not schema_path.is_file():
            continue
        schema = load_schema(schema_path)
        resource = Resource(contents=schema, specification=DRAFT202012)
        registry = registry.with_resource(uri=schema["$id"], resource=resource)
    return registry


def validate_instance(schema: dict, instance: dict, registry: Registry | None = None) -> list[str]:
    """Return a list of human-readable error messages (empty list = valid)."""
    validator = Draft202012Validator(schema, registry=registry or Registry())
    errors = sorted(validator.iter_errors(instance), key=lambda e: e.path)
    return [
        f"{'/'.join(str(p) for p in e.absolute_path) or '<root>'}: {e.message}"
        for e in errors
    ]


def main(schemas_root: Path | None = None) -> None:
    parser = argparse.ArgumentParser(description="Validate schemas and their examples.")
    parser.add_argument("--schemas-root", type=Path, default=schemas_root or REPO_ROOT / "schemas")
    args = parser.parse_args() if schemas_root is None else argparse.Namespace(
        schemas_root=schemas_root
    )

    root = args.schemas_root
    registry = build_registry(root)

    failed = 0
    examples = discover_examples(root)
    if not examples:
        print(f"No examples found under {root}")
        sys.exit(1)

    for schema_name, example_path in examples:
        schema_path = root / schema_name / "schema.json"
        schema = load_schema(schema_path)
        instance = json.loads(example_path.read_text())
        errors = validate_instance(schema, instance, registry=registry)
        rel = example_path.relative_to(root.parent if root.parent.name else root)
        if errors:
            failed += 1
            print(f"FAIL  {rel}")
            for err in errors:
                print(f"      {err}")
        else:
            print(f"PASS  {rel}")

    if failed:
        print(f"\n{failed} example(s) failed.")
        sys.exit(1)
    print(f"\nAll {len(examples)} example(s) passed.")


if __name__ == "__main__":
    main()

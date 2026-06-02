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


def _walk_json_pointer(schema_node, pointer):
    """Walk a JSON Pointer against a JSON Schema fragment. Returns the leaf
    schema node, or None if the path doesn't resolve."""
    if not pointer or not pointer.startswith("/"):
        return None
    parts = pointer.split("/")[1:]
    node = schema_node
    for p in parts:
        # JSON Pointer escape decoding
        p = p.replace("~1", "/").replace("~0", "~")
        if not isinstance(node, dict):
            return None
        props = node.get("properties") if isinstance(node, dict) else None
        if not props or p not in props:
            return None
        node = props[p]
    return node


def check_score_paths(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each questionnaire example, validate every scores[] entry's
    scorer+path against the Scorer entities in library_examples/scorers/.

    Returns a list of (path, kind, errors) tuples.
    """
    out = []
    scorers_dir = schemas_root / "questionnaire" / "examples" / "library_examples" / "scorers"
    scorers = {}
    if scorers_dir.is_dir():
        for sf in sorted(scorers_dir.glob("*.json")):
            data = json.loads(sf.read_text())
            scorers[data["id"]] = data
    examples_dir = schemas_root / "questionnaire" / "examples"
    if not examples_dir.is_dir():
        return out
    for q_path in sorted(examples_dir.glob("*.json")):
        try:
            instance = json.loads(q_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        scores = instance.get("scores", [])
        if not scores:
            continue
        errs = []
        for score in scores:
            scorer_ref = score.get("scorer", "")
            sid = scorer_ref.split("@")[0] if "@" in scorer_ref else scorer_ref
            sc = scorers.get(sid)
            if sc is None:
                errs.append(f"UNRESOLVED_SCORER: {scorer_ref}")
                continue
            path = score.get("path", "")
            target = _walk_json_pointer(sc.get("output_schema", {}), path)
            if target is None:
                errs.append(f"PATH_NOT_FOUND: {path} in {sid}")
            elif isinstance(target, dict) and target.get("type") in ("object", "array"):
                errs.append(f"PATH_NOT_LEAF: {path} in {sid} resolves to {target.get('type')}")
        out.append((q_path, "score_paths", errs))
    return out


def check_scorer_conformance(schemas_root: Path) -> list[tuple[Path, list[dict]]]:
    """Stub: returns SKIPPED for every (scorer, implementation, test_case) triple.

    A future deliverable will execute test cases against actual WASM/HTTP/Python/R
    implementations and report PASS/FAIL.
    """
    out = []
    scorers_dir = schemas_root / "questionnaire" / "examples" / "library_examples" / "scorers"
    if not scorers_dir.is_dir():
        return out
    for sf in sorted(scorers_dir.glob("*.json")):
        try:
            sc = json.loads(sf.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        statuses = []
        for impl in sc.get("implementations", []):
            for tc in sc.get("test_cases", []):
                statuses.append({
                    "implementation_kind": impl.get("kind"),
                    "test_case_name": tc.get("name", "<unnamed>"),
                    "status": "SKIPPED",
                    "reason": "conformance runner not yet implemented",
                })
        out.append((sf, statuses))
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

    score_path_results = check_score_paths(schemas_root)
    for path, _kind, errs in score_path_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (score paths)")
            for e in errs:
                print(f"      {e}")
        else:
            try:
                score_count = len(json.loads(path.read_text()).get("scores", []))
            except (json.JSONDecodeError, OSError):
                score_count = 0
            if score_count:
                print(f"PASS  {rel} (score paths: {score_count} verified)")

    conf_results = check_scorer_conformance(schemas_root)
    for sf, statuses in conf_results:
        rel = sf.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        skipped_count = sum(1 for s in statuses if s["status"] == "SKIPPED")
        if skipped_count:
            print(f"SKIP  {rel} ({skipped_count} conformance check(s) — runner not yet implemented)")

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

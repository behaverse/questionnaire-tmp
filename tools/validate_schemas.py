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


def check_stimulus_id_decomposable(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each Response example, verify stimulus_id parses into valid entity-id parts.

    Valid prefixes: ctx_, ins_, pr_, msg_ (per OD-17f).
    Returns a list of (path, kind, errors) tuples.
    """
    out = []
    valid_prefixes = ("ctx_", "ins_", "pr_", "msg_")
    response_examples = schemas_root / "response" / "examples"
    if not response_examples.is_dir():
        return out
    for q_path in sorted(response_examples.glob("*.json")):
        try:
            instance = json.loads(q_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        rows = instance.get("responses", []) if "responses" in instance else [instance]
        errs = []
        for idx, row in enumerate(rows):
            sid = row.get("stimulus_id", "")
            if not sid:
                continue
            parts = sid.split("+")
            for part in parts:
                if not any(part.startswith(p) for p in valid_prefixes):
                    errs.append(f"STIMULUS_ID_MALFORMED (row {idx}): '{sid}' contains '{part}' with invalid prefix")
        out.append((q_path, "stimulus_id", errs))
    return out


def check_scorer_outputs_against_schema(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each Session example with scorer_outputs, validate each output object
    against the referenced Scorer entity's output_schema.
    """
    out = []
    scorers_dir = schemas_root / "questionnaire" / "examples" / "library_examples" / "scorers"
    scorers = {}
    if scorers_dir.is_dir():
        for sf in sorted(scorers_dir.glob("*.json")):
            try:
                data = json.loads(sf.read_text())
                scorers[data["id"]] = data
            except (json.JSONDecodeError, OSError):
                continue
    session_examples = schemas_root / "session" / "examples"
    if not session_examples.is_dir():
        return out
    for s_path in sorted(session_examples.glob("*.json")):
        try:
            instance = json.loads(s_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        outputs = instance.get("scorer_outputs", {})
        if not outputs:
            continue
        errs = []
        for ref, value in outputs.items():
            sid = ref.split("@")[0]
            scorer = scorers.get(sid)
            if not scorer:
                errs.append(f"UNRESOLVED_SCORER: {ref}")
                continue
            output_schema = scorer.get("output_schema", {})
            try:
                Draft202012Validator(output_schema).validate(value)
            except Exception as e:
                errs.append(f"OUTPUT_VALIDATION_FAILED for {ref}: {str(e)[:120]}")
        out.append((s_path, "scorer_outputs", errs))
    return out


def check_pinned_scorer_consistency(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each runtime example, verify scores[].impl matches one of the
    referenced Scorer's implementations[]."""
    out = []
    scorers_dir = schemas_root / "questionnaire" / "examples" / "library_examples" / "scorers"
    scorers = {}
    if scorers_dir.is_dir():
        for sf in sorted(scorers_dir.glob("*.json")):
            try:
                data = json.loads(sf.read_text())
                scorers[data["id"]] = data
            except (json.JSONDecodeError, OSError):
                continue
    runtime_examples = schemas_root / "runtime" / "examples"
    if not runtime_examples.is_dir():
        return out
    for r_path in sorted(runtime_examples.glob("*.json")):
        try:
            instance = json.loads(r_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        scores = instance.get("scores", [])
        if not scores:
            continue
        errs = []
        for score in scores:
            scorer_ref = score.get("scorer", "")
            sid = scorer_ref.split("@")[0] if "@" in scorer_ref else scorer_ref
            scorer = scorers.get(sid)
            if scorer is None:
                errs.append(f"UNRESOLVED_SCORER: {scorer_ref}")
                continue
            declared_kinds = {impl.get("kind") for impl in scorer.get("implementations", [])}
            pinned = score.get("impl", {})
            pinned_kind = pinned.get("kind")
            if pinned_kind not in declared_kinds:
                errs.append(
                    f"IMPL_KIND_NOT_DECLARED: score '{score.get('id')}' pinned to "
                    f"kind='{pinned_kind}', but {sid} only declares {sorted(declared_kinds)}"
                )
        out.append((r_path, "pinned_scorer", errs))
    return out


def check_runtime_provenance_completeness(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each runtime example, verify the provenance block has the required structure."""
    out = []
    runtime_examples = schemas_root / "runtime" / "examples"
    if not runtime_examples.is_dir():
        return out
    required_fields = {
        "source_questionnaire_id",
        "source_questionnaire_version",
        "locale",
        "viewer_conformance_hash",
        "deployment_runtime_policy_hash",
        "generated_at",
        "denormaliser_version",
    }
    for r_path in sorted(runtime_examples.glob("*.json")):
        try:
            instance = json.loads(r_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        prov = instance.get("provenance", {})
        missing = required_fields - set(prov.keys())
        errs = []
        if missing:
            errs.append(f"PROVENANCE_MISSING: {sorted(missing)}")
        out.append((r_path, "provenance", errs))
    return out


EVENTS_VERBS = {
    "bdm:initialized", "bdm:started", "bdm:paused", "bdm:resumed",
    "bdm:completed", "bdm:submitted", "bdm:abandoned",
    "bdm:presented",
    "bdm:clicked", "bdm:drag_and_dropped", "bdm:key_pressed", "bdm:typed",
    "bdm:selected", "bdm:deselected", "bdm:adjusted",
    "bdm:got_focus", "bdm:lost_focus", "bdm:consented",
    "bdm:trial_started", "bdm:trial_ended", "bdm:state_changed",
    "bdm:recording_started", "bdm:recording_ended",
    "bdm:navigated"
}

EVENTS_OBJECT_TYPES = {
    "bdm:RuntimeInstance", "bdm:Screen", "bdm:Panel", "bdm:Stimulus",
    "bdm:Option", "bdm:Trial", "bdm:UIComponent", "bdm:Window",
    "bdm:Feedback", "bdm:ConsentForm", "bdm:Consent",
    "bdm:Recording", "bdm:Timer", "bdm:Scorer", "bdm:LocaleSwitch"
}

EVENTS_ACTOR_TYPES = {
    "bdm:Agent", "bdm:Group", "bdm:Engine", "bdm:Orchestrator", "bdm:Researcher"
}


def check_event_vocabulary(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each Event example, verify verb / object.objectType / actor.objectType are in vocabulary."""
    out = []
    events_examples = schemas_root / "events" / "examples"
    if not events_examples.is_dir():
        return out
    for q_path in sorted(events_examples.glob("*.json")):
        try:
            instance = json.loads(q_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        events_list = instance.get("events", []) if "events" in instance else [instance]
        errs = []
        for idx, ev in enumerate(events_list):
            v = ev.get("verb", "")
            if v and v not in EVENTS_VERBS:
                errs.append(f"VERB_NOT_IN_VOCABULARY (event {idx}): '{v}'")
            obj_type = ev.get("object", {}).get("objectType", "")
            if obj_type and obj_type not in EVENTS_OBJECT_TYPES:
                errs.append(f"OBJECT_TYPE_NOT_IN_VOCABULARY (event {idx}): '{obj_type}'")
            actor_type = ev.get("actor", {}).get("objectType", "")
            if actor_type and actor_type not in EVENTS_ACTOR_TYPES:
                errs.append(f"ACTOR_TYPE_NOT_IN_VOCABULARY (event {idx}): '{actor_type}'")
        out.append((q_path, "event_vocabulary", errs))
    return out


def check_event_extension_key_prefixes(schemas_root: Path) -> list[tuple[Path, str, list[str]]]:
    """For each Event example, verify all result.extensions and context.extensions keys are bdm:*-prefixed."""
    out = []
    events_examples = schemas_root / "events" / "examples"
    if not events_examples.is_dir():
        return out
    for q_path in sorted(events_examples.glob("*.json")):
        try:
            instance = json.loads(q_path.read_text())
        except (json.JSONDecodeError, OSError):
            continue
        events_list = instance.get("events", []) if "events" in instance else [instance]
        errs = []
        for idx, ev in enumerate(events_list):
            for section in ("result", "context"):
                ext = ev.get(section, {}).get("extensions", {})
                for key in ext:
                    if not key.startswith("bdm:"):
                        errs.append(f"EXTENSION_KEY_PREFIX (event {idx}, {section}.extensions): '{key}' not bdm:-prefixed")
        out.append((q_path, "event_extension_prefixes", errs))
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

    pinned_results = check_pinned_scorer_consistency(schemas_root)
    for path, _kind, errs in pinned_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (pinned scorer consistency)")
            for e in errs:
                print(f"      {e}")
        else:
            try:
                has_scores = bool(json.loads(path.read_text()).get("scores"))
            except (json.JSONDecodeError, OSError):
                has_scores = False
            if has_scores:
                print(f"PASS  {rel} (pinned scorer consistency)")

    prov_results = check_runtime_provenance_completeness(schemas_root)
    for path, _kind, errs in prov_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (runtime provenance completeness)")
            for e in errs:
                print(f"      {e}")
        else:
            print(f"PASS  {rel} (runtime provenance completeness)")

    stim_results = check_stimulus_id_decomposable(schemas_root)
    for path, _kind, errs in stim_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (stimulus_id decomposition)")
            for e in errs:
                print(f"      {e}")
        else:
            print(f"PASS  {rel} (stimulus_id decomposition)")

    scorer_out_results = check_scorer_outputs_against_schema(schemas_root)
    for path, _kind, errs in scorer_out_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (scorer_outputs)")
            for e in errs:
                print(f"      {e}")
        else:
            print(f"PASS  {rel} (scorer_outputs)")

    event_vocab_results = check_event_vocabulary(schemas_root)
    for path, _kind, errs in event_vocab_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (event vocabulary)")
            for e in errs:
                print(f"      {e}")
        else:
            print(f"PASS  {rel} (event vocabulary)")

    event_ext_results = check_event_extension_key_prefixes(schemas_root)
    for path, _kind, errs in event_ext_results:
        rel = path.relative_to(schemas_root.parent if schemas_root.parent.name else schemas_root)
        if errs:
            failed += 1
            print(f"FAIL  {rel} (event extension prefixes)")
            for e in errs:
                print(f"      {e}")
        else:
            print(f"PASS  {rel} (event extension prefixes)")

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

# Runtime Denormaliser — Design Spec

**Date drafted:** 2026-06-10
**Author:** Runtime-denormaliser brainstorming session (2026-06-10)
**Component:** `questionnaire-runtime-denormaliser` — first deliverable of **Phase 2** (Web Viewer + Deployments). The shared Schema 2 → Schema 3 dependency everything else in Phase 2 needs. See [HANDOFF.md](../../../HANDOFF.md) "Phase 2 — START HERE" and [plan/01_roadmap.md](../../../plan/01_roadmap.md) §"Phase 2".
**Target repo:** `questionnaire-runtime-denormaliser` (built in the current folder under `questionnaire-runtime-denormaliser/` for now; mirrors `library/` / `library-web/`; migrates at the deferred repo split per [design/14_repository_topology.md](../../../design/14_repository_topology.md)).
**Stack:** Python 3.12+ · `jsonschema` · `referencing` · pytest. **Pure library — no FastAPI, no Postgres, no network I/O.**
**Authoritative source documents:**

- [design/05d_runtime.md](../../../design/05d_runtime.md) — **OD-18**, the authoritative resolution: where the runtime is generated, locale handling, conformance manifest, scorer-impl selection, scoring stripping, cache key. This spec implements the denormaliser algorithm in §3 of that doc.
- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) — the reusable entity types the denormaliser inlines.
- [design/05b_scoring.md](../../../design/05b_scoring.md) — OD-16 scoring model (Scorer entity, `scores[]`, branching-required vs display-only).
- [schemas/questionnaire/schema.json](../../../schemas/questionnaire/schema.json) — Schema 2 v26.0609 (input).
- [schemas/runtime/schema.json](../../../schemas/runtime/schema.json) — Schema 3 v26.0603 (output; **kept loose, not bumped** — see §1.2).
- [schemas/viewer_conformance/schema.json](../../../schemas/viewer_conformance/schema.json) — Schema 7 (the viewer manifest input).

The **runtime denormaliser** is a pure Python library that turns a **Schema 2 Questionnaire** (references + multi-locale content + scoring) into a **Schema 3 Runtime** suitable for direct viewer consumption: references inlined, content trimmed to one locale, features trimmed to a viewer's conformance manifest, Scorer implementations pinned, and scoring optionally stripped. Per **OD-18a** it is consumed by both the Viewer Service (session-mint runtime generation) and the Editor (preview) — so it must be a standalone, I/O-free library with an injectable entity resolver.

---

## 1 — Scope

### 1.1 In scope
- A single public entry point `denormalise(...)` that produces a Schema 3 runtime JSON document from a Schema 2 questionnaire.
- **Ref resolution** — recursively inline every `{"ref": "<id>@<vYY.MMDD>"}` object with the referenced reusable entity's body (Prompt, Option, Context, Instruction, Question, Item, Message, Placeholder, Help, RegEx, Solution, Subscale, Scorer), via an **injected** `resolve_entity(ref) -> dict | None` callable.
- **Locale application (OD-18b)** — keep only the active locale's entry in every `content` / `*Translations` language-map; **strict pre-flight error** if a required content entity lacks the requested locale (no silent fallback). `pre_fetch_all_locales: true` opts into keeping all locales.
- **Faithful-projection output shape** — the runtime keeps Schema 2's structure and vocabulary (e.g. Option's `input_data_type: choice|number|text`, structural `options[]` + per-locale `content.<locale>.options[]`); the denormaliser does **not** merge them into a viewer-bespoke `choices[]` shape. The Web Viewer performs that trivial merge itself.
- **Manifest reconciliation (OD-18c)** — reconcile the questionnaire against the supplied Schema 7 `viewer_manifest`. **Behavioural channels** the viewer can't record are silently **trimmed** (optional telemetry — safe to drop). But an item whose widget kind (the Option `input_data_type.measurement_type.selection` triple) is **not** in `viewer_manifest.widgets`, or a `LogicRule` whose `action.type` is not in `viewer_manifest.logic_actions`, is a **pre-flight error** — silently dropping a question or a branching rule would change the instrument, so the deployment is invalid until the viewer or the questionnaire is fixed. (With MVP's permissive Web-Viewer manifest, errors won't trigger on the seeded content, but the algorithm is real and tested.)
- **Scorer-impl pinning (OD-18d)** — for each `scores[]` entry, choose the implementation kind = first of `runtime_policy.scorer_impl_preference` present in **both** the Scorer's `implementations[].kind` **and** `viewer_manifest.scorer_impl_kinds`; embed the chosen `impl` block (URL+sha256 for wasm, URL for http, package for python/r). Empty intersection → pre-flight error.
- **Scoring stripping (OD-18e)** — compute the branching-required score set via a conservative expression reference-extractor over all `LogicRule.condition`/`action`; under `show_score: false` strip display-only scores; under `disable_in_session_scoring: true` strip all scores **and** every LogicRule depending on a score. Record `stripped_scorer_refs` + `stripped_logic_rule_ids` in provenance.
- **Provenance block (OD-18f)** — assemble `provenance` with `viewer_conformance_hash` + `deployment_runtime_policy_hash` (both `sha256` of canonical JSON), `generated_at` (injected), `denormaliser_version`, locale, source id+version, and the stripped lists.
- **Input + output validation** — validate input against Schema 2 and output against Schema 3 (the loose canonical schema) **plus** a package-internal strict schema (§5).
- **`canonical_hash(obj) -> str`** exported for the future Viewer Service to compute identical cache-key hashes.

### 1.2 Non-goals (deferred to later Phase-2 specs)
- **No Viewer Service / Orchestrator** — no `runtime_cache` table, no 5-tuple cache lookup, no admin purge API, no `/sessions/new`, no viewer-registry, no OD-13 forwarding outbox. The denormaliser *produces* a runtime; the Service *caches and serves* it.
- **No Web Viewer** and **no WASM expression evaluator** — the denormaliser does **static** reference-extraction over expressions (to find branching-required scores); it never *evaluates* a condition. Runtime evaluation is the viewer's WASM evaluator (OD-11), a later spec.
- **No Scorer execution** — the denormaliser pins the chosen impl reference; it does not run scorers (no Scorer conformance runner; that's a later spec).
- **No Schema 3 version bump** — the canonical Schema 3 stays loose (`pages`/`blocks` opaque). The faithful shape is enforced by the package's own tests + internal strict schema, not by bumping the canonical schema (respects OD-06 "bumps are breaking/heavyweight"). Tighten Schema 3 later, once the Web Viewer proves the shape, as its own OD.
- **No Editor integration** — the Editor will import this library later; this spec only ships the library.
- **No persistence / network / DB** — entity resolution is injected; nothing here opens a connection or a socket.

---

## 2 — Module layout

Built under `questionnaire-runtime-denormaliser/` in the current repo (becomes the package root at reorg):

```
questionnaire-runtime-denormaliser/
├── pyproject.toml                  # dist: questionnaire-runtime-denormaliser; module: denormaliser
├── README.md
├── FOLLOWUPS.md
├── src/denormaliser/
│   ├── __init__.py                 # exports: denormalise, RuntimePolicy, PreflightError, canonical_hash
│   ├── api.py                      # denormalise(...) — orchestrates the passes
│   ├── policy.py                   # RuntimePolicy dataclass (the 6 OD-18f fields) + to_canonical_dict
│   ├── errors.py                   # PreflightError(problems: list[Problem]); Problem dataclass
│   ├── resolve.py                  # pass 2: recursive ref inlining (parameterised on resolve_entity)
│   ├── locale.py                   # pass 3: locale trim + strict missing-locale check
│   ├── manifest.py                 # pass 4: trim widgets/channels/logic-actions to viewer manifest
│   ├── scorers.py                  # pass 5: scorer-impl intersection + pinning
│   ├── scoring.py                  # pass 6: branching-required walk + show_score/disable stripping
│   ├── expressions.py              # extract_score_refs(expr) — conservative static analysis
│   ├── provenance.py               # pass 7: provenance block assembly
│   ├── hashing.py                  # canonical_hash(obj)
│   ├── validation.py               # input (Schema 2) + output (Schema 3 + internal strict) validation
│   └── strict_runtime_schema.json  # package-internal strict Schema 3 (dev/test validation only)
└── tests/
    ├── test_resolve.py
    ├── test_locale.py
    ├── test_manifest.py
    ├── test_scorers.py
    ├── test_scoring.py
    ├── test_expressions.py
    ├── test_hashing.py
    ├── test_preflight.py
    ├── test_denormalise_golden.py  # full pipeline → regenerated runtime examples
    └── fixtures/                   # Schema 2 inputs + entity stores + expected runtimes
```

Conventions mirror `library/`: `src/` layout, setuptools, `referencing.Registry` built from `schemas_dir.glob("**/schema.json")` for `$id` resolution, `pytest` with `testpaths = ["tests"]`.

---

## 3 — Public API (the contract)

```python
@dataclass(frozen=True)
class RuntimePolicy:
    scorer_impl_preference: list[str]          # e.g. ["wasm", "http", "python", "r"]
    show_score: bool = False
    lock_show_score_timing: bool = False
    show_score_live: bool = False
    pre_fetch_all_locales: bool = False
    disable_in_session_scoring: bool = False
    def to_canonical_dict(self) -> dict: ...    # stable dict for hashing

@dataclass
class Problem:
    kind: str          # "unresolved_ref" | "missing_locale" | "no_scorer_impl"
                       #   | "unsupported_widget" | "unsupported_logic_action"
    detail: str
    where: str         # entity id / score id / ref string

class PreflightError(Exception):
    def __init__(self, problems: list[Problem]): ...

def denormalise(
    questionnaire: dict,
    *,
    locale: str,
    runtime_policy: RuntimePolicy,
    viewer_manifest: dict,
    resolve_entity: Callable[[str], dict | None],
    generated_at: str,                          # ISO-8601; injected (deterministic tests)
    denormaliser_version: str = "v26.0610",
    schemas_dir: Path | None = None,            # if given, validate input + output
) -> dict:                                      # Schema 3 runtime JSON

def canonical_hash(obj) -> str:                 # sha256 of canonical JSON, lowercase hex
```

**Error model.** Hard errors (unresolved ref, missing required locale, empty scorer-impl intersection) are **collected across the whole document** and raised together as one `PreflightError(problems)` — collect-all, not fail-fast, so one run surfaces every problem. Expected strips (display-only scores under `show_score:false`; everything under `disable_in_session_scoring`) are **not** errors — they are recorded in provenance.

---

## 4 — Pipeline: seven ordered pure passes

Each pass is a pure `(doc, ctx) -> doc` that may append to a shared `problems` accumulator; `denormalise` composes them and raises `PreflightError` if `problems` is non-empty after the error-producing passes.

1. **validate_input** ([validation.py](../../../questionnaire-runtime-denormaliser/src/denormaliser/validation.py)) — validate `questionnaire` against Schema 2 (skipped if `schemas_dir is None`).
2. **resolve_refs** ([resolve.py]) — depth-first walk; for each `{"ref": "<id>@<v>"}`, call `resolve_entity`, merge the entity body as sibling keys (existing keys win, matching the Library's `resolve_definition` semantics), and recurse into resolved content (nested refs resolve transitively). `None` → `Problem("unresolved_ref", ...)`.
3. **apply_locale** ([locale.py]) — for every content / `*Translations` map, keep only `locale` (unless `pre_fetch_all_locales`, which keeps all). A required content entity missing `locale` → `Problem("missing_locale", ...)`. Sets top-level `locale` + `available_locales`.
4. **reconcile_manifest** ([manifest.py]) — trim behavioural channels absent from the manifest (safe); an item whose widget triple ∉ `manifest.widgets` → `Problem("unsupported_widget", ...)`; a LogicRule whose `action.type` ∉ `manifest.logic_actions` → `Problem("unsupported_logic_action", ...)`.
5. **pin_scorers** ([scorers.py]) — resolve each `scores[]` entry's Scorer (via `resolve_entity`), intersect `(preference, scorer.implementations[].kind, manifest.scorer_impl_kinds)`, pin the first match as the `impl` block. Empty → `Problem("no_scorer_impl", ...)`.
6. **strip_scores** ([scoring.py]) — build `branching_required` (§5); if `show_score` keep all, else keep only branching-required (`stripped_scorer_refs += display-only`); if `disable_in_session_scoring` strip all scores + every LogicRule referencing a score (`stripped_logic_rule_ids += ...`).
7. **build_provenance + validate_output** ([provenance.py], [validation.py]) — assemble `provenance` (hashes via `canonical_hash`); validate output against Schema 3 (loose) + internal strict schema.

**Architectural alternative considered:** a single recursive walk performing all transforms in one traversal. Rejected — runtimes are small (perf is a non-issue) and per-pass isolation is far more testable and debuggable. Discrete passes chosen.

---

## 5 — The three tricky bits

**Expression reference-extractor** ([expressions.py]). `extract_score_refs(expr: str) -> set[str]` is **static analysis, never evaluation** (the WASM evaluator doesn't exist yet, and OD-18e mandates a conservative parse). It returns the union of: (a) ids inside `score("id")` / `score('id')` calls, and (b) any **declared score id** appearing as a whole-word token anywhere in the expression. Conservative = over-include: a score that *might* be referenced is never stripped. `branching_required` = union over every `LogicRule.condition` and stringified `action` of `extract_score_refs`, intersected with the declared score ids.

**Hashing** ([hashing.py]). `canonical_hash(obj) = sha256(json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")).hexdigest()`. Deterministic and stable; the future Viewer Service imports this exact function so cache-key hashes match. `viewer_conformance_hash = canonical_hash(viewer_manifest)`; `deployment_runtime_policy_hash = canonical_hash(runtime_policy.to_canonical_dict())`.

**Strict output schema** ([strict_runtime_schema.json]). A package-internal JSON Schema that tightens Schema 3's opaque `pages`/`blocks` to the faithful-projection shape (single-locale content maps, Schema-2 Option vocabulary, pinned `impl` blocks). Used **only** for the denormaliser's own output validation in tests — it is **not** a canonical schema and does not affect `schemas/`.

---

## 6 — Testing & deliverables (TDD)

- **Per-pass unit tests** for resolve / locale / manifest / scorers / scoring, plus `expressions` and `hashing` units.
- **Pre-flight tests** — unresolved ref, missing locale, empty scorer intersection each raise `PreflightError` with the right `Problem` list (and collect-all: multiple problems in one raise).
- **Strip behaviour tests** — `show_score:true` keeps all; `show_score:false` keeps branching-required + drops display-only; `disable_in_session_scoring:true` drops all scores + dependent LogicRules; provenance lists are correct.
- **Golden full-pipeline tests** — use **self-contained fixtures** under `tests/fixtures/` (small, fully-resolvable Schema 2 questionnaires + dict-based entity stores authored for the denormaliser, which the package controls), including one realistic multi-page fixture exercising the whole pipeline (resolve + locale + scorer-pin + score-strip + provenance) end-to-end. The output is compared to a checked-in expected runtime JSON. **The canonical `schemas/runtime/examples/` are NOT touched** by this build: a discovery during planning is that the canonical Schema 2 examples reference ~14 reusable entities that don't exist in `library_examples/` (refs pass the schema suite because JSON Schema checks ref *format*, not resolvability), so they can't be denormalised today. That gap is logged in `FOLLOWUPS.md` as a separate "complete the example entity set + regenerate runtime examples" task.
- **Verification gate:** `pytest questionnaire-runtime-denormaliser/ -q` green; `pytest tools/tests/ -q` (309) still green; `python tools/validate_schemas.py` still passes; existing `library/` + `library-web/` suites untouched.

---

## 7 — Decisions locked in this session (2026-06-10)

| # | Decision | Choice |
|---|---|---|
| D1 | Output shape | **Faithful projection** — keep Schema 2 structure + vocabulary; viewer does the option-merge. |
| D2 | Schema 3 bump | **Keep loose, don't bump** — enforce shape via package tests + internal strict schema; regenerate examples. |
| D3 | Score stripping (OD-18e) | **Build the conservative reference-extractor now** — full OD-18e in v1 (no evaluator dependency). |
| D4 | Missing locale | **Strict pre-flight error** — no silent fallback. |
| D5 | Entity I/O boundary | **Pure / injectable** `resolve_entity` callable — no Library/Postgres dependency (forced by repo topology). |
| D6 | Pipeline architecture | **Seven discrete pure passes** over a single-traversal monolith — testability over micro-perf. |

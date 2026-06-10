# Runtime Denormaliser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `questionnaire-runtime-denormaliser` Python library — a pure, I/O-free function that turns a Schema 2 Questionnaire into a Schema 3 Runtime (refs inlined, one locale, scorers pinned, scoring optionally stripped, provenance attached).

**Architecture:** A single public `denormalise(...)` entry point composes seven discrete pure passes over a working copy of the questionnaire: resolve refs → apply locale → reconcile manifest → pin scorers → (raise collected pre-flight errors) → strip scores → assemble + validate output. Entity resolution is injected as a `resolve_entity(ref) -> dict | None` callable (no DB/network). Hard errors are collected across the document and raised together as `PreflightError`.

**Tech Stack:** Python 3.12 · `jsonschema` · `referencing` · pytest. Mirrors the `library/` package conventions (src layout, setuptools).

**Spec:** [docs/superpowers/specs/2026-06-10-runtime-denormaliser-design.md](../specs/2026-06-10-runtime-denormaliser-design.md)

---

## File structure

```
questionnaire-runtime-denormaliser/
├── pyproject.toml                          # dist: questionnaire-runtime-denormaliser; module: denormaliser
├── README.md
├── FOLLOWUPS.md
├── src/denormaliser/
│   ├── __init__.py                         # public exports
│   ├── errors.py                           # Problem, PreflightError
│   ├── policy.py                           # RuntimePolicy
│   ├── hashing.py                          # canonical_hash
│   ├── expressions.py                      # extract_score_refs
│   ├── resolve.py                          # pass 1: resolve_refs
│   ├── locale.py                           # pass 2: apply_locale
│   ├── manifest.py                         # pass 3: reconcile_manifest
│   ├── scorers.py                          # pass 4: pin_scorers
│   ├── scoring.py                          # pass 5: strip_scores
│   ├── provenance.py                       # pass 6: assemble_runtime
│   ├── validation.py                       # input/output validation
│   ├── context.py                          # _Ctx dataclass shared by passes
│   ├── api.py                              # denormalise(...) orchestration
│   └── strict_runtime_schema.json          # internal strict Schema 3 (test validation)
└── tests/
    ├── conftest.py                         # SCHEMAS_DIR fixture + fixture factories
    ├── test_hashing.py
    ├── test_expressions.py
    ├── test_resolve.py
    ├── test_locale.py
    ├── test_manifest.py
    ├── test_scorers.py
    ├── test_scoring.py
    ├── test_provenance.py
    ├── test_validation.py
    ├── test_preflight.py
    └── test_denormalise_golden.py
```

**Working directory note:** all paths below are relative to the repo root `/home/pedro/Repos/Cursor/questionnaire_apps`. The repo has a `.venv` at root; activate it (`source .venv/bin/activate`) for every command.

---

### Task 0: Package scaffolding

**Files:**
- Create: `questionnaire-runtime-denormaliser/pyproject.toml`
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/__init__.py`
- Create: `questionnaire-runtime-denormaliser/tests/conftest.py`

- [ ] **Step 1: Write `pyproject.toml`**

```toml
[project]
name = "questionnaire-runtime-denormaliser"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
  "jsonschema>=4.20",
  "referencing>=0.30",
]

[project.optional-dependencies]
dev = ["pytest>=8.0"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

- [ ] **Step 2: Write a placeholder `__init__.py`**

```python
"""questionnaire-runtime-denormaliser: Schema 2 -> Schema 3 runtime denormaliser."""

__version__ = "0.1.0"
```

- [ ] **Step 3: Write `tests/conftest.py` with the shared schemas-dir fixture**

```python
from pathlib import Path

import pytest

# Repo root is three parents up from this file:
# <repo>/questionnaire-runtime-denormaliser/tests/conftest.py
REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMAS_DIR = REPO_ROOT / "schemas"


@pytest.fixture
def schemas_dir() -> Path:
    assert SCHEMAS_DIR.is_dir(), f"schemas dir not found at {SCHEMAS_DIR}"
    return SCHEMAS_DIR
```

- [ ] **Step 4: Install editable + verify collection**

Run:
```bash
source .venv/bin/activate
pip install -e questionnaire-runtime-denormaliser/[dev]
pytest questionnaire-runtime-denormaliser/ -q
```
Expected: `no tests ran` (0 collected) with exit code 5, and the `schemas_dir` fixture importable (no collection errors).

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/pyproject.toml questionnaire-runtime-denormaliser/src questionnaire-runtime-denormaliser/tests/conftest.py
git commit -m "feat(denormaliser): package scaffolding"
```

---

### Task 1: `canonical_hash` (hashing.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/hashing.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_hashing.py`

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.hashing import canonical_hash


def test_hash_is_64_hex_lowercase():
    h = canonical_hash({"a": 1})
    assert len(h) == 64
    assert h == h.lower()
    assert all(c in "0123456789abcdef" for c in h)


def test_hash_is_key_order_independent():
    assert canonical_hash({"a": 1, "b": 2}) == canonical_hash({"b": 2, "a": 1})


def test_hash_distinguishes_different_values():
    assert canonical_hash({"a": 1}) != canonical_hash({"a": 2})


def test_hash_is_stable_for_known_input():
    # Locks the exact algorithm so the future Viewer Service matches.
    import hashlib
    obj = {"show_score": False, "scorer_impl_preference": ["wasm", "http"]}
    expected = hashlib.sha256(
        '{"scorer_impl_preference":["wasm","http"],"show_score":false}'.encode("utf-8")
    ).hexdigest()
    assert canonical_hash(obj) == expected
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_hashing.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.hashing'`

- [ ] **Step 3: Implement `hashing.py`**

```python
import hashlib
import json


def canonical_hash(obj) -> str:
    """SHA-256 (lowercase hex) of the canonical JSON serialization of obj.

    Canonical form: sorted keys, no whitespace, non-ASCII preserved. The future
    Viewer Service imports this exact function so runtime-cache key hashes match.
    """
    canonical = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_hashing.py -q`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/hashing.py questionnaire-runtime-denormaliser/tests/test_hashing.py
git commit -m "feat(denormaliser): canonical_hash"
```

---

### Task 2: Errors and policy (errors.py, policy.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/errors.py`
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/policy.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_policy.py` (add to it in later tasks too)

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-runtime-denormaliser/tests/test_policy.py`:

```python
import pytest

from denormaliser.errors import Problem, PreflightError
from denormaliser.policy import RuntimePolicy


def test_runtime_policy_defaults():
    p = RuntimePolicy(scorer_impl_preference=["wasm"])
    assert p.show_score is False
    assert p.disable_in_session_scoring is False
    assert p.pre_fetch_all_locales is False


def test_runtime_policy_canonical_dict_is_stable():
    p = RuntimePolicy(scorer_impl_preference=["wasm", "http"], show_score=True)
    d = p.to_canonical_dict()
    assert d == {
        "scorer_impl_preference": ["wasm", "http"],
        "show_score": True,
        "lock_show_score_timing": False,
        "show_score_live": False,
        "pre_fetch_all_locales": False,
        "disable_in_session_scoring": False,
    }


def test_preflight_error_carries_problems():
    problems = [Problem(kind="missing_locale", detail="no pt", where="pr_x")]
    err = PreflightError(problems)
    assert err.problems == problems
    assert "missing_locale" in str(err)
    assert "pr_x" in str(err)
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_policy.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.errors'`

- [ ] **Step 3: Implement `errors.py`**

```python
from dataclasses import dataclass


@dataclass
class Problem:
    """A single pre-flight problem. kind is one of:
    'unresolved_ref' | 'missing_locale' | 'no_scorer_impl'
    | 'unsupported_widget' | 'unsupported_logic_action'.
    """

    kind: str
    detail: str
    where: str


class PreflightError(Exception):
    """Raised when one or more hard pre-flight problems make the
    (questionnaire x viewer x policy) combination invalid. Carries every
    problem found in a single denormalise() run (collect-all, not fail-fast)."""

    def __init__(self, problems: list[Problem]):
        self.problems = problems
        lines = [f"  [{p.kind}] {p.where}: {p.detail}" for p in problems]
        super().__init__("pre-flight failed:\n" + "\n".join(lines))
```

- [ ] **Step 4: Implement `policy.py`**

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimePolicy:
    """The OD-18f runtime_policy sub-object: only the fields the denormaliser
    consults. Hashed (via to_canonical_dict) into the runtime cache key."""

    scorer_impl_preference: list[str]
    show_score: bool = False
    lock_show_score_timing: bool = False
    show_score_live: bool = False
    pre_fetch_all_locales: bool = False
    disable_in_session_scoring: bool = False

    def to_canonical_dict(self) -> dict:
        return {
            "scorer_impl_preference": list(self.scorer_impl_preference),
            "show_score": self.show_score,
            "lock_show_score_timing": self.lock_show_score_timing,
            "show_score_live": self.show_score_live,
            "pre_fetch_all_locales": self.pre_fetch_all_locales,
            "disable_in_session_scoring": self.disable_in_session_scoring,
        }
```

- [ ] **Step 5: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_policy.py -q`
Expected: PASS (3 passed)

- [ ] **Step 6: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/errors.py questionnaire-runtime-denormaliser/src/denormaliser/policy.py questionnaire-runtime-denormaliser/tests/test_policy.py
git commit -m "feat(denormaliser): RuntimePolicy + Problem/PreflightError"
```

---

### Task 3: Expression reference extractor (expressions.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/expressions.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_expressions.py`

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.expressions import extract_score_refs

DECLARED = {"phq9_total", "phq9_severity", "gad7_total"}


def test_matches_score_call():
    assert extract_score_refs('score("phq9_total") >= 10', DECLARED) == {"phq9_total"}


def test_matches_single_quoted_call():
    assert extract_score_refs("score('gad7_total') > 5", DECLARED) == {"gad7_total"}


def test_matches_bare_token_conservatively():
    # Any whole-word mention of a declared id counts (OD-18e conservative parse).
    assert extract_score_refs("phq9_severity == 'severe'", DECLARED) == {"phq9_severity"}


def test_does_not_match_substring_of_other_token():
    # 'phq9_total' must not match inside 'phq9_total_extra'
    assert extract_score_refs("phq9_total_extra > 1", DECLARED) == set()


def test_only_returns_declared_ids():
    assert extract_score_refs('score("undeclared_score") > 1', DECLARED) == set()


def test_empty_or_none_expression():
    assert extract_score_refs("", DECLARED) == set()
    assert extract_score_refs(None, DECLARED) == set()


def test_multiple_refs_in_one_expression():
    expr = 'score("phq9_total") >= 10 and phq9_severity != "minimal"'
    assert extract_score_refs(expr, DECLARED) == {"phq9_total", "phq9_severity"}
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_expressions.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.expressions'`

- [ ] **Step 3: Implement `expressions.py`**

```python
import re

_SCORE_CALL = re.compile(r"""score\s*\(\s*['"]([a-z][a-z0-9_]*)['"]\s*\)""")


def extract_score_refs(expr: str | None, declared_ids: set[str]) -> set[str]:
    """Conservative STATIC analysis (never evaluation) of an expression string.

    Returns the subset of declared_ids referenced by `expr`, via either an
    explicit score("id") call or a bare whole-word mention of a declared id.
    Conservative per OD-18e: any mention counts. Intersected with declared_ids
    so only real, declared scores are ever returned.
    """
    if not expr:
        return set()
    found: set[str] = set(_SCORE_CALL.findall(expr))
    for sid in declared_ids:
        if re.search(rf"(?<![A-Za-z0-9_]){re.escape(sid)}(?![A-Za-z0-9_])", expr):
            found.add(sid)
    return found & declared_ids
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_expressions.py -q`
Expected: PASS (7 passed)

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/expressions.py questionnaire-runtime-denormaliser/tests/test_expressions.py
git commit -m "feat(denormaliser): conservative score-ref extractor"
```

---

### Task 4: Shared context + ref resolution (context.py, resolve.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/context.py`
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/resolve.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_resolve.py`

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.context import Ctx
from denormaliser.policy import RuntimePolicy
from denormaliser.resolve import resolve_refs


def make_ctx(store):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"]),
        viewer_manifest={},
        resolve_entity=lambda ref: store.get(ref),
    )


def test_inlines_a_simple_ref():
    store = {"pr_x@v26.0602": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Hi"}}}}
    ctx = make_ctx(store)
    doc = {"prompt": {"ref": "pr_x@v26.0602"}}
    out = resolve_refs(doc, ctx)
    assert out == {"prompt": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Hi"}}}}
    assert ctx.problems == []


def test_sibling_keys_win_over_entity_body():
    store = {"it_x@v26.0602": {"id": "it_x", "required": False, "question": {"prompt": {"ref": "pr_x@v26.0602"}}},
             "pr_x@v26.0602": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Q"}}}}
    ctx = make_ctx(store)
    doc = {"ref": "it_x@v26.0602", "required": True}
    out = resolve_refs(doc, ctx)
    assert out["required"] is True            # sibling wins
    assert "ref" not in out                   # ref key dropped after resolution
    assert out["question"]["prompt"]["content"]["en"]["text"] == "Q"  # nested ref resolved


def test_unresolved_ref_records_problem_and_keeps_node():
    ctx = make_ctx({})
    doc = {"prompt": {"ref": "pr_missing@v26.0602"}}
    out = resolve_refs(doc, ctx)
    assert len(ctx.problems) == 1
    assert ctx.problems[0].kind == "unresolved_ref"
    assert ctx.problems[0].where == "pr_missing@v26.0602"
    # node is left structurally intact (ref kept) so other passes can continue
    assert out["prompt"]["ref"] == "pr_missing@v26.0602"


def test_collects_all_unresolved_refs():
    ctx = make_ctx({})
    doc = {"a": {"ref": "pr_1@v26.0602"}, "b": [{"ref": "pr_2@v26.0602"}]}
    resolve_refs(doc, ctx)
    wheres = {p.where for p in ctx.problems}
    assert wheres == {"pr_1@v26.0602", "pr_2@v26.0602"}


def test_non_ref_dicts_pass_through():
    ctx = make_ctx({})
    doc = {"option": {"input_data_type": "choice", "options": [{"index": 1, "value": 0}]}}
    assert resolve_refs(doc, ctx) == doc
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_resolve.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.context'`

- [ ] **Step 3: Implement `context.py`**

```python
from collections.abc import Callable
from dataclasses import dataclass, field

from .errors import Problem
from .policy import RuntimePolicy


@dataclass
class Ctx:
    """Mutable context threaded through every pass."""

    locale: str
    runtime_policy: RuntimePolicy
    viewer_manifest: dict
    resolve_entity: Callable[[str], dict | None]
    problems: list[Problem] = field(default_factory=list)
    stripped_scorer_refs: list[str] = field(default_factory=list)
    stripped_logic_rule_ids: list[str] = field(default_factory=list)
    available_locales: set[str] = field(default_factory=set)
```

- [ ] **Step 4: Implement `resolve.py`**

```python
from .context import Ctx
from .errors import Problem


def resolve_refs(node, ctx: Ctx):
    """Pass 1: recursively inline every {"ref": "<id>@<version>"} object with the
    referenced entity body. Sibling keys on the ref node win over the entity body;
    the 'ref' key is dropped after resolution. Recurses into resolved content so
    nested refs resolve transitively. Unresolved refs are recorded as problems and
    the node is left intact so later passes can continue (collect-all)."""
    if isinstance(node, dict):
        ref = node.get("ref")
        if isinstance(ref, str) and "@" in ref:
            body = ctx.resolve_entity(ref)
            if body is None:
                ctx.problems.append(
                    Problem(kind="unresolved_ref", detail=f"cannot resolve {ref}", where=ref)
                )
                return {k: resolve_refs(v, ctx) for k, v in node.items()}
            merged = dict(body)
            for k, v in node.items():
                if k != "ref":
                    merged[k] = v
            return {k: resolve_refs(v, ctx) for k, v in merged.items()}
        return {k: resolve_refs(v, ctx) for k, v in node.items()}
    if isinstance(node, list):
        return [resolve_refs(x, ctx) for x in node]
    return node
```

- [ ] **Step 5: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_resolve.py -q`
Expected: PASS (5 passed)

- [ ] **Step 6: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/context.py questionnaire-runtime-denormaliser/src/denormaliser/resolve.py questionnaire-runtime-denormaliser/tests/test_resolve.py
git commit -m "feat(denormaliser): Ctx + ref resolution pass"
```

---

### Task 5: Locale application (locale.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/locale.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_locale.py`

Language-maps to trim are the dict values of keys named `content` or `translations`. A language-map is a dict whose keys all match the language-code pattern. Trimming keeps only the active locale (or all locales if `pre_fetch_all_locales`); a required map missing the locale records a `missing_locale` problem. `ctx.available_locales` accumulates every locale seen across the document.

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.context import Ctx
from denormaliser.locale import apply_locale
from denormaliser.policy import RuntimePolicy


def make_ctx(locale="en", pre_fetch=False):
    return Ctx(
        locale=locale,
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"], pre_fetch_all_locales=pre_fetch),
        viewer_manifest={},
        resolve_entity=lambda ref: None,
    )


def test_trims_content_map_to_locale():
    ctx = make_ctx("en")
    doc = {"prompt": {"content": {
        "en": {"status": "validated", "text": "Hello"},
        "pt": {"status": "validated", "text": "Olá"},
    }}}
    out = apply_locale(doc, ctx)
    assert out["prompt"]["content"] == {"en": {"status": "validated", "text": "Hello"}}
    assert ctx.available_locales == {"en", "pt"}
    assert ctx.problems == []


def test_trims_translations_map():
    ctx = make_ctx("en")
    doc = {"translations": {"en": {"status": "validated", "title": "T"}, "pt": {"status": "validated", "title": "Tp"}}}
    out = apply_locale(doc, ctx)
    assert out["translations"] == {"en": {"status": "validated", "title": "T"}}


def test_missing_locale_records_problem():
    ctx = make_ctx("pt")
    doc = {"prompt": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Hello"}}}}
    apply_locale(doc, ctx)
    assert len(ctx.problems) == 1
    assert ctx.problems[0].kind == "missing_locale"
    assert "pt" in ctx.problems[0].detail


def test_pre_fetch_all_locales_keeps_all():
    ctx = make_ctx("en", pre_fetch=True)
    doc = {"prompt": {"content": {"en": {"status": "v", "text": "H"}, "pt": {"status": "v", "text": "O"}}}}
    out = apply_locale(doc, ctx)
    assert set(out["prompt"]["content"].keys()) == {"en", "pt"}
    assert ctx.available_locales == {"en", "pt"}


def test_non_language_content_is_not_treated_as_map():
    # An options array under 'content' is NOT a language map (keys aren't lang codes).
    ctx = make_ctx("en")
    doc = {"content": {"en": {"status": "v", "text": "x"}}}
    out = apply_locale(doc, ctx)
    assert out["content"] == {"en": {"status": "v", "text": "x"}}
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_locale.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.locale'`

- [ ] **Step 3: Implement `locale.py`**

```python
import re

from .context import Ctx
from .errors import Problem

_LANG = re.compile(r"^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$")
_MAP_KEYS = {"content", "translations"}


def _is_language_map(value) -> bool:
    return (
        isinstance(value, dict)
        and len(value) > 0
        and all(isinstance(k, str) and _LANG.match(k) for k in value)
    )


def apply_locale(node, ctx: Ctx, where: str = "<root>"):
    """Pass 2: keep only ctx.locale in every content/translations language-map
    (or keep all if pre_fetch_all_locales). Records a missing_locale problem for
    any required map lacking ctx.locale. Accumulates ctx.available_locales."""
    if isinstance(node, dict):
        out = {}
        node_id = node.get("id", where)
        for key, value in node.items():
            if key in _MAP_KEYS and _is_language_map(value):
                ctx.available_locales.update(value.keys())
                if ctx.runtime_policy.pre_fetch_all_locales:
                    out[key] = {lang: apply_locale(v, ctx, node_id) for lang, v in value.items()}
                elif ctx.locale in value:
                    out[key] = {ctx.locale: apply_locale(value[ctx.locale], ctx, node_id)}
                else:
                    ctx.problems.append(
                        Problem(
                            kind="missing_locale",
                            detail=f"'{node_id}' {key} has no locale '{ctx.locale}' (has: {sorted(value)})",
                            where=str(node_id),
                        )
                    )
                    out[key] = value
            else:
                out[key] = apply_locale(value, ctx, node_id)
        return out
    if isinstance(node, list):
        return [apply_locale(x, ctx, where) for x in node]
    return node
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_locale.py -q`
Expected: PASS (5 passed)

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/locale.py questionnaire-runtime-denormaliser/tests/test_locale.py
git commit -m "feat(denormaliser): locale application pass"
```

---

### Task 6: Manifest reconciliation (manifest.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/manifest.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_manifest.py`

Enforce two viewer-support invariants (pre-flight errors, never silent drops): every item's Option widget triple (`{input_data_type}.{measurement_type}.{selection|"single"}`) must be in `manifest.widgets`; every `LogicRule.action.type` must be in `manifest.logic_actions`. Each check is skipped if the corresponding manifest key is absent (permissive). **Note:** Schema 2 questionnaires carry no behavioural-channel declarations, so channel trimming is vacuous here (channels are deployment config recorded by the viewer); the channel concern is documented in FOLLOWUPS for when cognitive-task inputs arrive. This pass only reads the document to find problems; it does not mutate it.

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.context import Ctx
from denormaliser.manifest import reconcile_manifest
from denormaliser.policy import RuntimePolicy


def make_ctx(manifest):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"]),
        viewer_manifest=manifest,
        resolve_entity=lambda ref: None,
    )


def _doc_with_option(option):
    return {"pages": [{"id": "page_1", "elements": [{"id": "it_1", "option": option}]}]}


def test_supported_widget_passes():
    ctx = make_ctx({"widgets": ["choice.ordinal.single"]})
    doc = _doc_with_option({"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single"})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []


def test_unsupported_widget_errors():
    ctx = make_ctx({"widgets": ["choice.nominal.single"]})
    doc = _doc_with_option({"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single"})
    reconcile_manifest(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["unsupported_widget"]
    assert "choice.ordinal.single" in ctx.problems[0].detail


def test_widget_check_skipped_when_manifest_has_no_widgets():
    ctx = make_ctx({})
    doc = _doc_with_option({"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single"})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []


def test_missing_selection_defaults_to_single():
    ctx = make_ctx({"widgets": ["number.interval.single"]})
    doc = _doc_with_option({"input_data_type": "number", "measurement_type": "interval"})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []


def test_unsupported_logic_action_errors():
    ctx = make_ctx({"logic_actions": ["skip", "visibility"]})
    doc = {"pages": [], "logic": [{"id": "r1", "type": "branch", "condition": "x", "action": {}}]}
    reconcile_manifest(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["unsupported_logic_action"]
    assert ctx.problems[0].where == "r1"


def test_supported_logic_action_passes():
    ctx = make_ctx({"logic_actions": ["skip"]})
    doc = {"pages": [], "logic": [{"id": "r1", "type": "skip", "condition": "x", "action": {}}]}
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_manifest.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.manifest'`

- [ ] **Step 3: Implement `manifest.py`**

```python
from .context import Ctx
from .errors import Problem


def _iter_options(node):
    """Yield every dict that looks like an inlined Option (has input_data_type)."""
    if isinstance(node, dict):
        if "input_data_type" in node and "measurement_type" in node:
            yield node
        for v in node.values():
            yield from _iter_options(v)
    elif isinstance(node, list):
        for x in node:
            yield from _iter_options(x)


def _widget_triple(option: dict) -> str:
    return ".".join(
        [
            str(option.get("input_data_type")),
            str(option.get("measurement_type")),
            str(option.get("selection", "single")),
        ]
    )


def reconcile_manifest(doc: dict, ctx: Ctx) -> None:
    """Pass 3: enforce viewer support. Unsupported widget triples and logic-action
    types are pre-flight errors (silently dropping a question or branch would change
    the instrument). Checks are skipped when the manifest omits the relevant key."""
    widgets = ctx.viewer_manifest.get("widgets")
    if widgets is not None:
        allowed = set(widgets)
        for option in _iter_options(doc):
            triple = _widget_triple(option)
            if triple not in allowed:
                ctx.problems.append(
                    Problem(
                        kind="unsupported_widget",
                        detail=f"widget '{triple}' not in viewer manifest",
                        where=triple,
                    )
                )

    logic_actions = ctx.viewer_manifest.get("logic_actions")
    if logic_actions is not None:
        allowed_actions = set(logic_actions)
        for rule in doc.get("logic", []):
            rtype = rule.get("type")
            if rtype not in allowed_actions:
                ctx.problems.append(
                    Problem(
                        kind="unsupported_logic_action",
                        detail=f"logic action '{rtype}' not in viewer manifest",
                        where=str(rule.get("id", rtype)),
                    )
                )
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_manifest.py -q`
Expected: PASS (6 passed)

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/manifest.py questionnaire-runtime-denormaliser/tests/test_manifest.py
git commit -m "feat(denormaliser): manifest reconciliation pass"
```

---

### Task 7: Scorer-impl pinning (scorers.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/scorers.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_scorers.py`

For each `doc["scores"][i]`, resolve the Scorer entity via `ctx.resolve_entity(entry["scorer"])`, compute `chosen = first kind in policy.scorer_impl_preference present in both the scorer's implementation kinds AND manifest.scorer_impl_kinds`, and embed the matching implementation dict as `entry["impl"]`. Empty intersection → `no_scorer_impl` problem.

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.context import Ctx
from denormaliser.policy import RuntimePolicy
from denormaliser.scorers import pin_scorers

SCORER = {
    "id": "scr_phq9",
    "implementations": [
        {"kind": "wasm", "url": "https://x/scorer.wasm", "sha256": "0" * 64},
        {"kind": "http", "url": "https://x/score"},
        {"kind": "python", "package": "behaverse-scorer-phq9==26.0602"},
    ],
}


def make_ctx(preference, manifest_kinds):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=preference),
        viewer_manifest={"scorer_impl_kinds": manifest_kinds},
        resolve_entity=lambda ref: SCORER if ref == "scr_phq9@v26.0602" else None,
    )


def test_pins_first_preference_in_intersection():
    ctx = make_ctx(["wasm", "http"], ["wasm", "http"])
    doc = {"scores": [{"id": "phq9_total", "scorer": "scr_phq9@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert doc["scores"][0]["impl"] == {"kind": "wasm", "url": "https://x/scorer.wasm", "sha256": "0" * 64}
    assert ctx.problems == []


def test_skips_preferences_not_supported_by_viewer():
    # wasm preferred but viewer only supports http -> http chosen.
    ctx = make_ctx(["wasm", "http"], ["http"])
    doc = {"scores": [{"id": "phq9_total", "scorer": "scr_phq9@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert doc["scores"][0]["impl"]["kind"] == "http"


def test_empty_intersection_records_problem():
    # viewer supports only 'r', scorer has no 'r' impl.
    ctx = make_ctx(["r"], ["r"])
    doc = {"scores": [{"id": "phq9_total", "scorer": "scr_phq9@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["no_scorer_impl"]
    assert ctx.problems[0].where == "phq9_total"


def test_unresolvable_scorer_records_problem():
    ctx = make_ctx(["wasm"], ["wasm"])
    doc = {"scores": [{"id": "x", "scorer": "scr_missing@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["no_scorer_impl"]


def test_no_scores_key_is_noop():
    ctx = make_ctx(["wasm"], ["wasm"])
    doc = {"pages": []}
    pin_scorers(doc, ctx)
    assert ctx.problems == []
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_scorers.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.scorers'`

- [ ] **Step 3: Implement `scorers.py`**

```python
from .context import Ctx
from .errors import Problem


def pin_scorers(doc: dict, ctx: Ctx) -> None:
    """Pass 4: for each scores[] entry, choose the implementation kind = first in
    runtime_policy.scorer_impl_preference present in BOTH the Scorer's impl kinds
    AND viewer_manifest.scorer_impl_kinds; embed it as entry['impl']. Empty
    intersection (or unresolvable scorer) -> no_scorer_impl problem (OD-18d)."""
    viewer_kinds = set(ctx.viewer_manifest.get("scorer_impl_kinds", []))
    for entry in doc.get("scores", []):
        scorer_ref = entry.get("scorer")
        scorer = ctx.resolve_entity(scorer_ref) if scorer_ref else None
        if scorer is None:
            ctx.problems.append(
                Problem(kind="no_scorer_impl", detail=f"cannot resolve scorer {scorer_ref}",
                        where=str(entry.get("id", scorer_ref)))
            )
            continue
        impls = {impl["kind"]: impl for impl in scorer.get("implementations", [])}
        chosen_kind = next(
            (k for k in ctx.runtime_policy.scorer_impl_preference if k in impls and k in viewer_kinds),
            None,
        )
        if chosen_kind is None:
            ctx.problems.append(
                Problem(
                    kind="no_scorer_impl",
                    detail=(
                        f"no impl kind in (preference={ctx.runtime_policy.scorer_impl_preference} "
                        f"∩ scorer={sorted(impls)} ∩ viewer={sorted(viewer_kinds)})"
                    ),
                    where=str(entry.get("id", scorer_ref)),
                )
            )
            continue
        entry["impl"] = dict(impls[chosen_kind])
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_scorers.py -q`
Expected: PASS (5 passed)

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/scorers.py questionnaire-runtime-denormaliser/tests/test_scorers.py
git commit -m "feat(denormaliser): scorer-impl pinning pass"
```

---

### Task 8: Scoring stripping (scoring.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/scoring.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_scoring.py`

Compute `branching_required` = union over every LogicRule (condition + the rule's action string values) of `extract_score_refs`. Then: if `disable_in_session_scoring` → drop all scores (record their `scorer` refs) and every rule that references a score (record rule ids); elif not `show_score` → keep only branching-required scores (record stripped `scorer` refs); else keep all. This pass mutates `doc["scores"]` / `doc["logic"]` and appends to `ctx.stripped_*`.

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.context import Ctx
from denormaliser.policy import RuntimePolicy
from denormaliser.scoring import strip_scores


def make_ctx(show_score=False, disable=False):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(
            scorer_impl_preference=["wasm"], show_score=show_score, disable_in_session_scoring=disable
        ),
        viewer_manifest={},
        resolve_entity=lambda ref: None,
    )


def _doc():
    return {
        "scores": [
            {"id": "total", "scorer": "scr_x@v26.0602", "path": "/total"},
            {"id": "display_only", "scorer": "scr_y@v26.0602", "path": "/extra"},
        ],
        "logic": [
            {"id": "branch_on_total", "type": "branch", "condition": 'score("total") >= 10', "action": {"skip_to": "page_end"}},
        ],
    }


def test_show_score_true_keeps_all():
    ctx = make_ctx(show_score=True)
    doc = _doc()
    strip_scores(doc, ctx)
    assert {s["id"] for s in doc["scores"]} == {"total", "display_only"}
    assert ctx.stripped_scorer_refs == []


def test_show_score_false_keeps_only_branching_required():
    ctx = make_ctx(show_score=False)
    doc = _doc()
    strip_scores(doc, ctx)
    assert {s["id"] for s in doc["scores"]} == {"total"}        # branching-required kept
    assert ctx.stripped_scorer_refs == ["scr_y@v26.0602"]      # display-only stripped
    assert len(doc["logic"]) == 1                               # logic untouched here


def test_disable_in_session_scoring_strips_everything():
    ctx = make_ctx(disable=True)
    doc = _doc()
    strip_scores(doc, ctx)
    assert doc["scores"] == []
    assert doc["logic"] == []                                   # score-dependent rule removed
    assert sorted(ctx.stripped_scorer_refs) == ["scr_x@v26.0602", "scr_y@v26.0602"]
    assert ctx.stripped_logic_rule_ids == ["branch_on_total"]


def test_disable_keeps_logic_rules_without_score_deps():
    ctx = make_ctx(disable=True)
    doc = _doc()
    doc["logic"].append({"id": "skip_plain", "type": "skip", "condition": "answered(it_1)", "action": {"skip_to": "p2"}})
    strip_scores(doc, ctx)
    assert [r["id"] for r in doc["logic"]] == ["skip_plain"]
    assert ctx.stripped_logic_rule_ids == ["branch_on_total"]


def test_no_scores_key_is_noop():
    ctx = make_ctx(show_score=False)
    doc = {"pages": []}
    strip_scores(doc, ctx)
    assert ctx.stripped_scorer_refs == []
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_scoring.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.scoring'`

- [ ] **Step 3: Implement `scoring.py`**

```python
from .context import Ctx
from .expressions import extract_score_refs


def _action_strings(action) -> str:
    if not isinstance(action, dict):
        return ""
    return " ".join(str(v) for v in action.values() if isinstance(v, str))


def _rule_score_refs(rule: dict, declared_ids: set[str]) -> set[str]:
    refs = extract_score_refs(rule.get("condition"), declared_ids)
    refs |= extract_score_refs(_action_strings(rule.get("action")), declared_ids)
    return refs


def strip_scores(doc: dict, ctx: Ctx) -> None:
    """Pass 5: apply OD-18e scoring stripping. branching_required = every declared
    score id mentioned by any LogicRule condition/action. disable_in_session_scoring
    strips all scores + every score-dependent rule; show_score=false strips
    display-only scores; show_score=true keeps everything. Records stripped refs/ids."""
    scores = doc.get("scores")
    if not scores:
        return
    declared_ids = {s["id"] for s in scores}
    rules = doc.get("logic", []) or []

    branching_required: set[str] = set()
    for rule in rules:
        branching_required |= _rule_score_refs(rule, declared_ids)

    policy = ctx.runtime_policy

    if policy.disable_in_session_scoring:
        ctx.stripped_scorer_refs.extend(s["scorer"] for s in scores)
        doc["scores"] = []
        kept_rules = []
        for rule in rules:
            if _rule_score_refs(rule, declared_ids):
                if "id" in rule:
                    ctx.stripped_logic_rule_ids.append(rule["id"])
            else:
                kept_rules.append(rule)
        if "logic" in doc:
            doc["logic"] = kept_rules
        return

    if not policy.show_score:
        kept, stripped = [], []
        for s in scores:
            (kept if s["id"] in branching_required else stripped).append(s)
        doc["scores"] = kept
        ctx.stripped_scorer_refs.extend(s["scorer"] for s in stripped)
    # show_score True -> keep all scores untouched.
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_scoring.py -q`
Expected: PASS (5 passed)

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/scoring.py questionnaire-runtime-denormaliser/tests/test_scoring.py
git commit -m "feat(denormaliser): scoring stripping pass (OD-18e)"
```

---

### Task 9: Runtime assembly + provenance (provenance.py)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/provenance.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_provenance.py`

Assemble the final Schema-3-keyed runtime dict from the transformed working doc: pick only Schema-3-allowed top-level keys (`style`, `flow`, `pages`, `blocks`, `scores`, `logic`, `validation`, `extensions`), set `metadata` (with `language` forced to the active locale), `locale`, `available_locales`, `lock_show_score_timing` (from policy), and the `provenance` block. `@context` and any non-allowed source key are dropped.

- [ ] **Step 1: Write the failing tests**

```python
from denormaliser.context import Ctx
from denormaliser.hashing import canonical_hash
from denormaliser.policy import RuntimePolicy
from denormaliser.provenance import assemble_runtime


def make_ctx():
    ctx = Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"], lock_show_score_timing=True),
        viewer_manifest={"viewer_id": "web", "viewer_version": "v26.0610"},
        resolve_entity=lambda ref: None,
    )
    ctx.available_locales = {"en", "pt"}
    ctx.stripped_scorer_refs = ["scr_y@v26.0602"]
    return ctx


def _work():
    return {
        "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
        "metadata": {"id": "qst_demo", "version": "v26.0609", "title": "Demo", "language": "pt"},
        "pages": [{"id": "page_1", "elements": []}],
        "scores": [{"id": "total", "scorer": "scr_x@v26.0602", "path": "/total", "impl": {"kind": "wasm"}}],
    }


def test_assembles_required_top_level_keys():
    ctx = make_ctx()
    rt = assemble_runtime(_work(), ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")
    assert set(rt).issuperset({"provenance", "metadata", "locale", "pages"})
    assert "@context" not in rt                                   # dropped
    assert rt["locale"] == "en"
    assert rt["available_locales"] == ["en", "pt"]               # sorted
    assert rt["metadata"]["language"] == "en"                    # forced to active locale
    assert rt["lock_show_score_timing"] is True                 # from policy


def test_provenance_block_fields():
    ctx = make_ctx()
    rt = assemble_runtime(_work(), ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")
    prov = rt["provenance"]
    assert prov["source_questionnaire_id"] == "qst_demo"
    assert prov["source_questionnaire_version"] == "v26.0609"
    assert prov["locale"] == "en"
    assert prov["generated_at"] == "2026-06-10T00:00:00Z"
    assert prov["denormaliser_version"] == "v26.0610"
    assert prov["viewer_conformance_hash"] == canonical_hash(ctx.viewer_manifest)
    assert prov["deployment_runtime_policy_hash"] == canonical_hash(ctx.runtime_policy.to_canonical_dict())
    assert prov["stripped_scorer_refs"] == ["scr_y@v26.0602"]


def test_missing_version_raises():
    import pytest
    ctx = make_ctx()
    work = _work()
    del work["metadata"]["version"]
    with pytest.raises(ValueError, match="version"):
        assemble_runtime(work, ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")


def test_empty_stripped_lists_are_omitted():
    ctx = make_ctx()
    ctx.stripped_scorer_refs = []
    rt = assemble_runtime(_work(), ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")
    assert "stripped_scorer_refs" not in rt["provenance"]
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_provenance.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.provenance'`

- [ ] **Step 3: Implement `provenance.py`**

```python
from .context import Ctx
from .hashing import canonical_hash

# Schema-3-allowed top-level keys carried through verbatim from the working doc.
_CARRY_KEYS = ("style", "flow", "pages", "blocks", "scores", "logic", "validation", "extensions")


def assemble_runtime(work: dict, ctx: Ctx, *, generated_at: str, denormaliser_version: str) -> dict:
    """Pass 6: build the final Schema 3 runtime dict from the transformed working
    doc + the context. Picks only Schema-3-allowed keys; attaches provenance."""
    metadata = dict(work.get("metadata", {}))
    version = metadata.get("version")
    if not version:
        raise ValueError("questionnaire metadata is missing 'version' (required for provenance)")
    metadata["language"] = ctx.locale

    provenance = {
        "source_questionnaire_id": metadata["id"],
        "source_questionnaire_version": version,
        "locale": ctx.locale,
        "viewer_conformance_hash": canonical_hash(ctx.viewer_manifest),
        "deployment_runtime_policy_hash": canonical_hash(ctx.runtime_policy.to_canonical_dict()),
        "generated_at": generated_at,
        "denormaliser_version": denormaliser_version,
    }
    if ctx.stripped_scorer_refs:
        provenance["stripped_scorer_refs"] = sorted(set(ctx.stripped_scorer_refs))
    if ctx.stripped_logic_rule_ids:
        provenance["stripped_logic_rule_ids"] = list(ctx.stripped_logic_rule_ids)

    runtime = {
        "provenance": provenance,
        "metadata": metadata,
        "locale": ctx.locale,
        "available_locales": sorted(ctx.available_locales),
        "lock_show_score_timing": ctx.runtime_policy.lock_show_score_timing,
    }
    for key in _CARRY_KEYS:
        if key in work:
            runtime[key] = work[key]
    return runtime
```

- [ ] **Step 4: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_provenance.py -q`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/provenance.py questionnaire-runtime-denormaliser/tests/test_provenance.py
git commit -m "feat(denormaliser): runtime assembly + provenance"
```

---

### Task 10: Validation (validation.py + strict_runtime_schema.json)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/validation.py`
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/strict_runtime_schema.json`
- Test: `questionnaire-runtime-denormaliser/tests/test_validation.py`

Build a `referencing.Registry` from the repo's `schemas/**/schema.json` (same pattern as `library/src/library/validation.py`), validate the input against the questionnaire schema and the output against the runtime schema plus the package-internal strict schema. The internal strict schema is a lightweight tightening (requires `locale` in addition to the canonical Schema 3 requireds); golden tests (Task 12) are the primary shape guarantee. Validation is only run when `schemas_dir` is supplied.

- [ ] **Step 1: Write `strict_runtime_schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://behaverse.org/schemas/runtime/strict-internal/schema.json",
  "title": "Runtime (internal strict) — denormaliser output check",
  "description": "Package-internal tightening of Schema 3. NOT a canonical schema. Used only for denormaliser output validation in tests.",
  "type": "object",
  "required": ["provenance", "metadata", "locale", "pages"],
  "properties": {
    "locale": { "type": "string", "minLength": 2 },
    "available_locales": { "type": "array", "items": { "type": "string" } },
    "pages": { "type": "array", "minItems": 1 },
    "scores": {
      "type": "array",
      "items": { "type": "object", "required": ["id", "scorer", "path", "impl"] }
    }
  }
}
```

- [ ] **Step 2: Write the failing tests**

```python
import pytest
from jsonschema.exceptions import ValidationError

from denormaliser.validation import validate_input, validate_output


def test_validate_input_accepts_minimal_questionnaire(schemas_dir):
    # Mirrors schemas/questionnaire/examples/minimal.json: prompts are ref-only
    # (QuestionInline.prompt is a PromptRef), option is inline. Instrument metadata
    # REQUIRES id+title+description+language.
    q = {
        "metadata": {"id": "qst_x", "title": "X", "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": [{
            "question": {"prompt": {"ref": "pr_x@v26.0609"}},
            "option": {
                "input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
                "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
                "content": {"en": {"status": "validated", "label": "L",
                                   "options": [{"index": 1, "text": "a"}, {"index": 2, "text": "b"}]}},
            },
        }]}],
    }
    validate_input(q, schemas_dir)  # no raise (ref need not resolve — format only)


def test_validate_input_rejects_missing_pages(schemas_dir):
    with pytest.raises(ValidationError):
        validate_input(
            {"metadata": {"id": "qst_x", "title": "X", "description": "d", "language": "en"}},
            schemas_dir,
        )


def test_validate_output_accepts_well_formed_runtime(schemas_dir):
    rt = {
        "provenance": {
            "source_questionnaire_id": "qst_x", "source_questionnaire_version": "v26.0609",
            "locale": "en", "viewer_conformance_hash": "a" * 64, "deployment_runtime_policy_hash": "b" * 64,
            "generated_at": "2026-06-10T00:00:00Z", "denormaliser_version": "v26.0610",
        },
        "metadata": {"id": "qst_x", "title": "X", "language": "en"},
        "locale": "en",
        "pages": [{"id": "page_1", "elements": []}],
    }
    validate_output(rt, schemas_dir)  # no raise against both Schema 3 and strict


def test_validate_output_strict_requires_locale(schemas_dir):
    rt = {
        "provenance": {
            "source_questionnaire_id": "qst_x", "source_questionnaire_version": "v26.0609",
            "locale": "en", "viewer_conformance_hash": "a" * 64, "deployment_runtime_policy_hash": "b" * 64,
            "generated_at": "2026-06-10T00:00:00Z", "denormaliser_version": "v26.0610",
        },
        "metadata": {"id": "qst_x", "title": "X", "language": "en"},
        "pages": [{"id": "page_1", "elements": []}],
        # no top-level "locale" -> strict schema must reject
    }
    with pytest.raises(ValidationError):
        validate_output(rt, schemas_dir)
```

- [ ] **Step 3: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_validation.py -q`
Expected: FAIL — `ModuleNotFoundError: No module named 'denormaliser.validation'`

- [ ] **Step 4: Implement `validation.py`**

```python
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
```

- [ ] **Step 5: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_validation.py -q`
Expected: PASS (4 passed)

- [ ] **Step 6: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/validation.py questionnaire-runtime-denormaliser/src/denormaliser/strict_runtime_schema.json questionnaire-runtime-denormaliser/tests/test_validation.py
git commit -m "feat(denormaliser): input/output validation + internal strict schema"
```

---

### Task 11: Orchestration (api.py + public exports)

**Files:**
- Create: `questionnaire-runtime-denormaliser/src/denormaliser/api.py`
- Modify: `questionnaire-runtime-denormaliser/src/denormaliser/__init__.py`
- Test: `questionnaire-runtime-denormaliser/tests/test_preflight.py`

`denormalise(...)` deep-copies the input, runs validate_input (if `schemas_dir`), then the error-producing passes (resolve → locale → reconcile_manifest → pin_scorers); if `ctx.problems` is non-empty it raises `PreflightError`; otherwise runs `strip_scores`, assembles the runtime, validates the output (if `schemas_dir`), and returns it.

- [ ] **Step 1: Write the failing tests** (`test_preflight.py`)

```python
import pytest

from denormaliser import denormalise, PreflightError, RuntimePolicy


def _policy(**kw):
    return RuntimePolicy(scorer_impl_preference=["wasm", "http"], **kw)


def test_collects_multiple_preflight_problems():
    # An unresolved prompt ref AND a missing locale in inline content -> two problems, one raise.
    q = {
        "metadata": {"id": "qst_x", "version": "v26.0609", "title": "X", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"question": {"prompt": {"ref": "pr_missing@v26.0609"}},
             "option": {"input_data_type": "text", "measurement_type": "nominal",
                        "content": {"pt": {"status": "validated", "label": "só-pt"}}}},
        ]}],
    }
    with pytest.raises(PreflightError) as ei:
        denormalise(q, locale="en", runtime_policy=_policy(), viewer_manifest={},
                    resolve_entity=lambda ref: None, generated_at="2026-06-10T00:00:00Z")
    kinds = sorted(p.kind for p in ei.value.problems)
    assert kinds == ["missing_locale", "unresolved_ref"]


def test_happy_path_returns_runtime():
    q = {
        "metadata": {"id": "qst_x", "version": "v26.0609", "title": "X", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"question": {"prompt": {"content": {"en": {"status": "validated", "text": "Hi"}}}},
             "option": {"input_data_type": "text", "measurement_type": "nominal",
                        "content": {"en": {"status": "validated", "label": "x"}}}},
        ]}],
    }
    rt = denormalise(q, locale="en", runtime_policy=_policy(), viewer_manifest={},
                     resolve_entity=lambda ref: None, generated_at="2026-06-10T00:00:00Z")
    assert rt["provenance"]["source_questionnaire_id"] == "qst_x"
    assert rt["locale"] == "en"
    assert rt["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {"en": {"status": "validated", "text": "Hi"}}
```

- [ ] **Step 2: Run to verify failure**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_preflight.py -q`
Expected: FAIL — `ImportError: cannot import name 'denormalise'`

- [ ] **Step 3: Implement `api.py`**

```python
import copy
from collections.abc import Callable
from pathlib import Path

from .context import Ctx
from .errors import PreflightError
from .locale import apply_locale
from .manifest import reconcile_manifest
from .policy import RuntimePolicy
from .provenance import assemble_runtime
from .resolve import resolve_refs
from .scorers import pin_scorers
from .scoring import strip_scores
from .validation import validate_input, validate_output


def denormalise(
    questionnaire: dict,
    *,
    locale: str,
    runtime_policy: RuntimePolicy,
    viewer_manifest: dict,
    resolve_entity: Callable[[str], dict | None],
    generated_at: str,
    denormaliser_version: str = "v26.0610",
    schemas_dir: Path | None = None,
) -> dict:
    """Turn a Schema 2 questionnaire into a Schema 3 runtime. Pure + I/O-free:
    entity resolution is the injected resolve_entity callable. Raises PreflightError
    (carrying every collected problem) when the questionnaire x viewer x policy
    combination is invalid."""
    if schemas_dir is not None:
        validate_input(questionnaire, schemas_dir)

    ctx = Ctx(
        locale=locale,
        runtime_policy=runtime_policy,
        viewer_manifest=viewer_manifest,
        resolve_entity=resolve_entity,
    )

    work = copy.deepcopy(questionnaire)
    work = resolve_refs(work, ctx)          # pass 1
    work = apply_locale(work, ctx)          # pass 2
    reconcile_manifest(work, ctx)           # pass 3 (read-only, records problems)
    pin_scorers(work, ctx)                  # pass 4

    if ctx.problems:
        raise PreflightError(ctx.problems)

    strip_scores(work, ctx)                 # pass 5
    runtime = assemble_runtime(             # pass 6
        work, ctx, generated_at=generated_at, denormaliser_version=denormaliser_version
    )

    if schemas_dir is not None:
        validate_output(runtime, schemas_dir)
    return runtime
```

- [ ] **Step 4: Update `__init__.py` with public exports**

```python
"""questionnaire-runtime-denormaliser: Schema 2 -> Schema 3 runtime denormaliser."""

from .api import denormalise
from .errors import PreflightError, Problem
from .hashing import canonical_hash
from .policy import RuntimePolicy

__version__ = "0.1.0"
__all__ = ["denormalise", "RuntimePolicy", "PreflightError", "Problem", "canonical_hash"]
```

- [ ] **Step 5: Run to verify pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_preflight.py -q`
Expected: PASS (2 passed)

- [ ] **Step 6: Run the whole suite**

Run: `pytest questionnaire-runtime-denormaliser/ -q`
Expected: PASS (all tests from Tasks 1–11 green)

- [ ] **Step 7: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/api.py questionnaire-runtime-denormaliser/src/denormaliser/__init__.py questionnaire-runtime-denormaliser/tests/test_preflight.py
git commit -m "feat(denormaliser): denormalise() orchestration + public API"
```

---

### Task 12: Golden end-to-end test (realistic fixture)

**Files:**
- Create: `questionnaire-runtime-denormaliser/tests/fixtures/mini_phq.py` (fixture builders)
- Test: `questionnaire-runtime-denormaliser/tests/test_denormalise_golden.py`

A self-contained, fully-resolvable two-item PHQ-style questionnaire with a bilingual prompt (en+pt), one ref'd prompt + one ref'd scorer, a branching LogicRule, one display-only score, and one branching-required score. Exercises the whole pipeline end-to-end and asserts the exact faithful-projection output shape (Schema 2 vocabulary preserved; one locale; scorer pinned; display-only score stripped under show_score=false; provenance complete). Validated against the real schemas.

- [ ] **Step 1: Write the fixture builders** (`tests/fixtures/mini_phq.py`)

```python
"""Self-contained, fully-resolvable fixture for the golden end-to-end test."""

ENTITY_STORE = {
    "pr_mini_1@v26.0609": {
        "id": "pr_mini_1",
        "name": "interest",
        "content": {
            "en": {"status": "validated", "text": "Little interest or pleasure in doing things"},
            "pt": {"status": "validated", "text": "Pouco interesse ou prazer em fazer as coisas"},
        },
    },
    "pr_mini_2@v26.0609": {
        "id": "pr_mini_2",
        "name": "down",
        "content": {
            "en": {"status": "validated", "text": "Feeling down or hopeless"},
            "pt": {"status": "validated", "text": "Sentir-se em baixo ou sem esperança"},
        },
    },
    "opt_freq_4@v26.0609": {
        "id": "opt_freq_4",
        "input_data_type": "choice",
        "measurement_type": "ordinal",
        "selection": "single",
        "options": [
            {"index": 1, "value": 0},
            {"index": 2, "value": 1},
            {"index": 3, "value": 2},
            {"index": 4, "value": 3},
        ],
        "content": {
            "en": {"status": "validated", "label": "Frequency", "options": [
                {"index": 1, "text": "Not at all"}, {"index": 2, "text": "Several days"},
                {"index": 3, "text": "More than half the days"}, {"index": 4, "text": "Nearly every day"}]},
            "pt": {"status": "validated", "label": "Frequência", "options": [
                {"index": 1, "text": "Nunca"}, {"index": 2, "text": "Vários dias"},
                {"index": 3, "text": "Mais de metade dos dias"}, {"index": 4, "text": "Quase todos os dias"}]},
        },
    },
    "scr_mini@v26.0609": {
        "id": "scr_mini",
        "implementations": [
            {"kind": "wasm", "url": "https://behaverse.org/scorers/mini/v26.0609/scorer.wasm", "sha256": "a" * 64},
            {"kind": "http", "url": "https://scorer.behaverse.org/mini/v26.0609"},
        ],
    },
}


def resolve_entity(ref):
    return ENTITY_STORE.get(ref)


def questionnaire():
    return {
        "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
        "metadata": {"id": "qst_mini", "version": "v26.0609", "title": "Mini PHQ",
                     "description": "Two-item PHQ-style fixture.", "language": "en"},
        "pages": [
            {"id": "page_1", "elements": [
                {"id": "it_1",
                 "question": {"prompt": {"ref": "pr_mini_1@v26.0609"}},
                 "option": {"ref": "opt_freq_4@v26.0609"}},
            ]},
            {"id": "page_2", "elements": [
                {"id": "it_2",
                 "question": {"prompt": {"ref": "pr_mini_2@v26.0609"}},
                 "option": {"ref": "opt_freq_4@v26.0609"}},
            ]},
        ],
        "logic": [
            {"id": "branch_high", "type": "branch", "condition": 'score("mini_total") >= 4',
             "action": {"skip_to": "page_2"}},
        ],
        "scores": [
            {"id": "mini_total", "scorer": "scr_mini@v26.0609", "path": "/total"},
            {"id": "mini_label", "scorer": "scr_mini@v26.0609", "path": "/label"},
        ],
    }


VIEWER_MANIFEST = {
    "viewer_id": "behaverse-web-viewer",
    "viewer_version": "v26.0610",
    "widgets": ["choice.ordinal.single"],
    "logic_actions": ["skip", "visibility", "piping", "branch"],
    "scorer_impl_kinds": ["wasm", "http"],
}
```

- [ ] **Step 2: Write the failing golden test** (`test_denormalise_golden.py`)

```python
from denormaliser import RuntimePolicy, denormalise
from tests.fixtures import mini_phq


def _run(schemas_dir, **policy_kw):
    policy = RuntimePolicy(scorer_impl_preference=["wasm", "http"], **policy_kw)
    return denormalise(
        mini_phq.questionnaire(),
        locale="en",
        runtime_policy=policy,
        viewer_manifest=mini_phq.VIEWER_MANIFEST,
        resolve_entity=mini_phq.resolve_entity,
        generated_at="2026-06-10T12:00:00Z",
        denormaliser_version="v26.0610",
        schemas_dir=schemas_dir,
    )


def test_refs_inlined_and_locale_trimmed(schemas_dir):
    rt = _run(schemas_dir)
    opt = rt["pages"][0]["elements"][0]["option"]
    # Faithful projection: Schema 2 vocabulary + structure preserved.
    assert opt["input_data_type"] == "choice"
    assert opt["options"] == [{"index": 1, "value": 0}, {"index": 2, "value": 1},
                              {"index": 3, "value": 2}, {"index": 4, "value": 3}]
    # Locale trimmed to en only.
    assert set(opt["content"].keys()) == {"en"}
    assert opt["content"]["en"]["label"] == "Frequency"
    prompt = rt["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["content"] == {"en": {"status": "validated", "text": "Little interest or pleasure in doing things"}}
    assert rt["available_locales"] == ["en", "pt"]


def test_scorer_pinned_to_wasm(schemas_dir):
    rt = _run(schemas_dir)
    total = next(s for s in rt["scores"] if s["id"] == "mini_total")
    assert total["impl"]["kind"] == "wasm"
    assert total["impl"]["sha256"] == "a" * 64


def test_display_only_score_stripped_when_show_score_false(schemas_dir):
    rt = _run(schemas_dir, show_score=False)
    # mini_total is branching-required (in the LogicRule); mini_label is display-only.
    assert {s["id"] for s in rt["scores"]} == {"mini_total"}
    assert rt["provenance"]["stripped_scorer_refs"] == ["scr_mini@v26.0609"]


def test_show_score_true_keeps_both(schemas_dir):
    rt = _run(schemas_dir, show_score=True)
    assert {s["id"] for s in rt["scores"]} == {"mini_total", "mini_label"}
    assert "stripped_scorer_refs" not in rt["provenance"]


def test_disable_in_session_scoring_strips_all(schemas_dir):
    rt = _run(schemas_dir, disable_in_session_scoring=True)
    assert rt["scores"] == []
    assert rt["logic"] == []
    assert rt["provenance"]["stripped_logic_rule_ids"] == ["branch_high"]


def test_pt_locale_runtime(schemas_dir):
    policy = RuntimePolicy(scorer_impl_preference=["wasm", "http"])
    rt = denormalise(
        mini_phq.questionnaire(), locale="pt", runtime_policy=policy,
        viewer_manifest=mini_phq.VIEWER_MANIFEST, resolve_entity=mini_phq.resolve_entity,
        generated_at="2026-06-10T12:00:00Z", schemas_dir=schemas_dir,
    )
    prompt = rt["pages"][0]["elements"][0]["question"]["prompt"]
    assert prompt["content"]["pt"]["text"] == "Pouco interesse ou prazer em fazer as coisas"
    assert rt["metadata"]["language"] == "pt"
```

- [ ] **Step 3: Add `tests/fixtures/__init__.py`**

Create empty file `questionnaire-runtime-denormaliser/tests/fixtures/__init__.py` so `tests.fixtures` imports resolve.

- [ ] **Step 4: Run to verify failure then pass**

Run: `pytest questionnaire-runtime-denormaliser/tests/test_denormalise_golden.py -q`
Expected: PASS (6 passed). If any fail, fix the implementation pass it points to (golden tests are the integration check across all passes).

- [ ] **Step 5: Commit**

```bash
git add questionnaire-runtime-denormaliser/tests/fixtures questionnaire-runtime-denormaliser/tests/test_denormalise_golden.py
git commit -m "test(denormaliser): golden end-to-end pipeline test"
```

---

### Task 13: README, FOLLOWUPS, and final verification gate

**Files:**
- Create: `questionnaire-runtime-denormaliser/README.md`
- Create: `questionnaire-runtime-denormaliser/FOLLOWUPS.md`

- [ ] **Step 1: Write `README.md`**

````markdown
# questionnaire-runtime-denormaliser

Pure Python library (per **OD-18**) that turns a **Schema 2 Questionnaire** into a
**Schema 3 Runtime**: references inlined, content trimmed to one locale, viewer
features reconciled, Scorer implementations pinned, scoring optionally stripped,
provenance attached. Shared by the Viewer Service (session-mint) and the Editor
(preview). I/O-free — entity resolution is an injected callable.

## Usage

```python
from pathlib import Path
from denormaliser import denormalise, RuntimePolicy

runtime = denormalise(
    questionnaire,                       # Schema 2 dict (may contain refs)
    locale="en",
    runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm", "http"], show_score=False),
    viewer_manifest=manifest,            # Schema 7 dict
    resolve_entity=lambda ref: store.get(ref),   # "pr_x@v26.0609" -> entity body | None
    generated_at="2026-06-10T12:00:00Z",
    schemas_dir=Path("schemas"),         # optional: validate input + output
)
```

`denormalise` raises `denormaliser.PreflightError` (carrying every collected
`Problem`) when the questionnaire × viewer × policy combination is invalid
(unresolved ref, missing locale, no scorer-impl intersection, unsupported widget,
unsupported logic action).

## Development

```bash
source ../.venv/bin/activate
pip install -e .[dev]
pytest -q
```
````

- [ ] **Step 2: Write `FOLLOWUPS.md`**

```markdown
# Follow-ups — questionnaire-runtime-denormaliser

Deferred / out-of-scope work discovered while building the denormaliser.

- **Complete the canonical example entity set + regenerate runtime examples.**
  The canonical Schema 2 examples (`schemas/questionnaire/examples/{minimal,phq9,kitchensink}.json`)
  reference ~14 reusable entities that don't exist in `schemas/questionnaire/examples/library_examples/`
  (e.g. `pr_feel_good`, `pr_phq9_2..9`, and kitchensink's `pr_essay`/`pr_mood`/`pr_name`/`pr_topics`/`pr_year_born`).
  They pass `tools/tests` only because JSON Schema checks ref *format*, not resolvability.
  Author the missing entities, then regenerate `schemas/runtime/examples/*.json` from real denormaliser output.

- **Cycle detection in ref resolution.** v1 assumes the entity graph is acyclic
  (guaranteed by hard-pinning, OD-06). A malformed cyclic input would recurse until
  Python's recursion limit. Add an explicit visited-set guard if untrusted inputs become possible.

- **Expand the internal strict runtime schema.** Currently a lightweight tightening
  (requires top-level `locale`; scores require `impl`). Could be expanded to fully
  validate the faithful-projection option/item shapes once the Web Viewer pins the contract.

- **Behavioural-channel reconciliation.** Vacuous for questionnaire input (Schema 2 carries
  no channel declarations). Revisit when cognitive-task inputs (which may declare channels) arrive.
```

- [ ] **Step 3: Run the full denormaliser suite + the project's consistency gate**

Run:
```bash
source .venv/bin/activate
pytest questionnaire-runtime-denormaliser/ -q                 # all denormaliser tests green
pytest tools/tests/ -q                                        # 309 — schemas untouched, still green
python tools/validate_schemas.py 2>&1 | tail -3               # 44 examples + 1 SKIP, unchanged
```
Expected: denormaliser suite fully green; `tools/tests` still 309 passed; schema validator unchanged. (The `library/` and `library-web/` suites are untouched by this work and need not be re-run, but may be run for full assurance.)

- [ ] **Step 4: Commit**

```bash
git add questionnaire-runtime-denormaliser/README.md questionnaire-runtime-denormaliser/FOLLOWUPS.md
git commit -m "docs(denormaliser): README + FOLLOWUPS"
```

---

## Self-review checklist (run before execution)

- **Spec coverage:** ref resolution (T4) ✓ · locale + strict missing-locale (T5) ✓ · manifest reconciliation (T6) ✓ · scorer-impl pinning (T7) ✓ · scoring stripping incl. disable_in_session_scoring (T8) ✓ · provenance + hashes (T9) ✓ · input/output + internal strict validation (T10) ✓ · collect-all PreflightError (T11) ✓ · faithful projection + self-contained golden fixtures (T12) ✓ · canonical_hash export (T1) ✓ · pure/injectable boundary (T11 signature) ✓ · no Schema 3 bump (T10 keeps canonical schema untouched; strict schema is package-internal) ✓.
- **Type consistency:** `Ctx` fields used identically across passes; `denormalise(...)` signature matches the spec §3; `resolve_entity(ref)->dict|None` consistent T4/T7/T12; `extract_score_refs(expr, declared_ids)` consistent T3/T8; `assemble_runtime(work, ctx, *, generated_at, denormaliser_version)` consistent T9/T11.
- **No placeholders:** every step shows real code/commands with expected output.
```

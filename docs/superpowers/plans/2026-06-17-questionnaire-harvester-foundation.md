# Questionnaire Harvester Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the prior agent's manual PHQ-9 pilot into a repeatable harvester package that automatically extracts a PsyToolkit questionnaire into canonical Schema-2 entities, reusing shared scales via the existing de-dup engine, and proves it end-to-end on GAD-7.

**Architecture:** A standalone `questionnaire-harvester/` Python package that takes `library/` as a read-only dependency (reusing its IDs, writer, and validator). A pipeline of small modules — `sources/` (site → raw extraction), `draft` (raw → canonical entities), `dedup` (fingerprint match/reuse, already built), `licensing` (rich flag → canonical enum), `tracking` (markdown register + questions) — wired behind a CLI. Output lands in the tracked `output/` staging area; promotion to the library is a separate manual step (out of scope here).

**Tech Stack:** Python 3.11+, `pytest`, `beautifulsoup4` + `httpx` (adapter fetch/parse), stdlib `hashlib`/`json`/`dataclasses`. Reuses `library` (jsonschema/referencing validator).

## Global Constraints

- **Isolation:** the harvester writes only to `questionnaire-harvester/output/` (tracked) and `questionnaire-harvester/{raw,_corpus}/` (gitignored). It never writes to `schemas/`, `library/`, or any production content tree. Promotion + `library ingest` is out of scope for this plan.
- **Canonical conventions:** follow `questionnaire-harvester/conventions.md` exactly. Id prefixes via `library.importers.survey_db.ids` (`opt_ pr_ ins_ ctx_ msg_ q_ it_ qst_ …`); ids = `sanitize()` (lowercase, non-`[a-z0-9_]`→`_`). Refs hard-pinned `{"ref": "<id>@vYY.MMDD"}` (CalVer).
- **Validator gotchas (hard rules):** `provenance` is closed to exactly `{source, imported_at, importer_version}`. ALL harvest metadata (source URL, harvest date, rich license block) goes in `x_*` keys at the `metadata` level. `metadata.license` is the fixed enum: `public_domain | cc0 | cc_by | cc_by_nc | cc_by_sa | proprietary_open_redistribution | proprietary_restricted | unknown | mixed_see_components`.
- **License policy:** capture content in full regardless of license; flag richly; default ambiguous → `unknown` + `author_contact_needed: true`. See `about_licenses.md`.
- **Entity shapes:** match the PHQ-9 pilot in `output/` exactly (Option/Instruction/Prompt/Questionnaire). Page elements are inline `{option:{ref}, question:{prompt:{ref}, instruction?:{ref}, context?:{ref}}, required?}` — `question` is inline, NOT a `q_` entity.
- **CalVer version for this batch:** `v26.0617` (matches the existing pilot; refs within a batch share one version).
- **TDD:** every task is test-first. Run from repo root unless noted. Commit at the end of each task.

---

### Task 1: Package scaffold + library dependency + validate the existing pilot

Proves the dependency wiring is correct and the prior PHQ-9 pilot is genuinely Schema-2 valid through the library's own validator. This is the foundation every later task builds on.

**Files:**
- Create: `questionnaire-harvester/pyproject.toml`
- Create: `questionnaire-harvester/src/harvester/__init__.py`
- Create: `questionnaire-harvester/src/harvester/validate.py`
- Test: `questionnaire-harvester/tests/test_validate.py`
- Modify: `questionnaire-harvester/.gitignore` (ensure `_corpus/`, `raw/`, `*.egg-info/`, `.venv/` ignored)

**Interfaces:**
- Produces: `validate_tree(out_dir: Path, schemas_dir: Path, release: str | None = None) -> list[str]` — returns a list of human-readable error strings (empty list = all valid). Wraps `library.loader.load_tree` + `library.validation.build_registry` + `validate_artifact`.

- [ ] **Step 1: Write `pyproject.toml`**

```toml
[project]
name = "questionnaire-harvester"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["beautifulsoup4>=4.12", "httpx>=0.27"]

[project.optional-dependencies]
dev = ["pytest>=8"]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.setuptools.packages.find]
where = ["src"]

[project.scripts]
harvest = "harvester.cli:main"
```

- [ ] **Step 2: Create the package init**

`src/harvester/__init__.py`:
```python
"""questionnaire-harvester: web resources -> canonical Schema-2 entities."""
__version__ = "0.1.0"
```

- [ ] **Step 3: Write the failing test**

`tests/test_validate.py`:
```python
from pathlib import Path
from harvester.validate import validate_tree

REPO = Path(__file__).resolve().parents[3]
SCHEMAS = REPO / "schemas"
PILOT = REPO / "questionnaire-harvester" / "output"

def test_phq9_pilot_is_schema2_valid():
    errors = validate_tree(PILOT, SCHEMAS, release="v26.0617")
    assert errors == [], "PHQ-9 pilot must validate: " + "; ".join(errors)
```

- [ ] **Step 4: Install deps and run test to verify it fails**

```bash
cd questionnaire-harvester && pip install -e . && pip install -e ../library && pip install pytest beautifulsoup4 httpx
cd .. && PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_validate.py -v
```
Expected: FAIL with `ModuleNotFoundError: No module named 'harvester.validate'`.

- [ ] **Step 5: Implement `validate.py`**

`src/harvester/validate.py`:
```python
from pathlib import Path
from library.loader import load_tree
from library.validation import build_registry, validate_artifact

def validate_tree(out_dir: Path, schemas_dir: Path, release: str | None = None) -> list[str]:
    """Validate every entity in out_dir against the canonical schemas.
    Returns a list of error strings (empty = all valid)."""
    registry = build_registry(Path(schemas_dir))
    errors: list[str] = []
    for art in load_tree(Path(out_dir), release):
        try:
            validate_artifact(art, registry, Path(schemas_dir))
        except Exception as e:  # SchemaInvalidError or ref-resolution failure
            errors.append(f"{art.path.name}: {e}")
    return errors
```

- [ ] **Step 6: Run test to verify it passes**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_validate.py -v
```
Expected: PASS. (If it fails on a real schema error in the pilot, that is a genuine finding — record it and stop for owner review rather than editing the schema.)

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/pyproject.toml questionnaire-harvester/src questionnaire-harvester/tests questionnaire-harvester/.gitignore
git commit -m "feat(harvester): package scaffold + validator wrapper; PHQ-9 pilot validates"
```

---

### Task 2: De-dup engine as an importable API

The engine exists as a CLI script (`dedup/build_catalogue.py`). Lift its logic into an importable module the draft layer can call, without breaking the CLI.

**Files:**
- Create: `questionnaire-harvester/src/harvester/dedup.py`
- Modify: `questionnaire-harvester/dedup/build_catalogue.py` (import from the new module instead of duplicating `fingerprint`/`norm`)
- Test: `questionnaire-harvester/tests/test_dedup.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `norm(s) -> str` and `option_fingerprint(option: dict) -> str` (the exact logic from `build_catalogue.py`).
  - `load_scales_index(path: Path) -> dict[str, list[str]]` — reads `dedup/scales-index.json`.
  - `lookup_option(option: dict, index: dict[str, list[str]]) -> str | None` — returns an existing option id for an exact fingerprint match, else `None`.

- [ ] **Step 1: Write the failing test**

`tests/test_dedup.py`:
```python
from harvester.dedup import option_fingerprint, lookup_option

PHQ_FREQ = {
    "input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
    "dimension": "frequency",
    "options": [{"index": i, "value": float(i - 1)} for i in range(1, 5)],
    "content": {"en": {"options": [
        {"index": 1, "text": "Not at all"}, {"index": 2, "text": "Several days"},
        {"index": 3, "text": "More than half the days"}, {"index": 4, "text": "Nearly every day"}]}},
}

def test_fingerprint_is_stable_and_case_insensitive():
    a = option_fingerprint(PHQ_FREQ)
    upper = {**PHQ_FREQ, "content": {"en": {"options": [
        {"index": o["index"], "text": o["text"].upper()} for o in PHQ_FREQ["content"]["en"]["options"]]}}}
    assert option_fingerprint(upper) == a  # norm() folds case

def test_lookup_reuses_existing_id():
    index = {option_fingerprint(PHQ_FREQ): ["opt_phq_frequency_4"]}
    assert lookup_option(PHQ_FREQ, index) == "opt_phq_frequency_4"

def test_lookup_returns_none_for_unknown_scale():
    other = {**PHQ_FREQ, "options": [{"index": 1, "value": 0.0}, {"index": 2, "value": 1.0}],
             "content": {"en": {"options": [{"index": 1, "text": "No"}, {"index": 2, "text": "Yes"}]}}}
    assert lookup_option(other, {option_fingerprint(PHQ_FREQ): ["opt_phq_frequency_4"]}) is None
```

- [ ] **Step 2: Run to verify it fails**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_dedup.py -v
```
Expected: FAIL `No module named 'harvester.dedup'`.

- [ ] **Step 3: Implement `dedup.py`**

`src/harvester/dedup.py`:
```python
import json, hashlib
from pathlib import Path

def norm(s) -> str:
    return " ".join(str(s).strip().lower().split())

def option_fingerprint(o: dict) -> str:
    en = (o.get("content", {}).get("en") or {})
    anchors = [norm(a.get("text", "")) for a in (en.get("options") or [])]
    values = [a.get("value") for a in (o.get("options") or [])]
    base = [o.get("input_data_type"), o.get("measurement_type"), o.get("selection")]
    if anchors:
        payload = base + [values, anchors]
    else:
        payload = base + [o.get("dimension"), norm(en.get("units", ""))]
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]

def load_scales_index(path: Path) -> dict[str, list[str]]:
    p = Path(path)
    return json.loads(p.read_text()) if p.exists() else {}

def lookup_option(option: dict, index: dict[str, list[str]]) -> str | None:
    ids = index.get(option_fingerprint(option))
    return sorted(ids)[0] if ids else None
```

- [ ] **Step 4: Refactor the CLI to reuse the module (no logic duplication)**

In `dedup/build_catalogue.py`, replace the inline `norm`/`fingerprint` defs with:
```python
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
from harvester.dedup import norm, option_fingerprint as fingerprint
```
Keep the rest (file scanning, index/catalogue writing) unchanged.

- [ ] **Step 5: Run tests + confirm the CLI still builds the catalogue**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_dedup.py -v
python3 questionnaire-harvester/dedup/build_catalogue.py questionnaire-harvester/output
```
Expected: tests PASS; CLI prints `indexed N options; ...` and rewrites `scales-index.json`/`scales-catalogue.md`.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/dedup.py questionnaire-harvester/dedup/build_catalogue.py questionnaire-harvester/tests/test_dedup.py
git commit -m "feat(harvester): extract dedup fingerprint/lookup into importable module"
```

---

### Task 3: Generalize de-dup to Instructions

Instructions recur across instruments (the PHQ "Over the last 2 weeks…" stem is shared by GAD-7). Add a text-based fingerprint + lookup so shared Instructions also dedup.

**Files:**
- Modify: `questionnaire-harvester/src/harvester/dedup.py`
- Test: `questionnaire-harvester/tests/test_dedup.py` (extend)

**Interfaces:**
- Produces:
  - `instruction_fingerprint(instruction: dict) -> str` — sha256 over `norm(content.en.text)`.
  - `build_instruction_index(out_dir: Path) -> dict[str, list[str]]` — scans `out_dir/instructions/*.json`.
  - `lookup_instruction(instruction: dict, index: dict[str, list[str]]) -> str | None`.

- [ ] **Step 1: Write the failing test (append to `tests/test_dedup.py`)**

```python
from harvester.dedup import instruction_fingerprint, lookup_instruction

INS = {"content": {"en": {"text": "Over the last 2 weeks, how often have you been bothered?"}}}

def test_instruction_dedup_is_case_and_space_insensitive():
    a = instruction_fingerprint(INS)
    b = instruction_fingerprint({"content": {"en": {"text": "  Over the LAST 2 weeks, how often   have you been bothered? "}}})
    assert a == b
    assert lookup_instruction(INS, {a: ["ins_phq_2weeks"]}) == "ins_phq_2weeks"
```

- [ ] **Step 2: Run to verify it fails**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_dedup.py::test_instruction_dedup_is_case_and_space_insensitive -v
```
Expected: FAIL `cannot import name 'instruction_fingerprint'`.

- [ ] **Step 3: Implement in `dedup.py`**

```python
import glob, os

def instruction_fingerprint(ins: dict) -> str:
    text = norm(((ins.get("content", {}).get("en") or {}).get("text", "")))
    return hashlib.sha256(text.encode()).hexdigest()[:16]

def build_instruction_index(out_dir: Path) -> dict[str, list[str]]:
    index: dict[str, list[str]] = {}
    for fp in sorted(glob.glob(os.path.join(str(out_dir), "instructions", "*.json"))):
        ins = json.loads(Path(fp).read_text())
        index.setdefault(instruction_fingerprint(ins), []).append(ins["id"])
    return index

def lookup_instruction(ins: dict, index: dict[str, list[str]]) -> str | None:
    ids = index.get(instruction_fingerprint(ins))
    return sorted(ids)[0] if ids else None
```

- [ ] **Step 4: Run + commit**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_dedup.py -v
git add questionnaire-harvester/src/harvester/dedup.py questionnaire-harvester/tests/test_dedup.py
git commit -m "feat(harvester): dedup Instructions by normalized text"
```

---

### Task 4: Licensing module (rich block → canonical enum)

**Files:**
- Create: `questionnaire-harvester/src/harvester/licensing.py`
- Test: `questionnaire-harvester/tests/test_licensing.py`

**Interfaces:**
- Produces:
  - `@dataclass LicenseFlag` with fields `license_class, license_status, commercial_use, redistribution, translation, source_url, author_contact_needed, notes`.
  - `LicenseFlag.canonical_enum() -> str` mapping per `about_licenses.md §5`.
  - `LicenseFlag.x_metadata() -> dict` — the `x_license_*` keys for `metadata`.
  - `LicenseFlag.unknown(source_url: str) -> LicenseFlag` classmethod (the ambiguous default).

- [ ] **Step 1: Write the failing test**

`tests/test_licensing.py`:
```python
from harvester.licensing import LicenseFlag

def test_public_domain_maps_to_enum():
    f = LicenseFlag(license_class="public_domain", license_status="confirmed",
                    commercial_use="yes", redistribution="yes", translation="yes",
                    source_url="https://x", author_contact_needed=False, notes="")
    assert f.canonical_enum() == "public_domain"

def test_free_research_maps_to_proprietary_open_redistribution():
    f = LicenseFlag(license_class="free_research", license_status="inferred",
                    commercial_use="no", redistribution="yes", translation="unknown",
                    source_url="https://x", author_contact_needed=False, notes="research only")
    assert f.canonical_enum() == "proprietary_open_redistribution"

def test_unknown_default_flags_author_contact():
    f = LicenseFlag.unknown("https://src")
    assert f.canonical_enum() == "unknown"
    assert f.author_contact_needed is True
    assert f.x_metadata()["x_license_status"] == "unknown"
    assert f.x_metadata()["x_source_url"] == "https://src"
```

- [ ] **Step 2: Run to verify it fails**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_licensing.py -v
```
Expected: FAIL `No module named 'harvester.licensing'`.

- [ ] **Step 3: Implement `licensing.py`**

```python
from dataclasses import dataclass

_ENUM = {
    "public_domain": "public_domain", "cc0": "cc0", "cc_by": "cc_by",
    "cc_by_nc": "cc_by_nc", "cc_by_sa": "cc_by_sa",
    "free_research": "proprietary_open_redistribution",
    "proprietary": "proprietary_restricted",
    "mixed": "mixed_see_components", "unknown": "unknown",
}

@dataclass
class LicenseFlag:
    license_class: str
    license_status: str          # confirmed | inferred | unknown
    commercial_use: str          # yes | no | unknown
    redistribution: str
    translation: str
    source_url: str
    author_contact_needed: bool
    notes: str

    def canonical_enum(self) -> str:
        return _ENUM.get(self.license_class, "unknown")

    def x_metadata(self) -> dict:
        return {
            "x_license_class": self.license_class,
            "x_license_status": self.license_status,
            "x_commercial_use": self.commercial_use,
            "x_redistribution": self.redistribution,
            "x_translation": self.translation,
            "x_source_url": self.source_url,
            "x_author_contact_needed": self.author_contact_needed,
            "x_license_notes": self.notes,
        }

    @classmethod
    def unknown(cls, source_url: str) -> "LicenseFlag":
        return cls("unknown", "unknown", "unknown", "unknown", "unknown",
                   source_url, True, "license unclear — confirm with author")
```

- [ ] **Step 4: Run + commit**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_licensing.py -v
git add questionnaire-harvester/src/harvester/licensing.py questionnaire-harvester/tests/test_licensing.py
git commit -m "feat(harvester): license flag model + canonical-enum mapping"
```

---

### Task 5: Raw extraction model

The site-agnostic intermediate that adapters produce and the draft layer consumes.

**Files:**
- Create: `questionnaire-harvester/src/harvester/raw.py`
- Test: `questionnaire-harvester/tests/test_raw.py`

**Interfaces:**
- Produces (dataclasses):
  - `RawScale(input_data_type, measurement_type, selection, dimension, anchors: list[str], values: list[float])`
  - `RawItem(text: str, construct: str | None = None)`
  - `RawQuestionnaire(qst_id, title, short_title, description, citation, year, source_site, source_url, instruction_text, scale: RawScale, items: list[RawItem], license: LicenseFlag, domain: list[str], population: list[str])`
  - `RawQuestionnaire.from_dict(d) -> RawQuestionnaire` / `.to_dict() -> dict` (for `raw/<id>.json` round-trip).

- [ ] **Step 1: Write the failing test**

`tests/test_raw.py`:
```python
from harvester.raw import RawQuestionnaire
from harvester.licensing import LicenseFlag

def _sample():
    return RawQuestionnaire(
        qst_id="qst_gad7", title="GAD-7", short_title="GAD-7", description="7-item anxiety screener.",
        citation="Spitzer RL et al (2006).", year=2006, source_site="psytoolkit.org",
        source_url="https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
        instruction_text="Over the last 2 weeks, how often have you been bothered by the following problems?",
        scale={"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
               "dimension": "frequency", "anchors": ["Not at all", "Several days", "More than half the days", "Nearly every day"],
               "values": [0.0, 1.0, 2.0, 3.0]},
        items=[{"text": "Feeling nervous, anxious, or on edge"}],
        license=LicenseFlag.unknown("https://us.psytoolkit.org/survey-library/anxiety-gad7.html"),
        domain=["anxiety"], population=["adults"])

def test_raw_roundtrips_through_dict():
    rq = _sample()
    assert RawQuestionnaire.from_dict(rq.to_dict()).qst_id == "qst_gad7"
    assert RawQuestionnaire.from_dict(rq.to_dict()).items[0].text.startswith("Feeling nervous")
```

- [ ] **Step 2: Run to verify it fails**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_raw.py -v
```
Expected: FAIL `No module named 'harvester.raw'`.

- [ ] **Step 3: Implement `raw.py`**

```python
from dataclasses import dataclass, asdict, field
from harvester.licensing import LicenseFlag

@dataclass
class RawScale:
    input_data_type: str
    measurement_type: str
    selection: str
    dimension: str
    anchors: list
    values: list

@dataclass
class RawItem:
    text: str
    construct: str | None = None

@dataclass
class RawQuestionnaire:
    qst_id: str
    title: str
    short_title: str
    description: str
    citation: str
    year: int | None
    source_site: str
    source_url: str
    instruction_text: str
    scale: RawScale
    items: list
    license: LicenseFlag
    domain: list = field(default_factory=list)
    population: list = field(default_factory=list)

    def __post_init__(self):
        if isinstance(self.scale, dict):
            self.scale = RawScale(**self.scale)
        self.items = [RawItem(**i) if isinstance(i, dict) else i for i in self.items]
        if isinstance(self.license, dict):
            self.license = LicenseFlag(**self.license)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "RawQuestionnaire":
        return cls(**d)
```

- [ ] **Step 4: Run + commit**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_raw.py -v
git add questionnaire-harvester/src/harvester/raw.py questionnaire-harvester/tests/test_raw.py
git commit -m "feat(harvester): raw extraction intermediate model"
```

---

### Task 6: Draft layer (raw → canonical entities with de-dup reuse)

The core conversion. Turns a `RawQuestionnaire` into canonical entity dicts, reusing an existing Option/Instruction ref when the fingerprint matches, else minting one. Writes files via the library writer.

**Files:**
- Create: `questionnaire-harvester/src/harvester/draft.py`
- Test: `questionnaire-harvester/tests/test_draft.py`

**Interfaces:**
- Consumes: `RawQuestionnaire` (Task 5); `option_fingerprint`/`lookup_option`/`lookup_instruction`/`build_instruction_index`/`load_scales_index` (Tasks 2–3); `LicenseFlag` (Task 4); `library.importers.survey_db.ids.sanitize`, `library.importers.survey_db.writer.write_entity`.
- Produces:
  - `draft(rq: RawQuestionnaire, version: str, scales_index: dict, instr_index: dict) -> DraftResult` where `DraftResult` has `.entities: dict[str, list[dict]]` (keyed by entity_type), `.reused: list[str]`, `.minted: list[str]`.
  - `write_draft(result: DraftResult, out_dir: Path) -> None` — writes each entity via `write_entity`.

- [ ] **Step 1: Write the failing test**

`tests/test_draft.py`:
```python
from harvester.draft import draft
from harvester.dedup import option_fingerprint
from harvester.raw import RawQuestionnaire
from harvester.licensing import LicenseFlag

PHQ_FREQ = {"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
            "dimension": "frequency",
            "anchors": ["Not at all", "Several days", "More than half the days", "Nearly every day"],
            "values": [0.0, 1.0, 2.0, 3.0]}

def _gad7():
    return RawQuestionnaire(
        qst_id="qst_gad7", title="GAD-7", short_title="GAD-7", description="7-item anxiety screener.",
        citation="Spitzer RL et al (2006).", year=2006, source_site="psytoolkit.org",
        source_url="https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
        instruction_text="Over the last 2 weeks, how often have you been bothered by any of the following problems?",
        scale=dict(PHQ_FREQ),
        items=[{"text": "Feeling nervous, anxious, or on edge"},
               {"text": "Not being able to stop or control worrying"}],
        license=LicenseFlag.unknown("https://us.psytoolkit.org/survey-library/anxiety-gad7.html"),
        domain=["anxiety"], population=["adults"])

def test_reuses_existing_phq_frequency_option():
    # Build the option the engine would have indexed, to derive its fingerprint.
    opt = {"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
           "dimension": "frequency",
           "options": [{"index": i + 1, "value": v} for i, v in enumerate(PHQ_FREQ["values"])],
           "content": {"en": {"options": [{"index": i + 1, "text": t} for i, t in enumerate(PHQ_FREQ["anchors"])]}}}
    scales_index = {option_fingerprint(opt): ["opt_phq_frequency_4"]}
    res = draft(_gad7(), version="v26.0617", scales_index=scales_index, instr_index={})
    qst = res.entities["questionnaire"][0]
    refs = {e["option"]["ref"] for e in qst["pages"][0]["elements"]}
    assert refs == {"opt_phq_frequency_4@v26.0617"}      # reused, not minted
    assert "opt_phq_frequency_4" in res.reused
    assert not any(o["id"] != "opt_phq_frequency_4" for o in res.entities.get("option", []))

def test_mints_prompts_and_sets_license_enum_and_x_metadata():
    res = draft(_gad7(), version="v26.0617", scales_index={}, instr_index={})
    qst = res.entities["questionnaire"][0]
    assert qst["metadata"]["license"] == "unknown"
    assert qst["metadata"]["x_author_contact_needed"] is True
    assert qst["metadata"]["provenance"] == {"source": "web_harvest",
        "imported_at": "2026-06-17T00:00:00Z", "importer_version": "web-harvest-0.1.0"} or \
        set(qst["metadata"]["provenance"]) == {"source", "imported_at", "importer_version"}
    assert len(res.entities["prompt"]) == 2
    assert qst["pages"][0]["elements"][0]["question"]["prompt"]["ref"] == "pr_gad7_1@v26.0617"
```

- [ ] **Step 2: Run to verify it fails**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_draft.py -v
```
Expected: FAIL `No module named 'harvester.draft'`.

- [ ] **Step 3: Implement `draft.py`**

```python
from dataclasses import dataclass, field
from pathlib import Path
from library.importers.survey_db.ids import sanitize
from library.importers.survey_db.writer import write_entity
from harvester.dedup import option_fingerprint, lookup_option, lookup_instruction
from harvester.raw import RawQuestionnaire

PROVENANCE = {"source": "web_harvest", "imported_at": "2026-06-17T00:00:00Z",
              "importer_version": "web-harvest-0.1.0"}

@dataclass
class DraftResult:
    entities: dict = field(default_factory=lambda: {})
    reused: list = field(default_factory=list)
    minted: list = field(default_factory=list)

def _slug(qst_id: str) -> str:
    return qst_id[4:] if qst_id.startswith("qst_") else qst_id

def _build_option(rq: RawQuestionnaire, slug: str) -> dict:
    s = rq.scale
    return {
        "id": f"opt_{slug}_{s.dimension}_{len(s.anchors)}",
        "dimension": s.dimension, "input_data_type": s.input_data_type,
        "measurement_type": s.measurement_type, "selection": s.selection,
        "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(s.values)],
        "content": {"en": {"status": "validated",
            "label": f"{rq.short_title} {len(s.anchors)}-point {s.dimension}",
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(s.anchors)]}},
    }

def draft(rq: RawQuestionnaire, version: str, scales_index: dict, instr_index: dict) -> DraftResult:
    slug = _slug(rq.qst_id)
    res = DraftResult(entities={"option": [], "instruction": [], "prompt": [], "questionnaire": []})

    # --- Option: reuse or mint ---
    opt = _build_option(rq, slug)
    existing_opt = lookup_option(opt, scales_index)
    if existing_opt:
        opt_id = existing_opt
        res.reused.append(opt_id)
    else:
        opt_id = opt["id"]
        res.entities["option"].append(opt)
        res.minted.append(opt_id)

    # --- Instruction: reuse or mint ---
    ins = {"id": f"ins_{slug}_instruction",
           "content": {"en": {"status": "validated", "text": rq.instruction_text}}}
    existing_ins = lookup_instruction(ins, instr_index)
    if existing_ins:
        ins_id = existing_ins
        res.reused.append(ins_id)
    else:
        ins_id = ins["id"]
        res.entities["instruction"].append(ins)
        res.minted.append(ins_id)

    # --- Prompts ---
    elements = []
    for i, item in enumerate(rq.items, start=1):
        pr_id = f"pr_{slug}_{i}"
        prompt = {"id": pr_id, "content": {"en": {"status": "validated", "text": item.text}}}
        if item.construct:
            prompt["construct"] = item.construct
        res.entities["prompt"].append(prompt)
        res.minted.append(pr_id)
        elements.append({
            "option": {"ref": f"{opt_id}@{version}"},
            "question": {"prompt": {"ref": f"{pr_id}@{version}"},
                         "instruction": {"ref": f"{ins_id}@{version}"}},
            "required": True,
        })

    # --- Questionnaire ---
    md = {"id": rq.qst_id, "version": version, "title": rq.title, "short_title": rq.short_title,
          "description": rq.description, "language": "en", "available_languages": ["en"],
          "license": rq.license.canonical_enum(),
          "classification": {"domain": rq.domain, "population": rq.population,
                             "administration_mode": ["self_report"]},
          "psychometrics": {"item_count": len(rq.items)},
          "publication": {"citation": rq.citation, **({"year": rq.year} if rq.year else {})},
          "provenance": dict(PROVENANCE),
          "x_source_site": rq.source_site, "x_harvest_date": "2026-06-17",
          **rq.license.x_metadata()}
    qst = {"@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
           "metadata": md, "pages": [{"id": "page_main", "elements": elements}]}
    res.entities["questionnaire"].append(qst)
    return res

def write_draft(result: DraftResult, out_dir: Path) -> None:
    for etype, objs in result.entities.items():
        for obj in objs:
            write_entity(Path(out_dir), etype, obj)
```

- [ ] **Step 4: Run to verify it passes**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_draft.py -v
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/draft.py questionnaire-harvester/tests/test_draft.py
git commit -m "feat(harvester): draft layer raw->canonical with option/instruction reuse"
```

---

### Task 7: PsyToolkit source adapter (against a saved fixture)

Parse a real PsyToolkit survey page into a `RawQuestionnaire`. Tests run against a committed HTML fixture — no live network in tests. Best-effort: anything not confidently extracted is left for the loss report / owner questions rather than guessed.

**Files:**
- Create: `questionnaire-harvester/src/harvester/sources/__init__.py`
- Create: `questionnaire-harvester/src/harvester/sources/base.py`
- Create: `questionnaire-harvester/src/harvester/sources/psytoolkit.py`
- Create: `questionnaire-harvester/tests/fixtures/psytoolkit_gad7.html` (captured in Step 1)
- Test: `questionnaire-harvester/tests/test_psytoolkit.py`

**Interfaces:**
- Consumes: `RawQuestionnaire`/`RawScale`/`RawItem` (Task 5), `LicenseFlag` (Task 4).
- Produces:
  - `class SourceAdapter` (base) with `parse(html: str, url: str) -> RawQuestionnaire` and `fetch(url: str) -> str`.
  - `class PsyToolkitAdapter(SourceAdapter)` implementing `parse`.

- [ ] **Step 1: Capture the fixture (one-time, real network)**

```bash
PYTHONPATH=questionnaire-harvester/src python - <<'PY'
import httpx, pathlib
url = "https://us.psytoolkit.org/survey-library/anxiety-gad7.html"
html = httpx.get(url, follow_redirects=True, timeout=30).text
p = pathlib.Path("questionnaire-harvester/tests/fixtures"); p.mkdir(parents=True, exist_ok=True)
(p / "psytoolkit_gad7.html").write_text(html)
print("saved", len(html), "bytes")
PY
```
Then open the saved file and read the item list, the response-scale anchors, the instruction stem, and the citation. The selectors in Step 3 must be written to match THIS file's actual structure. (If PsyToolkit redirects or the page lacks item text, record that as the finding and switch the first instrument to one whose page does carry items — note it in the register and stop for owner input.)

- [ ] **Step 2: Write the failing test from the fixture's real content**

`tests/test_psytoolkit.py` (fill the asserted strings from what you read in Step 1):
```python
from pathlib import Path
from harvester.sources.psytoolkit import PsyToolkitAdapter

FIX = Path(__file__).parent / "fixtures" / "psytoolkit_gad7.html"

def test_parses_gad7_items_and_scale():
    rq = PsyToolkitAdapter().parse(FIX.read_text(), "https://us.psytoolkit.org/survey-library/anxiety-gad7.html")
    assert rq.qst_id == "qst_gad7"
    assert len(rq.items) == 7
    assert rq.items[0].text.lower().startswith("feeling nervous")
    assert rq.scale.anchors == ["Not at all", "Several days", "More than half the days", "Nearly every day"]
    assert rq.scale.values == [0.0, 1.0, 2.0, 3.0]
    assert rq.instruction_text.lower().startswith("over the last 2 weeks")
    assert rq.license.license_class == "unknown"   # PsyToolkit asserts no blanket license
    assert rq.source_site == "psytoolkit.org"
```

- [ ] **Step 3: Run to verify it fails, then implement the adapter**

Run:
```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -v
```
Expected: FAIL (missing module).

`sources/base.py`:
```python
import httpx
from harvester.raw import RawQuestionnaire

class SourceAdapter:
    site = "unknown"
    def fetch(self, url: str) -> str:
        return httpx.get(url, follow_redirects=True, timeout=30).text
    def parse(self, html: str, url: str) -> RawQuestionnaire:
        raise NotImplementedError
```

`sources/psytoolkit.py` — implement `parse` using BeautifulSoup, with selectors matched to the captured fixture. Skeleton (adjust selectors/values to the real DOM read in Step 1):
```python
import re
from bs4 import BeautifulSoup
from harvester.sources.base import SourceAdapter
from harvester.raw import RawQuestionnaire, RawScale, RawItem
from harvester.licensing import LicenseFlag

class PsyToolkitAdapter(SourceAdapter):
    site = "psytoolkit.org"

    def parse(self, html: str, url: str) -> RawQuestionnaire:
        soup = BeautifulSoup(html, "html.parser")
        slug = re.sub(r"[^a-z0-9]+", "", url.rsplit("/", 1)[-1].replace(".html", "").split("-")[-1].lower())
        qst_id = f"qst_{slug}"
        # --- items: the numbered statement list on the page (selector per fixture) ---
        items = [RawItem(text=li.get_text(" ", strip=True)) for li in self._item_nodes(soup)]
        # --- scale anchors + values (per fixture) ---
        anchors, values = self._scale(soup)
        scale = RawScale("choice", "ordinal", "single", "frequency", anchors, values)
        instruction = self._instruction(soup)
        title, short_title, citation, year = self._meta(soup, slug)
        return RawQuestionnaire(
            qst_id=qst_id, title=title, short_title=short_title,
            description=self._description(soup), citation=citation, year=year,
            source_site=self.site, source_url=url, instruction_text=instruction,
            scale=scale, items=items, license=LicenseFlag.unknown(url),
            domain=self._domain(soup), population=["adults"])

    # The helper methods below contain the fixture-specific selectors; implement each
    # by reading questionnaire-harvester/tests/fixtures/psytoolkit_gad7.html.
    def _item_nodes(self, soup): ...
    def _scale(self, soup): ...
    def _instruction(self, soup): ...
    def _meta(self, soup, slug): ...
    def _description(self, soup): ...
    def _domain(self, soup): ...
```
Implement each helper concretely against the fixture so the Step-2 test passes. If a field genuinely isn't on the page (e.g. citation), return a sensible empty value — the draft/questions step surfaces it as an open question; do not fabricate.

- [ ] **Step 4: Run to verify it passes**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -v
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources questionnaire-harvester/tests/test_psytoolkit.py questionnaire-harvester/tests/fixtures/psytoolkit_gad7.html
git commit -m "feat(harvester): PsyToolkit adapter -> RawQuestionnaire (GAD-7 fixture)"
```

---

### Task 8: Tracking layer (register.md + questions/<id>.md)

The owner-facing progress surface. Append/update a row in `register.md` and generate a per-questionnaire open-questions file.

**Files:**
- Create: `questionnaire-harvester/src/harvester/tracking.py`
- Test: `questionnaire-harvester/tests/test_tracking.py`

**Interfaces:**
- Consumes: `RawQuestionnaire` (Task 5), `DraftResult` (Task 6).
- Produces:
  - `upsert_register_row(register_path: Path, qst_id, sources, importance, status, n_open, license_status) -> None` — idempotent by `qst_id`; creates the table with a header if absent.
  - `write_questions(questions_dir: Path, rq: RawQuestionnaire, result: DraftResult, extra: list[str]) -> list[str]` — writes `questions/<qst_id>.md`, returns the list of open questions (license-unknown, missing citation, near-match reuse confirmations, etc.). Returns count drives `n_open`.

- [ ] **Step 1: Write the failing test**

`tests/test_tracking.py`:
```python
from pathlib import Path
from harvester.tracking import upsert_register_row, write_questions
from harvester.raw import RawQuestionnaire
from harvester.licensing import LicenseFlag
from harvester.draft import DraftResult

def test_register_is_idempotent_by_id(tmp_path):
    reg = tmp_path / "register.md"
    upsert_register_row(reg, "qst_gad7", "psytoolkit", "high", "drafted", 2, "unknown")
    upsert_register_row(reg, "qst_gad7", "psytoolkit", "high", "ready", 0, "unknown")
    body = reg.read_text()
    assert body.count("qst_gad7") == 1
    assert "ready" in body and "drafted" not in body

def test_questions_flags_unknown_license(tmp_path):
    rq = RawQuestionnaire(qst_id="qst_gad7", title="GAD-7", short_title="GAD-7", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x",
        instruction_text="…", scale={"input_data_type":"choice","measurement_type":"ordinal",
        "selection":"single","dimension":"frequency","anchors":["a"],"values":[0.0]},
        items=[{"text":"x"}], license=LicenseFlag.unknown("https://x"), domain=["anxiety"], population=["adults"])
    qs = write_questions(tmp_path, rq, DraftResult(entities={}, reused=["opt_phq_frequency_4"], minted=[]), [])
    assert any("license" in q.lower() for q in qs)
    assert any("citation" in q.lower() for q in qs)        # empty citation flagged
    assert (tmp_path / "qst_gad7.md").exists()
```

- [ ] **Step 2: Run to verify it fails**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_tracking.py -v
```
Expected: FAIL `No module named 'harvester.tracking'`.

- [ ] **Step 3: Implement `tracking.py`**

```python
from pathlib import Path
from harvester.raw import RawQuestionnaire
from harvester.draft import DraftResult

_HEADER = ("# Harvest Register\n\n"
           "| Questionnaire | Sources | Importance | Status | Open Qs | License |\n"
           "|---|---|---|---|---|---|\n")

def upsert_register_row(register_path: Path, qst_id, sources, importance, status, n_open, license_status) -> None:
    p = Path(register_path)
    lines = p.read_text().splitlines() if p.exists() else _HEADER.splitlines()
    row = f"| {qst_id} | {sources} | {importance} | {status} | {n_open} | {license_status} |"
    out, replaced = [], False
    for ln in lines:
        if ln.startswith(f"| {qst_id} |"):
            out.append(row); replaced = True
        else:
            out.append(ln)
    if not replaced:
        out.append(row)
    p.write_text("\n".join(out) + "\n")

def write_questions(questions_dir: Path, rq: RawQuestionnaire, result: DraftResult, extra: list) -> list:
    qs: list = list(extra)
    if rq.license.license_class == "unknown" or rq.license.author_contact_needed:
        qs.append(f"License for **{rq.title}** is unclear ({rq.source_url}). Confirm class / contact author?")
    if not rq.citation:
        qs.append(f"No citation captured for **{rq.title}** — supply the source publication?")
    for reused in result.reused:
        qs.append(f"Confirm reuse of shared entity `{reused}` for **{rq.title}** (vs. minting a new one)?")
    d = Path(questions_dir); d.mkdir(parents=True, exist_ok=True)
    body = [f"# Open questions — {rq.title} (`{rq.qst_id}`)", "",
            f"Source: {rq.source_url}", "",
            "Answer inline under each item (replace the `> answer:` line).", ""]
    for i, q in enumerate(qs, 1):
        body += [f"### {i}. {q}", "> answer: ", ""]
    (d / f"{rq.qst_id}.md").write_text("\n".join(body) + "\n")
    return qs
```

- [ ] **Step 4: Run + commit**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_tracking.py -v
git add questionnaire-harvester/src/harvester/tracking.py questionnaire-harvester/tests/test_tracking.py
git commit -m "feat(harvester): register.md upsert + per-questionnaire questions file"
```

---

### Task 9: CLI + end-to-end GAD-7 harvest (integration)

Wire the pipeline behind one command and run the full loop on GAD-7, proving dedup reuse of the PHQ-9 scale and Schema-2 validity.

**Files:**
- Create: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Consumes: every module above.
- Produces: `main(argv=None) -> int`; subcommand `harvest <url>` that: fetches+parses (PsyToolkit), loads `dedup/scales-index.json` + builds the instruction index from `output/`, drafts, writes entities to `output/`, validates the tree, upserts `register.md`, and writes `questions/<id>.md`. Prints reused/minted ids.

- [ ] **Step 1: Write the failing e2e test (fixture-driven, no network)**

`tests/test_cli_e2e.py`:
```python
import json
from pathlib import Path
from harvester import cli

REPO = Path(__file__).resolve().parents[3]

def test_gad7_harvest_reuses_phq_scale_and_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_gad7.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    # seed dedup index with the PHQ frequency scale so GAD-7 must reuse it
    idx = REPO / "questionnaire-harvester" / "dedup" / "scales-index.json"
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
                   "--out", str(out), "--scales-index", str(idx),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0617"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_gad7.json").read_text())
    refs = {e["option"]["ref"] for e in qst["pages"][0]["elements"]}
    assert refs == {"opt_phq_frequency_4@v26.0617"}          # reused PHQ-9 scale
    assert not (out / "options").exists() or not list((out / "options").glob("*.json"))  # nothing minted
    assert (tmp_path / "questions" / "qst_gad7.md").exists()
```

- [ ] **Step 2: Run to verify it fails**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_cli_e2e.py -v
```
Expected: FAIL (missing `cli`).

- [ ] **Step 3: Implement `cli.py`**

```python
import argparse, sys
from pathlib import Path
from harvester.sources.psytoolkit import PsyToolkitAdapter
from harvester.dedup import load_scales_index, build_instruction_index
from harvester.draft import draft, write_draft
from harvester.validate import validate_tree
from harvester.tracking import upsert_register_row, write_questions

def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    ap = argparse.ArgumentParser(prog="harvest")
    sub = ap.add_subparsers(dest="cmd", required=True)
    h = sub.add_parser("harvest")
    h.add_argument("url")
    h.add_argument("--out", default="questionnaire-harvester/output")
    h.add_argument("--scales-index", default="questionnaire-harvester/dedup/scales-index.json")
    h.add_argument("--register", default="questionnaire-harvester/register.md")
    h.add_argument("--questions", default="questionnaire-harvester/questions")
    h.add_argument("--schemas", default="schemas")
    h.add_argument("--version", default="v26.0617")
    a = ap.parse_args(argv)
    if a.cmd != "harvest":
        return 2

    rq = PsyToolkitAdapter().parse(PsyToolkitAdapter().fetch(a.url), a.url)
    scales_index = load_scales_index(Path(a.scales_index))
    instr_index = build_instruction_index(Path(a.out))
    result = draft(rq, a.version, scales_index, instr_index)
    write_draft(result, Path(a.out))

    errors = validate_tree(Path(a.out), Path(a.schemas), release=a.version)
    if errors:
        print("VALIDATION ERRORS:", *errors, sep="\n  ")
        return 1
    qs = write_questions(Path(a.questions), rq, result, [])
    lic = rq.license.license_class
    upsert_register_row(Path(a.register), rq.qst_id, rq.source_site, "high",
                        "needs-review" if qs else "ready", len(qs), lic)
    print(f"harvested {rq.qst_id}: reused={result.reused} minted={result.minted} open_qs={len(qs)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 4: Run the e2e test to verify it passes**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests/test_cli_e2e.py -v
```
Expected: PASS.

- [ ] **Step 5: Run the real harvest, write GAD-7 into `output/`, rebuild the catalogue**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m harvester.cli harvest \
  https://us.psytoolkit.org/survey-library/anxiety-gad7.html
python3 questionnaire-harvester/dedup/build_catalogue.py questionnaire-harvester/output
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests -v
```
Expected: GAD-7 entities in `output/` (prompts + qst_gad7, NO new option), `register.md` + `questions/qst_gad7.md` written, full test suite green, catalogue shows the PHQ frequency fingerprint now mapped to its single id (reused, not duplicated).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_cli_e2e.py \
  questionnaire-harvester/output questionnaire-harvester/register.md questionnaire-harvester/questions \
  questionnaire-harvester/dedup/scales-index.json questionnaire-harvester/dedup/scales-catalogue.md
git commit -m "feat(harvester): CLI harvest pipeline; GAD-7 harvested reusing PHQ-9 scale"
```

---

### Task 10: Wrap-up — README + finish the branch

**Files:**
- Create: `questionnaire-harvester/README.md`

- [ ] **Step 1: Write `README.md`**

Document: purpose; the pipeline (`harvest <url>` → `output/` + `register.md` + `questions/<id>.md`); the dedup loop (`build_catalogue.py` after each harvest); how to read `register.md`/answer `questions/*.md`; the PYTHONPATH run incantation; pointers to `about_licenses.md` and `conventions.md`; and the explicit follow-ups (fuzzy near-match tier; `psychology_tools`/`arab_psychology` adapters; promote→`library ingest`; web-UI disclaimer banner + license badge).

- [ ] **Step 2: Run the full suite one final time**

```bash
PYTHONPATH=library/src:questionnaire-harvester/src python -m pytest questionnaire-harvester/tests -v
```
Expected: all green.

- [ ] **Step 3: Commit + finish the branch**

```bash
git add questionnaire-harvester/README.md
git commit -m "docs(harvester): README + follow-ups"
```
Then use the `superpowers:finishing-a-development-branch` skill. Per project convention (memory: "No PRs — merge + push"): merge `harvester-design` → `master` locally and push. Do NOT open a PR.

---

## Self-Review

**Spec coverage:**
- Standalone dir + library read-dependency → Task 1. ✓
- De-dup curated registry + content match → Tasks 2–3 (engine API + Instructions), reused in Task 6/9. ✓
- Licensing model (rich block → enum, x_* metadata, unknown default) → Task 4, applied in Task 6. ✓
- Raw intermediate → Task 5. ✓
- Draft raw→canonical with reuse/mint + naming convention → Task 6. ✓
- PsyToolkit adapter (first source, fixture-tested) → Task 7. ✓
- Progress surface (register.md + questions/<id>.md) → Task 8. ✓
- One-questionnaire-at-a-time pipeline + CLI + GAD-7 dedup proof → Task 9. ✓
- Validator gotchas (closed provenance, license enum, x_*) → enforced in Tasks 1/6, asserted in tests. ✓
- **Deferred (explicitly out of scope, documented in Task 10 README):** fuzzy near-match `review/dedup.md` tier; `psychology_tools`/`arab_psychology` adapters; promote→ingest; web-UI banner + badge. These are noted in the spec's follow-ups and are separate later plans.

**Placeholder scan:** Task 7's adapter helper bodies are intentionally derived from the captured fixture (real TDD against real HTML) — the extraction *contract* (return types, asserted values) is concrete; only the CSS selectors are determined at execution because they depend on the live DOM. This is flagged explicitly, not a hidden TODO. No other placeholders.

**Type consistency:** `option_fingerprint`/`lookup_option`/`lookup_instruction`/`build_instruction_index`/`load_scales_index` (Tasks 2–3) are consumed with matching signatures in Tasks 6 and 9. `RawQuestionnaire`/`RawScale`/`RawItem` (Task 5) flow unchanged into Tasks 6–9. `DraftResult.{entities,reused,minted}` (Task 6) used consistently in Tasks 8–9. `LicenseFlag.{canonical_enum,x_metadata,unknown}` (Task 4) used in Tasks 6–9. Consistent.

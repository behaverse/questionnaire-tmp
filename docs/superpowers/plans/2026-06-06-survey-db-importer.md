# survey_database Importer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the legacy `survey_database/data/survey_db.sqlite` catalogue into canonical Schema 2 JSON (reusable entities + 64 questionnaires, each with a provenance block) plus a loss report, feeding the Library Core's ingestion path.

**Architecture:** A package `library/src/library/importers/survey_db/` of small single-purpose units (id mapping, content-map builder, sqlite reader, per-entity mappers, questionnaire reconstructor, provenance, loss report, writer, orchestrator) + a `library import-survey-db` CLI. Reusable entities carry no version (the Library stamps `--release`); questionnaires carry version + provenance. Output is validated against the schemas and proven by ingesting into a throwaway Library Postgres.

**Tech Stack:** Python 3.12 · stdlib `sqlite3` · reuses the `library` package (`entity_types`, `validation`, `ingest`) · pytest + testcontainers.

**Spec:** [../specs/2026-06-06-survey-db-importer-design.md](../specs/2026-06-06-survey-db-importer-design.md)

---

## Environment notes

- Run from repo root `/home/pedro/Repos/Cursor/questionnaire_apps` on branch `survey-db-importer`. Use `.venv/bin/...`.
- **Integration tests that touch Postgres need `DOCKER_CONFIG=/tmp/lib_docker` prefixed** (this machine's docker credstore is broken otherwise). Unit tests need no Docker.
- Legacy DB: `survey_database/data/survey_db.sqlite`. The `library` package is already installed editable in `.venv`.

## File structure

```
library/src/library/importers/
├── __init__.py
└── survey_db/
    ├── __init__.py
    ├── ids.py             # sanitize(), canonical_id(), LANGS_FULL/LANGS_MIN, PREFIX
    ├── content.py         # simple_content() language map
    ├── loss.py            # LossReport
    ├── reader.py          # SurveyDB(sqlite) row accessors
    ├── mappers.py         # map_prompt/context/instruction/message/placeholder/help/regex/option/solution
    ├── questionnaire.py   # reconstruct()
    ├── provenance.py      # build_provenance()
    ├── writer.py          # write_entity()
    └── run.py             # import_survey_db() + ImportSummary
# modified: library/src/library/cli.py  (add `import-survey-db` subcommand)
library/tests/unit/importers/        # unit tests
library/tests/integration/           # reader + integration + smoke tests
content/                              # default output dir — add to .gitignore
```

**Naming contract (identical across tasks):** `canonical_id(entity_type, legacy_id) -> str` · `simple_content(row, langs, field="text") -> dict` · `LossReport` with `.add(category, source, detail)`, `.preserve(kind, n)`, `.write(out_dir)` · `SurveyDB(path)` with `.prompts()/.contexts()/.instructions()/.messages()/.placeholders()/.helps()/.regexes()/.solutions()/.surveys()/.compositions()/.options_grouped()` · mappers `map_<type>(row)` (and `map_option(option_id, rows)`) returning a canonical dict with a canonical `id` and **no** `version` · `reconstruct(qid, comp_rows, survey_row, release, imported_at) -> dict` · `build_provenance(qid, header_id, imported_at) -> dict` · `write_entity(out_dir, entity_type, obj) -> Path` · `import_survey_db(sqlite_path, out_dir, release, imported_at) -> ImportSummary`.

---

## Task 1: id mapping (`ids.py`)

**Files:** Create `library/src/library/importers/__init__.py` (empty), `library/src/library/importers/survey_db/__init__.py` (empty), `library/src/library/importers/survey_db/ids.py`; Test `library/tests/unit/importers/test_ids.py`.

- [ ] **Step 1: Write `library/tests/unit/importers/test_ids.py`**

```python
from library.importers.survey_db.ids import sanitize, canonical_id, LANGS_FULL, LANGS_MIN

def test_sanitize_lowercases_and_replaces():
    assert sanitize("acs-s") == "acs_s"
    assert sanitize("AISS Q1!") == "aiss_q1"
    assert sanitize("__x__") == "x"

def test_canonical_id_prefixes_by_type():
    assert canonical_id("prompt", "aiss_q_1") == "pr_aiss_q_1"
    assert canonical_id("option", "agreement_7") == "opt_agreement_7"
    assert canonical_id("questionnaire", "x_aiss") == "qst_x_aiss"
    assert canonical_id("questionnaire", "acs-s") == "qst_acs_s"

def test_lang_lists():
    assert LANGS_FULL[:2] == ["en", "fr"] and "it" in LANGS_FULL
    assert LANGS_MIN == ["en", "fr"]
```

- [ ] **Step 2: Run → FAIL.** `.venv/bin/pytest library/tests/unit/importers/test_ids.py -v`

- [ ] **Step 3: Write `library/src/library/importers/survey_db/ids.py`** (and the two empty `__init__.py` files)

```python
import re

LANGS_FULL = ["en", "fr", "de", "lu", "pt", "es", "it"]
LANGS_MIN = ["en", "fr"]

PREFIX = {
    "message": "msg_", "context": "ctx_", "instruction": "ins_", "prompt": "pr_",
    "option": "opt_", "placeholder": "ph_", "help": "help_", "regex": "rx_",
    "solution": "sol_", "questionnaire": "qst_",
}

def sanitize(s: str) -> str:
    s = re.sub(r"[^a-z0-9_]+", "_", s.strip().lower())
    return s.strip("_")

def canonical_id(entity_type: str, legacy_id: str) -> str:
    return PREFIX[entity_type] + sanitize(legacy_id)
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**

```bash
git add library/src/library/importers/ library/tests/unit/importers/test_ids.py
git commit -m "feat(importer): id sanitization + canonical-id mapping"
```

---

## Task 2: content-map builder (`content.py`)

**Files:** Create `library/src/library/importers/survey_db/content.py`; Test `library/tests/unit/importers/test_content.py`.

- [ ] **Step 1: Write `library/tests/unit/importers/test_content.py`**

```python
from library.importers.survey_db.content import simple_content
from library.importers.survey_db.ids import LANGS_FULL, LANGS_MIN

def test_builds_only_nonempty_langs():
    row = {"text_en": "Hello", "text_fr": "Bonjour", "text_de": "", "text_lu": None}
    out = simple_content(row, LANGS_MIN)
    assert out == {"en": {"status": "complete", "text": "Hello"},
                   "fr": {"status": "complete", "text": "Bonjour"}}

def test_full_langs_skips_missing():
    row = {"text_en": "x"}  # other langs absent
    out = simple_content(row, LANGS_FULL)
    assert list(out.keys()) == ["en"]

def test_custom_field_name():
    row = {"text_en": "desc"}
    assert simple_content(row, ["en"], field="description")["en"] == {"status": "complete", "text": "desc"}
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/importers/survey_db/content.py`**

```python
def simple_content(row: dict, langs: list[str], field: str = "text") -> dict:
    out = {}
    for lang in langs:
        val = row.get(f"text_{lang}")
        if val:
            out[lang] = {"status": "complete", field: val}
    return out
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**

```bash
git add library/src/library/importers/survey_db/content.py library/tests/unit/importers/test_content.py
git commit -m "feat(importer): language-keyed content-map builder"
```

---

## Task 3: loss report (`loss.py`)

**Files:** Create `library/src/library/importers/survey_db/loss.py`; Test `library/tests/unit/importers/test_loss.py`.

- [ ] **Step 1: Write `library/tests/unit/importers/test_loss.py`**

```python
import json
from library.importers.survey_db.loss import LossReport

def test_accumulate_and_write(tmp_path):
    lr = LossReport()
    lr.add("dropped", "surveys.scoring_code", "url not convertible to Scorer")
    lr.add("warning", "surveys.acs.license", "NULL -> unknown")
    lr.preserve("prompts", 793)
    lr.write(tmp_path)
    data = json.loads((tmp_path / "loss_report.json").read_text())
    assert data["preserved"]["prompts"] == 793
    cats = {e["category"] for e in data["entries"]}
    assert cats == {"dropped", "warning"}
    md = (tmp_path / "loss_report.md").read_text()
    assert "dropped" in md and "prompts: 793" in md
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/importers/survey_db/loss.py`**

```python
import json
from dataclasses import dataclass, field, asdict
from pathlib import Path

@dataclass
class LossReport:
    entries: list = field(default_factory=list)
    preserved: dict = field(default_factory=dict)

    def add(self, category: str, source: str, detail: str) -> None:
        assert category in {"dropped", "approximated", "preserved", "warning"}
        self.entries.append({"category": category, "source": source, "detail": detail})

    def preserve(self, kind: str, n: int) -> None:
        self.preserved[kind] = n

    def write(self, out_dir: Path) -> None:
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "loss_report.json").write_text(json.dumps(asdict(self), indent=2, sort_keys=True))
        lines = ["# Import loss report", "", "## Preserved"]
        lines += [f"- {k}: {v}" for k, v in sorted(self.preserved.items())]
        for cat in ("dropped", "approximated", "warning"):
            rows = [e for e in self.entries if e["category"] == cat]
            lines += ["", f"## {cat} ({len(rows)})"] + [f"- `{e['source']}` — {e['detail']}" for e in rows]
        (out_dir / "loss_report.md").write_text("\n".join(lines) + "\n")
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**

```bash
git add library/src/library/importers/survey_db/loss.py library/tests/unit/importers/test_loss.py
git commit -m "feat(importer): loss report accumulator (json + markdown)"
```

---

## Task 4: sqlite reader (`reader.py`)

**Files:** Create `library/src/library/importers/survey_db/reader.py`; Test `library/tests/integration/test_importer_reader.py` (real sqlite; no Postgres).

- [ ] **Step 1: Write `library/tests/integration/test_importer_reader.py`**

```python
from pathlib import Path
from library.importers.survey_db.reader import SurveyDB

DB = Path("survey_database/data/survey_db.sqlite")

def test_counts_match_known_catalogue():
    db = SurveyDB(DB)
    assert len(db.prompts()) == 793
    assert len(db.contexts()) == 30
    assert len(db.instructions()) == 22
    assert len(db.messages()) == 100
    assert len(db.placeholders()) == 11
    assert len(db.helps()) == 21
    assert len(db.regexes()) == 7
    assert len(db.solutions()) == 35

def test_options_grouped_by_option_id():
    db = SurveyDB(DB)
    groups = db.options_grouped()
    assert "agreement_7" in groups and len(groups["agreement_7"]) >= 2

def test_compositions_and_surveys():
    db = SurveyDB(DB)
    comps = db.compositions()
    assert any(c["element_type"] == "header" for c in comps)
    surveys = db.surveys()  # dict by survey_id
    assert "aiss" in surveys and surveys["aiss"]["title"]
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/importers/survey_db/reader.py`**

```python
import sqlite3
from collections import defaultdict
from pathlib import Path

class SurveyDB:
    def __init__(self, path: Path):
        self._con = sqlite3.connect(str(path))
        self._con.row_factory = sqlite3.Row

    def _rows(self, sql: str) -> list[dict]:
        return [dict(r) for r in self._con.execute(sql)]

    def prompts(self): return self._rows("SELECT * FROM prompts")
    def contexts(self): return self._rows("SELECT * FROM contexts")
    def instructions(self): return self._rows("SELECT * FROM instructions")
    def messages(self): return self._rows("SELECT * FROM messages")
    def placeholders(self): return self._rows("SELECT * FROM placeholders")
    def helps(self): return self._rows("SELECT * FROM help_texts")
    def regexes(self): return self._rows("SELECT * FROM regex_patterns")
    def solutions(self): return self._rows("SELECT * FROM solutions")
    def compositions(self): return self._rows("SELECT * FROM compositions ORDER BY id")

    def surveys(self) -> dict:
        return {r["survey_id"]: r for r in self._rows("SELECT * FROM surveys")}

    def options_grouped(self) -> dict:
        groups = defaultdict(list)
        for r in self._rows("SELECT * FROM options ORDER BY option_id, [index]"):
            if r.get("option_id"):
                groups[r["option_id"]].append(r)
        return dict(groups)
```

- [ ] **Step 4: Run → PASS.** `DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/tests/integration/test_importer_reader.py -v` (no Docker actually needed here, but harmless).

- [ ] **Step 5: Commit**

```bash
git add library/src/library/importers/survey_db/reader.py library/tests/integration/test_importer_reader.py
git commit -m "feat(importer): sqlite reader for the legacy catalogue"
```

---

## Task 5: content-entity, regex & solution mappers (`mappers.py`, part 1)

**Files:** Create `library/src/library/importers/survey_db/mappers.py`; Test `library/tests/unit/importers/test_mappers_simple.py`.

- [ ] **Step 1: Write `library/tests/unit/importers/test_mappers_simple.py`**

```python
from library.importers.survey_db import mappers

def test_map_prompt():
    row = {"prompt_id": "aiss_q_2", "name": "cold_water", "dimension": "similarity",
           "topics": "risk_taking; novelty_seeking", "reversed": 1,
           "text_en": "When the water is very cold...", "text_pt": "Quando a água..."}
    out = mappers.map_prompt(row)
    assert out["id"] == "pr_aiss_q_2"
    assert out["name"] == "cold_water" and out["dimension"] == "similarity"
    assert out["topics"] == ["risk_taking", "novelty_seeking"]
    assert out["reversed"] is True
    assert "construct" not in out
    assert out["content"]["en"]["text"].startswith("When the water")
    assert out["content"]["en"]["status"] == "complete" and "pt" in out["content"]

def test_map_prompt_no_topics_not_reversed():
    out = mappers.map_prompt({"prompt_id": "aiss_q_1", "name": "x", "dimension": "similarity",
                              "topics": None, "reversed": 0, "text_en": "hi"})
    assert "topics" not in out and out["reversed"] is False

def test_map_message_type_to_array():
    out = mappers.map_message({"message_id": "welcome", "type": "purpose", "text_en": "Hi", "text_fr": "Salut"})
    assert out["id"] == "msg_welcome" and out["type"] == ["purpose"]
    assert set(out["content"].keys()) == {"en", "fr"}

def test_map_regex_and_solution():
    rx = mappers.map_regex({"regex_id": "year_4digit", "regex": "^\\d{4}$", "example_input": "2026"})
    assert rx["id"] == "rx_year_4digit" and rx["regex"] == "^\\d{4}$"
    sol = mappers.map_solution({"question_id": "icar16_q_1", "expected_response": "X"})
    assert sol["id"] == "sol_icar16_q_1" and sol["prompt"]["ref"].startswith("pr_icar16_q_1@")
```

Note: solution refs are version-pinned at questionnaire-reconstruction time; for the standalone mapper, `map_solution` emits an **unpinned** prompt ref placeholder `pr_<id>@PENDING` that `run` rewrites with the release. The test only checks the prefix.

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/importers/survey_db/mappers.py`** (part 1 — option mapper added in Task 6)

```python
from .ids import canonical_id, LANGS_FULL, LANGS_MIN
from .content import simple_content

def _split(s, sep=";"):
    return [p.strip() for p in s.split(sep) if p.strip()] if s else []

def map_prompt(row: dict) -> dict:
    out = {"id": canonical_id("prompt", row["prompt_id"])}
    if row.get("name"): out["name"] = row["name"]
    if row.get("dimension"): out["dimension"] = row["dimension"]
    topics = _split(row.get("topics"))
    if topics: out["topics"] = topics
    out["reversed"] = bool(row.get("reversed"))
    out["content"] = simple_content(row, LANGS_FULL)
    return out

def map_context(row: dict) -> dict:
    return {"id": canonical_id("context", row["context_id"]), "content": simple_content(row, LANGS_FULL)}

def map_instruction(row: dict) -> dict:
    out = {"id": canonical_id("instruction", row["instruction_id"]), "content": simple_content(row, LANGS_FULL)}
    if row.get("dimension"): out["dimension"] = row["dimension"]
    return out

def map_message(row: dict) -> dict:
    return {"id": canonical_id("message", row["message_id"]),
            "type": _split(row.get("type"), sep=",") or [row["type"]] if row.get("type") else [],
            "content": simple_content(row, LANGS_MIN)}

def map_placeholder(row: dict) -> dict:
    return {"id": canonical_id("placeholder", row["placeholder_id"]), "content": simple_content(row, LANGS_MIN)}

def map_help(row: dict) -> dict:
    return {"id": canonical_id("help", row["help_id"]), "content": simple_content(row, LANGS_MIN)}

def map_regex(row: dict) -> dict:
    return {"id": canonical_id("regex", row["regex_id"]), "regex": row["regex"],
            "example_input": row.get("example_input")}

def map_solution(row: dict) -> dict:
    return {"id": canonical_id("solution", row["question_id"]),
            "prompt": {"ref": canonical_id("prompt", row["question_id"]) + "@PENDING"},
            "expected_response": row["expected_response"]}
```

- [ ] **Step 4: Run → PASS.** Adjust `map_message` if the `type` split produces an unexpected shape (the test pins `["purpose"]`).

- [ ] **Step 5: Commit**

```bash
git add library/src/library/importers/survey_db/mappers.py library/tests/unit/importers/test_mappers_simple.py
git commit -m "feat(importer): content-entity, regex, solution mappers"
```

---

## Task 6: option mapper (`mappers.py`, part 2)

**Files:** Modify `library/src/library/importers/survey_db/mappers.py`; Test `library/tests/unit/importers/test_mappers_option.py`.

- [ ] **Step 1: Write `library/tests/unit/importers/test_mappers_option.py`**

```python
from library.importers.survey_db import mappers

def test_map_choice_option_groups_rows():
    rows = [
        {"option_id": "agreement_3", "dimension": "agreement", "input_data_type": "choice",
         "measurement_type": "ordinal", "index": 1, "value": 0, "text_en": "disagree", "text_fr": "pas d'accord"},
        {"option_id": "agreement_3", "dimension": "agreement", "input_data_type": "choice",
         "measurement_type": "ordinal", "index": 2, "value": 1, "text_en": "neutral", "text_fr": "neutre"},
        {"option_id": "agreement_3", "dimension": "agreement", "input_data_type": "choice",
         "measurement_type": "ordinal", "index": 3, "value": 2, "text_en": "agree", "text_fr": "d'accord"},
    ]
    out = mappers.map_option("agreement_3", rows)
    assert out["id"] == "opt_agreement_3"
    assert out["input_data_type"] == "choice" and out["measurement_type"] == "ordinal"
    assert out["selection"] == "single"
    assert out["options"] == [{"index": 1, "value": 0}, {"index": 2, "value": 1}, {"index": 3, "value": 2}]
    assert out["content"]["en"]["options"] == [
        {"index": 1, "text": "disagree"}, {"index": 2, "text": "neutral"}, {"index": 3, "text": "agree"}]
    assert "fr" in out["content"]

def test_map_number_option_has_no_choices():
    rows = [{"option_id": "hours", "dimension": "duration", "input_data_type": "number",
             "measurement_type": "ratio", "index": None, "value": None, "min_value": 0, "max_value": 168,
             "step": 1, "units": "h/week", "text_en": None}]
    out = mappers.map_option("hours", rows)
    assert out["input_data_type"] == "number" and "options" not in out
    assert out["min"] == 0 and out["max"] == 168 and out["step"] == 1
    assert out["content"]["en"]["units"] == "h/week"

def test_map_option_refs_placeholder_help_regex():
    rows = [{"option_id": "yr", "dimension": None, "input_data_type": "text", "measurement_type": "interval",
             "index": None, "value": None, "placeholder_id": "year_yyyy", "help_id": "year_help",
             "input_validation": "year_4digit", "text_en": None}]
    out = mappers.map_option("yr", rows)
    assert out["placeholder"]["ref"].startswith("ph_year_yyyy@")
    assert out["help"]["ref"].startswith("help_year_help@")
    assert out["input_validation"]["ref"].startswith("rx_year_4digit@")
```

Note: refs from an Option to placeholder/help/regex are pinned at write time by `run` (replace `@PENDING`); the mapper emits `@PENDING`. Tests check the prefix only.

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Add `map_option` to `mappers.py`**

```python
def _first(rows, key):
    for r in rows:
        if r.get(key) not in (None, ""):
            return r[key]
    return None

def map_option(option_id: str, rows: list[dict]) -> dict:
    head = rows[0]
    out = {"id": canonical_id("option", option_id),
           "input_data_type": head.get("input_data_type"),
           "measurement_type": head.get("measurement_type")}
    if head.get("dimension"): out["dimension"] = head["dimension"]
    for legacy, canon in (("min_value", "min"), ("max_value", "max"), ("step", "step")):
        v = _first(rows, legacy)
        if v is not None: out[canon] = v
    if _first(rows, "placeholder_id"):
        out["placeholder"] = {"ref": canonical_id("placeholder", _first(rows, "placeholder_id")) + "@PENDING"}
    if _first(rows, "help_id"):
        out["help"] = {"ref": canonical_id("help", _first(rows, "help_id")) + "@PENDING"}
    if _first(rows, "input_validation"):
        out["input_validation"] = {"ref": canonical_id("regex", _first(rows, "input_validation")) + "@PENDING"}

    is_choice = (head.get("input_data_type") == "choice")
    units = _first(rows, "units")
    if is_choice:
        out["selection"] = "single"
        out["options"] = [{"index": r["index"], "value": r.get("value")} for r in rows if r.get("index") is not None]
    # per-language content: label/units + per-choice text
    langs = LANGS_FULL
    content = {}
    for lang in langs:
        entry = {}
        if units and lang == "en":
            entry["units"] = units  # units stored once; legacy has a single units column
        if is_choice:
            opts = [{"index": r["index"], "text": r.get(f"text_{lang}")} for r in rows
                    if r.get("index") is not None and r.get(f"text_{lang}")]
            if opts:
                entry["options"] = opts
        if entry:
            entry["status"] = "complete"
            content[lang] = entry
    if content:
        out["content"] = content
    return out
```

- [ ] **Step 4: Run → PASS.** If the questionnaire schema requires `content` or `selection` shapes differently, adjust to match `$defs.Option` (it's validated end-to-end in Task 9 — fix there if validation flags it).

- [ ] **Step 5: Commit**

```bash
git add library/src/library/importers/survey_db/mappers.py library/tests/unit/importers/test_mappers_option.py
git commit -m "feat(importer): option mapper (grouping + choices + refs)"
```

---

## Task 7: provenance + questionnaire reconstruction (`provenance.py`, `questionnaire.py`)

**Files:** Create `provenance.py`, `questionnaire.py`; Test `library/tests/unit/importers/test_questionnaire.py`.

- [ ] **Step 1: Write `library/tests/unit/importers/test_questionnaire.py`**

```python
from library.importers.survey_db.questionnaire import reconstruct
from library.importers.survey_db.provenance import build_provenance

SURVEY = {"survey_id": "aiss", "title": "AISS", "variant": "1996", "description": "d",
          "license": None, "topics": "risk; novelty", "target_population": None,
          "validated_languages": "en; pt", "reference": "DOI: x", "tags": "a; b", "scoring_code": "http://x"}
COMPS = [
    {"id": 1, "questionnaire": "x_aiss", "element_type": "header", "header_id": "aiss"},
    {"id": 2, "questionnaire": "x_aiss", "element_type": "message", "message_id": "intro"},
    {"id": 3, "questionnaire": "x_aiss", "element_type": "question", "prompt_id": "aiss_q_1",
     "option_id": "agreement_7", "context_id": None, "instruction_id": None, "is_required": 1, "condition": None},
]

def test_reconstruct_metadata_and_elements():
    q = reconstruct("x_aiss", COMPS, SURVEY, release="v26.0606", imported_at="2026-06-06T00:00:00Z")
    assert q["metadata"]["id"] == "qst_x_aiss" and q["metadata"]["version"] == "v26.0606"
    assert q["metadata"]["title"] == "AISS" and q["metadata"]["license"] == "unknown"
    assert q["metadata"]["classification"]["domain"] == ["risk", "novelty"]
    assert q["metadata"]["available_languages"] == ["en", "pt"]
    assert q["metadata"]["provenance"]["source"] == "survey_db_sqlite"
    assert q["metadata"]["provenance"]["source_header_id"] == "aiss"
    els = q["pages"][0]["elements"]
    assert els[0]["ref"] == "msg_intro@v26.0606"          # message element
    item = els[1]
    assert item["question"]["prompt"]["ref"] == "pr_aiss_q_1@v26.0606"
    assert item["option"]["ref"] == "opt_agreement_7@v26.0606"
    assert item["required"] is True

def test_build_provenance_fields():
    p = build_provenance("x_aiss", "aiss", "2026-06-06T00:00:00Z")
    assert p["source"] == "survey_db_sqlite" and p["source_questionnaire_id"] == "x_aiss"
    assert p["imported_at"] == "2026-06-06T00:00:00Z" and p["importer_version"].startswith("survey-db-importer")
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/importers/survey_db/provenance.py`**

```python
IMPORTER_VERSION = "survey-db-importer-0.1.0"

def build_provenance(questionnaire_id: str, header_id: str, imported_at: str) -> dict:
    return {
        "source": "survey_db_sqlite",
        "imported_at": imported_at,
        "importer_version": IMPORTER_VERSION,
        "source_questionnaire_id": questionnaire_id,
        "source_header_id": header_id,
        "import_loss_report": "loss_report.md",
    }
```

- [ ] **Step 4: Write `library/src/library/importers/survey_db/questionnaire.py`**

```python
from .ids import canonical_id
from .mappers import _split
from .provenance import build_provenance

def _ref(entity_type, legacy_id, version):
    return {"ref": canonical_id(entity_type, legacy_id) + "@" + version}

def reconstruct(qid: str, comp_rows: list[dict], survey_row: dict, release: str, imported_at: str) -> dict:
    rows = [c for c in comp_rows if c["questionnaire"] == qid]
    header = next((c for c in rows if c["element_type"] == "header"), None)
    version = next((c.get("version") for c in rows if c.get("version")), None) or release
    s = survey_row or {}
    meta = {"id": canonical_id("questionnaire", qid), "version": version,
            "title": s.get("title") or qid, "language": "en"}
    if s.get("variant"): meta["short_title"] = str(s["variant"])
    if s.get("description"): meta["description"] = s["description"]
    meta["license"] = s.get("license") or "unknown"
    classification = {}
    if _split(s.get("topics")): classification["domain"] = _split(s.get("topics"))
    if _split(s.get("target_population")): classification["population"] = _split(s.get("target_population"))
    if classification: meta["classification"] = classification
    if s.get("reference"): meta["publication"] = {"citation": s["reference"].strip()}
    langs = _split(s.get("validated_languages"))
    if langs: meta["available_languages"] = langs
    if _split(s.get("tags")): meta["tags"] = _split(s.get("tags"))
    meta["provenance"] = build_provenance(qid, (header or {}).get("header_id"), imported_at)

    elements = []
    for c in rows:
        et = c["element_type"]
        if et == "message" and c.get("message_id"):
            elements.append(_ref("message", c["message_id"], version))
        elif et == "question" and c.get("prompt_id"):
            question = {"prompt": _ref("prompt", c["prompt_id"], version)}
            if c.get("context_id"): question["context"] = _ref("context", c["context_id"], version)
            if c.get("instruction_id"): question["instruction"] = _ref("instruction", c["instruction_id"], version)
            item = {"question": question, "option": _ref("option", c["option_id"], version)}
            if c.get("is_required"): item["required"] = True
            if c.get("condition"): item["show_if"] = c["condition"]
            elements.append(item)
    return {"@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
            "metadata": meta, "pages": [{"id": "page_main", "elements": elements}]}
```

- [ ] **Step 5: Run → PASS. Commit**

```bash
git add library/src/library/importers/survey_db/provenance.py library/src/library/importers/survey_db/questionnaire.py library/tests/unit/importers/test_questionnaire.py
git commit -m "feat(importer): provenance block + questionnaire reconstruction"
```

---

## Task 8: writer (`writer.py`)

**Files:** Create `writer.py`; Test `library/tests/unit/importers/test_writer.py`.

- [ ] **Step 1: Write `library/tests/unit/importers/test_writer.py`**

```python
import json
from library.importers.survey_db.writer import write_entity

def test_writes_to_plural_dir(tmp_path):
    p = write_entity(tmp_path, "prompt", {"id": "pr_x", "content": {}})
    assert p == tmp_path / "prompts" / "pr_x.json"
    assert json.loads(p.read_text())["id"] == "pr_x"

def test_questionnaire_dir(tmp_path):
    p = write_entity(tmp_path, "questionnaire", {"metadata": {"id": "qst_x"}})
    assert p == tmp_path / "questionnaires" / "qst_x.json"
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Write `library/src/library/importers/survey_db/writer.py`**

```python
import json
from pathlib import Path
from ...entity_types import DIR_BY_TYPE

def write_entity(out_dir, entity_type: str, obj: dict) -> Path:
    eid = obj["id"] if entity_type != "questionnaire" else obj["metadata"]["id"]
    d = Path(out_dir) / DIR_BY_TYPE[entity_type]
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"{eid}.json"
    p.write_text(json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=True))
    return p
```

- [ ] **Step 4: Run → PASS. Commit**

```bash
git add library/src/library/importers/survey_db/writer.py library/tests/unit/importers/test_writer.py
git commit -m "feat(importer): canonical-JSON writer"
```

---

## Task 9: orchestrator + CLI + full-run smoke test (`run.py`, cli.py)

**Files:** Create `run.py`; Modify `library/src/library/cli.py`; add `content/` to `.gitignore`; Test `library/tests/integration/test_importer_run.py`.

- [ ] **Step 1: Write `library/tests/integration/test_importer_run.py`**

```python
import json, sqlite3
from pathlib import Path
import psycopg
from library.importers.survey_db.run import import_survey_db
from library.validation import build_registry, validate_artifact
from library.loader import load_tree
from library.ingest import ingest_tree
from library.config import get_settings

DB = Path("survey_database/data/survey_db.sqlite")
REL = "v26.0606"; AT = "2026-06-06T00:00:00Z"
S = get_settings()

def test_full_run_counts_validate_and_ingest(tmp_path):
    summary = import_survey_db(DB, tmp_path, release=REL, imported_at=AT)
    # expected counts (from the legacy catalogue)
    assert len(list((tmp_path / "prompts").glob("*.json"))) == 793
    assert len(list((tmp_path / "contexts").glob("*.json"))) == 30
    assert len(list((tmp_path / "instructions").glob("*.json"))) == 22
    assert len(list((tmp_path / "messages").glob("*.json"))) == 100
    assert len(list((tmp_path / "placeholders").glob("*.json"))) == 11
    assert len(list((tmp_path / "helps").glob("*.json"))) == 21
    assert len(list((tmp_path / "regexes").glob("*.json"))) == 7
    assert len(list((tmp_path / "solutions").glob("*.json"))) == 35
    assert len(list((tmp_path / "questionnaires").glob("*.json"))) == 64
    # distinct option sets (computed from the DB)
    con = sqlite3.connect(DB); n_opt = con.execute(
        "SELECT count(DISTINCT option_id) FROM options WHERE option_id IS NOT NULL").fetchone()[0]
    assert len(list((tmp_path / "options").glob("*.json"))) == n_opt
    assert (tmp_path / "loss_report.json").exists()

    # every artifact validates against the schemas
    reg = build_registry(S.schemas_dir)
    for art in load_tree(tmp_path, release=REL):
        validate_artifact(art, reg, S.schemas_dir)

def test_full_run_ingests_into_library(pg_url, tmp_path):
    import_survey_db(DB, tmp_path, release=REL, imported_at=AT)
    reg = build_registry(S.schemas_dir)
    with psycopg.connect(pg_url) as c:
        report = ingest_tree(c, tmp_path, "import", registry=reg, schemas_dir=S.schemas_dir, release=REL)
        c.commit()
        assert report.errors == []
        n_qst = c.execute("SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'").fetchone()[0]
        assert n_qst == 64
```

- [ ] **Step 2: Run → FAIL.** `DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/tests/integration/test_importer_run.py -v`

- [ ] **Step 3: Write `library/src/library/importers/survey_db/run.py`**

```python
import re
from dataclasses import dataclass, field
from pathlib import Path
from .reader import SurveyDB
from . import mappers
from .questionnaire import reconstruct
from .writer import write_entity
from .loss import LossReport

@dataclass
class ImportSummary:
    counts: dict = field(default_factory=dict)
    loss: LossReport = None

def _pin_pending(obj: dict, version: str) -> dict:
    # replace the "@PENDING" placeholder refs emitted by entity mappers with the release version
    return _walk(obj, version)

def _walk(node, version):
    if isinstance(node, dict):
        return {k: (v.replace("@PENDING", "@" + version) if k == "ref" and isinstance(v, str) else _walk(v, version))
                for k, v in node.items()}
    if isinstance(node, list):
        return [_walk(x, version) for x in node]
    return node

def import_survey_db(sqlite_path, out_dir, release: str, imported_at: str) -> ImportSummary:
    db = SurveyDB(Path(sqlite_path))
    out = Path(out_dir)
    loss = LossReport()
    counts = {}

    def emit(entity_type, obj):
        write_entity(out, entity_type, _pin_pending(obj, release))
        counts[entity_type] = counts.get(entity_type, 0) + 1

    for row in db.prompts(): emit("prompt", mappers.map_prompt(row))
    for row in db.contexts(): emit("context", mappers.map_context(row))
    for row in db.instructions(): emit("instruction", mappers.map_instruction(row))
    for row in db.messages(): emit("message", mappers.map_message(row))
    for row in db.placeholders(): emit("placeholder", mappers.map_placeholder(row))
    for row in db.helps(): emit("help", mappers.map_help(row))
    for row in db.regexes(): emit("regex", mappers.map_regex(row))
    for row in db.solutions(): emit("solution", mappers.map_solution(row))
    for option_id, rows in db.options_grouped().items(): emit("option", mappers.map_option(option_id, rows))

    comps = db.compositions()
    surveys = db.surveys()
    qids = sorted({c["questionnaire"] for c in comps if c.get("questionnaire")})
    for qid in qids:
        header = next((c for c in comps if c["questionnaire"] == qid and c["element_type"] == "header"), None)
        hid = (header or {}).get("header_id")
        survey = surveys.get(hid)
        if survey is None:
            loss.add("warning", f"questionnaire.{qid}", f"header_id {hid!r} has no survey metadata")
        q = reconstruct(qid, comps, survey, release, imported_at)
        if q["metadata"]["license"] == "unknown":
            loss.add("warning", f"surveys.{hid}.license", "NULL -> unknown")
        emit("questionnaire", q)

    used_headers = {(next((c for c in comps if c["questionnaire"] == q and c["element_type"] == "header"), {}) or {}).get("header_id") for q in qids}
    for sid in surveys:
        if sid not in used_headers:
            loss.add("dropped", f"surveys.{sid}", "orphan survey (no questionnaire references it)")
        if surveys[sid].get("scoring_code"):
            loss.add("dropped", f"surveys.{sid}.scoring_code", "scoring URL not convertible to a Scorer (OD-16)")

    for k, v in counts.items():
        loss.preserve(k, v)
    loss.write(out)
    return ImportSummary(counts=counts, loss=loss)
```

- [ ] **Step 4: Add the `import-survey-db` subcommand to `library/src/library/cli.py`**

In `cli.py`, add an `import-survey-db` subparser and branch:
```python
    imp = sub.add_parser("import-survey-db")
    imp.add_argument("sqlite_path")
    imp.add_argument("--out", default="content")
    imp.add_argument("--release", required=True)
    imp.add_argument("--imported-at", required=True)
```
and in the command dispatch:
```python
        elif args.cmd == "import-survey-db":
            from .importers.survey_db.run import import_survey_db
            summary = import_survey_db(args.sqlite_path, args.out, args.release, args.imported_at)
            print("imported:", summary.counts)
```
(The `import-survey-db` branch needs no DB connection — it only reads sqlite + writes files; keep it outside the `with psycopg.connect(...)` block, or open the connection lazily only for `migrate`/`ingest`.)

- [ ] **Step 5: Add `content/` to `.gitignore`**

```bash
grep -qxF 'content/' .gitignore || echo 'content/' >> .gitignore
```

- [ ] **Step 6: Run → PASS.** `DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/tests/integration/test_importer_run.py -v`

If validation fails on a produced artifact, the schema shape for that entity differs from the mapper output — fix the mapper (Tasks 5/6) or `reconstruct` (Task 7) to match `$defs`, re-run. Do NOT weaken the "every artifact validates" / "64 questionnaires ingest" assertions. If a count is off by the orphan/junk surveys, confirm the expected count (64 questionnaires is the `compositions` distinct count, independent of orphan surveys).

- [ ] **Step 7: Commit**

```bash
git add library/src/library/importers/survey_db/run.py library/src/library/cli.py .gitignore library/tests/integration/test_importer_run.py
git commit -m "feat(importer): orchestrator + CLI + full-run validate/ingest smoke test"
```

---

## Task 10: full suite + regression check

- [ ] **Step 1: Run everything**

`DOCKER_CONFIG=/tmp/lib_docker .venv/bin/pytest library/ -q` → all pass (Library Core + importer).
`.venv/bin/pytest tools/tests/ -q` → 308 pass (unchanged).

- [ ] **Step 2: Run the CLI end-to-end (manual sanity)**

`.venv/bin/python -m library.cli import-survey-db survey_database/data/survey_db.sqlite --out /tmp/import_out --release v26.0606 --imported-at 2026-06-06T00:00:00Z` → prints counts; `/tmp/import_out/loss_report.md` exists.

- [ ] **Step 3: Commit any final fixups** (if none, skip).

---

## Self-review (run during authoring)

1. **Spec coverage:** ids (T1), content map (T2), loss report (T3+used in T9), reader (T4), all 9 mappers (T5/T6), questionnaire reconstruction + provenance (T7), writer (T8), orchestrator + CLI + counts + validate + ingest (T9), suite/regression (T10). Output gitignored (T9). Orphan/junk + scoring_code drops recorded (T9). All spec §§ map to a task.
2. **Placeholders:** none — every step has runnable code/commands.
3. **Type/name consistency:** `canonical_id`, `simple_content`, `LossReport.add/preserve/write`, `SurveyDB.*`, `map_*`, `reconstruct(qid, comp_rows, survey_row, release, imported_at)`, `build_provenance(qid, header_id, imported_at)`, `write_entity(out_dir, entity_type, obj)`, `import_survey_db(sqlite_path, out_dir, release, imported_at)`, the `@PENDING` ref convention + `_pin_pending` rewrite — all used identically across tasks.

## Known follow-ups (out of this plan)

- `condition`→`show_if` is verbatim passthrough; real expression translation waits on the WASM evaluator (OD-11).
- `map_message` `type` splitting assumes comma-or-single; if the legacy `type` vocabulary is richer, refine against `messages.type` values.
- Option `units`/`label` per-language handling is minimal (legacy has a single `units` column); revisit if multilingual units are needed.
- Psychometric metadata is absent in the source (left empty for native enrichment; imported content stays unpublishable until reviewed, per 13_importers).

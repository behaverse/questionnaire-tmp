# short_title Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix ~25 junk `short_title`s via a curated `short_titles.json` override store (durable across re-harvest) + an improved shared `derive_short_title` for future harvests, then apply + regenerate.

**Architecture:** `short_titles.py` (override IO + apply + bulk patch via `write_entity` + junk guard) wired into harvest + two CLIs; `naming.derive_short_title` replaces both adapters' first-parenthetical logic. Apply the 19 confident overrides in place; 6 stay as owner-fillable TODOs.

**Tech Stack:** Python 3 (stdlib + BeautifulSoup), pytest. Spec: `docs/superpowers/specs/2026-06-21-questionnaire-harvester-short-title-cleanup-design.md`.

## Global Constraints

- **Faithfulness:** acronyms are factual instrument labels; the 6 uncertain ones stay as `TODO` placeholders (skipped by apply), not guessed into canonical.
- **No schema change; no new dependency.** `short_title` is a core field; values only corrected. Default `--version v26.0618`.
- **Serialization fidelity:** bulk patch reuses `write_entity(out_dir, "questionnaire", q)` (`json.dumps(..., indent=2, ensure_ascii=False, sort_keys=True)`, NO trailing newline) → only `short_title` diffs.
- **Preserve stylized acronyms** (BITe / Grit-S / LiES / NODS-CLiP): no override touches them; `derive_short_title`'s ≥2-uppercase test keeps them; the guard must not flag them.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** isolated worktree `.claude/worktrees/harvester-shorttitles`, branch `harvester-shorttitle-cleanup-0621`. ALL edits under this worktree. Before each commit confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-shorttitle-cleanup-0621`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Model:** do NOT use the cheapest (haiku) tier. Use sonnet or higher.
- **Run from the worktree root**; `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.

## Reference (verified)

- Both adapters set short_title via `short_m = re.search(r"\(([^)]+)\)", title); short_title = short_m.group(1) if short_m else title` — `psychology_tools.py:225-226`, `psytoolkit.py:291-292`.
- `write_entity(out_dir, "questionnaire", obj)` (from `library.importers.survey_db.writer`) writes `output/questionnaires/<metadata.id>.json`, `sort_keys=True, indent=2`, no trailing newline.
- `cli.py` subparsers: `harvest` (h), `document-scoring`, `review-export`, `apply-descriptions`, `check-descriptions`; harvest already has `--descriptions`, `--source-metadata`. Dispatch branches precede the `if a.cmd != "harvest": return 2` guard.

---

### Task 1: `short_titles.py` module + harvest durability

**Files:**
- Create: `questionnaire-harvester/src/harvester/short_titles.py`
- Modify: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_short_titles.py`, `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Produces: `load_short_titles(path) -> dict`; `apply_short_title(rq, store_path) -> bool`; `apply_short_titles_to_output(out_dir, store_path) -> list[str]`; `check_short_titles(out_dir) -> list[dict]`; harvest `--short-titles`.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_short_titles.py`:

```python
import json
from types import SimpleNamespace
from library.importers.survey_db.writer import write_entity
from harvester.short_titles import (
    load_short_titles, apply_short_title, apply_short_titles_to_output, check_short_titles)


def _store(tmp_path, mapping):
    p = tmp_path / "short_titles.json"
    p.write_text(json.dumps(mapping))
    return p

def _q(qid, st):
    return {"@context": "x", "metadata": {"id": qid, "title": "T", "short_title": st,
            "description": "d"}, "pages": [{"id": "page_main", "elements": []}]}

def test_load_short_titles_drops_todo_and_blank(tmp_path):
    p = _store(tmp_path, {"qst_a": "AAA", "qst_b": "TODO: maybe BBB", "qst_c": "  ", "qst_d": "D-1"})
    assert load_short_titles(p) == {"qst_a": "AAA", "qst_d": "D-1"}

def test_load_short_titles_missing(tmp_path):
    assert load_short_titles(tmp_path / "nope.json") == {}

def test_apply_short_title_sets_when_present(tmp_path):
    p = _store(tmp_path, {"qst_x": "XSC"})
    rq = SimpleNamespace(qst_id="qst_x", short_title="old")
    assert apply_short_title(rq, p) is True and rq.short_title == "XSC"

def test_apply_short_title_noop_for_todo(tmp_path):
    p = _store(tmp_path, {"qst_x": "TODO: XSC?"})
    rq = SimpleNamespace(qst_id="qst_x", short_title="old")
    assert apply_short_title(rq, p) is False and rq.short_title == "old"

def test_apply_to_output_patches_only_overridden(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a", "for adolescents"))
    write_entity(out, "questionnaire", _q("qst_b", "BITe"))
    before_b = (out / "questionnaires" / "qst_b.json").read_text()
    p = _store(tmp_path, {"qst_a": "ABS", "qst_b": "TODO: skip"})
    patched = apply_short_titles_to_output(out, p)
    assert patched == ["qst_a"]
    a = json.loads((out / "questionnaires" / "qst_a.json").read_text())["metadata"]
    assert a["short_title"] == "ABS"
    assert (out / "questionnaires" / "qst_b.json").read_text() == before_b  # untouched

def test_check_flags_junk_not_clean(tmp_path):
    out = tmp_path / "output"
    for qid, st in [("qst_1", "for adolescents"), ("qst_2", "revised version"),
                    ("qst_3", "Short Form"), ("qst_4", "CIA 3.0"), ("qst_5", "Rotter, 1966"),
                    ("qst_6", "Original"), ("qst_7", "Trust in close relationships"),
                    ("qst_ok1", "PHQ-9"), ("qst_ok2", "BITe"), ("qst_ok3", "WHO-5"),
                    ("qst_ok4", "Teacher Burnout")]:
        write_entity(out, "questionnaire", _q(qid, st))
    flagged = {f["id"] for f in check_short_titles(out)}
    assert {"qst_1", "qst_2", "qst_3", "qst_4", "qst_5", "qst_6", "qst_7"} <= flagged
    assert not ({"qst_ok1", "qst_ok2", "qst_ok3", "qst_ok4"} & flagged)
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py` (reuses the SP1 `psychology_tools_meta.html` fixture → id `qst_demo`):

```python
def test_harvest_applies_short_title_override(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_meta.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    st = tmp_path / "short_titles.json"; st.write_text('{"qst_demo": "DSC"}')
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-screening",
                   "--out", str(out), "--scales-index", str(tmp_path / "missing.json"),
                   "--register", str(tmp_path / "register.md"), "--questions", str(tmp_path / "questions"),
                   "--source-metadata", str(tmp_path / "sm"), "--short-titles", str(st),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    md = json.loads((out / "questionnaires" / "qst_demo.json").read_text())["metadata"]
    assert md["short_title"] == "DSC"
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_short_titles.py questionnaire-harvester/tests/test_cli_e2e.py -k "short_title" -v`
Expected: FAIL — no `short_titles` module; harvest has no `--short-titles`.

- [ ] **Step 3: Create `short_titles.py`**

Create `questionnaire-harvester/src/harvester/short_titles.py`:

```python
import json
import re
from pathlib import Path

from library.importers.survey_db.writer import write_entity

_JUNK_RE = re.compile(
    r",|\bversion\b|\bform\b|\boriginal\b|^\s*(?:for|the)\b|^[a-z]|\b(?:19|20)\d{2}\b|\d\.\d",
    re.I)


def load_short_titles(path):
    """Return {id: short_title} from the JSON store, dropping blank values and TODO
    placeholders (values starting with 'TODO', case-insensitive)."""
    p = Path(path)
    if not p.exists():
        return {}
    raw = json.loads(p.read_text())
    return {k: v.strip() for k, v in raw.items()
            if isinstance(v, str) and v.strip() and not v.strip().lower().startswith("todo")}


def apply_short_title(rq, store_path):
    """If a (non-TODO) override exists for rq.qst_id, set rq.short_title. Returns True iff applied."""
    st = load_short_titles(store_path).get(rq.qst_id)
    if st:
        rq.short_title = st
        return True
    return False


def apply_short_titles_to_output(out_dir, store_path):
    """Bulk in-place patch: set metadata.short_title from the store for each questionnaire whose
    id has a (non-TODO) override AND whose value differs; rewrite via write_entity (identical
    serialization). Returns the ids patched."""
    overrides = load_short_titles(store_path)
    qdir = Path(out_dir) / "questionnaires"
    patched = []
    for f in sorted(qdir.glob("*.json")):
        q = json.loads(f.read_text())
        m = q.get("metadata") or {}
        qid = m.get("id")
        if qid in overrides and m.get("short_title") != overrides[qid]:
            q["metadata"]["short_title"] = overrides[qid]
            write_entity(out_dir, "questionnaire", q)
            patched.append(qid)
    return patched


def check_short_titles(out_dir):
    """Flag canonical short_titles that look like junk (qualifier fragments / version cruft /
    sentence-like). Returns [{id, short_title}] for flagged ids."""
    qdir = Path(out_dir) / "questionnaires"
    flagged = []
    for f in sorted(qdir.glob("*.json")):
        m = json.loads(f.read_text()).get("metadata") or {}
        st = m.get("short_title") or ""
        if _JUNK_RE.search(st) or len(st.split()) > 2 or len(st) > 24:
            flagged.append({"id": m.get("id"), "short_title": st})
    return flagged
```

- [ ] **Step 4: Wire harvest `--short-titles`**

In `questionnaire-harvester/src/harvester/cli.py`, add the harvest arg (after the `h.add_argument("--descriptions", ...)` line):

```python
    h.add_argument("--short-titles", default="questionnaire-harvester/short_titles.json")
```

In the harvest flow, immediately after the existing `apply_authored_description(rq, Path(a.descriptions))` call, add:

```python
    from harvester.short_titles import apply_short_title
    apply_short_title(rq, Path(a.short_titles))
```

- [ ] **Step 5: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/short_titles.py questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_short_titles.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): short_title override store + harvest-path apply"
```

---

### Task 2: `apply-short-titles` + `check-short-titles` CLIs

**Files:**
- Modify: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:** Consumes `apply_short_titles_to_output` + `check_short_titles` (Task 1). Produces `apply-short-titles` + `check-short-titles` subcommands.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_apply_short_titles_cli(tmp_path):
    from library.importers.survey_db.writer import write_entity
    out = tmp_path / "output"
    write_entity(out, "questionnaire", {"@context": "x", "metadata": {"id": "qst_z",
        "title": "T", "short_title": "for adolescents", "description": "d"},
        "pages": [{"id": "page_main", "elements": []}]})
    st = tmp_path / "short_titles.json"; st.write_text('{"qst_z": "ABS"}')
    rc = cli.main(["apply-short-titles", "--out", str(out), "--short-titles", str(st)])
    assert rc == 0
    md = json.loads((out / "questionnaires" / "qst_z.json").read_text())["metadata"]
    assert md["short_title"] == "ABS"

def test_check_short_titles_cli_nonzero_on_junk(tmp_path):
    from library.importers.survey_db.writer import write_entity
    out = tmp_path / "output"
    write_entity(out, "questionnaire", {"@context": "x", "metadata": {"id": "qst_j",
        "title": "T", "short_title": "revised version", "description": "d"},
        "pages": [{"id": "page_main", "elements": []}]})
    rc = cli.main(["check-short-titles", "--out", str(out)])
    assert rc == 1
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py -k "short_titles_cli or check_short_titles" -v`
Expected: FAIL — subcommands unknown (SystemExit).

- [ ] **Step 3: Add the two subcommands**

In `questionnaire-harvester/src/harvester/cli.py`, register subparsers (after the `check-descriptions` `cd = sub.add_parser(...)` block — or after the existing subparsers, before `a = ap.parse_args(argv)`):

```python
    ast = sub.add_parser("apply-short-titles")
    ast.add_argument("--out", default="questionnaire-harvester/output")
    ast.add_argument("--short-titles", default="questionnaire-harvester/short_titles.json")
    cst = sub.add_parser("check-short-titles")
    cst.add_argument("--out", default="questionnaire-harvester/output")
```

Add the dispatch branches (before the `if a.cmd != "harvest": return 2` guard):

```python
    if a.cmd == "apply-short-titles":
        from harvester.short_titles import apply_short_titles_to_output
        ids = apply_short_titles_to_output(Path(a.out), Path(a.short_titles))
        print(f"applied {len(ids)} short_title override(s)")
        return 0
    if a.cmd == "check-short-titles":
        from harvester.short_titles import check_short_titles
        flagged = check_short_titles(Path(a.out))
        for f in flagged:
            print(f"FLAG {f['id']}: {f['short_title']!r}")
        print(f"{len(flagged)} flagged")
        return 1 if flagged else 0
```

- [ ] **Step 4: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): apply-short-titles + check-short-titles CLIs"
```

---

### Task 3: Shared `derive_short_title` + adapter wiring

**Files:**
- Create: `questionnaire-harvester/src/harvester/naming.py`
- Modify: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, `questionnaire-harvester/src/harvester/sources/psytoolkit.py`
- Test: `questionnaire-harvester/tests/test_naming.py`

**Interfaces:** Produces `derive_short_title(title) -> str`; both adapters use it.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_naming.py`:

```python
from harvester.naming import derive_short_title

def test_derive_short_title():
    assert derive_short_title("Hare Psychopathy Checklist (Original) (PCL-22)") == "PCL-22"
    assert derive_short_title("Clinical Impairment Assessment Questionnaire (CIA 3.0)") == "CIA"
    assert derive_short_title("The Obsessive–Compulsive Inventory (short version, OCI-R)") == "OCI-R"
    assert derive_short_title("Short Grit Scale (Grit-S)") == "Grit-S"
    assert derive_short_title("Autism Spectrum Quotient (AQ)") == "AQ"
    assert derive_short_title("Patient Health Questionnaire-9 (PHQ-9)") == "PHQ-9"
    assert derive_short_title("The WHO-5 Well-Being Index") == "WHO-5"
    assert derive_short_title("Aggressive behavior scale (for adolescents)") == "Aggressive behavior scale"
    assert derive_short_title("Systemizing Quotient") == "Systemizing Quotient"
```

- [ ] **Step 2: Run to verify it fails**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_naming.py -v`
Expected: FAIL — no `naming` module.

- [ ] **Step 3: Create `naming.py`**

Create `questionnaire-harvester/src/harvester/naming.py`:

```python
import re


def _acronymish(tok):
    """A token that looks like an acronym: 2-14 chars, no spaces, >= 2 uppercase letters
    (catches stylized ones like BITe, Grit-S, OCI-R, WHO-5, PCL-22)."""
    tok = tok.strip(" .,;:")
    return 2 <= len(tok) <= 14 and " " not in tok and sum(c.isupper() for c in tok) >= 2


def derive_short_title(title):
    """Best clean acronym / short name for a questionnaire title:
    1) an acronym in a parenthetical (right-most first — the real short form usually trails);
    2) else an acronym-style token elsewhere (skipping Titlecase words like 'Well-Being');
    3) else the title minus a trailing descriptive parenthetical; 4) else the title."""
    title = title or ""
    for paren in reversed(re.findall(r"\(([^)]+)\)", title)):
        for tok in re.split(r"[,\s]+", paren.strip()):
            if _acronymish(tok):
                return tok
    for tok in re.split(r"\s+", re.sub(r"[()]", " ", title)):
        if _acronymish(tok) and not tok.istitle():
            return tok
    name = re.sub(r"\s*\([^)]*\)\s*$", "", title).strip()
    return name or title
```

- [ ] **Step 4: Run the naming test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_naming.py -v`
Expected: PASS.

- [ ] **Step 5: Wire both adapters**

In `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, add near the top imports:

```python
from harvester.naming import derive_short_title
```

and replace (around line 225):

```python
        short_m = re.search(r"\(([^)]+)\)", title)
        short_title = short_m.group(1) if short_m else title
```

with:

```python
        short_title = derive_short_title(title)
```

In `questionnaire-harvester/src/harvester/sources/psytoolkit.py`, add the same import near the top, and replace (around line 291):

```python
        short_m = re.search(r"\(([^)]+)\)", title)
        short_title = short_m.group(1) if short_m else title
```

with:

```python
        short_title = derive_short_title(title)
```

- [ ] **Step 6: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS. If an existing adapter test asserts the OLD first-parenthetical short_title for a fixture and the new derived value differs (the new value is the cleaner acronym), update that assertion to the new value — do not revert the derivation.

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/naming.py questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/src/harvester/sources/psytoolkit.py questionnaire-harvester/tests/test_naming.py
git commit -m "feat(harvester): shared derive_short_title (clean acronym) for both adapters"
```

---

### Task 4: Author `short_titles.json` + rollout

**Files:**
- Create: `questionnaire-harvester/short_titles.json`
- (data) `questionnaire-harvester/output/**`, `import_review/**`; `HANDOFF.md` (untracked).

- [ ] **Step 1: Create the override store**

Create `questionnaire-harvester/short_titles.json`:

```json
{
  "qst_arc": "SQ",
  "qst_cc": "ZKPQ-50-CC",
  "qst_cia": "CIA",
  "qst_ehi": "EHI",
  "qst_gas": "GAS",
  "qst_gp": "GPS",
  "qst_gsqs": "GSQS",
  "qst_happiness": "CHS",
  "qst_intelligence": "EI",
  "qst_lsas": "LSAS",
  "qst_npi16": "NPI-16",
  "qst_ohq": "OHQ",
  "qst_pcl22": "PCL-22",
  "qst_pts": "PTS",
  "qst_sbs": "SBS",
  "qst_scsr": "SCS-R",
  "qst_sf": "LAS-SF",
  "qst_shortversionocir": "OCI-R",
  "qst_tsis": "TSIS",
  "qst_who5": "WHO-5",
  "qst_adolescents": "TODO: ABS? (Aggressive Behavior Scale)",
  "qst_ard": "TODO: Dominance Scale (no standard acronym)",
  "qst_burnout": "TODO: Teacher Burnout (no standard acronym)",
  "qst_quotient": "TODO: AQ-10?",
  "qst_rotter": "TODO: Rotter I-E?",
  "qst_trust": "TODO: Trust Scale (no standard acronym)",
  "qst_webexec": "TODO: webexec? (stylized lowercase name — confirm WEBEXEC vs webexec)"
}
```

- [ ] **Step 2: Apply + verify**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli apply-short-titles 2>&1 | tail -1
python - <<'PY'
import json
for qid, exp in [("qst_lsas","LSAS"),("qst_pcl22","PCL-22"),("qst_shortversionocir","OCI-R"),
                 ("qst_who5","WHO-5"),("qst_npi16","NPI-16")]:
    import os
    f=f"questionnaire-harvester/output/questionnaires/{qid}.json"
    if os.path.exists(f):
        st=json.load(open(f))["metadata"]["short_title"]
        print(qid, st, "OK" if st==exp else f"!! expected {exp}")
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: `applied 20 short_title override(s)`; the listed ids show their corrected acronym (note `qst_pcl22` was clean already if not in the survey — only assert ids present); tree `OK`. (Some listed ids may not exist; the snippet guards with `os.path.exists`.)

- [ ] **Step 3: Regenerate review + run the guard**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli review-export 2>&1 | tail -1
echo "=== remaining junk (should be ~the 6 TODO ids) ===" && python -m harvester.cli check-short-titles 2>&1 | tail -20
```

Expected: `wrote 158 review doc(s) + README`; `check-short-titles` flags roughly the 7 TODO ids (adolescents, ard, burnout, quotient, rotter, trust, webexec) plus any other genuinely-multiword names — report the exact list.

- [ ] **Step 4: Commit the data + regenerated docs**

```bash
git add questionnaire-harvester/short_titles.json questionnaire-harvester/output questionnaire-harvester/import_review
git commit -m "data(harvester): apply curated short_title acronyms (19); regenerate review"
```

- [ ] **Step 5: Update the HANDOFF (untracked — on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note `short_titles.json` override store + `apply-short-titles`/`check-short-titles` CLIs + harvest `--short-titles` durability + the improved `derive_short_title`; 20 acronyms applied; 7 `TODO` ids await owner values (fill the JSON, re-run `apply-short-titles` + `review-export`). Do NOT `git add` it.

---

## Final integration (after all tasks)

- [ ] **Run the suite + validator**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m pytest questionnaire-harvester/tests -q
python tools/validate_schemas.py
```

Expected: harvester suite green; `All N example(s) passed.`

- [ ] **Merge inside the worktree + fast-forward-push**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/harvester-shorttitles
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester short_title cleanup branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/harvester-shorttitles
git branch -D harvester-shorttitle-cleanup-0621
```

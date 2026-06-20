# Authored Descriptions (SP2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every questionnaire's canonical `description` with an original two-sentence house-format description from a durable `descriptions/<id>.md` override store, with an originality guard, generation of all 158, and rollout.

**Architecture:** New `descriptions.py` (override IO + apply + bulk in-place patch via `write_entity` + originality guard); `RawQuestionnaire.description_source`; `draft` emits `x_description_source` (authored wins over site_meta); `cli` `--descriptions` (harvest, durable) + `apply-descriptions` + `check-descriptions` subcommands; batched generation; rollout (apply + regenerate).

**Tech Stack:** Python 3 (stdlib + BeautifulSoup), pytest. Spec: `docs/superpowers/specs/2026-06-20-questionnaire-harvester-authored-descriptions-design.md`.

## Global Constraints

- **Copyright / faithfulness:** authored descriptions are original wording (the originality guard blocks ≥8-word verbatim overlap with the SP1-captured source). Never invent psychometric claims (cut-offs, validity stats); omit rater/purpose qualifiers when unknown rather than guess. The scraped original stays only in `source_metadata/` (SP1).
- **No schema change; no new dependency; no in-pipeline LLM.** `x_description_source` is an `^x_` metadata extension; `descriptions/` is a tracked sidecar. Default `--version v26.0618`.
- **Serialization fidelity:** the bulk patch reuses `write_entity(out_dir, "questionnaire", q)` (`json.dumps(..., indent=2, ensure_ascii=False, sort_keys=True)`, NO trailing newline) so only changed fields diff.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** isolated worktree `.claude/worktrees/harvester-descriptions`, branch `harvester-authored-descriptions-0620`. ALL edits under this worktree. Before each commit confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-authored-descriptions-0620`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Model:** do NOT use the cheapest (haiku) tier. Use sonnet or higher.
- **Run from the worktree root**; `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.

## Reference (verified)

- `draft.py` lines 176-181: the `x_references`/`x_keywords`/`x_description_source` block (the `x_description_source` line currently: `if getattr(rq, "source_meta", None): md["x_description_source"] = "site_meta"`).
- `raw.py` `RawQuestionnaire` tail: `references`, `keywords`, `source_meta` (add `description_source` after).
- `write_entity(out_dir, "questionnaire", obj)` (from `library.importers.survey_db.writer`) writes `output/questionnaires/<metadata.id>.json` with `sort_keys=True, indent=2`, no trailing newline.
- `cli.py`: subparsers `harvest` (h), `document-scoring` (ds), `review-export` (rv); dispatch branches before the `if a.cmd != "harvest": return 2` guard.

---

### Task 1: Override store + harvest-path apply

**Files:**
- Create: `questionnaire-harvester/src/harvester/descriptions.py`
- Modify: `questionnaire-harvester/src/harvester/raw.py`, `questionnaire-harvester/src/harvester/draft.py`, `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_descriptions.py`, `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Produces: `load_authored(descriptions_dir) -> dict[str,str]`; `apply_authored_description(rq, descriptions_dir) -> bool`; `RawQuestionnaire.description_source: str | None`; harvest `--descriptions`.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_descriptions.py`:

```python
from types import SimpleNamespace
from harvester.descriptions import load_authored, apply_authored_description

def test_load_authored_reads_md_files(tmp_path):
    (tmp_path / "qst_a.md").write_text("Desc A.\n")
    (tmp_path / "qst_b.md").write_text("  Desc B.  ")
    (tmp_path / "qst_empty.md").write_text("   ")
    m = load_authored(tmp_path)
    assert m == {"qst_a": "Desc A.", "qst_b": "Desc B."}

def test_load_authored_missing_dir(tmp_path):
    assert load_authored(tmp_path / "nope") == {}

def test_apply_authored_sets_description_and_source(tmp_path):
    (tmp_path / "qst_x.md").write_text("The X (X) is a 3-item demo. It is used to test.")
    rq = SimpleNamespace(qst_id="qst_x", description="old scraped", description_source=None)
    assert apply_authored_description(rq, tmp_path) is True
    assert rq.description == "The X (X) is a 3-item demo. It is used to test."
    assert rq.description_source == "authored"

def test_apply_authored_noop_when_absent(tmp_path):
    rq = SimpleNamespace(qst_id="qst_y", description="old", description_source=None)
    assert apply_authored_description(rq, tmp_path) is False
    assert rq.description == "old" and rq.description_source is None
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py` (reuses the SP1 `psychology_tools_meta.html` fixture → id `qst_demo`):

```python
def test_harvest_applies_authored_description_override(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_meta.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    desc = tmp_path / "descriptions"; desc.mkdir()
    (desc / "qst_demo.md").write_text("The Demo Screening (DEMO) is a 1-item demo measure. It is used to test harvesting.")
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-screening",
                   "--out", str(out), "--scales-index", str(tmp_path / "missing.json"),
                   "--register", str(tmp_path / "register.md"), "--questions", str(tmp_path / "questions"),
                   "--source-metadata", str(tmp_path / "sm"), "--descriptions", str(desc),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    md = json.loads((out / "questionnaires" / "qst_demo.json").read_text())["metadata"]
    assert md["description"] == "The Demo Screening (DEMO) is a 1-item demo measure. It is used to test harvesting."
    assert md["x_description_source"] == "authored"
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_descriptions.py questionnaire-harvester/tests/test_cli_e2e.py -k "authored or load_authored" -v`
Expected: FAIL — no `descriptions` module; harvest has no `--descriptions`.

- [ ] **Step 3: Create `descriptions.py`**

Create `questionnaire-harvester/src/harvester/descriptions.py`:

```python
import json
from pathlib import Path

from library.importers.survey_db.writer import write_entity


def load_authored(descriptions_dir):
    """Return {id: description text} from descriptions/<id>.md (stripped; empties skipped)."""
    out = {}
    d = Path(descriptions_dir)
    if d.is_dir():
        for f in sorted(d.glob("*.md")):
            text = f.read_text().strip()
            if text:
                out[f.stem] = text
    return out


def apply_authored_description(rq, descriptions_dir):
    """If an authored description exists for rq.qst_id, set rq.description to it and
    rq.description_source = 'authored'. Returns True iff applied."""
    text = load_authored(descriptions_dir).get(rq.qst_id)
    if text:
        rq.description = text
        rq.description_source = "authored"
        return True
    return False


def apply_descriptions_to_output(out_dir, descriptions_dir):
    """Bulk in-place patch: for each output/questionnaires/*.json whose id has an authored
    override, set metadata.description + metadata.x_description_source='authored' and rewrite
    via write_entity (identical serialization). Returns the ids patched."""
    authored = load_authored(descriptions_dir)
    qdir = Path(out_dir) / "questionnaires"
    patched = []
    for f in sorted(qdir.glob("*.json")):
        q = json.loads(f.read_text())
        qid = (q.get("metadata") or {}).get("id")
        if qid in authored:
            q["metadata"]["description"] = authored[qid]
            q["metadata"]["x_description_source"] = "authored"
            write_entity(out_dir, "questionnaire", q)
            patched.append(qid)
    return patched
```

(`apply_descriptions_to_output` is used in Task 2; defining it here keeps the module cohesive.)

- [ ] **Step 4: Add `RawQuestionnaire.description_source`**

In `questionnaire-harvester/src/harvester/raw.py`, after `source_meta: dict | None = None`, add:

```python
    description_source: str | None = None
```

- [ ] **Step 5: `draft` emits authored-wins `x_description_source`**

In `questionnaire-harvester/src/harvester/draft.py`, replace:

```python
    if getattr(rq, "source_meta", None):
        md["x_description_source"] = "site_meta"
```

with:

```python
    if getattr(rq, "description_source", None):
        md["x_description_source"] = rq.description_source
    elif getattr(rq, "source_meta", None):
        md["x_description_source"] = "site_meta"
```

- [ ] **Step 6: Wire harvest `--descriptions`**

In `questionnaire-harvester/src/harvester/cli.py`, add the harvest arg (after the `h.add_argument("--source-metadata", ...)` line):

```python
    h.add_argument("--descriptions", default="questionnaire-harvester/descriptions")
```

In the harvest flow, after the `--id` override + collision-check block and immediately BEFORE `instr_index = build_instruction_index(Path(a.out))`, add:

```python
    from harvester.descriptions import apply_authored_description
    apply_authored_description(rq, Path(a.descriptions))
```

- [ ] **Step 7: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (descriptions unit tests + the harvest-override e2e + everything else).

- [ ] **Step 8: Commit**

```bash
git add questionnaire-harvester/src/harvester/descriptions.py questionnaire-harvester/src/harvester/raw.py questionnaire-harvester/src/harvester/draft.py questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_descriptions.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): authored-description override store + harvest-path apply"
```

---

### Task 2: `apply-descriptions` bulk CLI

**Files:**
- Modify: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_descriptions.py`, `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Consumes: `apply_descriptions_to_output` (Task 1).
- Produces: `apply-descriptions` subcommand.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_descriptions.py`:

```python
import json
from library.importers.survey_db.writer import write_entity
from harvester.descriptions import apply_descriptions_to_output

def _q(qid, desc="scraped", src="site_meta"):
    return {"@context": "x", "metadata": {"id": qid, "title": "T", "short_title": "T",
            "description": desc, "x_source_site": "psychology-tools.com",
            "x_description_source": src}, "pages": [{"id": "page_main", "elements": []}]}

def test_apply_descriptions_patches_only_overridden(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a"))
    write_entity(out, "questionnaire", _q("qst_b"))
    untouched_before = (out / "questionnaires" / "qst_b.json").read_text()
    desc = tmp_path / "descriptions"; desc.mkdir()
    (desc / "qst_a.md").write_text("The A (A) is authored. It is used to test.")
    patched = apply_descriptions_to_output(out, desc)
    assert patched == ["qst_a"]
    a = json.loads((out / "questionnaires" / "qst_a.json").read_text())["metadata"]
    assert a["description"] == "The A (A) is authored. It is used to test."
    assert a["x_description_source"] == "authored"
    # qst_b (no override) byte-identical
    assert (out / "questionnaires" / "qst_b.json").read_text() == untouched_before
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_apply_descriptions_cli(tmp_path):
    from library.importers.survey_db.writer import write_entity
    out = tmp_path / "output"
    write_entity(out, "questionnaire", {"@context": "x", "metadata": {"id": "qst_z", "title": "T",
        "short_title": "T", "description": "old", "x_source_site": "psychology-tools.com"},
        "pages": [{"id": "page_main", "elements": []}]})
    desc = tmp_path / "descriptions"; desc.mkdir()
    (desc / "qst_z.md").write_text("The Z (Z) is authored. It is used to test.")
    rc = cli.main(["apply-descriptions", "--out", str(out), "--descriptions", str(desc)])
    assert rc == 0
    md = json.loads((out / "questionnaires" / "qst_z.json").read_text())["metadata"]
    assert md["x_description_source"] == "authored" and md["description"].startswith("The Z (Z)")
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -k "apply_descriptions" -v`
Expected: FAIL — `apply-descriptions` subcommand unknown (SystemExit) / function asserted via CLI.

- [ ] **Step 3: Add the `apply-descriptions` subcommand**

In `questionnaire-harvester/src/harvester/cli.py`, register a subparser alongside the others (after the `rv = sub.add_parser("review-export")` block):

```python
    ad = sub.add_parser("apply-descriptions")
    ad.add_argument("--out", default="questionnaire-harvester/output")
    ad.add_argument("--descriptions", default="questionnaire-harvester/descriptions")
```

Add the dispatch branch (before the `if a.cmd != "harvest": return 2` guard):

```python
    if a.cmd == "apply-descriptions":
        from harvester.descriptions import apply_descriptions_to_output
        ids = apply_descriptions_to_output(Path(a.out), Path(a.descriptions))
        print(f"applied {len(ids)} authored description(s)")
        return 0
```

- [ ] **Step 4: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_descriptions.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): apply-descriptions bulk in-place patch CLI"
```

---

### Task 3: `check-descriptions` originality guard

**Files:**
- Modify: `questionnaire-harvester/src/harvester/descriptions.py`, `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_descriptions.py`, `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Produces: `check_descriptions(out_dir, descriptions_dir, source_meta_dir) -> list[dict]`; `check-descriptions` subcommand (returns non-zero when any flagged).

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_descriptions.py`:

```python
from harvester.descriptions import check_descriptions

def _setup(tmp_path, qid, short, desc_text, intro):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q(qid))
    # patch short_title
    import json as _j
    p = out / "questionnaires" / f"{qid}.json"
    q = _j.loads(p.read_text()); q["metadata"]["short_title"] = short
    write_entity(out, "questionnaire", q)
    desc = tmp_path / "descriptions"; desc.mkdir(exist_ok=True)
    (desc / f"{qid}.md").write_text(desc_text)
    sm = tmp_path / "sm"; sm.mkdir(exist_ok=True)
    (sm / f"{qid}.json").write_text(_j.dumps({"id": qid, "introduction": [intro], "meta_description": ""}))
    return out, desc, sm

def test_check_flags_verbatim_overlap(tmp_path):
    intro = "the alpha beta gamma delta epsilon zeta eta theta iota measure is good"
    out, desc, sm = _setup(tmp_path, "qst_o", "AAA",
                           "AAA: the alpha beta gamma delta epsilon zeta eta theta iota measure.", intro)
    issues = {i["id"]: i["issues"] for i in check_descriptions(out, desc, sm)}
    assert any("overlap" in s for s in issues.get("qst_o", []))

def test_check_flags_shape_problems(tmp_path):
    out, desc, sm = _setup(tmp_path, "qst_s", "ZZZ", "no acronym here and no period", "unrelated source text")
    issues = {i["id"]: i["issues"] for i in check_descriptions(out, desc, sm)}
    assert "qst_s" in issues  # missing acronym + missing period

def test_check_clean_description_passes(tmp_path):
    out, desc, sm = _setup(tmp_path, "qst_c", "GAD-7",
                           "The GAD-7 is a 7-item anxiety screening questionnaire. It is used in primary care.",
                           "completely different wording about worry over fourteen days for screening purposes here")
    assert check_descriptions(out, desc, sm) == []
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_check_descriptions_cli_nonzero_on_overlap(tmp_path):
    from library.importers.survey_db.writer import write_entity
    out = tmp_path / "output"
    q = {"@context": "x", "metadata": {"id": "qst_v", "title": "T", "short_title": "VV",
         "description": "x"}, "pages": [{"id": "page_main", "elements": []}]}
    write_entity(out, "questionnaire", q)
    desc = tmp_path / "descriptions"; desc.mkdir()
    (desc / "qst_v.md").write_text("VV one two three four five six seven eight nine ten end.")
    sm = tmp_path / "sm"; sm.mkdir()
    (sm / "qst_v.json").write_text('{"id":"qst_v","introduction":["one two three four five six seven eight nine ten"],"meta_description":""}')
    rc = cli.main(["check-descriptions", "--out", str(out), "--descriptions", str(desc), "--source-metadata", str(sm)])
    assert rc == 1
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -k "check" -v`
Expected: FAIL — no `check_descriptions` / `check-descriptions`.

- [ ] **Step 3: Add `check_descriptions`**

In `questionnaire-harvester/src/harvester/descriptions.py`, add (and `import re` at the top):

```python
def _words(text):
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def check_descriptions(out_dir, descriptions_dir, source_meta_dir, *, n=8, max_len=400):
    """Flag authored descriptions that (a) share a run of >= n consecutive words with the
    captured source introduction/meta_description (verbatim-overlap → copyright risk), or
    (b) fail shape checks (empty / > max_len / no sentence period / missing acronym).
    Returns [{id, issues:[...]}] for flagged ids only."""
    authored = load_authored(descriptions_dir)
    qdir, smdir = Path(out_dir) / "questionnaires", Path(source_meta_dir)
    flagged = []
    for qid, text in sorted(authored.items()):
        issues = []
        qf = qdir / f"{qid}.json"
        short = ""
        if qf.exists():
            short = (json.loads(qf.read_text()).get("metadata") or {}).get("short_title") or ""
        if not text.strip():
            issues.append("empty")
        if len(text) > max_len:
            issues.append(f"too long ({len(text)} > {max_len})")
        if "." not in text:
            issues.append("no sentence period")
        if short and short.lower() not in text.lower():
            issues.append(f"missing acronym {short!r}")
        smf = smdir / f"{qid}.json"
        if smf.exists():
            sm = json.loads(smf.read_text())
            src = " ".join(sm.get("introduction") or []) + " " + (sm.get("meta_description") or "")
            src_grams = {tuple(w) for w in _ngrams(_words(src), n)}
            if src_grams and any(tuple(g) in src_grams for g in _ngrams(_words(text), n)):
                issues.append(f"verbatim overlap (>= {n} words) with source")
        if issues:
            flagged.append({"id": qid, "issues": issues})
    return flagged


def _ngrams(words, n):
    return [words[i:i + n] for i in range(len(words) - n + 1)] if len(words) >= n else []
```

- [ ] **Step 4: Add the `check-descriptions` subcommand**

In `questionnaire-harvester/src/harvester/cli.py`, register the subparser (after the `apply-descriptions` one):

```python
    cd = sub.add_parser("check-descriptions")
    cd.add_argument("--out", default="questionnaire-harvester/output")
    cd.add_argument("--descriptions", default="questionnaire-harvester/descriptions")
    cd.add_argument("--source-metadata", default="questionnaire-harvester/source_metadata")
```

Add the dispatch branch (before the `if a.cmd != "harvest": return 2` guard):

```python
    if a.cmd == "check-descriptions":
        from harvester.descriptions import check_descriptions
        flagged = check_descriptions(Path(a.out), Path(a.descriptions), Path(a.source_metadata))
        for f in flagged:
            print(f"FLAG {f['id']}: {'; '.join(f['issues'])}")
        print(f"{len(flagged)} flagged")
        return 1 if flagged else 0
```

- [ ] **Step 5: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/descriptions.py questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_descriptions.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): check-descriptions originality + shape guard"
```

---

### Task 4: Generate the 158 authored descriptions (controller-orchestrated)

**NOTE FOR THE EXECUTOR:** this task is **orchestrated by the controller**, not a single implementer subagent — it fans out batches and iterates against the guard. It produces data files only (`descriptions/<id>.md`); no source changes.

- [ ] **Step 1: Build the id → facts worklist**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json, glob
rows=[]
for f in sorted(glob.glob("questionnaire-harvester/output/questionnaires/*.json")):
    q=json.load(open(f)); m=q["metadata"]; els=q["pages"][0]["elements"]
    o1=None
    if els:
        oref=els[0]["option"]["ref"].split("@")[0]
        of=f"questionnaire-harvester/output/options/{oref}.json"
        import os
        if os.path.exists(of): o1=json.load(open(of))
    print(json.dumps({"id":m["id"],"title":m["title"],"short_title":m["short_title"],
        "items":m["psychometrics"]["item_count"],
        "input_data_type":(o1 or {}).get("input_data_type"),
        "measurement_type":(o1 or {}).get("measurement_type"),
        "keywords":m.get("x_keywords") or []}))
PY
```
This prints one JSON line per questionnaire (158). Confirm the count is 158.

- [ ] **Step 2: Generate in batches (controller dispatches subagents)**

For each batch of ~20 ids, dispatch a sonnet subagent that, for each id, reads `output/questionnaires/<id>.json` + its first option + `source_metadata/<id>.json` (keywords + introduction — **factual reference only, never copied**) and writes `questionnaire-harvester/descriptions/<id>.md` containing ONLY the description text: two sentences in the house format —

> "The {full title with acronym in parentheses} is a {N}-item {self-report/clinician-rated/parent-rated/teacher-rated — only if known} {measure/screening tool/questionnaire/scale} {assessing/screening for/measuring} {construct/domain}. It is used to {purpose}."

Rules for the subagent: original wording (do NOT reuse any run of words from the introduction); ≤ ~350 chars; must contain the acronym (`short_title`); end sentences with periods; omit the rater or purpose clause when not confidently known rather than inventing; never state cut-offs/validity/normative claims. Each subagent writes its batch's files and returns the ids written.

- [ ] **Step 3: Run the guard; regenerate flagged**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli check-descriptions 2>&1 | tail -20
echo "descriptions written: $(ls questionnaire-harvester/descriptions/*.md 2>/dev/null | wc -l)"
```
Expected eventually: `0 flagged` and 158 files. Re-dispatch generation for any flagged ids (overlap/shape) until the guard passes and all 158 exist. Report the final count + that the guard is clean.

- [ ] **Step 4: Commit the generated descriptions**

```bash
git add questionnaire-harvester/descriptions
git commit -m "data(harvester): author original two-sentence descriptions for all questionnaires"
```

---

### Task 5: Rollout — apply + regenerate + handoff

**Files:** (data) `questionnaire-harvester/output/**`, `import_review/**`, `scoring/**`; `HANDOFF.md` (untracked).

- [ ] **Step 1: Apply authored descriptions to canonical + verify**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli apply-descriptions 2>&1 | tail -1
python - <<'PY'
import json, glob
tot=auth=0
for f in glob.glob("questionnaire-harvester/output/questionnaires/*.json"):
    m=json.load(open(f))["metadata"]; tot+=1
    if m.get("x_description_source")=="authored": auth+=1
print(f"questionnaires {tot} | x_description_source=authored {auth}")
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```
Expected: `applied 158 authored description(s)`; `authored 158`; tree `OK`. Report numbers.

- [ ] **Step 2: Regenerate review + scoring docs + spot-check**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli review-export 2>&1 | tail -1
python -m harvester.cli document-scoring 2>&1 | tail -1
python - <<'PY'
import json, pathlib
for qid in ("qst_aq","qst_gad7","qst_lsas"):
    m=json.load(open(f"questionnaire-harvester/output/questionnaires/{qid}.json"))["metadata"]
    print(qid, "->", m["description"][:90], "| src:", m.get("x_description_source"))
    t=pathlib.Path(f"questionnaire-harvester/import_review/{qid}.md").read_text()
    print("   review note still says site_meta?", "x_description_source: site_meta" in t)
PY
```
Expected: `158` review + `158` scoring; each spot-checked questionnaire shows the authored description + `x_description_source: authored`; the review docs no longer carry the `site_meta` note. Report.

- [ ] **Step 3: Commit the rollout**

```bash
git add questionnaire-harvester/output questionnaire-harvester/import_review questionnaire-harvester/scoring
git commit -m "data(harvester): apply authored descriptions to canonical; regenerate review + scoring"
```

- [ ] **Step 4: Update the HANDOFF (untracked — on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note the `descriptions/<id>.md` authored override store; `apply-descriptions` + `check-descriptions` CLIs; harvest now applies overrides (durable); all 158 canonical descriptions are authored (`x_description_source: authored`); the scraped originals remain in `source_metadata/`. Do NOT `git add` it.

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
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/harvester-descriptions
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester authored-descriptions branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/harvester-descriptions
git branch -D harvester-authored-descriptions-0620
```

# Harvester Import Review Aid — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `review-export` command that reads the harvested canonical JSON and writes `questionnaire-harvester/import_review/` — a `README.md` review checklist (one box per questionnaire, grouped by source site, with links to the readable export + the original page) and a human-readable `<id>.md` render per questionnaire (refs resolved to text) for side-by-side comparison.

**Architecture:** A new module `harvester/review_export.py` (its own four-subdir `load_entities`; pure `render_option`/`render_questionnaire_md`/`index_entry`/`render_index_md`; `write_review_export`) + a `review-export` CLI subcommand. Reads `output/`; writes `import_review/`. No change to harvest/draft/validate, the canonical entities, or the schema.

**Tech Stack:** Python 3 (stdlib `json`/`pathlib` only — no new dependency), pytest. Spec: `docs/superpowers/specs/2026-06-20-questionnaire-harvester-import-review-design.md`.

## Global Constraints

- **Faithful reformatting only:** resolve refs to their stored text and lay it out; no interpretation, no edits to canonical data. Instruction/context text rendered **verbatim** (incl. any literal HTML). Missing referenced entities render as `‹missing …›`, never crash.
- **No new dependency:** stdlib only.
- **Sidecar only:** write under `import_review/`; do NOT modify any questionnaire/option/prompt/instruction/context JSON or the schema.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/harvester-review`, branch `harvester-review-export-0620`). ALL edits under this worktree. Before each commit confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-review-export-0620`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **Model:** do NOT use the cheapest (haiku) tier for implementers. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/harvester-review`; `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **`import_review/` is tracked staging** (like `questions/`/`scoring/`).

## Canonical field paths (verified)

- questionnaire `metadata.{id,title,short_title,x_source_url,x_source_site,license,publication?}`; `pages[0].elements[]` = `{option:{ref}, question:{prompt:{ref}, instruction?:{ref}, context?:{ref}}}`.
- option: `input_data_type` (`choice`|`number`|`text`), `dimension`; structural `options[]`=`[{index,value(float)}]`; `content.en.options[]`=`[{index,text}]`; number options carry `min/max/step/min_label/max_label/center_label/initial_value`.
- prompt: `content.en.text`, optional `reversed`. instruction/context: `content.en.text`.
- refs carry `@vYY.MMDD` → strip with `split("@",1)[0]`. Source sites: psytoolkit.org / psychology-tools.com / phqscreeners.com (158 total).

---

### Task 1: `review_export.py` — load + render + write

**Files:**
- Create: `questionnaire-harvester/src/harvester/review_export.py`
- Test: `questionnaire-harvester/tests/test_review_export.py`

**Interfaces:**
- Produces: `load_entities(out_dir, subdirs=(...)) -> dict`; `render_option(opt) -> str`; `render_questionnaire_md(qst, entities) -> str`; `index_entry(qst) -> dict`; `render_index_md(entries) -> str`; `write_review_export(out_dir, review_dir, only_id=None) -> list[str]`.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_review_export.py`:

```python
import json
from harvester.review_export import (
    render_option, render_questionnaire_md, index_entry, render_index_md, write_review_export)


def _choice(oid, dim, vals, anchors):
    return {"id": oid, "input_data_type": "choice", "dimension": dim,
            "measurement_type": "ordinal", "selection": "single",
            "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(vals)],
            "content": {"en": {"options": [{"index": i + 1, "text": a}
                                           for i, a in enumerate(anchors)]}}}

def _number(oid, dim, lo, hi, step, minl, maxl):
    return {"id": oid, "input_data_type": "number", "dimension": dim,
            "min": float(lo), "max": float(hi), "step": float(step),
            "min_label": minl, "max_label": maxl}

def _pr(pid, text, reversed=False):
    p = {"id": pid, "content": {"en": {"text": text}}}
    if reversed:
        p["reversed"] = True
    return p

def _ins(iid, text):
    return {"id": iid, "content": {"en": {"text": text}}}

def _qst(qid, elements, **md):
    m = {"id": qid, "title": md.get("title", "T"), "short_title": md.get("short_title", "T"),
         "x_source_url": md.get("source_url", "http://x"), "x_source_site": md.get("site", "s"),
         "license": md.get("license", "unknown")}
    if "publication" in md:
        m["publication"] = md["publication"]
    return {"metadata": m, "pages": [{"id": "page_main", "elements": elements}]}

def test_render_option_choice():
    s = render_option(_choice("o", "rating", [0, 1, 2, 3], ["None", "Mild", "Moderate", "Severe"]))
    assert s == "1. None (0) · 2. Mild (1) · 3. Moderate (2) · 4. Severe (3)"

def test_render_option_number_slider():
    s = render_option(_number("o", "rating", 1, 7, 1, "not at all", "very much"))
    assert s == 'number 1–7 (step 1): "not at all" … "very much"'

def test_render_option_blank_anchor_shows_value_only():
    assert render_option(_choice("o", "rating", [0, 1], ["", ""])) == "1. (0) · 2. (1)"

def test_render_option_missing():
    assert render_option(None) == "‹missing option›"

def test_render_questionnaire_md_resolves_text_and_link():
    o = _choice("opt_x", "fear", [0, 1], ["No", "Yes"])
    pr = _pr("pr_x_1", "I feel tense", reversed=True)
    ins = _ins("ins_x", "Rate each item.")
    els = [{"option": {"ref": "opt_x@v"},
            "question": {"prompt": {"ref": "pr_x_1@v"}, "instruction": {"ref": "ins_x@v"}}}]
    md = render_questionnaire_md(
        _qst("qst_x", els, source_url="http://src"),
        {"options": {"opt_x": o}, "prompts": {"pr_x_1": pr},
         "instructions": {"ins_x": ins}, "contexts": {}})
    assert "**Original:** http://src" in md
    assert "I feel tense" in md
    assert "1. No (0) · 2. Yes (1)" in md
    assert "reversed" in md and "dimension: fear" in md
    assert "Rate each item." in md

def test_render_questionnaire_md_missing_option_does_not_crash():
    els = [{"option": {"ref": "opt_gone@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}]
    md = render_questionnaire_md(_qst("qst_x", els),
                                 {"options": {}, "prompts": {"pr_x_1": _pr("pr_x_1", "q")},
                                  "instructions": {}, "contexts": {}})
    assert "‹missing option›" in md

def test_render_index_md_grouped_checklist():
    es = [{"id": "qst_b", "title": "B", "short_title": "B", "source_url": "http://b", "source_site": "site2.org"},
          {"id": "qst_a", "title": "A", "short_title": "A", "source_url": "http://a", "source_site": "site1.org"}]
    md = render_index_md(es)
    assert md.index("## site1.org (1)") < md.index("## site2.org (1)")   # sorted by site
    assert "- [ ] [A (`qst_a`)](qst_a.md) — [original](http://a)" in md
    assert md.count("- [ ]") == 2

def test_write_review_export_tmp(tmp_path):
    out = tmp_path / "output"
    for sub in ("questionnaires", "options", "prompts", "instructions", "contexts"):
        (out / sub).mkdir(parents=True)
    (out / "options" / "opt_x.json").write_text(json.dumps(_choice("opt_x", "rating", [0, 1], ["No", "Yes"])))
    (out / "prompts" / "pr_x_1.json").write_text(json.dumps(_pr("pr_x_1", "q1")))
    els = [{"option": {"ref": "opt_x@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}]
    (out / "questionnaires" / "qst_x.json").write_text(json.dumps(_qst("qst_x", els, site="s.org")))
    rev = tmp_path / "import_review"
    ids = write_review_export(out, rev)
    assert ids == ["qst_x"]
    assert (rev / "qst_x.md").exists() and (rev / "README.md").exists()
    assert "- [ ]" in (rev / "README.md").read_text()
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_review_export.py -v`
Expected: FAIL — `ModuleNotFoundError: harvester.review_export`.

- [ ] **Step 3: Write the module**

Create `questionnaire-harvester/src/harvester/review_export.py`:

```python
import json
from pathlib import Path


def load_entities(out_dir, subdirs=("options", "prompts", "instructions", "contexts")):
    """Return {subdir: {id: json}} for the harvested tree."""
    out = {}
    for sub in subdirs:
        m = {}
        d = Path(out_dir) / sub
        if d.is_dir():
            for f in sorted(d.glob("*.json")):
                try:
                    o = json.loads(f.read_text())
                except json.JSONDecodeError:
                    continue
                if isinstance(o, dict) and "id" in o:
                    m[o["id"]] = o
        out[sub] = m
    return out


def _ref_id(ref):
    return (ref or "").split("@", 1)[0]


def _num(v):
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return v


def _text(entity):
    return (((entity or {}).get("content", {}) or {}).get("en", {}) or {}).get("text", "")


def render_option(opt):
    """A readable one-line description of an option (choice anchors+values, or number/slider)."""
    if opt is None:
        return "‹missing option›"
    if opt.get("input_data_type") == "number":
        s = f"number {_num(opt.get('min'))}–{_num(opt.get('max'))}"
        if opt.get("step") not in (None, ""):
            s += f" (step {_num(opt.get('step'))})"
        labels = []
        if opt.get("min_label") or opt.get("max_label"):
            labels.append(f"\"{opt.get('min_label', '')}\" … \"{opt.get('max_label', '')}\"")
        if opt.get("center_label"):
            labels.append(f"center \"{opt['center_label']}\"")
        if opt.get("initial_value") is not None:
            labels.append(f"initial {_num(opt['initial_value'])}")
        return s + (": " + " · ".join(labels) if labels else "")
    anchors = {c.get("index"): c.get("text", "")
               for c in (((opt.get("content", {}) or {}).get("en", {}) or {}).get("options", []))}
    vals = {s.get("index"): s.get("value") for s in opt.get("options", [])}
    parts = []
    for i in sorted(set(anchors) | set(vals)):
        a = anchors.get(i, "")
        v = _num(vals.get(i))
        parts.append(f"{i}. {a} ({v})" if a else f"{i}. ({v})")
    return " · ".join(parts) if parts else "(no options)"


def render_questionnaire_md(qst, entities):
    """A human-readable render of an imported questionnaire: original link, metadata,
    resolved instruction/context, and each item's prompt text + option line."""
    md = qst.get("metadata", {}) or {}
    opts, prs = entities.get("options", {}), entities.get("prompts", {})
    inss, ctxs = entities.get("instructions", {}), entities.get("contexts", {})
    pages = qst.get("pages") or []
    elements = pages[0].get("elements", []) if pages else []

    out = [f"# {md.get('title', '')} (`{md.get('id', '')}`)\n",
           f"**Original:** {md.get('x_source_url', '—')}\n",
           f"- short_title: {md.get('short_title', '')}",
           f"- source: {md.get('x_source_site', '')}",
           f"- license: {md.get('license', '')}"]
    pub = md.get("publication")
    if pub:
        out.append(f"- publication: {pub.get('citation', '')} ({pub.get('year', '')})")
    out.append(f"- items: {len(elements)}\n")

    seen_i, instr_texts, seen_c, ctx_texts = set(), [], set(), []
    for el in elements:
        iref = _ref_id(el.get("question", {}).get("instruction", {}).get("ref", ""))
        if iref and iref not in seen_i:
            seen_i.add(iref)
            instr_texts.append(_text(inss.get(iref)) or f"‹missing {iref}›")
        cref = _ref_id(el.get("question", {}).get("context", {}).get("ref", ""))
        if cref and cref not in seen_c:
            seen_c.add(cref)
            ctx_texts.append(_text(ctxs.get(cref)) or f"‹missing {cref}›")
    if instr_texts:
        out.append("## Instructions\n")
        out += [t + "\n" for t in instr_texts]
    if ctx_texts:
        out.append("## Context\n")
        out += [t + "\n" for t in ctx_texts]

    out.append("## Items\n")
    for i, el in enumerate(elements, start=1):
        pref = _ref_id(el.get("question", {}).get("prompt", {}).get("ref", ""))
        oref = _ref_id(el.get("option", {}).get("ref", ""))
        pr = prs.get(pref)
        opt = opts.get(oref)
        ptext = _text(pr) if pr is not None else f"‹missing {pref}›"
        tags = []
        if opt is not None and opt.get("dimension"):
            tags.append(f"dimension: {opt['dimension']}")
        if (pr or {}).get("reversed"):
            tags.append("reversed")
        tagstr = f"  _({'; '.join(tags)})_" if tags else ""
        out.append(f"{i}. **{ptext}**{tagstr}")
        out.append(f"   - {render_option(opt)}")
    out.append("")
    return "\n".join(out)


def index_entry(qst):
    md = qst.get("metadata", {}) or {}
    return {"id": md.get("id"), "title": md.get("title"),
            "short_title": md.get("short_title"),
            "source_url": md.get("x_source_url"),
            "source_site": md.get("x_source_site") or "unknown"}


def render_index_md(entries):
    """A review checklist grouped by source site (sorted), one checkbox per questionnaire."""
    by_site = {}
    for e in entries:
        by_site.setdefault(e["source_site"], []).append(e)
    out = ["# Import review\n",
           "Tick each box after reviewing the imported questionnaire against its original.\n"]
    for site in sorted(by_site):
        rows = sorted(by_site[site], key=lambda e: e["id"] or "")
        out.append(f"## {site} ({len(rows)})\n")
        for e in rows:
            label = e["short_title"] or e["title"] or e["id"]
            out.append(f"- [ ] [{label} (`{e['id']}`)]({e['id']}.md) — "
                       f"[original]({e['source_url']})")
        out.append("")
    return "\n".join(out)


def write_review_export(out_dir, review_dir, only_id=None):
    """Scan all questionnaires; always (re)write README.md (full checklist) + a readable
    <id>.md for only_id (or every questionnaire). Returns the doc ids written."""
    out_dir, review_dir = Path(out_dir), Path(review_dir)
    entities = load_entities(out_dir)
    qdir = out_dir / "questionnaires"
    files = sorted(qdir.glob("*.json")) if qdir.is_dir() else []
    review_dir.mkdir(parents=True, exist_ok=True)
    entries, written = [], []
    for f in files:
        try:
            qst = json.loads(f.read_text())
        except json.JSONDecodeError:
            continue
        qid = (qst.get("metadata", {}) or {}).get("id")
        if not qid:
            continue
        entries.append(index_entry(qst))
        if only_id and qid != only_id:
            continue
        (review_dir / f"{qid}.md").write_text(render_questionnaire_md(qst, entities))
        written.append(qid)
    (review_dir / "README.md").write_text(render_index_md(entries))
    return written
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_review_export.py -v`
Expected: PASS (all 8 tests).

- [ ] **Step 5: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (nothing else touched).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/review_export.py questionnaire-harvester/tests/test_review_export.py
git commit -m "feat(harvester): review_export module (readable questionnaire render + checklist)"
```

---

### Task 2: `review-export` CLI + full sweep

**Files:**
- Modify: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: `write_review_export` from Task 1; the real `output/` tree.
- Produces: `review-export` subcommand; `import_review/README.md` + `import_review/<id>.md` for all questionnaires.

- [ ] **Step 1: Write the failing CLI tests**

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_review_export_cli_lsas(tmp_path):
    from harvester import cli
    rev = tmp_path / "import_review"
    assert cli.main(["review-export", "--out", "questionnaire-harvester/output",
                     "--review-dir", str(rev), "--id", "qst_lsas"]) == 0
    doc = (rev / "qst_lsas.md").read_text()
    assert "psychology-tools.com/test/liebowitz-social-anxiety-scale" in doc
    assert "1. **" in doc and "48. **" in doc
    assert "dimension: fear" in doc and "dimension: avoidance" in doc
    readme = (rev / "README.md").read_text()
    assert readme.count("- [ ]") == 158

def test_review_export_cli_gad7(tmp_path):
    from harvester import cli
    rev = tmp_path / "import_review"
    assert cli.main(["review-export", "--out", "questionnaire-harvester/output",
                     "--review-dir", str(rev), "--id", "qst_gad7"]) == 0
    doc = (rev / "qst_gad7.md").read_text()
    assert "## Items" in doc
    assert "(0)" in doc          # a choice option line rendered with weights
```

(These read the real `output/` via the repo-relative path; the suite runs from the worktree root.)

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py -k review_export -v`
Expected: FAIL — argparse rejects the unknown `review-export` subcommand (SystemExit).

- [ ] **Step 3: Add the `review-export` subcommand**

In `questionnaire-harvester/src/harvester/cli.py`, the `harvest` and `document-scoring` subparsers are already registered and dispatched. Add a third, following the exact same pattern.

Register the subparser **alongside the existing `document-scoring` subparser** (i.e. just after the `ds.add_argument("--id", ...)` line, before `a = ap.parse_args(argv)`):

```python
    rv = sub.add_parser("review-export")
    rv.add_argument("--out", default="questionnaire-harvester/output")
    rv.add_argument("--review-dir", default="questionnaire-harvester/import_review")
    rv.add_argument("--id", dest="qst_id", default=None, help="only this questionnaire id")
```

Add the dispatch branch **immediately after the existing `if a.cmd == "document-scoring":` block and before the `if a.cmd != "harvest": return 2` guard**:

```python
    if a.cmd == "review-export":
        from harvester.review_export import write_review_export
        ids = write_review_export(Path(a.out), Path(a.review_dir), only_id=a.qst_id)
        print(f"wrote {len(ids)} review doc(s) + README")
        return 0
```

- [ ] **Step 4: Run the CLI tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (both new CLI tests + everything else).

- [ ] **Step 5: Commit the CLI wiring**

```bash
git add questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): review-export CLI subcommand"
```

- [ ] **Step 6: Generate all review docs (full sweep)**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli review-export 2>&1 | tail -1
echo "docs: $(ls questionnaire-harvester/import_review/*.md | grep -v '/README.md' | wc -l) | README boxes: $(grep -c '^- \[ \]' questionnaire-harvester/import_review/README.md) | questionnaires: $(ls questionnaire-harvester/output/questionnaires/*.json | wc -l)"
# spot-check: a slider questionnaire renders the 'number .. (step ..)' line
python - <<'PY'
import glob
sl = [f for f in glob.glob("questionnaire-harvester/import_review/*.md")
      if "/README.md" not in f and "number " in open(f).read() and "(step " in open(f).read()]
print("docs with a slider line:", len(sl), "e.g.", sl[0].split("/")[-1] if sl else "none")
# every doc has the Original link + an Items section
import os
bad = [f for f in glob.glob("questionnaire-harvester/import_review/*.md")
       if "/README.md" not in f and ("**Original:**" not in open(f).read() or "## Items" not in open(f).read())]
print("docs missing Original/Items:", bad or "none")
PY
```

Expected: `wrote 158 review doc(s) + README`; docs == 158; README boxes == 158; questionnaires == 158; at least one slider doc; no docs missing Original/Items. Report the counts + the slider example.

- [ ] **Step 7: Commit the generated docs**

```bash
git add questionnaire-harvester/import_review
git commit -m "docs(harvester): generate import_review/ readable exports + checklist for all questionnaires"
```

- [ ] **Step 8: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note the new `review-export` command + the `import_review/` folder (README checklist linking each readable `<id>.md` export to the original page, for side-by-side review). Do **NOT** `git add` it. No commit for this step.

---

## Final integration (after all tasks)

- [ ] **Run the suite + validator**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m pytest questionnaire-harvester/tests -q
python tools/validate_schemas.py
```

Expected: harvester suite green; `All N example(s) passed.` (review docs are sidecars — the canonical tree is unchanged).

- [ ] **Merge inside the worktree + fast-forward-push** (do NOT touch the main dir — a concurrent editor agent holds it)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/harvester-review
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester review-export branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree** (from the main repo dir)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/harvester-review
git branch -D harvester-review-export-0620   # tip == origin/master after the ff-push
```

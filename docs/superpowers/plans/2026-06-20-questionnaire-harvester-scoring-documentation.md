# Harvester Scoring Documentation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `document-scoring` command that reads the harvested canonical JSON and writes a faithful `scoring/<id>.md` sidecar (fenced-json structured block + prose + per-item table + `needs-research` checklist) per questionnaire, to seed the later `scr_*` Scorer-authoring stage.

**Architecture:** A new pure-where-possible module `harvester/scoring_doc.py` (`load_entities`, `derive_scoring`, `render_scoring_md`, `write_scoring_docs`) + a `document-scoring` CLI subcommand. Reads `output/`; writes `scoring/<id>.md`. No change to harvest/draft/validate, the canonical entities, or the schema.

**Tech Stack:** Python 3 (stdlib `json`/`pathlib` only — no new dependency), pytest. Spec: `docs/superpowers/specs/2026-06-20-questionnaire-harvester-scoring-documentation-design.md`.

## Global Constraints

- **Faithfulness:** derive only from canonical JSON; never invent aggregation/cut-offs/subscale-membership — those stay null under `to_research`; `status` is always `"needs-research"`. Missing referenced entities are flagged in `to_research.notes`, never crash.
- **No new dependency:** stdlib only (the structured block is a fenced ` ```json ` block, not YAML frontmatter; PyYAML is NOT a declared harvester dep).
- **Sidecar only:** write `scoring/<id>.md`; do NOT modify any questionnaire/option/prompt JSON or the schema.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/harvester-scoring`, branch `harvester-scoring-doc-0620`). ALL edits under this worktree. Before each commit confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-scoring-doc-0620`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **Model:** do NOT use the cheapest (haiku) tier for implementers. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/harvester-scoring`; `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **`scoring/` is tracked staging** (like `questions/`); owner-reviewable; not auto-promoted.

## Canonical field paths (verified)

- questionnaire: `metadata.{id,title,short_title,x_source_url,publication?}`; `pages[0].elements[]` each `{option:{ref}, question:{prompt:{ref}, instruction?:{ref}}, required}`.
- option: `dimension`, `measurement_type`, structural `options[]` = `[{index, value(float)}]`, `content.en.options[]` = `[{index, text}]`.
- prompt: `content.en.text`; optional `reversed`; optional `subscales` (`scl_*@v..` refs).
- refs carry an `@vYY.MMDD` suffix → strip with `split("@",1)[0]`.

---

### Task 1: `scoring_doc.py` — derive + render + write

**Files:**
- Create: `questionnaire-harvester/src/harvester/scoring_doc.py`
- Test: `questionnaire-harvester/tests/test_scoring_doc.py`

**Interfaces:**
- Produces: `load_entities(out_dir: Path) -> dict` (`{"options":{id:json},"prompts":{id:json}}`); `derive_scoring(qst: dict, options_by_id: dict, prompts_by_id: dict) -> dict`; `render_scoring_md(desc: dict) -> str`; `write_scoring_docs(out_dir: Path, scoring_dir: Path, only_id: str|None=None) -> list[str]`.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_scoring_doc.py`:

```python
import json
import pytest
from harvester.scoring_doc import derive_scoring, render_scoring_md, write_scoring_docs


def _opt(oid, dim, vals, anchors, mt="ordinal"):
    return {"id": oid, "dimension": dim, "measurement_type": mt, "input_data_type": "choice",
            "selection": "single",
            "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(vals)],
            "content": {"en": {"options": [{"index": i + 1, "text": a}
                                           for i, a in enumerate(anchors)]}}}

def _pr(pid, text, reversed=False, subscales=None):
    p = {"id": pid, "content": {"en": {"text": text}}}
    if reversed:
        p["reversed"] = True
    if subscales:
        p["subscales"] = subscales
    return p

def _qst(qid, elements, **md):
    m = {"id": qid, "title": md.get("title", "T"), "short_title": md.get("short_title", "T"),
         "x_source_url": md.get("source_url", "http://x")}
    if "publication" in md:
        m["publication"] = md["publication"]
    return {"metadata": m, "pages": [{"id": "page_main", "elements": elements}]}

def test_derive_uniform_single_scale():
    o = _opt("opt_x_rating_3", "rating", [0, 1, 2], ["Never", "Sometimes", "Often"])
    prs = {f"pr_x_{i}": _pr(f"pr_x_{i}", f"item {i}") for i in (1, 2, 3)}
    els = [{"option": {"ref": "opt_x_rating_3@v26.0618"},
            "question": {"prompt": {"ref": f"pr_x_{i}@v26.0618"}}} for i in (1, 2, 3)]
    d = derive_scoring(_qst("qst_x", els), {"opt_x_rating_3": o}, prs)
    assert d["item_count"] == 3
    assert d["dimensions"] == ["rating"]
    assert d["uniform_scale"] is True
    assert len(d["option_scales"]) == 1
    sc = d["option_scales"][0]
    assert sc["values"] == [0, 1, 2] and sc["value_range"] == [0, 2]
    assert sc["anchors"] == ["Never", "Sometimes", "Often"]
    assert d["reversed_items"] == []
    assert len(d["per_item"]) == 3
    assert d["status"] == "needs-research"
    assert d["to_research"] == {"aggregation": None, "subscale_definitions": None,
                                "cutoffs": None, "notes": None}

def test_derive_two_dimensions_not_uniform():
    of = _opt("opt_y_fear_1", "fear", [0, 1, 2, 3], ["None", "Mild", "Moderate", "Severe"])
    oa = _opt("opt_y_avoidance_2", "avoidance", [0, 1, 2, 3], ["Never", "Rarely", "Often", "Usually"])
    els = [{"option": {"ref": "opt_y_fear_1@v"}, "question": {"prompt": {"ref": "pr_y_1@v"}}},
           {"option": {"ref": "opt_y_avoidance_2@v"}, "question": {"prompt": {"ref": "pr_y_2@v"}}}]
    d = derive_scoring(_qst("qst_y", els), {"opt_y_fear_1": of, "opt_y_avoidance_2": oa},
                       {"pr_y_1": _pr("pr_y_1", "s1"), "pr_y_2": _pr("pr_y_2", "s1")})
    assert d["dimensions"] == ["avoidance", "fear"]
    assert d["uniform_scale"] is False
    assert len(d["option_scales"]) == 2

def test_derive_reversed_and_subscales():
    o = _opt("opt_z_rating_2", "rating", [0, 1], ["No", "Yes"])
    els = [{"option": {"ref": "opt_z_rating_2@v"}, "question": {"prompt": {"ref": "pr_z_1@v"}}},
           {"option": {"ref": "opt_z_rating_2@v"}, "question": {"prompt": {"ref": "pr_z_2@v"}}}]
    d = derive_scoring(_qst("qst_z", els), {"opt_z_rating_2": o},
                       {"pr_z_1": _pr("pr_z_1", "a", reversed=True, subscales=["scl_anx@v26.0601"]),
                        "pr_z_2": _pr("pr_z_2", "b")})
    assert d["reversed_items"] == ["pr_z_1"]
    assert d["per_item"][0]["reversed"] is True
    assert d["subscales"] == ["scl_anx"]
    assert d["uniform_scale"] is True

def test_derive_missing_option_flagged_not_crash():
    els = [{"option": {"ref": "opt_missing@v"}, "question": {"prompt": {"ref": "pr_m_1@v"}}}]
    d = derive_scoring(_qst("qst_m", els), {}, {"pr_m_1": _pr("pr_m_1", "a")})
    assert "missing option opt_missing" in (d["to_research"]["notes"] or "")
    assert d["item_count"] == 1

def test_render_md_roundtrips_json_block_and_has_table():
    o = _opt("opt_x_rating_3", "rating", [0, 1, 2], ["Never", "Sometimes", "Often"])
    prs = {f"pr_x_{i}": _pr(f"pr_x_{i}", f"item {i}") for i in (1, 2, 3)}
    els = [{"option": {"ref": "opt_x_rating_3@v"},
            "question": {"prompt": {"ref": f"pr_x_{i}@v"}}} for i in (1, 2, 3)]
    d = derive_scoring(_qst("qst_x", els, source_url="http://src"), {"opt_x_rating_3": o}, prs)
    md = render_scoring_md(d)
    block = md.split("```json", 1)[1].split("```", 1)[0]
    assert json.loads(block)["id"] == "qst_x"
    assert "needs-research" in md
    assert "http://src" in md
    assert "| # | item | dimension | weights | reversed |" in md
    assert md.count("- [ ]") == 3

def test_write_scoring_docs_tmp(tmp_path):
    out = tmp_path / "output"
    (out / "questionnaires").mkdir(parents=True)
    (out / "options").mkdir()
    (out / "prompts").mkdir()
    o = _opt("opt_x_rating_3", "rating", [0, 1, 2], ["Never", "Sometimes", "Often"])
    (out / "options" / "opt_x_rating_3.json").write_text(json.dumps(o))
    for i in (1, 2, 3):
        (out / "prompts" / f"pr_x_{i}.json").write_text(json.dumps(_pr(f"pr_x_{i}", f"item {i}")))
    els = [{"option": {"ref": "opt_x_rating_3@v"},
            "question": {"prompt": {"ref": f"pr_x_{i}@v"}}} for i in (1, 2, 3)]
    (out / "questionnaires" / "qst_x.json").write_text(json.dumps(_qst("qst_x", els)))
    sc = tmp_path / "scoring"
    ids = write_scoring_docs(out, sc)
    assert ids == ["qst_x"]
    assert (sc / "qst_x.md").exists()
    block = (sc / "qst_x.md").read_text().split("```json", 1)[1].split("```", 1)[0]
    assert json.loads(block)["item_count"] == 3
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_scoring_doc.py -v`
Expected: FAIL — `ModuleNotFoundError: harvester.scoring_doc`.

- [ ] **Step 3: Write the module**

Create `questionnaire-harvester/src/harvester/scoring_doc.py`:

```python
import json
from pathlib import Path


def load_entities(out_dir: Path) -> dict:
    """Return {'options': {id: json}, 'prompts': {id: json}} for the harvested tree."""
    ents = {}
    for sub in ("options", "prompts"):
        m = {}
        d = out_dir / sub
        if d.is_dir():
            for f in sorted(d.glob("*.json")):
                try:
                    o = json.loads(f.read_text())
                except json.JSONDecodeError:
                    continue
                if isinstance(o, dict) and "id" in o:
                    m[o["id"]] = o
        ents[sub] = m
    return ents


def _num(v):
    """Render a scale weight: whole-number floats become ints (0.0 -> 0)."""
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return v


def _ref_id(ref: str) -> str:
    return (ref or "").split("@", 1)[0]


def derive_scoring(qst: dict, options_by_id: dict, prompts_by_id: dict) -> dict:
    """Pure: a faithful scoring descriptor derived only from the canonical questionnaire
    and its referenced options/prompts. Interpretive fields (aggregation, subscale
    membership, cut-offs) stay null under `to_research`; `status` is always
    'needs-research'. Missing referenced entities are flagged in `to_research.notes`,
    never crashed on."""
    md = qst.get("metadata", {}) or {}
    pages = qst.get("pages") or []
    elements = (pages[0].get("elements", []) if pages else [])
    notes = []

    per_item, scale_order, scales = [], [], {}
    dimensions, reversed_items, subscales = set(), [], set()

    for i, el in enumerate(elements, start=1):
        oref = _ref_id(el.get("option", {}).get("ref", ""))
        pref = _ref_id(el.get("question", {}).get("prompt", {}).get("ref", ""))
        opt = options_by_id.get(oref)
        pr = prompts_by_id.get(pref)
        if oref and opt is None:
            notes.append(f"missing option {oref}")
        if pref and pr is None:
            notes.append(f"missing prompt {pref}")
        dim = (opt or {}).get("dimension")
        if dim:
            dimensions.add(dim)
        values = [_num(s.get("value")) for s in (opt or {}).get("options", [])]
        if oref and opt is not None and oref not in scales:
            anchors = [c.get("text", "") for c in
                       ((opt.get("content", {}) or {}).get("en", {}) or {}).get("options", [])]
            scales[oref] = {
                "ref": oref, "dimension": dim,
                "measurement_type": opt.get("measurement_type"),
                "levels": len(values), "values": values,
                "value_range": [min(values), max(values)] if values else [],
                "anchors": anchors,
            }
            scale_order.append(oref)
        text = (((pr or {}).get("content", {}) or {}).get("en", {}) or {}).get("text", "")
        is_rev = bool((pr or {}).get("reversed"))
        if is_rev and pref:
            reversed_items.append(pref)
        for s in ((pr or {}).get("subscales") or []):
            subscales.add(_ref_id(s))
        per_item.append({
            "index": i, "prompt_id": pref, "prompt_snippet": text[:80],
            "dimension": dim, "values": values, "reversed": is_rev,
        })

    return {
        "id": md.get("id"),
        "title": md.get("title"),
        "short_title": md.get("short_title"),
        "source_url": md.get("x_source_url"),
        "publication": md.get("publication"),
        "status": "needs-research",
        "item_count": len(elements),
        "dimensions": sorted(dimensions),
        "option_scales": [scales[r] for r in scale_order],
        "reversed_items": reversed_items,
        "subscales": sorted(subscales),
        "uniform_scale": len(scale_order) == 1,
        "per_item": per_item,
        "to_research": {
            "aggregation": None, "subscale_definitions": None, "cutoffs": None,
            "notes": "; ".join(notes) if notes else None,
        },
    }


def render_scoring_md(desc: dict) -> str:
    """fenced-json structured block + human prose + per-item table + research checklist."""
    title = desc.get("title") or desc.get("id") or ""
    out = [
        f"# Scoring — {title} (`{desc.get('id')}`)\n",
        "> **status: needs-research.** The structure below is faithful to the harvested "
        "data. The aggregation formula, subscale membership, and cut-offs are NOT in the "
        "source and must be sourced from the instrument manual/literature before authoring "
        "a `scr_*` Scorer.\n",
        "```json",
        json.dumps(desc, indent=2, ensure_ascii=False),
        "```\n",
        "## Known structure\n",
        f"- Items: {desc.get('item_count')}",
        f"- Dimensions: {', '.join(desc.get('dimensions', [])) or '—'}",
        f"- Distinct scales: {len(desc.get('option_scales', []))} "
        f"({'uniform' if desc.get('uniform_scale') else 'mixed'})",
        f"- Reverse-scored items: {', '.join(desc.get('reversed_items', [])) or 'none'}",
        f"- Subscale refs: {', '.join(desc.get('subscales', [])) or 'none'}\n",
        "## Per-item\n",
        "| # | item | dimension | weights | reversed |",
        "|---|------|-----------|---------|----------|",
    ]
    for it in desc.get("per_item", []):
        snippet = (it.get("prompt_snippet") or "").replace("|", "\\|").replace("\n", " ")
        weights = ",".join(str(v) for v in it.get("values", []))
        out.append(f"| {it['index']} | {snippet} | {it.get('dimension') or ''} | "
                   f"{weights} | {'yes' if it.get('reversed') else 'no'} |")
    src = desc.get("source_url") or "the instrument manual"
    out += [
        "",
        f"## To research (fill from {src})\n",
        "- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)",
        "- [ ] Subscales: item membership + names.",
        "- [ ] Cut-offs / severity bands / interpretation.",
        "",
    ]
    return "\n".join(out)


def write_scoring_docs(out_dir: Path, scoring_dir: Path, only_id: str | None = None) -> list:
    """Resolve + derive + render + write scoring/<id>.md for every questionnaire in
    out_dir (or just `only_id`). Returns the ids written."""
    ents = load_entities(out_dir)
    qdir = out_dir / "questionnaires"
    files = sorted(qdir.glob("*.json")) if qdir.is_dir() else []
    scoring_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for f in files:
        try:
            qst = json.loads(f.read_text())
        except json.JSONDecodeError:
            continue
        qid = (qst.get("metadata", {}) or {}).get("id")
        if not qid or (only_id and qid != only_id):
            continue
        desc = derive_scoring(qst, ents["options"], ents["prompts"])
        (scoring_dir / f"{qid}.md").write_text(render_scoring_md(desc))
        written.append(qid)
    return written
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_scoring_doc.py -v`
Expected: PASS (all 6 tests).

- [ ] **Step 5: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (nothing else touched).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/scoring_doc.py questionnaire-harvester/tests/test_scoring_doc.py
git commit -m "feat(harvester): scoring_doc module (derive + render + write scoring sidecars)"
```

---

### Task 2: `document-scoring` CLI + full sweep

**Files:**
- Modify: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: `write_scoring_docs` from Task 1; the real `output/` tree.
- Produces: `document-scoring` subcommand; `scoring/<id>.md` for all questionnaires.

- [ ] **Step 1: Write the failing CLI tests**

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_document_scoring_cli_lsas(tmp_path):
    from harvester import cli
    sc = tmp_path / "scoring"
    rc = cli.main(["document-scoring", "--out", "questionnaire-harvester/output",
                   "--scoring", str(sc), "--id", "qst_lsas"])
    assert rc == 0
    block = json.loads((sc / "qst_lsas.md").read_text().split("```json", 1)[1].split("```", 1)[0])
    assert block["item_count"] == 48
    assert block["dimensions"] == ["avoidance", "fear"]
    assert len(block["option_scales"]) == 2
    assert block["uniform_scale"] is False

def test_document_scoring_cli_uniform(tmp_path):
    from harvester import cli
    sc = tmp_path / "scoring"
    assert cli.main(["document-scoring", "--out", "questionnaire-harvester/output",
                     "--scoring", str(sc), "--id", "qst_gad7"]) == 0
    block = json.loads((sc / "qst_gad7.md").read_text().split("```json", 1)[1].split("```", 1)[0])
    assert block["uniform_scale"] is True
    assert block["option_scales"][0]["values"] == [0, 1, 2, 3]
```

(These read the real `output/` via the repo-relative path; the suite runs from the worktree root.)

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py -k document_scoring -v`
Expected: FAIL — argparse rejects the unknown `document-scoring` subcommand (SystemExit).

- [ ] **Step 3: Add the `document-scoring` subcommand**

In `questionnaire-harvester/src/harvester/cli.py`, register the subparser. After the existing `h.add_argument("--version", ...)` line (the last `harvest` arg, before `a = ap.parse_args(argv)`), add:

```python
    ds = sub.add_parser("document-scoring")
    ds.add_argument("--out", default="questionnaire-harvester/output")
    ds.add_argument("--scoring", default="questionnaire-harvester/scoring")
    ds.add_argument("--id", dest="qst_id", default=None, help="only this questionnaire id")
```

Then replace the existing guard:

```python
    a = ap.parse_args(argv)
    if a.cmd != "harvest":
        return 2
```

with:

```python
    a = ap.parse_args(argv)
    if a.cmd == "document-scoring":
        from harvester.scoring_doc import write_scoring_docs
        ids = write_scoring_docs(Path(a.out), Path(a.scoring), only_id=a.qst_id)
        print(f"wrote {len(ids)} scoring doc(s)")
        return 0
    if a.cmd != "harvest":
        return 2
```

- [ ] **Step 4: Run the CLI tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (both new CLI tests + everything else).

- [ ] **Step 5: Commit the CLI wiring**

```bash
git add questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): document-scoring CLI subcommand"
```

- [ ] **Step 6: Generate all scoring docs (full sweep)**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli document-scoring 2>&1 | tail -1
echo "docs: $(ls questionnaire-harvester/scoring/*.md | wc -l) | questionnaires: $(ls questionnaire-harvester/output/questionnaires/*.json | wc -l)"
# every json block must parse; report any with a to_research.notes flag (dangling refs)
python - <<'PY'
import json, glob
flagged = []
n = 0
for f in sorted(glob.glob("questionnaire-harvester/scoring/*.md")):
    block = open(f).read().split("```json", 1)[1].split("```", 1)[0]
    d = json.loads(block)  # raises if any block is malformed
    n += 1
    if d["to_research"]["notes"]:
        flagged.append((d["id"], d["to_research"]["notes"]))
print("parsed", n, "blocks OK")
print("dangling-ref flagged:", flagged or "none")
# spot-checks
for qid, exp in [("qst_phq9", True), ("qst_lsas", False)]:
    d = json.loads(open(f"questionnaire-harvester/scoring/{qid}.md").read().split("```json",1)[1].split("```",1)[0])
    print(qid, "uniform", d["uniform_scale"], "items", d["item_count"], "dims", d["dimensions"])
PY
```

Expected: `wrote 158 scoring doc(s)`; doc count == questionnaire count (158); all blocks parse; spot-checks show PHQ-9 uniform/9 items and LSAS non-uniform/48/[avoidance,fear]. Report the count + any dangling-ref flagged ids (these are pre-existing data issues to note, not blockers).

- [ ] **Step 7: Commit the generated docs**

```bash
git add questionnaire-harvester/scoring
git commit -m "docs(harvester): generate scoring/*.md sidecars for all questionnaires"
```

- [ ] **Step 8: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note the new `document-scoring` command + the `scoring/<id>.md` sidecars (faithful structure + `needs-research` checklist; sets up later `scr_*` authoring); note the psychology-tools "deferred layout" backlog is cleared and #4 scoring-documentation is done. Do **NOT** `git add` it. No commit for this step.

---

## Final integration (after all tasks)

- [ ] **Run the suite + validator**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m pytest questionnaire-harvester/tests -q
python tools/validate_schemas.py
```

Expected: harvester suite green; `All N example(s) passed.` (scoring docs are sidecars — the canonical tree is unchanged, so validation is unaffected).

- [ ] **Merge inside the worktree + fast-forward-push** (do NOT touch the main dir — a concurrent editor agent holds it)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/harvester-scoring
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester scoring-doc branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree** (from the main repo dir)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/harvester-scoring
git branch -D harvester-scoring-doc-0620   # tip == origin/master after the ff-push
```

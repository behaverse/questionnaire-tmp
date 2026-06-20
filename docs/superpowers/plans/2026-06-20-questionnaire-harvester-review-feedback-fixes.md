# Import-Review Feedback Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address the owner's import-review comments — render description/all-references/clear-weights in the review export; enrich the psychology-tools adapter (secondary instruction notes + per-reference links) and re-harvest the 40 pages; add the PHQ-9 10th item; regenerate all review + scoring docs.

**Architecture:** Renderer changes in `review_export.py`; adapter changes in `sources/psychology_tools.py` (+ idempotent re-harvest); one curated edit to `qst_phq9`; then regenerate `import_review/` + `scoring/` for all 158. No schema change; `draft.py`/`raw.py` unchanged.

**Tech Stack:** Python 3 (stdlib + BeautifulSoup), pytest. Spec: `docs/superpowers/specs/2026-06-20-questionnaire-harvester-review-feedback-fixes-design.md`.

## Global Constraints

- **Faithfulness:** descriptions/references/links/instructions come from the source; weights unchanged. The only authored content is the standard PHQ-9 functional-impairment item (a documented completion of a curated entity).
- **No new dependency; no schema change.** `x_references` becomes a list of `{citation, url?}` objects via the `^x_` extension (schema-permissive). Default `--version v26.0618`.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/harvester-review-fixes`, branch `harvester-review-fixes-0620`). ALL edits under this worktree. Before each commit confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-review-fixes-0620`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **Model:** do NOT use the cheapest (haiku) tier. Use sonnet or higher.
- **Run from the worktree root**; `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **`import_review/` + `scoring/` are tracked staging;** `HANDOFF.md` is gitignored (edit on disk, never `git add`).

---

### Task 1: Review-export rendering (description, references, `[score: N]`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/review_export.py`
- Test: `questionnaire-harvester/tests/test_review_export.py`, `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Produces: `render_option` choice output `index. <label> [score: <N>]`; `render_questionnaire_md` gains a Description block + a `## References` section (handles string and `{citation, url?}` reference shapes).

- [ ] **Step 1: Update + add the failing tests**

Also update the one stale e2e weight assertion (the render format changes here, so this must be fixed in this task to keep the suite green): in `questionnaire-harvester/tests/test_cli_e2e.py`, in `test_review_export_cli_gad7`, change `assert "(0)" in doc` to `assert "[score: 0]" in doc`.

In `questionnaire-harvester/tests/test_review_export.py`, REPLACE the two old-format assertions:

```python
def test_render_option_choice():
    s = render_option(_choice("o", "rating", [0, 1, 2, 3], ["None", "Mild", "Moderate", "Severe"]))
    assert s == "1. None [score: 0] · 2. Mild [score: 1] · 3. Moderate [score: 2] · 4. Severe [score: 3]"
```

```python
def test_render_option_blank_anchor_shows_value_only():
    assert render_option(_choice("o", "rating", [0, 1], ["", ""])) == "1. [score: 0] · 2. [score: 1]"
```

Then APPEND new tests (the `_qst`/`_choice`/`_pr` helpers already exist in this file; extend `_qst` calls with description/x_references via the metadata dict directly):

```python
def test_render_md_shows_description():
    o = _choice("opt_x", "rating", [0, 1], ["No", "Yes"])
    q = _qst("qst_x", [{"option": {"ref": "opt_x@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}])
    q["metadata"]["description"] = "A demo screening measure."
    md = render_questionnaire_md(q, {"options": {"opt_x": o}, "prompts": {"pr_x_1": _pr("pr_x_1", "q1")},
                                     "instructions": {}, "contexts": {}})
    assert "A demo screening measure." in md

def test_render_md_references_string_and_object_shapes():
    o = _choice("opt_x", "rating", [0, 1], ["No", "Yes"])
    q = _qst("qst_x", [{"option": {"ref": "opt_x@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}])
    q["metadata"]["x_references"] = ["Plain citation A. 2001.",
                                     {"citation": "Linked citation B. 2005.", "url": "https://pubmed/2"}]
    md = render_questionnaire_md(q, {"options": {"opt_x": o}, "prompts": {"pr_x_1": _pr("pr_x_1", "q1")},
                                     "instructions": {}, "contexts": {}})
    assert "## References" in md
    assert "- Plain citation A. 2001." in md
    assert "- Linked citation B. 2005. — [link](https://pubmed/2)" in md

def test_render_md_no_references_section_when_absent():
    o = _choice("opt_x", "rating", [0, 1], ["No", "Yes"])
    q = _qst("qst_x", [{"option": {"ref": "opt_x@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}])
    md = render_questionnaire_md(q, {"options": {"opt_x": o}, "prompts": {"pr_x_1": _pr("pr_x_1", "q1")},
                                     "instructions": {}, "contexts": {}})
    assert "## References" not in md
```

- [ ] **Step 2: Run to verify the updated/new tests fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_review_export.py -v`
Expected: FAIL on the `[score: …]` format + the description/references assertions.

- [ ] **Step 3: Update `render_option` (choice branch)**

In `review_export.py`, in `render_option`, replace the choice-branch loop body so weights read `[score: N]`:

```python
    parts = []
    for i in sorted(set(anchors) | set(vals)):
        a = anchors.get(i, "")
        v = _num(vals.get(i))
        parts.append(f"{i}. {a} [score: {v}]" if a else f"{i}. [score: {v}]")
    return " · ".join(parts) if parts else "(no options)"
```

(The `number`/slider branch is unchanged.)

- [ ] **Step 4: Add Description + References to `render_questionnaire_md`**

In `render_questionnaire_md`, after the `out.append(f"- items: {len(elements)}\n")` line, insert a Description block:

```python
    desc = (md.get("description") or "").strip()
    if desc and desc != (md.get("title") or ""):
        out.append("## Description\n")
        out.append(desc + "\n")
```

Then, immediately before the final `out.append("")` / `return`, add a References section that handles both shapes:

```python
    refs = md.get("x_references") or []
    if refs:
        out.append("## References\n")
        for r in refs:
            if isinstance(r, dict):
                line = f"- {r.get('citation', '')}"
                if r.get("url"):
                    line += f" — [link]({r['url']})"
            else:
                line = f"- {r}"
            out.append(line)
        out.append("")
```

- [ ] **Step 5: Run the review_export tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (review_export unit tests + the updated gad7 e2e + everything else green).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/review_export.py questionnaire-harvester/tests/test_review_export.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): review export shows description + all references (links) + [score: N] weights"
```

---

### Task 2: psychology-tools adapter — secondary notes + reference links

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`
- Test: `questionnaire-harvester/tests/test_psychology_tools.py`

**Interfaces:**
- Consumes: existing `_clean_citation`.
- Produces: `_source_link(li) -> str|None`; `parse()` appends `^please note` paragraphs to `instruction_text`; `references` is now a list of `{"citation": str, "url"?: str}` objects; `RawQuestionnaire.references` carries objects (draft already passes them through).

- [ ] **Step 1: Update the reference tests + add new failing tests**

In `questionnaire-harvester/tests/test_psychology_tools.py`, the existing tests assert `rq.references[i]` are strings. UPDATE them to the object shape:
- the test around the qchat single-source case: change `assert "Allison, S Baron-Cohen" in rq.references[0]` → `assert "Allison, S Baron-Cohen" in rq.references[0]["citation"]`; `assert " ." not in rq.references[0]` → `... not in rq.references[0]["citation"]`; `assert rq.citation == rq.references[0]` → `assert rq.citation == rq.references[0]["citation"]`.
- `test_two_sources_primary_publication_all_in_references`: change `assert rq.citation == rq.references[0]` → `assert rq.citation == rq.references[0]["citation"]`.
- Leave `rq.references == []`, `len(rq.references) == N`, and `len(rq.references) > 0` assertions as-is.

Then APPEND new tests (reuse the file's existing `_page`/`_row`/`OPTS3` helpers):

```python
def test_reference_link_extracted_as_object():
    html = ('<html><body><h1>X (X)</h1>'
            + _row("q1", "stem", OPTS3).join(("<form>", "</form>"))
            + '<h6>Sources</h6><ol class="sources">'
              '<li class="source">Author A. Title. '
              '<a href="https://www.ncbi.nlm.nih.gov/pubmed/123">link</a> '
              '<time datetime="2001">2001</time>.</li>'
              '<li class="source">Author B. Untitled. <time datetime="2005">2005</time>.</li>'
              '</ol></body></html>')
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert rq.references[0]["citation"].startswith("Author A.")
    assert rq.references[0]["url"] == "https://www.ncbi.nlm.nih.gov/pubmed/123"
    assert "url" not in rq.references[1]            # no <a> -> no url key
    assert rq.citation == rq.references[0]["citation"]

def test_please_note_paragraph_appended_to_instruction():
    html = ('<html><body><h1>X (X)</h1>'
            '<p>Instructions Read each item.</p>'
            '<p>Please note: "occasionally" means once or twice.</p>'
            '<form>' + _row("q1", "stem", OPTS3) + '</form></body></html>')
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert rq.instruction_text.startswith("Read each item.")
    assert 'Please note: "occasionally" means once or twice.' in rq.instruction_text

def test_no_please_note_leaves_instruction_unchanged():
    html = ('<html><body><h1>X (X)</h1><p>Instructions Read each item.</p>'
            '<form>' + _row("q1", "stem", OPTS3) + '</form></body></html>')
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert rq.instruction_text == "Read each item."
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -k "reference_link or please_note or two_sources or qchat or sources" -v`
Expected: FAIL — references are strings (no `["citation"]`), no `url`, and the note isn't appended.

- [ ] **Step 3: Add `_source_link` + the please-note append + object references**

In `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, add a helper near `_clean_citation`:

```python
def _source_link(li):
    """The first hyperlink in a `li.source` (psychology-tools cites PubMed URLs), or None."""
    a = li.find("a", href=True)
    return a["href"].strip() if a and a.get("href", "").strip() else None
```

In `parse()`, immediately AFTER the existing instruction loop (the `for el in soup.find_all(["p", "li"]) … break` block) and BEFORE the `shared_prompt_text = None` line, append any "Please note" paragraphs:

```python
        notes = []
        for el in soup.find_all("p"):
            t = el.get_text(" ", strip=True)
            if re.match(r"^\s*please note\b[:.]?", t, re.I) and t not in notes:
                notes.append(t)
        if notes:
            instruction_text = ((instruction_text + "\n\n") if instruction_text else "") + "\n\n".join(notes)
```

Then change the references build (the `references = [c for c …]` line and the `citation =` line) to objects:

```python
        references = []
        for li in soup.select("ol.sources li.source"):
            c = _clean_citation(li)
            if not c:
                continue
            ref = {"citation": c}
            link = _source_link(li)
            if link:
                ref["url"] = link
            references.append(ref)
        citation = references[0]["citation"] if references else ""
```

(The `year` extraction and the `return RawQuestionnaire(... references=references)` are unchanged — `references` now holds objects; `draft` passes them straight to `md["x_references"]`.)

- [ ] **Step 4: Run the adapter tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (updated reference tests, new link/note tests, and everything else).

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/tests/test_psychology_tools.py
git commit -m "feat(harvester): psychology-tools adapter captures 'Please note' instructions + per-reference links"
```

---

### Task 3: Re-harvest the 40 psychology-tools pages (idempotent)

**Files:**
- (data) `questionnaire-harvester/output/**`, `register.md`

**Interfaces:** Consumes Task 2's adapter; preserves ids via a URL→id map from existing output.

- [ ] **Step 1: Re-harvest each psychology-tools page with its existing id**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json, glob, subprocess, sys
# URL -> id for psychology-tools entries (preserves --id overrides)
m = {}
for f in glob.glob("questionnaire-harvester/output/questionnaires/*.json"):
    md = json.load(open(f))["metadata"]
    if md.get("x_source_site") == "psychology-tools.com":
        m[md["x_source_url"]] = md["id"]
print(f"re-harvesting {len(m)} psychology-tools pages")
ok = skip = 0
for url, qid in sorted(m.items(), key=lambda kv: kv[1]):
    r = subprocess.run([sys.executable, "-m", "harvester.cli", "harvest", url,
                        "--id", qid, "--version", "v26.0618"],
                       capture_output=True, text=True)
    line = (r.stdout + r.stderr).strip().splitlines()[-1] if (r.stdout + r.stderr).strip() else ""
    if r.returncode == 0 and line.startswith("harvested"):
        ok += 1
    else:
        skip += 1
        print("SKIP/FAIL", qid, "::", line)
print(f"ok={ok} skip={skip}")
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: `ok=40 skip=0`; tree `OK`. If a page times out transiently, re-run (idempotent). Report any SKIP/FAIL (do not fabricate).

- [ ] **Step 2: Verify the enrichment landed**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json, glob
obj = strg = withurl = note = 0
for f in glob.glob("questionnaire-harvester/output/questionnaires/*.json"):
    md = json.load(open(f))["metadata"]
    if md.get("x_source_site") != "psychology-tools.com":
        continue
    refs = md.get("x_references") or []
    if refs:
        (obj := obj + 1) if isinstance(refs[0], dict) else (strg := strg + 1)
        if any(isinstance(r, dict) and r.get("url") for r in refs):
            withurl += 1
# asrm 'Please note' present in its instruction entity
import glob as g
ins = [json.load(open(x)) for x in g.glob("questionnaire-harvester/output/instructions/ins_asrm*.json")]
asrm_note = any("Please note" in (i.get("content",{}).get("en",{}).get("text","")) for i in ins)
print(f"psych-tools refs: object-form={obj} string-form={strg} with-≥1-url={withurl}")
print("asrm instruction has 'Please note':", asrm_note)
PY
```

Expected: `string-form=0` (all object-form), `with-≥1-url` > 0, and `asrm instruction has 'Please note': True`. Report the numbers.

- [ ] **Step 3: Commit the re-harvest**

```bash
git add -A questionnaire-harvester/output questionnaire-harvester/register.md
git commit -m "data(harvester): re-harvest psychology-tools with reference links + secondary instructions"
```

---

### Task 4: PHQ-9 10th (functional-impairment) item

**Files:**
- (data) `questionnaire-harvester/output/prompts/pr_phq9_10.json`, `questionnaire-harvester/output/options/opt_phq9_impairment_4.json`, `questionnaire-harvester/output/questionnaires/qst_phq9.json`
- Test: `questionnaire-harvester/tests/test_phq9_item10.py`

**Interfaces:** standalone curated edit; no adapter.

- [ ] **Step 1: Write the failing structural test**

Create `questionnaire-harvester/tests/test_phq9_item10.py`:

```python
import json
from pathlib import Path

OUT = Path("questionnaire-harvester/output")

def test_phq9_has_impairment_item_10():
    q = json.loads((OUT / "questionnaires" / "qst_phq9.json").read_text())
    els = q["pages"][0]["elements"]
    assert len(els) == 10
    assert q["metadata"]["psychometrics"]["item_count"] == 10
    last = els[-1]
    pr = json.loads((OUT / "prompts" / (last["question"]["prompt"]["ref"].split("@")[0] + ".json")).read_text())
    assert "how difficult" in pr["content"]["en"]["text"].lower()
    opt = json.loads((OUT / "options" / (last["option"]["ref"].split("@")[0] + ".json")).read_text())
    anchors = [c["text"] for c in opt["content"]["en"]["options"]]
    assert anchors == ["Not difficult at all", "Somewhat difficult", "Very difficult", "Extremely difficult"]
    assert opt.get("x_scored") is False
```

- [ ] **Step 2: Run to verify it fails**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_phq9_item10.py -v`
Expected: FAIL — qst_phq9 has 9 elements.

- [ ] **Step 3: Add the item via a scripted, validated edit**

Run this one-off writer (derives the version suffix from an existing element ref so it matches):

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json
from pathlib import Path
OUT = Path("questionnaire-harvester/output")
qf = OUT / "questionnaires" / "qst_phq9.json"
q = json.loads(qf.read_text())
els = q["pages"][0]["elements"]
ver = els[0]["option"]["ref"].split("@")[1]          # match existing version, e.g. v26.0617
pr_id, opt_id = "pr_phq9_10", "opt_phq9_impairment_4"
(OUT / "prompts" / f"{pr_id}.json").write_text(json.dumps({
    "id": pr_id,
    "content": {"en": {"status": "validated", "text":
        "If you checked off any problems, how difficult have these problems made it for you "
        "to do your work, take care of things at home, or get along with other people?"}},
}, indent=2) + "\n")
anchors = ["Not difficult at all", "Somewhat difficult", "Very difficult", "Extremely difficult"]
(OUT / "options" / f"{opt_id}.json").write_text(json.dumps({
    "id": opt_id, "input_data_type": "choice", "measurement_type": "ordinal",
    "selection": "single", "dimension": "impairment", "x_scored": False,
    "options": [{"index": i + 1, "value": float(i)} for i in range(4)],
    "content": {"en": {"status": "validated",
        "options": [{"index": i + 1, "text": t} for i, t in enumerate(anchors)]}},
}, indent=2) + "\n")
if not any(e["question"]["prompt"]["ref"].startswith(pr_id + "@") for e in els):
    els.append({"option": {"ref": f"{opt_id}@{ver}"},
                "question": {"prompt": {"ref": f"{pr_id}@{ver}"}},
                "required": False})
q["metadata"]["psychometrics"]["item_count"] = len(els)
qf.write_text(json.dumps(q, indent=2) + "\n")
print("wrote", pr_id, opt_id, "items:", len(els), "ver:", ver)
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: `wrote pr_phq9_10 opt_phq9_impairment_4 items: 10`; tree `OK`. If validation flags `x_scored` (schema rejects the `^x_` key on an option), report it — the OptionBase `^x_` patternProperties should accept it; do not strip it without reporting.

- [ ] **Step 4: Run the test + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/output/prompts/pr_phq9_10.json questionnaire-harvester/output/options/opt_phq9_impairment_4.json questionnaire-harvester/output/questionnaires/qst_phq9.json questionnaire-harvester/tests/test_phq9_item10.py
git commit -m "data(harvester): add PHQ-9 functional-impairment item 10 (unscored) to qst_phq9"
```

---

### Task 5: Regenerate review + scoring docs + handoff

**Files:** (data) `questionnaire-harvester/import_review/**`, `questionnaire-harvester/scoring/**`; `HANDOFF.md` (untracked).

- [ ] **Step 1: Regenerate all docs**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli review-export 2>&1 | tail -1
python -m harvester.cli document-scoring 2>&1 | tail -1
echo "review docs: $(ls questionnaire-harvester/import_review/*.md | grep -v /README.md | wc -l) | scoring docs: $(ls questionnaire-harvester/scoring/*.md | wc -l)"
```

Expected: `wrote 158 review doc(s) + README`; `wrote 158 scoring doc(s)`; both counts 158.

- [ ] **Step 2: Spot-check the fixed questionnaires**

```bash
python - <<'PY'
chk = {
 "qst_aq":   ["## Description", "## References", "[link](", "[score: 0]"],
 "qst_asrm": ["Please note", "## References", "[link]("],
 "qst_phq9": ["how difficult", "[score: 0]"],
}
import pathlib
for qid, needles in chk.items():
    t = pathlib.Path(f"questionnaire-harvester/import_review/{qid}.md").read_text()
    miss = [n for n in needles if n not in t]
    print(qid, "OK" if not miss else f"MISSING {miss}")
# phq9 now 10 items in the review doc
t = pathlib.Path("questionnaire-harvester/import_review/qst_phq9.md").read_text()
print("phq9 has item 10:", "10. **" in t)
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: all three `OK`; phq9 has item 10; tree `OK`. Report results.

- [ ] **Step 3: Commit the regenerated docs**

```bash
git add questionnaire-harvester/import_review questionnaire-harvester/scoring
git commit -m "docs(harvester): regenerate import_review + scoring after review-feedback fixes"
```

- [ ] **Step 4: Update the HANDOFF (untracked — on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note the review export now shows description + all references (with source links) + `[score: N]` weights; the psychology-tools adapter captures "Please note" instructions + per-reference links (x_references now `{citation,url}` objects); qst_phq9 has the unscored functional-impairment item 10. Do NOT `git add` it.

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
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/harvester-review-fixes
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester review-fixes branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/harvester-review-fixes
git branch -D harvester-review-fixes-0620
```

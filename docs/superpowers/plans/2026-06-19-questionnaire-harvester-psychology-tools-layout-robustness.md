# psychology-tools.com Adapter Robustness — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture two psychology-tools.com page shapes the adapter currently refuses — endpoint-only-labelled scales (unlabeled middle anchors) and the alternate `li.question-container` layout — unlocking ~9 more `/test/` questionnaires.

**Architecture:** One small `draft._build_choice_option` tweak (emit content text only for non-empty anchors → unlabeled ordinal choices). Then refactor the adapter to extract items from either template (standard `div.notable-tr.question` else alternate `li.question-container`) via a unified row/cell helper that tolerates blank anchors.

**Tech Stack:** Python 3, BeautifulSoup, pytest. Spec: `docs/superpowers/specs/2026-06-19-questionnaire-harvester-psychology-tools-layout-robustness-design.md`.

## Global Constraints

- **Faithfulness:** item stems + anchor labels + values verbatim; blank anchors kept blank (not invented); never fabricate.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/psytools-layout`, branch `harvester-psytools-layout-0619`). Commit with `git add <paths> && git commit` on the current HEAD; before committing confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-psytools-layout-0619`; after committing confirm the parent via `git rev-parse --short HEAD^`. Never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere.
- **Model:** do NOT use the cheapest (haiku) tier for implementers. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/psytools-layout`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **No schema change** — uses the existing v26.0618 unlabeled-ordinal-choice support; harvester default `--version` is `v26.0618`.
- **Tests use SYNTHETIC fixtures** (invented items) — never a real copyrighted page.
- **License posture:** `license: unknown` / `needs-review`; staging the owner reviews before ingest.
- **Both site templates** use `<input id="qN_k">` + `<label for="qN_k">`; response cells are `.notable-td.response` (standard) or `ul.responses > li` (alternate); stems are `.notable-td.prompt` (minus a `.num` span) or `span.prompt`.

---

### Task 1: Unlabeled-choice support in `draft._build_choice_option`

**Files:**
- Modify: `questionnaire-harvester/src/harvester/draft.py` (`_build_choice_option`)
- Test: `questionnaire-harvester/tests/test_draft.py`

**Interfaces:**
- Produces: `_build_choice_option` emits `content.options` only for non-empty anchors; structural `options[]` (index+value) still lists all anchors.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_draft.py`:

```python
def test_build_choice_option_omits_blank_anchor_content():
    from harvester.draft import _build_choice_option
    from harvester.raw import RawOption
    spec = RawOption(input_data_type="choice", measurement_type="ordinal", selection="single",
                     dimension="rating", anchors=["Low", "", "", "High"], values=[1.0, 2.0, 3.0, 4.0])
    opt = _build_choice_option(spec, "demo", "Demo", n=1)
    # structural options keep ALL four (index + value)
    assert [o["index"] for o in opt["options"]] == [1, 2, 3, 4]
    assert [o["value"] for o in opt["options"]] == [1.0, 2.0, 3.0, 4.0]
    # content options only for the labelled anchors (indices 1 and 4), text-bearing
    co = opt["content"]["en"]["options"]
    assert [o["index"] for o in co] == [1, 4]
    assert [o["text"] for o in co] == ["Low", "High"]

def test_build_choice_option_all_labelled_unchanged():
    from harvester.draft import _build_choice_option
    from harvester.raw import RawScale
    spec = RawScale(input_data_type="choice", measurement_type="ordinal", selection="single",
                    dimension="agree", anchors=["No", "Yes"], values=[0.0, 1.0])
    opt = _build_choice_option(spec, "x", "X")
    co = opt["content"]["en"]["options"]
    assert [(o["index"], o["text"]) for o in co] == [(1, "No"), (2, "Yes")]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_draft.py -k build_choice_option -v`
Expected: FAIL — `test_build_choice_option_omits_blank_anchor_content` produces a content option with empty `text` for the blank anchors (current code includes all).

- [ ] **Step 3: Omit blank-anchor content options**

In `questionnaire-harvester/src/harvester/draft.py`, in `_build_choice_option`, change the content `options` comprehension to skip blank anchors. The line currently reads:

```python
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(spec.anchors)]}},
```

Change it to:

```python
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(spec.anchors) if t]}},
```

(The structural `"options": [{"index": i + 1, "value": float(v)} ...]` line above is unchanged — it still lists every anchor's index+value.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_draft.py -v`
Expected: PASS (the two new tests + all existing draft tests — all-labelled scales are unaffected).

- [ ] **Step 5: Run the FULL suite (no regressions)**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — no existing questionnaire has blank anchors, so output is unchanged.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/draft.py questionnaire-harvester/tests/test_draft.py
git commit -m "feat(harvester): _build_choice_option emits unlabeled choices (omit blank-anchor content)"
```

---

### Task 2: Adapter — both layouts + tolerate blank anchors (`psychology_tools.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`
- Test: `questionnaire-harvester/tests/test_psychology_tools.py`

**Interfaces:**
- Consumes: `_build_choice_option` unlabeled support (Task 1).
- Produces: `_extract_items(form) -> list[RawItem]` handling standard + alternate templates; `parse()` uses it; blank anchor labels no longer refused (empty stem / non-numeric value still refused).

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psychology_tools.py` (these reuse the `_page` helper already in that file; add the new builders here):

```python
def _std_row_endpoint_only(name, stem):
    # standard layout, only first+last labelled (middles blank) — endpoint-anchored scale
    opts = [("Not at all", "1"), ("", "2"), ("", "3"), ("", "4"), ("Very much", "5")]
    cells = "".join(
        f'<span class="notable-td response"><label class="aria-label" for="{name}_{i}">{a}</label>'
        f'<input id="{name}_{i}" type="radio" name="{name}" value="{v}"></span>'
        for i, (a, v) in enumerate(opts))
    return (f'<div class="notable-tr question odd">'
            f'<span class="notable-td prompt"><span class="num">{name[1:]}.</span>'
            f'<span>{stem}</span></span>{cells}</div>')

def _alt_row(name, stem, opts):
    lis = "".join(
        f'<li class="response"><input id="{name}_{i}" type="radio" name="{name}" value="{v}">'
        f'<label for="{name}_{i}">{a}</label></li>' for i, (a, v) in enumerate(opts))
    return (f'<li class="question-container"><span class="prompt">{stem}</span>'
            f'<ul class="responses">{lis}</ul></li>')

def _alt_page(rows, *, title="Demo Mania Scale (DMS)"):
    return f'<html><head><meta name="description" content="demo."></head><body><h1>{title}</h1><form>{rows}</form></body></html>'

ALT3 = [("Absent", "0"), ("Mild", "1"), ("Severe", "2")]

def test_standard_endpoint_only_labels_no_refusal():
    html = _page(_std_row_endpoint_only("q1", "I worry about deadlines"))
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    o = rq.items[0].option
    assert o.values == [1.0, 2.0, 3.0, 4.0, 5.0]               # all values kept
    assert o.anchors == ["Not at all", "", "", "", "Very much"]  # blanks kept verbatim

def test_alternate_layout_li_question_container():
    html = _alt_page(_alt_row("q1", "Elevated mood", ALT3) + _alt_row("q2", "Increased energy", ALT3))
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert len(rq.items) == 2
    assert rq.items[0].text == "Elevated mood"
    assert rq.items[0].option.anchors == ["Absent", "Mild", "Severe"]
    assert rq.items[0].option.values == [0.0, 1.0, 2.0]

def test_alternate_stemless_refused():
    # empty span.prompt -> stem-less Beck-style -> refuse (deferred)
    html = _alt_page(_alt_row("q1", "", [("Statement A", "0"), ("Statement B", "1")]))
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")

def test_no_rows_either_layout_refused():
    html = "<html><h1>X (X)</h1><form><p>nothing</p></form></html>"
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
```

(Confirm the file already imports `PsychologyToolsParseError` — it is imported at the top of `test_psychology_tools.py`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -k "endpoint or alternate or no_rows" -v`
Expected: FAIL — endpoint-only refuses on blank anchor; alternate layout finds no `.notable-tr.question` rows.

- [ ] **Step 3: Refactor item extraction into a both-layouts helper**

In `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, add two module-level helpers (after `_derive_id`, before the class):

```python
def _cell_pair(cell):
    """From a response cell (standard `.notable-td.response` span or alternate
    `ul.responses > li`), return (anchor_text, value_float). Anchor may be "" (unlabeled).
    Raises on a missing/non-numeric radio value."""
    lab = cell.find("label")
    text = lab.get_text(" ", strip=True) if lab else ""
    inp = cell.find("input", attrs={"type": "radio"})
    v = inp.get("value") if inp else None
    if v is None or v == "":
        raise PsychologyToolsParseError("response cell has no radio value")
    try:
        return (text, float(v))
    except ValueError:
        raise PsychologyToolsParseError(f"non-numeric radio value {v!r}")


def _extract_items(form):
    """Parse item rows from whichever template is present: standard
    `div.notable-tr.question` else alternate `li.question-container`. Returns [RawItem].
    Refuses (PsychologyToolsParseError) on no rows, an empty stem, or no response cells."""
    rows = form.select("div.notable-tr.question") or form.select("li.question-container")
    if not rows:
        raise PsychologyToolsParseError("no item rows (neither standard nor alternate layout)")
    items = []
    for row in rows:
        prompt_el = row.select_one(".notable-td.prompt") or row.select_one("span.prompt")
        num = prompt_el.select_one(".num") if prompt_el else None
        if num:
            num.extract()
        stem = prompt_el.get_text(" ", strip=True) if prompt_el else ""
        if not stem:
            raise PsychologyToolsParseError("item has an empty stem")
        cells = row.select(".notable-td.response") or row.select("ul.responses > li")
        if not cells:
            raise PsychologyToolsParseError("item has no response options")
        pairs = [_cell_pair(c) for c in cells]
        items.append(RawItem(text=stem, option=RawOption(
            input_data_type="choice", measurement_type="ordinal", selection="single",
            dimension="rating", anchors=[a for a, _ in pairs], values=[v for _, v in pairs])))
    return items
```

Then replace the inline item-parsing block in `parse()`. Find this block:

```python
        form = soup.find("form")
        if form is None:
            raise PsychologyToolsParseError("no <form> — not a /test/ page")
        rows = form.select("div.notable-tr.question")
        if not rows:
            raise PsychologyToolsParseError("no `.notable-tr.question` item rows found")

        items = []
        for row in rows:
            prompt_el = row.select_one(".notable-td.prompt")
            if prompt_el is None:
                raise PsychologyToolsParseError("item row has no .prompt cell")
            num = prompt_el.select_one(".num")
            if num:
                num.extract()
            stem = prompt_el.get_text(" ", strip=True)
            if not stem:
                raise PsychologyToolsParseError("item has an empty stem")
            cells = row.select(".notable-td.response")
            if not cells:
                raise PsychologyToolsParseError("item has no response options")
            anchors, values = [], []
            for c in cells:
                lab = c.find("label")
                text = lab.get_text(" ", strip=True) if lab else ""
                if not text:
                    raise PsychologyToolsParseError("response cell has an empty anchor label")
                inp = c.find("input", attrs={"type": "radio"})
                v = inp.get("value") if inp else None
                if v is None or v == "":
                    raise PsychologyToolsParseError("response cell has no radio value")
                try:
                    values.append(float(v))
                except ValueError:
                    raise PsychologyToolsParseError(f"non-numeric radio value {v!r}")
                anchors.append(text)
            items.append(RawItem(text=stem, option=RawOption(
                input_data_type="choice", measurement_type="ordinal", selection="single",
                dimension="rating", anchors=anchors, values=values)))
        if not items:
            raise PsychologyToolsParseError("no items parsed")
```

with:

```python
        form = soup.find("form")
        if form is None:
            raise PsychologyToolsParseError("no <form> — not a /test/ page")
        items = _extract_items(form)
        if not items:
            raise PsychologyToolsParseError("no items parsed")
```

(The title/id block above and the instruction/description/citation/return block below are unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -v`
Expected: PASS (new layout/blank-anchor tests + all existing adapter tests — the standard all-labelled path is unchanged).

- [ ] **Step 5: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/tests/test_psychology_tools.py
git commit -m "feat(harvester): psychology-tools adapter handles alt layout + unlabeled anchors"
```

---

### Task 3: e2e + re-sweep + handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psychology_tools_alt.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked local note — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: Tasks 1-2 + the existing draft engine + CLI.
- Produces: a validating alt-layout harvest; ~9 newly-harvested `/test/` questionnaires.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psychology_tools_alt.html` (SYNTHETIC — invented items, alternate layout):

```html
<html><head><meta name="description" content="A demo mania rating scale for testing."></head>
<body>
<h1>Demo Mania Rating Scale (DMRS)</h1>
<p>InstructionsRate each item by severity.</p>
<form>
  <li class="question-container"><span class="prompt">Elevated mood</span>
    <ul class="responses">
      <li class="response"><input id="q1_0" type="radio" name="q1" value="0"><label for="q1_0">Absent</label></li>
      <li class="response"><input id="q1_1" type="radio" name="q1" value="1"><label for="q1_1">Mild</label></li>
      <li class="response"><input id="q1_2" type="radio" name="q1" value="2"><label for="q1_2">Severe</label></li>
    </ul></li>
  <li class="question-container"><span class="prompt">Increased motor activity</span>
    <ul class="responses">
      <li class="response"><input id="q2_0" type="radio" name="q2" value="0"><label for="q2_0">Absent</label></li>
      <li class="response"><input id="q2_1" type="radio" name="q2" value="1"><label for="q2_1">Mild</label></li>
      <li class="response"><input id="q2_2" type="radio" name="q2" value="2"><label for="q2_2">Severe</label></li>
    </ul></li>
</form>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_psychology_tools_alt_layout_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_alt.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-mania-rating-scale",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_dmrs.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 2
    # identical 3-point scale dedups to one option
    assert len({e["option"]["ref"] for e in els}) == 1
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "single"
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_psychology_tools_alt_layout_harvest_validates -v`
Expected: PASS once Tasks 1-2 are merged.

- [ ] **Step 3: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — all prior tests + the new e2e.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psychology_tools_alt.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e psychology-tools alternate-layout harvest validates"
```

- [ ] **Step 5: Re-sweep the now-supported pages**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
B=https://psychology-tools.com/test
for u in penn-state-worry-questionnaire altman-self-rating-mania-scale dissociative-experiences-scale infant-toddler-checklist kutcher-adolescent-depression-scale montgomery-asberg-depression-rating-scale personality-type-indicator qchat-quantitative-checklist-for-autism-in-toddlers young-mania-rating-scale; do
  out=$(python -m harvester.cli harvest "$B/$u" 2>&1); rc=$?
  errs=$(python -c "from pathlib import Path; from harvester.validate import validate_tree; e=validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618'); print('OK' if not e else 'ERR '+str(e[0]))")
  if [ $rc -eq 0 ] && [ "$errs" = "OK" ] && echo "$out" | grep -q "^harvested "; then
    git add -A questionnaire-harvester/; echo "OK  $u :: $(echo "$out" | grep -oE 'qst_[a-z0-9]+' | head -1)"
  else
    git clean -fdq questionnaire-harvester/output questionnaire-harvester/questions
    git checkout -q questionnaire-harvester/register.md questionnaire-harvester/questions 2>/dev/null
    echo "SKIP/FAIL $u :: rc=$rc errs=$errs :: $(echo "$out" | tail -1)"
  fi
done
python -c "from pathlib import Path; from harvester.validate import validate_tree; print(validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: most/all 9 `OK`; final tree validation `OK`. If a page times out transiently, retry once. A genuine refusal or id collision cleanly SKIPs — note it, do NOT fabricate. Report how many succeeded + qst_ids + item counts.

- [ ] **Step 6: Commit the re-sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest psychology-tools alt-layout + endpoint-only questionnaires"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: bump the State count by the number harvested; note the adapter now handles the alternate `li.question-container` layout + endpoint-only-labelled (unlabeled) scales; note stem-less Beck-style (binge-eating, health-anxiety-inventory) + liebowitz two-dimension remain deferred. Do **NOT** `git add` it — `/HANDOFF.md` is gitignored. No commit for this step.

---

## Final integration (after all tasks)

- [ ] **Run the suite + validator**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m pytest questionnaire-harvester/tests -q
python tools/validate_schemas.py
```

Expected: harvester suite green; `All N example(s) passed.`

- [ ] **Merge to master + push** (the main dir is on a clean `master`; merging `--no-ff` directly there + pushing is the established pattern)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git merge --no-ff harvester-psytools-layout-0619 -m "merge: harvester — psychology-tools alt layout + unlabeled-anchor support"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git push origin master
```

- [ ] **Clean up the feature worktree**

```bash
git worktree remove .claude/worktrees/psytools-layout
git branch -d harvester-psytools-layout-0619
```

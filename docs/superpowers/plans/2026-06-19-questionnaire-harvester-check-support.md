# Multi-select Checkbox (`t: check`) Harvester Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest PsyToolkit `t: check` (multi-select checkbox) questionnaires — one block = one multi-select item.

**Architecture:** Parser-only. Extract the radio block's logic into a shared `_parse_choice_item_block(block_lines, *, selection, measurement_type)`; `t: radio` and `t: check` both call it (radio → single/ordinal, check → multiple/nominal). The existing `draft()` already builds per-item choice options (incl. `selection: multiple`), so no schema/data-model/draft changes.

**Tech Stack:** Python 3, BeautifulSoup, pytest. Spec: `docs/superpowers/specs/2026-06-19-questionnaire-harvester-check-support-design.md`.

## Global Constraints

- **Faithfulness (owner directive):** keep source text exactly; never fabricate or normalise.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/check-support`, branch `harvester-check-0619`). Commit with `git add <paths> && git commit` on the current HEAD; before committing confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-check-0619`; after committing confirm the parent via `git rev-parse --short HEAD^`. Never checkout/reset/rebase/switch branches or `cd` elsewhere.
- **Model:** do NOT use the cheapest (haiku) tier for implementers — it mis-parented commits in prior runs. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/check-support`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **No schema change** — targets the existing schema `v26.0618`; harvester default `--version` is `v26.0618`.
- **Check mapping:** one `t: check` block = one item; `q:` (multi-line) → item prompt verbatim; `- {score=N} text` → one choice `RawOption` with `selection="multiple"`, `measurement_type="nominal"`, `dimension="rating"`, values from `{score=N}` (float-capable) else positional `1…N`; `scale=None`, `instruction_text=None`, `shared_prompt_text=None`. Refuse a block with no options, an empty option label, or an empty stem.
- **Radio must stay byte-identical** — the shared-helper refactor leaves `t: radio` output unchanged (single/ordinal); the widened float score regex still matches integer scores.

---

### Task 1: Shared choice-item parser + `t: check` branch (`psytoolkit.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psytoolkit.py`
- Test: `questionnaire-harvester/tests/test_psytoolkit.py`

**Interfaces:**
- Consumes: `RawOption`, `RawItem` (existing); `_blocks` (existing).
- Produces: `_parse_choice_item_block(block_lines, *, selection, measurement_type) -> RawItem`; `_parse_radio_block(block_lines) -> RawItem` (thin wrapper, single/ordinal). `parse()` gains a `t: check` branch → one multi-select `RawItem` per check block.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psytoolkit.py`:

```python
def test_parse_check_block_multiselect_nominal_float_scores():
    from harvester.sources.psytoolkit import _parse_choice_item_block
    block = [
        "l: happinessitems",
        "t: check",
        "q: Tick all the ones that are right about you.",
        "- {score=3.64} Life is good for me at the moment",
        "- {score=1.74} I never feel safe",
        "- {score=4.25} I have lots of fun",
    ]
    item = _parse_choice_item_block(block, selection="multiple", measurement_type="nominal")
    assert item.text == "Tick all the ones that are right about you."
    assert item.option.input_data_type == "choice"
    assert item.option.selection == "multiple"
    assert item.option.measurement_type == "nominal"
    assert item.option.anchors == ["Life is good for me at the moment", "I never feel safe",
                                   "I have lots of fun"]
    assert item.option.values == [3.64, 1.74, 4.25]


def test_radio_block_still_single_ordinal_after_refactor():
    from harvester.sources.psytoolkit import _parse_radio_block
    block = ["l: q1", "t: radio", "q: Rate this",
             "- {score=0} no", "- {score=1} yes"]
    item = _parse_radio_block(block)
    assert item.option.selection == "single"
    assert item.option.measurement_type == "ordinal"
    assert item.option.values == [0.0, 1.0]


def test_parse_check_block_refuses_no_options():
    from harvester.sources.psytoolkit import _parse_choice_item_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_choice_item_block(["l: x", "t: check", "q: Q with no options"],
                                 selection="multiple", measurement_type="nominal")


def test_parse_full_check_page_via_public_surface():
    dsl = ("l: items\nt: check\nq: Tick all that apply.\n"
           "- {score=3.64} a\n- {score=1.74} b\n- {score=4.25} c\n\n"
           "l: s1\nt: set\n- sum $items\n\n"
           "l: fb\nt: info\nq: Your score is {$s1}\n")
    html = f"<html><h1>Children's Happiness Scale</h1><pre>{dsl}</pre></html>"
    rq = PsyToolkitAdapter().parse(html, "https://x/children-happiness.html")
    assert rq.scale is None
    assert rq.instruction_text is None
    assert len(rq.items) == 1
    assert rq.items[0].text == "Tick all that apply."
    assert rq.items[0].option.selection == "multiple"
    assert rq.items[0].option.values == [3.64, 1.74, 4.25]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -k "check or refactor" -v`
Expected: FAIL — `_parse_choice_item_block` not defined.

- [ ] **Step 3: Extract the shared helper + rewrite `_parse_radio_block` as a wrapper**

In `questionnaire-harvester/src/harvester/sources/psytoolkit.py`, replace the entire existing `_parse_radio_block` function with the shared helper + a thin wrapper:

```python
def _parse_choice_item_block(block_lines, *, selection, measurement_type):
    """From a single per-item choice block (`t: radio` / `t: check`), return one RawItem.

    `q:` is the item stem (the prompt); the `- {score=N} text` lines are that item's own
    options. Values come from each `{score=N}` (integer or decimal) else the 1-based
    position. Refuses (PsyToolkitParseError) a block with no options, an empty option
    label, or an empty stem — never fabricates."""
    q_parts, in_q = [], False
    anchors, values, pos = [], [], 0
    for ln in block_lines[1:]:
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            pos += 1
            body = s.strip()
            am = re.match(r"-\s*\{score=(-?\d+(?:\.\d+)?)\}\s*(.+)", body)
            if am:
                values.append(float(am.group(1)))
                anchors.append(am.group(2).strip())
            else:
                text = re.sub(r"^(\{[^}]*\}\s*)+", "", re.sub(r"^-\s*", "", body)).strip()
                values.append(float(pos))
                anchors.append(text)
        elif re.match(r"^[a-z]:", s):
            if s.startswith("q:"):
                q_parts, in_q = [s[2:].strip()], True
            else:
                in_q = False
        elif in_q and s.strip():
            q_parts.append(s.strip())
    stem = " ".join(p for p in q_parts if p)
    if not anchors:
        raise PsyToolkitParseError("choice item block has no options")
    if any(not a for a in anchors):
        raise PsyToolkitParseError("choice item block has an empty option label")
    if not stem:
        raise PsyToolkitParseError("choice item block has no question stem")
    opt = RawOption(
        input_data_type="choice", measurement_type=measurement_type, selection=selection,
        dimension="rating", anchors=anchors, values=values)
    return RawItem(text=stem, option=opt)


def _parse_radio_block(block_lines):
    """A `t: radio` block: one item, single-select ordinal options."""
    return _parse_choice_item_block(block_lines, selection="single", measurement_type="ordinal")
```

(The only behavioral delta vs. the old radio code is the score regex now accepts a decimal
part — `(-?\d+(?:\.\d+)?)` — which still matches integer scores identically, so radio output
is unchanged. The refusal message wording is now generic ("choice item block …"); no test
asserts the exact message text.)

- [ ] **Step 4: Add the `t: check` detection + branch to `parse()`**

In `parse()`, find the `radio_blocks` line:

```python
        radio_blocks = [b for b in blocks if any(re.match(r"^t:\s*radio\b", ln) for ln in b)]
```

and add a `check_blocks` line immediately after it:

```python
        check_blocks = [b for b in blocks if any(re.match(r"^t:\s*check\b", ln) for ln in b)]
```

Then find the `elif radio_blocks:` branch and the final `else:` after it:

```python
        elif radio_blocks:
            items = [_parse_radio_block(b) for b in radio_blocks]
            if not items:
                raise PsyToolkitParseError("radio block has no items")
        else:
            raise PsyToolkitParseError(
                "no `t: scale`, `t: range`, `t: multiradio`, or `t: radio` question block found")
```

Replace that with (insert a `check` branch + extend the final message):

```python
        elif radio_blocks:
            items = [_parse_radio_block(b) for b in radio_blocks]
            if not items:
                raise PsyToolkitParseError("radio block has no items")
        elif check_blocks:
            items = [_parse_choice_item_block(b, selection="multiple", measurement_type="nominal")
                     for b in check_blocks]
            if not items:
                raise PsyToolkitParseError("check block has no items")
        else:
            raise PsyToolkitParseError(
                "no `t: scale`, `t: range`, `t: multiradio`, `t: radio`, or `t: check` "
                "question block found")
```

(`^t:\s*check\b` matches only `t: check`; precedence scale → range → multiradio → radio →
check is preserved.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -v`
Expected: PASS (check tests + refactor regression + all existing scale/range/multiradio/radio tests).

- [ ] **Step 6: Run the FULL harvester suite (regression guard)**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — draft/dedup/raw/e2e untouched; radio output unchanged.

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psytoolkit.py questionnaire-harvester/tests/test_psytoolkit.py
git commit -m "feat(harvester): parse t:check (multi-select) via shared choice-item-block parser"
```

---

### Task 2: End-to-end, sweep, handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psytoolkit_check.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked local note — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: the `t: check` parser (Task 1) + the existing draft engine.
- Produces: a validating `t: check` import; 1 multi-select questionnaire harvested.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psytoolkit_check.html`:

```html
<html><head><title>Children's Happiness</title></head><body>
<h1>Children's Happiness Scale</h1>
<div id="content"><p>A 20-item checklist of children's happiness.</p></div>
<pre>
l: happinessitems
t: check
q: Here are some things children might say about themselves. Tick all the ones that are right about you. Leave the others blank.
- {score=3.64} Life is good for me at the moment
- {score=1.74} I never feel safe
- {score=4.25} I have lots of fun
- {score=1.68} I get lonely

l: happiness1
t: set
- sum $happinessitems

l: feedback
t: info
q: Your happiness score is {$happiness1}
</pre>
<h2 id="refs">References</h2>
<ul><li>Holder, M. D., &amp; Klassen, A. (2010). Temperament and happiness in children. Journal of Happiness Studies, 11, 419-439.</li></ul>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_check_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_check.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/children-happiness.html",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    # h1 "Children's Happiness Scale" (no acronym) -> URL slug "happiness" -> qst_happiness
    qst = json.loads((out / "questionnaires" / "qst_happiness.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 1
    assert "instruction" not in els[0]["question"]
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "multiple"
    assert opt["measurement_type"] == "nominal"
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_check_harvest_validates -v`
Expected: PASS once Task 1 is merged. If it FAILS asserting the filename, print the actual id: `python -c "from harvester.sources.psytoolkit import derive_qst_id; print(derive_qst_id(\"Children's Happiness Scale\", 'https://x/children-happiness.html'))"` and align the assertion to the real derived id.

- [ ] **Step 3: Run the FULL harvester suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — all prior tests + the new check parser + e2e tests.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psytoolkit_check.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e t:check multi-select harvest validates"
```

- [ ] **Step 5: Sweep the children-happiness page**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
B=https://us.psytoolkit.org/survey-library
u=children-happiness.html
out=$(python -m harvester.cli harvest "$B/$u" 2>&1); rc=$?
errs=$(python -c "from pathlib import Path; from harvester.validate import validate_tree; e=validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618'); print('OK' if not e else 'ERR '+str(e[0]))")
if [ $rc -eq 0 ] && [ "$errs" = "OK" ] && echo "$out" | grep -q "^harvested "; then
  git add -A questionnaire-harvester/; echo "OK  $u :: $(echo "$out" | grep -oE 'qst_[a-z0-9]+' | head -1)"
else
  git clean -fdq questionnaire-harvester/output questionnaire-harvester/questions
  git checkout -q questionnaire-harvester/register.md questionnaire-harvester/questions 2>/dev/null
  echo "FAIL $u :: rc=$rc errs=$errs :: $(echo "$out" | tail -1)"
fi
python -c "from pathlib import Path; from harvester.validate import validate_tree; print(validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: `OK`; final tree validation `OK`. If the page times out transiently, retry once. A genuine parse refusal: note it in your report, do NOT fabricate.

- [ ] **Step 6: Commit the sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest PsyToolkit multi-select (t:check) Children's Happiness Scale"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: update the State count (≈117 → ≈118), add a one-line note that `t: check` is now supported (one block = one multi-select item; `selection: multiple`, `measurement_type: nominal`), and move "check" out of the "what's next" list. Do **NOT** `git add` it — `/HANDOFF.md` is gitignored. No commit for this step.

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
git merge --no-ff harvester-check-0619 -m "merge: harvester — multi-select checkbox (t:check) support"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git push origin master
```

- [ ] **Clean up the feature worktree**

```bash
git worktree remove .claude/worktrees/check-support
git branch -d harvester-check-0619
```

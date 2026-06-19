# Per-item Radio (`t: radio`) Harvester Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest PsyToolkit `t: radio` (per-item radio) questionnaires — each block is one item (stem + its own scored options).

**Architecture:** Parser-only. A `t: radio` block → `RawItem(text=<q:>, option=RawOption(choice/ordinal/single, anchors, values))`. The existing `draft()` already handles per-item prompts + per-item choice options (counter ids) + the no-instruction case, so no schema/data-model/draft changes.

**Tech Stack:** Python 3, BeautifulSoup, pytest. Spec: `docs/superpowers/specs/2026-06-18-questionnaire-harvester-radio-support-design.md`.

## Global Constraints

- **Faithfulness (owner directive):** keep source text exactly; never fabricate or normalise. EPDS item 1's `q:` conflates a general note with the stem — keep it verbatim as that item's prompt.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/radio-support`, branch `harvester-radio-0618`). Commit with `git add <paths> && git commit` on the current HEAD; before committing confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-radio-0618`; after committing confirm the parent via `git rev-parse --short HEAD^`. Never checkout/reset/rebase/switch branches or `cd` elsewhere.
- **Model:** do NOT use the cheapest (haiku) tier for implementers — it mis-parented commits onto master twice in prior runs. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/radio-support`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **No schema change** — this targets the existing schema `v26.0618`; harvester default `--version` is already `v26.0618`.
- **Radio mapping:** each `t: radio` block = one item; `q:` (multi-line) → item prompt verbatim; `- {score=N} text` → per-item choice `RawOption` (`ordinal`/`single`, `dimension="rating"`), values from `{score=N}` else positional `1…N`; `scale=None`, `instruction_text=None`, `shared_prompt_text=None`. Refuse a block with no options, an empty option label, or an empty stem.

---

### Task 1: Parse `t: radio` blocks (`psytoolkit.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psytoolkit.py`
- Test: `questionnaire-harvester/tests/test_psytoolkit.py`

**Interfaces:**
- Consumes: `RawOption`, `RawItem` (existing); `_blocks` (existing).
- Produces: `_parse_radio_block(block_lines) -> RawItem` (raises `PsyToolkitParseError` on no options / empty label / empty stem). `parse()` returns a `RawQuestionnaire` with `scale=None`, `instruction_text=None`, `shared_prompt_text=None` and one per-item choice option per `t: radio` block.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psytoolkit.py`:

```python
def test_parse_radio_block_stem_and_scored_options():
    from harvester.sources.psytoolkit import _parse_radio_block
    block = [
        "l: epds2",
        "t: radio",
        "q: I have looked forward with enjoyment to things",
        "- {score=0} As much as I ever did",
        "- {score=1} Rather less than I used to",
        "- {score=2} Definitely less than I used to",
        "- {score=3} Hardly at all",
    ]
    item = _parse_radio_block(block)
    assert item.text == "I have looked forward with enjoyment to things"
    assert item.option.input_data_type == "choice"
    assert item.option.measurement_type == "ordinal"
    assert item.option.selection == "single"
    assert item.option.anchors == ["As much as I ever did", "Rather less than I used to",
                                   "Definitely less than I used to", "Hardly at all"]
    assert item.option.values == [0.0, 1.0, 2.0, 3.0]


def test_parse_radio_block_positional_when_no_scores():
    from harvester.sources.psytoolkit import _parse_radio_block
    block = ["l: q1", "t: radio", "q: Rate this", "- low", "- mid", "- high"]
    item = _parse_radio_block(block)
    assert item.option.values == [1.0, 2.0, 3.0]
    assert item.option.anchors == ["low", "mid", "high"]


def test_parse_radio_block_refuses_no_options():
    from harvester.sources.psytoolkit import _parse_radio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_radio_block(["l: q1", "t: radio", "q: A question with no options"])


def test_parse_radio_block_refuses_empty_label():
    from harvester.sources.psytoolkit import _parse_radio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_radio_block(["l: q1", "t: radio", "q: Q", "- {score=1}", "- {score=2} ok"])


def test_parse_radio_block_refuses_empty_stem():
    from harvester.sources.psytoolkit import _parse_radio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_radio_block(["l: q1", "t: radio", "- {score=1} a", "- {score=2} b"])


def test_parse_full_radio_page_via_public_surface():
    dsl = ("l: sq1\nt: radio\nq: I find it easy to use train timetables.\n"
           "- {score=2} strongly agree\n- {score=1} slightly agree\n"
           "- {score=0} slightly disagree\n- {score=0} strongly disagree\n\n"
           "l: sq2\nt: radio\nq: I like clearly organised shops.\n"
           "- {score=2} strongly agree\n- {score=1} slightly agree\n"
           "- {score=0} slightly disagree\n- {score=0} strongly disagree\n")
    html = f"<html><h1>Systemizing Quotient (SQ)</h1><pre>{dsl}</pre></html>"
    rq = PsyToolkitAdapter().parse(html, "https://x/systemizing-arc.html")
    assert rq.scale is None
    assert rq.instruction_text is None
    assert rq.shared_prompt_text is None
    assert len(rq.items) == 2
    assert rq.items[0].text == "I find it easy to use train timetables."
    assert rq.items[0].option.values == [2.0, 1.0, 0.0, 0.0]
    assert rq.items[1].text == "I like clearly organised shops."
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -k radio -v`
Expected: FAIL — `_parse_radio_block` not defined.

- [ ] **Step 3: Add `_parse_radio_block`**

In `questionnaire-harvester/src/harvester/sources/psytoolkit.py`, add this function immediately after `_parse_multiradio_block` (before the `class PsyToolkitAdapter` line):

```python
def _parse_radio_block(block_lines):
    """From a `t: radio` block, return one RawItem (stem + per-item choice option).

    Each radio block is a single item: `q:` is the stem (the item's prompt), and the
    `- {score=N} text` lines are that item's own scored options. Values come from each
    `{score=N}` (else the 1-based position). Refuses (PsyToolkitParseError) a block with
    no options, an empty option label, or an empty stem — never fabricates."""
    q_parts, in_q = [], False
    anchors, values, pos = [], [], 0
    for ln in block_lines[1:]:
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            pos += 1
            body = s.strip()
            am = re.match(r"-\s*\{score=(-?\d+)\}\s*(.+)", body)
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
        raise PsyToolkitParseError("radio block has no options")
    if any(not a for a in anchors):
        raise PsyToolkitParseError("radio block has an empty option label")
    if not stem:
        raise PsyToolkitParseError("radio block has no question stem")
    opt = RawOption(
        input_data_type="choice", measurement_type="ordinal", selection="single",
        dimension="rating", anchors=anchors, values=values)
    return RawItem(text=stem, option=opt)
```

- [ ] **Step 4: Add the `t: radio` branch to `parse()`**

In `parse()`, find the line that computes `mr_blocks`:

```python
        mr_blocks = [b for b in blocks if any(re.match(r"^t:\s*multiradio\b", ln) for ln in b)]
```

and add a `radio_blocks` line immediately after it:

```python
        radio_blocks = [b for b in blocks if any(re.match(r"^t:\s*radio\b", ln) for ln in b)]
```

Then find the `elif mr_blocks:` branch and the final `else:` that follows it:

```python
        elif mr_blocks:
            if len(mr_blocks) > 1:
                raise PsyToolkitParseError("multiple multiradio blocks — needs manual handling")
            shared_prompt_text, items = _parse_multiradio_block(mr_blocks[0])
            if not items:
                raise PsyToolkitParseError("multiradio block has no items")
        else:
            raise PsyToolkitParseError("no `t: scale`, `t: range`, or `t: multiradio` question block found")
```

Insert a `radio` branch between them and update the final error message, so it reads:

```python
        elif mr_blocks:
            if len(mr_blocks) > 1:
                raise PsyToolkitParseError("multiple multiradio blocks — needs manual handling")
            shared_prompt_text, items = _parse_multiradio_block(mr_blocks[0])
            if not items:
                raise PsyToolkitParseError("multiradio block has no items")
        elif radio_blocks:
            items = [_parse_radio_block(b) for b in radio_blocks]
            if not items:
                raise PsyToolkitParseError("radio block has no items")
        else:
            raise PsyToolkitParseError(
                "no `t: scale`, `t: range`, `t: multiradio`, or `t: radio` question block found")
```

(Note: `^t:\s*radio\b` does not match `t: multiradio` — "multiradio" does not start with "radio" — so a multiradio page's `radio_blocks` is empty and the `elif mr_blocks:` branch still wins for it. Precedence scale → range → multiradio → radio is preserved.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -v`
Expected: PASS (radio tests + all existing scale/range/multiradio tests).

- [ ] **Step 6: Run the FULL harvester suite (regression guard)**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — the draft/dedup/raw/e2e tests are untouched by this parser-only change.

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psytoolkit.py questionnaire-harvester/tests/test_psytoolkit.py
git commit -m "feat(harvester): parse t:radio (per-item radio) blocks into per-item options"
```

---

### Task 2: End-to-end, sweep, handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psytoolkit_radio.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked local note — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: the `t: radio` parser (Task 1) + the existing draft engine.
- Produces: a validating `t: radio` import; 3 radio questionnaires harvested.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psytoolkit_radio.html`:

```html
<html><head><title>EPDS</title></head><body>
<h1>Postnatal Depression (EPDS)</h1>
<div id="content"><p>A 10-item postnatal depression screening scale.</p></div>
<pre>
l: epds1
t: radio
q: I have been able to laugh and see the funny side of things
- {score=0} As much as I always could
- {score=1} Not quite so much now
- {score=2} Definitely not so much now
- {score=3} Not at all

l: epds2
t: radio
q: I have looked forward with enjoyment to things
- {score=0} As much as I ever did
- {score=1} Rather less than I used to
- {score=2} Definitely less than I used to
- {score=3} Hardly at all
</pre>
<h2 id="refs">References</h2>
<ul><li>Cox, J. L., Holden, J. M., &amp; Sagovsky, R. (1987). Detection of postnatal depression. British Journal of Psychiatry, 150, 782-786.</li></ul>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_radio_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_radio.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/depression-epds.html",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    # h1 "Postnatal Depression (EPDS)" -> qst_epds
    qst = json.loads((out / "questionnaires" / "qst_epds.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # per-item distinct prompts; no instruction; per-item choice options
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 2
    assert all("instruction" not in e["question"] for e in els)
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "single"
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_radio_harvest_validates -v`
Expected: PASS once Task 1 is merged.

- [ ] **Step 3: Run the FULL harvester suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — all prior tests + the new radio parser + e2e tests.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psytoolkit_radio.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e t:radio per-item radio harvest validates"
```

- [ ] **Step 5: Sweep the three real radio pages**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
B=https://us.psytoolkit.org/survey-library
for u in depression-epds.html systemizing-arc.html nurturant-fathering.html; do
  out=$(python -m harvester.cli harvest "$B/$u" 2>&1); rc=$?
  errs=$(python -c "from pathlib import Path; from harvester.validate import validate_tree; e=validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618'); print('OK' if not e else 'ERR '+str(e[0]))")
  if [ $rc -eq 0 ] && [ "$errs" = "OK" ] && echo "$out" | grep -q "^harvested "; then
    git add -A questionnaire-harvester/; echo "OK  $u :: $(echo "$out" | grep -oE 'qst_[a-z0-9]+' | head -1)"
  else
    git clean -fdq questionnaire-harvester/output questionnaire-harvester/questions
    git checkout -q questionnaire-harvester/register.md questionnaire-harvester/questions 2>/dev/null
    echo "FAIL $u :: rc=$rc errs=$errs :: $(echo "$out" | tail -1)"
  fi
done
python -c "from pathlib import Path; from harvester.validate import validate_tree; print(validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: all three `OK`; final tree validation `OK`. If a page times out transiently, retry it ONCE. A genuine parse refusal: note it in your report, do NOT fabricate.

- [ ] **Step 6: Commit the sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest 3 PsyToolkit per-item radio (t:radio) questionnaires"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: update the State count (≈114 → ≈117), add a one-line note that `t: radio` is now supported (each block = one item: `q:` stem + per-item scored choice options; no instruction), and move "radio" out of the "what's next" list. Do **NOT** `git add` it — `/HANDOFF.md` is gitignored. No commit for this step.

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
git merge --no-ff harvester-radio-0618 -m "merge: harvester — per-item radio (t:radio) support"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git push origin master
```

- [ ] **Clean up the feature worktree**

```bash
git worktree remove .claude/worktrees/radio-support
git branch -d harvester-radio-0618
```

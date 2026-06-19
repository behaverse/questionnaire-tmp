# Stem-less Beck-style Scales (shared prompt) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest psychology-tools.com stem-less Beck-style scales (alt-layout pages whose item rows have an empty `span.prompt`) by routing them to the existing shared-prompt model.

**Architecture:** Adapter-only. `_extract_items` allows empty stems (yields `RawItem(text=None, …)`); `parse()` detects an all-stem-less page and uses the page's Instructions as the single `shared_prompt_text` (with per-item options). The drafter's shared-prompt path already exists — no schema/draft change.

**Tech Stack:** Python 3, BeautifulSoup, pytest. Spec: `docs/superpowers/specs/2026-06-19-questionnaire-harvester-psychology-tools-stemless-design.md`.

## Global Constraints

- **Faithfulness:** statements + scores verbatim; the shared prompt is the page's real Instructions (never fabricated). Never invent a per-item stem.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/psytools-stemless`, branch `harvester-psytools-stemless-0619`). ALL edits under this worktree. Commit on the current HEAD; before committing confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-psytools-stemless-0619`; after, confirm parent via `git rev-parse --short HEAD^`. Never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. `origin/master` moves with a concurrent editor agent — at final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push to master (never merge in the main dir).
- **Model:** do NOT use the cheapest (haiku) tier for implementers. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/psytools-stemless`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **No schema change** — reuses the existing `shared_prompt_text` + shared-prompt draft path (draft.py ~124-140). Default `--version` is `v26.0618`.
- **Tests use SYNTHETIC fixtures** (invented statements) — never a real copyrighted page.
- **License posture:** `license: unknown` / `needs-review`; staging only.

---

### Task 1: Adapter — route all-stem-less alt pages to the shared prompt

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`
- Test: `questionnaire-harvester/tests/test_psychology_tools.py`

**Interfaces:**
- Consumes: `RawQuestionnaire.shared_prompt_text`, `RawItem.text` (may be None) — both already exist.
- Produces: `_extract_items` yields `RawItem(text=None, …)` for empty-stem rows; `parse()` sets `shared_prompt_text` (= the Instructions) when all items are stem-less, else refuses on mixed / no-instruction.

- [ ] **Step 1a: Replace the now-obsolete `test_refuses_empty_stem`**

The existing `test_refuses_empty_stem` (in `test_psychology_tools.py`) builds a standard-layout row with an empty stem inside `_page(...)` — and `_page` includes an `Instructions` paragraph by default. Under the new behavior that page is a valid all-stem-less shared-prompt harvest, NOT a refusal, so this test will break. **Replace it** (the "refuse" intent now lives in `test_stemless_no_instruction_refused` below — empty stem with no instruction). Change:

```python
def test_refuses_empty_stem():
    bad = _row("q1", "", OPTS3)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(bad), "https://psychology-tools.com/test/x")
```

to assert the new shared-prompt behavior:

```python
def test_empty_stem_with_instruction_uses_shared_prompt():
    # standard-layout row with an empty stem + an Instructions paragraph -> shared prompt
    rq = PsychologyToolsAdapter().parse(_page(_row("q1", "", OPTS3)),
                                        "https://psychology-tools.com/test/x")
    assert rq.shared_prompt_text == "Rate each statement."
    assert rq.instruction_text is None
    assert rq.items[0].text is None
    assert rq.items[0].option.anchors == ["Never", "Sometimes", "Often"]
```

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psychology_tools.py` (reuses the existing `_alt_row` / `OPTS3` helpers already in the file):

```python
def _alt_page_instr(rows, *, instr="Instructions Below are groups of statements.",
                    title="Demo Eating Scale (DES)"):
    p = f"<p>{instr}</p>" if instr else ""
    return (f'<html><head><meta name="description" content="A demo scale."></head>'
            f'<body><h1>{title}</h1>{p}<form>{rows}</form></body></html>')

def test_stemless_alt_uses_instruction_as_shared_prompt():
    rows = (_alt_row("q1", "", [("A1", "0"), ("A2", "1")])
            + _alt_row("q2", "", [("B1", "0"), ("B2", "1")]))
    rq = PsychologyToolsAdapter().parse(_alt_page_instr(rows), "https://psychology-tools.com/test/x")
    assert rq.shared_prompt_text == "Below are groups of statements."
    assert rq.instruction_text is None
    assert all(it.text is None for it in rq.items)
    assert rq.items[0].option.anchors == ["A1", "A2"]      # each item keeps its own distinct option-set
    assert rq.items[1].option.anchors == ["B1", "B2"]
    assert rq.items[0].option.values == [0.0, 1.0]

def test_stemless_no_instruction_refused():
    rows = _alt_row("q1", "", OPTS3)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_alt_page_instr(rows, instr=""),
                                       "https://psychology-tools.com/test/x")

def test_mixed_stem_and_stemless_refused():
    rows = _alt_row("q1", "Has a stem", OPTS3) + _alt_row("q2", "", OPTS3)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_alt_page_instr(rows), "https://psychology-tools.com/test/x")

def test_all_stem_alt_page_unchanged_no_shared_prompt():
    rows = _alt_row("q1", "Real stem one", OPTS3) + _alt_row("q2", "Real stem two", OPTS3)
    rq = PsychologyToolsAdapter().parse(_alt_page_instr(rows), "https://psychology-tools.com/test/x")
    assert rq.shared_prompt_text is None
    assert rq.items[0].text == "Real stem one" and rq.items[1].text == "Real stem two"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -k "stemless or mixed or all_stem" -v`
Expected: FAIL — `_extract_items` raises "item has an empty stem", so the stem-less cases never reach the shared-prompt logic.

- [ ] **Step 3: Allow empty stems in `_extract_items`**

In `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, in `_extract_items`, remove the empty-stem refusal and make the item's `text` `None` when blank. The current body is:

```python
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
```

Change it to:

```python
        stem = prompt_el.get_text(" ", strip=True) if prompt_el else ""
        cells = row.select(".notable-td.response") or row.select("ul.responses > li")
        if not cells:
            raise PsychologyToolsParseError("item has no response options")
        pairs = [_cell_pair(c) for c in cells]
        items.append(RawItem(text=stem or None, option=RawOption(
            input_data_type="choice", measurement_type="ordinal", selection="single",
            dimension="rating", anchors=[a for a, _ in pairs], values=[v for _, v in pairs])))
```

Also update the `_extract_items` docstring's "Refuses" sentence to drop "an empty stem" (it now refuses only on no rows / no response cells).

- [ ] **Step 4: Add the stem-less branch to `parse()`**

In `parse()`, the instruction is extracted into `instruction_text` (the `for el in soup.find_all(["p", "li"])` loop). Immediately AFTER that loop and BEFORE the `meta = soup.find("meta", ...)` / `description = ...` lines, insert:

```python
        shared_prompt_text = None
        stemless = [it for it in items if it.text is None]
        if stemless:
            if len(stemless) != len(items):
                raise PsychologyToolsParseError("mixed stem / stem-less item rows")
            if not instruction_text:
                raise PsychologyToolsParseError(
                    "stem-less page with no instruction to use as the shared prompt")
            shared_prompt_text = instruction_text
            instruction_text = None
```

(Placing it before `description` means a stem-less page's `description` falls back to the meta description or title — not the instruction, which is now the shared prompt.)

Then in the `return RawQuestionnaire(...)` call, change the hard-coded `shared_prompt_text=None` to the computed value:

```python
            domain=[], population=[], context_text=None, shared_prompt_text=shared_prompt_text,
            references=references)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -v`
Expected: PASS (the 4 new tests + all existing adapter tests — note the previously-deferred "stem-less refused" behavior is intentionally replaced; if an OLD test asserted that an all-stem-less alt page raises, update it to the new shared-prompt behavior rather than deleting coverage).

- [ ] **Step 6: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — standard / per-item-stem / endpoint-only paths unchanged; only all-stem-less alt pages newly parse.

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/tests/test_psychology_tools.py
git commit -m "feat(harvester): route stem-less Beck-style psychology-tools pages to shared prompt"
```

---

### Task 2: e2e + re-sweep + handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psychology_tools_stemless.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: Task 1 + the existing draft shared-prompt path + CLI.
- Produces: a validating stem-less harvest; binge-eating + health-anxiety-inventory harvested.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psychology_tools_stemless.html` (SYNTHETIC — invented statements, alt-layout, empty `span.prompt`):

```html
<html><head><meta name="description" content="A demo eating scale for testing."></head>
<body>
<h1>Demo Eating Scale (DES)</h1>
<p>Instructions Below are groups of statements. In each group pick the one that applies.</p>
<form>
  <li class="question-container"><span class="prompt"></span>
    <ul class="responses">
      <li class="response"><input id="q1_0" type="radio" name="q1" value="0"><label for="q1_0">I do not snack between meals.</label></li>
      <li class="response"><input id="q1_1" type="radio" name="q1" value="1"><label for="q1_1">I sometimes snack between meals.</label></li>
      <li class="response"><input id="q1_2" type="radio" name="q1" value="3"><label for="q1_2">I snack between meals very often.</label></li>
    </ul></li>
  <li class="question-container"><span class="prompt"></span>
    <ul class="responses">
      <li class="response"><input id="q2_0" type="radio" name="q2" value="0"><label for="q2_0">I never eat when not hungry.</label></li>
      <li class="response"><input id="q2_1" type="radio" name="q2" value="2"><label for="q2_1">I often eat when not hungry.</label></li>
    </ul></li>
</form>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_psychology_tools_stemless_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_stemless.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-eating-scale",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_des.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # one shared prompt referenced by every element; no per-item instruction
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 1
    assert all("instruction" not in e["question"] for e in els)
    # the two items have distinct option-sets (different content)
    assert len({e["option"]["ref"] for e in els}) == 2
    prompt = json.loads(next((out / "prompts").glob("*_shared.json")).read_text())
    assert "Below are groups of statements" in prompt["content"]["en"]["text"]
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_psychology_tools_stemless_harvest_validates -v`
Expected: PASS once Task 1 is merged.

- [ ] **Step 3: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psychology_tools_stemless.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e stem-less Beck-style harvest validates"
```

- [ ] **Step 5: Sweep the two stem-less pages**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
B=https://psychology-tools.com/test
for u in binge-eating-scale health-anxiety-inventory; do
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

Expected: both `OK`; final tree validation `OK`. If a page times out transiently, retry once. A genuine refusal (e.g. no Instructions found, or an id collision) cleanly SKIPs — note it, do NOT fabricate. Report the qst_ids + element counts (binge-eating ~16 items, health-anxiety ~18) and that each references a single `pr_<slug>_shared`.

- [ ] **Step 6: Commit the sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest stem-less Beck-style scales (binge-eating, health-anxiety)"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: bump the State count by the number harvested; note the adapter now handles stem-less Beck-style psychology-tools pages via the shared-prompt model (Instructions → one `Prompt`, per-item option-sets); note liebowitz two-dimension is still deferred (#3b). Do **NOT** `git add` it. No commit for this step.

---

## Final integration (after all tasks)

- [ ] **Run the suite + validator**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m pytest questionnaire-harvester/tests -q
python tools/validate_schemas.py
```

Expected: harvester suite green; `All N example(s) passed.`

- [ ] **Merge inside the worktree + fast-forward-push** (do NOT touch the main dir — a concurrent editor agent holds it)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/psytools-stemless
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester stem-less branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree** (from the main repo dir; does not alter the main dir's branch or the editor's WIP)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/psytools-stemless
git branch -D harvester-psytools-stemless-0619   # tip == origin/master after the ff-push
```

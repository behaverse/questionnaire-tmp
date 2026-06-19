# Two-Dimension Table (Liebowitz) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest the psychology-tools.com two-super-header dimension-table layout (Liebowitz Social Anxiety Scale) by flattening each item into one question per dimension, with the Fear/Avoidance distinction on `Option.dimension`.

**Architecture:** Adapter-only. A new bespoke parser (`_extract_dimension_table` + helpers `_sanitize_dimension`, `_dimension_table`, `_radio_value`) parses the table by column position; `parse()` routes table pages to it, else falls through to the existing `_extract_items`. The drafter's per-item path (verified) dedups the two identical scales to 2 Options.

**Tech Stack:** Python 3, BeautifulSoup, pytest. Spec: `docs/superpowers/specs/2026-06-19-questionnaire-harvester-psychology-tools-liebowitz-design.md`.

## Global Constraints

- **Faithfulness:** item stems + scores verbatim (strip only the leading positional item number, matching the adapter's existing `.num` handling); dimension keys + anchors are the page's own column headers; never fabricate. Refuse cleanly rather than guess.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/psytools-liebowitz`, branch `harvester-psytools-liebowitz-0619`). ALL edits under this worktree. Before committing confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-psytools-liebowitz-0619`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. `origin/master` moves with a concurrent editor agent — at final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (never merge in the main dir).
- **Model:** do NOT use the cheapest (haiku) tier for implementers. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/psytools-liebowitz`.
- **Test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **No schema/draft/raw change** — `RawOption` already carries `dimension`/`anchors`/`values`; the per-item drafter already dedups identical scales. Default `--version` is `v26.0618`.
- **`Option.dimension` must match `^[a-z][a-z0-9_]+$`** (min 2 chars).
- **Tests use SYNTHETIC fixtures** (invented stems) — never a real copyrighted page.
- **License posture:** `license: unknown` / `needs-review`; staging only.

---

### Task 1: Dimension-table parser + `parse()` routing

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`
- Test: `questionnaire-harvester/tests/test_psychology_tools.py`

**Interfaces:**
- Consumes: `RawItem`, `RawOption` (already imported in the module); `PsychologyToolsParseError`.
- Produces: `_sanitize_dimension(label: str) -> str`; `_dimension_table(form) -> bs4.Tag | None`; `_radio_value(cell) -> float`; `_extract_dimension_table(table) -> list[RawItem]` (interleaved item1-dim1, item1-dim2, …); `parse()` routes table pages to it.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psychology_tools.py` (reuses the existing `_page`/`_row`/`OPTS3` helpers already in the file). Add `_sanitize_dimension` to the existing import line `from harvester.sources.psychology_tools import (...)`.

```python
def _dim_table(dims, anchor_groups, rows, *, title="Demo Two-Dim (DTD)"):
    """dims: [(name, span), ...]; anchor_groups: parallel list of anchor-label lists;
    rows: [(stem, [values...]), ...]. Builds a two-super-header table page."""
    h1 = "<tr><td></td>" + "".join(f'<th colspan="{s}">{n}</th>' for n, s in dims) + "</tr>"
    h2 = "<tr><td></td>" + "".join(f"<th>{a}</th>" for grp in anchor_groups for a in grp) + "</tr>"
    body = ""
    for stem, vals in rows:
        cells = "".join(f'<td><input type="radio" name="x{i}" value="{v}"></td>'
                        for i, v in enumerate(vals))
        body += f"<tr><td>{stem}</td>{cells}</tr>"
    return (f'<html><head><meta name="description" content="demo."></head>'
            f"<body><h1>{title}</h1><form><table>{h1}{h2}{body}</table></form></body></html>")

_DIMS = [("Fear", 2), ("Avoidance", 2)]
_FA = [["None", "Mild"], ["Never", "Often"]]

def test_dimension_table_flattens_per_dimension_interleaved():
    rows = [("Telephoning", [0, 1, 0, 1]), ("Parties", [2, 3, 2, 3])]
    rq = PsychologyToolsAdapter().parse(_dim_table(_DIMS, _FA, rows),
                                        "https://psychology-tools.com/test/x")
    assert len(rq.items) == 4
    assert rq.shared_prompt_text is None
    assert [i.text for i in rq.items] == ["Telephoning", "Telephoning", "Parties", "Parties"]
    assert [i.option.dimension for i in rq.items] == ["fear", "avoidance", "fear", "avoidance"]
    assert rq.items[0].option.anchors == ["None", "Mild"] and rq.items[0].option.values == [0.0, 1.0]
    assert rq.items[1].option.anchors == ["Never", "Often"] and rq.items[1].option.values == [0.0, 1.0]
    assert rq.items[2].option.values == [2.0, 3.0]

def test_dimension_table_strips_leading_item_number():
    rq = PsychologyToolsAdapter().parse(_dim_table(_DIMS, _FA, [("1. Telephoning", [0, 1, 0, 1])]),
                                        "https://psychology-tools.com/test/x")
    assert rq.items[0].text == "Telephoning"

def test_sanitize_dimension():
    assert _sanitize_dimension("Fear") == "fear"
    assert _sanitize_dimension("Avoidance") == "avoidance"
    with pytest.raises(PsychologyToolsParseError):
        _sanitize_dimension("!")     # sanitizes to "" -> invalid
    with pytest.raises(PsychologyToolsParseError):
        _sanitize_dimension("3D")    # leading digit -> invalid

def test_dimension_table_radio_count_mismatch_refused():
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_dim_table(_DIMS, _FA, [("stem", [0, 1, 0])]),
                                       "https://psychology-tools.com/test/x")

def test_dimension_table_non_numeric_value_refused():
    html = _dim_table(_DIMS, _FA, [("stem", [0, 1, 0, 1])]).replace('value="1"', 'value="x"', 1)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")

def test_standard_page_unaffected_by_dimension_branch():
    # a non-table standard page still routes to _extract_items
    rq = PsychologyToolsAdapter().parse(_page(_row("q1", "I feel tense", OPTS3)),
                                        "https://psychology-tools.com/test/x")
    assert len(rq.items) == 1 and rq.items[0].text == "I feel tense"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -k "dimension or sanitize or unaffected" -v`
Expected: FAIL — `ImportError` for `_sanitize_dimension` and/or the table page refusing via `_extract_items` ("no item rows").

- [ ] **Step 3: Add the three helpers**

In `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, after `_cell_pair` (around line 49, before `_extract_items`), add:

```python
def _sanitize_dimension(label: str) -> str:
    """A column super-header label -> a schema-valid Option.dimension key
    (pattern ^[a-z][a-z0-9_]+$). 'Fear'->'fear', 'Avoidance'->'avoidance'. Refuses if the
    result can't satisfy the pattern (too short, or leading non-letter)."""
    key = re.sub(r"_+", "_", re.sub(r"[^a-z0-9]+", "_", label.lower())).strip("_")
    if not re.fullmatch(r"[a-z][a-z0-9_]+", key):
        raise PsychologyToolsParseError(f"dimension label {label!r} -> invalid key {key!r}")
    return key


def _dimension_table(form):
    """Return the form's two-dimension table iff its first header row has >=2 `<th colspan>`
    super-header cells, else None. This distinguishes the Liebowitz-style layout from the
    standard `div.notable-tr` / alternate `li.question-container` layouts (which have no such
    table)."""
    for table in form.find_all("table"):
        head = table.find("tr")
        if head and len([th for th in head.find_all("th") if th.get("colspan")]) >= 2:
            return table
    return None


def _radio_value(cell) -> float:
    """The numeric value of a single-radio table cell (the anchor comes from the column
    header, not the cell). Raises on a missing/non-numeric value."""
    inp = cell.find("input", attrs={"type": "radio"})
    v = inp.get("value") if inp else None
    if v is None or v == "":
        raise PsychologyToolsParseError("radio cell has no value")
    try:
        return float(v)
    except ValueError:
        raise PsychologyToolsParseError(f"non-numeric radio value {v!r}")
```

- [ ] **Step 4: Add `_extract_dimension_table`**

Immediately after `_radio_value` (and before `_extract_items`), add:

```python
def _extract_dimension_table(table):
    """Flatten a two-super-header dimension table into per-(item, dimension) RawItems,
    interleaved (item1-dim1, item1-dim2, item2-dim1, ...). Parses by column position: the
    super-header colspans partition both the anchor row and each data row's radio cells."""
    rows = table.find_all("tr")
    if len(rows) < 3:
        raise PsychologyToolsParseError("dimension table has too few rows")
    supers = [th for th in rows[0].find_all("th") if th.get("colspan")]
    if len(supers) < 2:
        raise PsychologyToolsParseError("need >=2 dimension super-headers")
    dims = []  # (dim_key, span) in column order
    for th in supers:
        try:
            span = int(th.get("colspan"))
        except (TypeError, ValueError):
            raise PsychologyToolsParseError(f"bad colspan {th.get('colspan')!r}")
        if span < 1:
            raise PsychologyToolsParseError("colspan < 1")
        dims.append((_sanitize_dimension(th.get_text(" ", strip=True)), span))
    total = sum(span for _, span in dims)
    anchors_flat = [th.get_text(" ", strip=True) for th in rows[1].find_all("th")]
    if len(anchors_flat) != total:
        raise PsychologyToolsParseError(
            f"anchor count {len(anchors_flat)} != colspan total {total}")
    per_dim_anchors, pos = [], 0
    for _, span in dims:
        per_dim_anchors.append(anchors_flat[pos:pos + span])
        pos += span
    items = []
    for row in rows[2:]:
        cells = row.find_all(["td", "th"])
        radio_cells = [c for c in cells if c.find("input", attrs={"type": "radio"})]
        if not radio_cells:
            continue
        if len(radio_cells) != total:
            raise PsychologyToolsParseError(
                f"data row has {len(radio_cells)} radio cells != {total}")
        stem_cell = next((c for c in cells if not c.find("input", attrs={"type": "radio"})), None)
        stem = re.sub(r"^\s*\d+[.)]\s*", "",
                      stem_cell.get_text(" ", strip=True)) if stem_cell else ""
        if not stem:
            raise PsychologyToolsParseError("dimension-table row has an empty stem")
        values = [_radio_value(c) for c in radio_cells]
        pos = 0
        for (dim_key, span), anchors in zip(dims, per_dim_anchors):
            items.append(RawItem(text=stem, option=RawOption(
                input_data_type="choice", measurement_type="ordinal", selection="single",
                dimension=dim_key, anchors=list(anchors), values=values[pos:pos + span])))
            pos += span
    if not items:
        raise PsychologyToolsParseError("dimension table has no data rows with radios")
    return items
```

- [ ] **Step 5: Route table pages in `parse()`**

In `parse()`, replace the single line:

```python
        items = _extract_items(form)
```

with:

```python
        tbl = _dimension_table(form)
        items = _extract_dimension_table(tbl) if tbl is not None else _extract_items(form)
```

(Everything else in `parse()` is unchanged. Dimension-table items all have non-None `text`, so the stem-less shared-prompt branch is skipped and `shared_prompt_text` stays `None`.)

- [ ] **Step 6: Run the new tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -v`
Expected: PASS (new dimension tests + all existing adapter tests).

- [ ] **Step 7: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — standard / alt / stem-less / endpoint-only paths unchanged.

- [ ] **Step 8: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/tests/test_psychology_tools.py
git commit -m "feat(harvester): parse psychology-tools two-dimension tables (Liebowitz)"
```

---

### Task 2: e2e + re-sweep + handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psychology_tools_dimension.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: Task 1 + the existing draft per-item path + CLI.
- Produces: a validating two-dimension harvest; `qst_lsas` harvested.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psychology_tools_dimension.html` (SYNTHETIC — invented stems, two-super-header table, 2 dims × 2 items):

```html
<html><head><meta name="description" content="A demo two-dimension scale for testing."></head>
<body>
<h1>Demo Two-Dimension Scale (DTDS)</h1>
<p>Instructions Rate each situation on both dimensions.</p>
<form><table>
  <tr><td></td><th colspan="4">Fear</th><th colspan="4">Avoidance</th></tr>
  <tr><td></td><th>None</th><th>Mild</th><th>Moderate</th><th>Severe</th>
              <th>Never</th><th>Rarely</th><th>Often</th><th>Usually</th></tr>
  <tr><td>1. Speaking to a stranger</td>
    <td><input type="radio" name="qa1" value="0"></td><td><input type="radio" name="qa1" value="1"></td>
    <td><input type="radio" name="qa1" value="2"></td><td><input type="radio" name="qa1" value="3"></td>
    <td><input type="radio" name="qb1" value="0"></td><td><input type="radio" name="qb1" value="1"></td>
    <td><input type="radio" name="qb1" value="2"></td><td><input type="radio" name="qb1" value="3"></td></tr>
  <tr><td>2. Eating in public</td>
    <td><input type="radio" name="qa2" value="0"></td><td><input type="radio" name="qa2" value="1"></td>
    <td><input type="radio" name="qa2" value="2"></td><td><input type="radio" name="qa2" value="3"></td>
    <td><input type="radio" name="qb2" value="0"></td><td><input type="radio" name="qb2" value="1"></td>
    <td><input type="radio" name="qb2" value="2"></td><td><input type="radio" name="qb2" value="3"></td></tr>
</table></form>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_psychology_tools_dimension_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_dimension.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-two-dimension-scale",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_dtds.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 4                                        # 2 items x 2 dimensions
    opt_refs = {e["option"]["ref"].split("@")[0] for e in els}
    assert len(opt_refs) == 2                                   # fear + avoidance scales dedup to 2
    dims = sorted(json.loads((out / "options" / f"{r}.json").read_text())["dimension"]
                  for r in opt_refs)
    assert dims == ["avoidance", "fear"]
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_psychology_tools_dimension_harvest_validates -v`
Expected: PASS (id `qst_dtds` from the `(DTDS)` acronym; 4 elements, 2 deduped options with dimensions fear/avoidance).

- [ ] **Step 3: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psychology_tools_dimension.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e two-dimension table harvest validates"
```

- [ ] **Step 5: Sweep the Liebowitz page**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
out=$(python -m harvester.cli harvest "https://psychology-tools.com/test/liebowitz-social-anxiety-scale" 2>&1); rc=$?
echo "$out" | tail -1
errs=$(python -c "from pathlib import Path; from harvester.validate import validate_tree; e=validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618'); print('OK' if not e else 'ERR '+str(e[0]))")
if [ $rc -eq 0 ] && [ "$errs" = "OK" ] && echo "$out" | grep -q "^harvested "; then
  git add -A questionnaire-harvester/; echo "OK :: $(echo "$out" | grep -oE 'qst_[a-z0-9]+' | head -1)"
else
  git clean -fdq questionnaire-harvester/output questionnaire-harvester/questions
  git checkout -q questionnaire-harvester/register.md 2>/dev/null
  echo "SKIP/FAIL :: rc=$rc errs=$errs :: $(echo "$out" | tail -1)"
fi
```

Then verify the structure:

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json, glob
d=json.load(open("questionnaire-harvester/output/questionnaires/qst_lsas.json"))
els=d["pages"][0]["elements"]
opt_refs={e["option"]["ref"].split("@")[0] for e in els}
have={json.load(open(f))["id"] for f in glob.glob("questionnaire-harvester/output/options/*.json")+glob.glob("questionnaire-harvester/output/prompts/*.json")}
allrefs=set()
for e in els:
    allrefs.add(e["option"]["ref"].split("@")[0]); allrefs.add(e["question"]["prompt"]["ref"].split("@")[0])
dims=sorted(json.load(open(f"questionnaire-harvester/output/options/{r}.json"))["dimension"] for r in opt_refs)
print("elements", len(els), "options", len(opt_refs), "dims", dims,
      "missing", [r for r in allrefs if r not in have] or "none")
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: `OK :: qst_lsas`; then `elements 48 options 2 dims ['avoidance', 'fear'] missing none`; tree `OK`. If the page times out transiently, retry once. A genuine refusal (structure changed) cleanly SKIPs — note it, do NOT fabricate. Report the element/option/dimension counts.

- [ ] **Step 6: Commit the sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest Liebowitz two-dimension scale (qst_lsas)"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: bump the State count by 1; note the adapter now handles the two-super-header dimension-table layout (Liebowitz) — each item flattened into one question per dimension with `Option.dimension` (`fear`/`avoidance`), the two scales dedup to 2 Options; `qst_lsas` harvested (48 elements). Note the "deferred layout" backlog is now CLEARED. Do **NOT** `git add` it. No commit for this step.

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
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/psytools-liebowitz
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester liebowitz branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree** (from the main repo dir; does not alter the main dir's branch or the editor's WIP)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/psytools-liebowitz
git branch -D harvester-psytools-liebowitz-0619   # tip == origin/master after the ff-push
```

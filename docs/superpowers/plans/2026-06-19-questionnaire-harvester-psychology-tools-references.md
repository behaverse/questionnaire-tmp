# psychology-tools.com Structured References — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract each psychology-tools.com page's structured `Sources` section into `publication` (primary) + a new `metadata.x_references` list, and backfill all 37 already-harvested psychology-tools questionnaires.

**Architecture:** Add a `references` field to `RawQuestionnaire` and emit `metadata.x_references` in the drafter; rewrite the adapter's citation extraction to read `ol.sources li.source` (+ `time.publication-date`); re-harvest the 37 to backfill. No schema change.

**Tech Stack:** Python 3, BeautifulSoup, pytest. Spec: `docs/superpowers/specs/2026-06-19-questionnaire-harvester-psychology-tools-references-design.md`.

## Global Constraints

- **Faithfulness:** citation words + year preserved verbatim; only whitespace/punctuation-spacing is tidied (metadata formatting, not item/scale content). Never fabricate.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/psytools-refs`, branch `harvester-psytools-refs-0619`). ALL edits under this worktree. Commit on the current HEAD; before committing confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-psytools-refs-0619`; after committing confirm parent via `git rev-parse --short HEAD^`. Never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. `origin/master` is moving with a concurrent editor agent — at final integration, merge `origin/master` INTO this branch inside the worktree and fast-forward-push to master (do NOT merge in the main dir).
- **Model:** do NOT use the cheapest (haiku) tier for implementers. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/psytools-refs`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **No schema change** — `metadata.x_references` rides the existing `^x_` patternProperties (value schema `{}` — array allowed; verified). Default `--version` is `v26.0618`.
- **Tests use SYNTHETIC fixtures** — never a real copyrighted page.
- **License posture:** `license: unknown` / `needs-review`; staging only.

---

### Task 1: `RawQuestionnaire.references` + `draft` emits `x_references`

**Files:**
- Modify: `questionnaire-harvester/src/harvester/raw.py`
- Modify: `questionnaire-harvester/src/harvester/draft.py`
- Test: `questionnaire-harvester/tests/test_draft.py`

**Interfaces:**
- Produces: `RawQuestionnaire.references: list` (default `[]`); the questionnaire `metadata` gains `x_references` (the list) only when non-empty.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_draft.py`:

```python
def test_draft_emits_x_references_when_present():
    rq = _gad7()
    rq.references = ["First A et al. (2006).", "Second B et al. (2010)."]
    res = draft(rq, version="v26.0617", scales_index={}, instr_index={})
    md = res.entities["questionnaire"][0]["metadata"]
    assert md["x_references"] == ["First A et al. (2006).", "Second B et al. (2010)."]

def test_draft_no_x_references_when_empty():
    res = draft(_gad7(), version="v26.0617", scales_index={}, instr_index={})
    assert "x_references" not in res.entities["questionnaire"][0]["metadata"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_draft.py -k x_references -v`
Expected: FAIL — `RawQuestionnaire` has no `references` attribute (AttributeError on `rq.references = ...`).

- [ ] **Step 3: Add the `references` field**

In `questionnaire-harvester/src/harvester/raw.py`, in the `RawQuestionnaire` dataclass, add a field after `shared_prompt_text`:

```python
    shared_prompt_text: str | None = None
    references: list = field(default_factory=list)
```

(`field` is already imported in `raw.py`.)

- [ ] **Step 4: Emit `x_references` in `draft`**

In `questionnaire-harvester/src/harvester/draft.py`, find the publication line in the metadata assembly:

```python
    if rq.citation and rq.year:
        md["publication"] = {"citation": rq.citation, "year": rq.year}
```

and add, immediately after it:

```python
    if rq.references:
        md["x_references"] = rq.references
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_draft.py -v`
Expected: PASS (new tests + existing draft tests; all existing callers default `references=[]` so no `x_references` is emitted for them).

- [ ] **Step 6: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — additive field, no behavior change for existing harvests.

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/raw.py questionnaire-harvester/src/harvester/draft.py questionnaire-harvester/tests/test_draft.py
git commit -m "feat(harvester): RawQuestionnaire.references -> metadata.x_references"
```

---

### Task 2: Adapter — extract `ol.sources` citation/year/references

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`
- Test: `questionnaire-harvester/tests/test_psychology_tools.py`

**Interfaces:**
- Consumes: `RawQuestionnaire.references` (Task 1).
- Produces: `_clean_citation(li) -> str`; `parse()` populates `citation`/`year` from the first `ol.sources li.source` and `references` from all of them.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psychology_tools.py` (reuses the existing `_row` helper + `OPTS3`):

```python
def _page_with_sources(li_html):
    return (f'<html><body><h1>Demo Scale (DEMO)</h1>'
            f'<form>{_row("q1", "An item", OPTS3)}</form>'
            f'<h6>Sources</h6><ol class="sources">{li_html}</ol></body></html>')

def test_extracts_structured_reference_and_year():
    li = ('<li class="source"><span class="authors">C Allison , S Baron-Cohen</span> . '
          'Some Title . <time class="publication-date" datetime="2008">2008</time> .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert rq.year == 2008
    assert len(rq.references) == 1
    assert "Allison, S Baron-Cohen" in rq.references[0]   # space-before-comma tidied
    assert " ." not in rq.references[0]                    # space-before-period tidied
    assert rq.citation == rq.references[0]

def test_two_sources_primary_publication_all_in_references():
    li = ('<li class="source"><span>First A</span> . '
          '<time class="publication-date" datetime="1959">1959</time> .</li>'
          '<li class="source"><span>Second B</span> . '
          '<time class="publication-date" datetime="1970">1970</time> .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert len(rq.references) == 2
    assert rq.year == 1959                 # year from the first source
    assert rq.citation == rq.references[0]

def test_no_sources_section_yields_no_citation():
    html = ('<html><body><h1>Demo Scale (DEMO)</h1>'
            f'<form>{_row("q1", "An item", OPTS3)}</form></body></html>')
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert rq.citation == "" and rq.year is None and rq.references == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -k "reference or sources" -v`
Expected: FAIL — current extraction does not read `ol.sources`; `rq.references` not populated (and `parse()` doesn't pass `references`).

- [ ] **Step 3: Add `_clean_citation` and rewrite the extraction**

In `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, add a module-level helper (after `_derive_id`, before the class):

```python
def _clean_citation(li):
    """A `li.source` element's text, whitespace-collapsed and tidied so the hCard spans'
    stray spaces around punctuation are removed (e.g. 'Allison , S' -> 'Allison, S')."""
    t = re.sub(r"\s+", " ", li.get_text(" ", strip=True)).strip()
    return re.sub(r"\s+([,.;:])", r"\1", t)
```

Then replace the existing citation block in `parse()`:

```python
        citation, year = "", None
        for el in soup.find_all(["p", "li", "div", "span"]):
            t = el.get_text(" ", strip=True)
            if re.match(r"^(source|reference)s?\b", t, re.I):
                ym = re.search(r"\b(19|20)\d{2}\b", t)
                if ym:
                    citation = re.sub(r"^(source|reference)s?\s*:?\s*", "", t, flags=re.I).strip()
                    year = int(ym.group())
                break
```

with structured extraction:

```python
        references = [c for c in (_clean_citation(li) for li in soup.select("ol.sources li.source")) if c]
        citation = references[0] if references else ""
        year = None
        first = soup.select_one("ol.sources li.source")
        if first:
            tnode = first.select_one("time.publication-date")
            ytext = (tnode.get("datetime") or tnode.get_text(" ", strip=True)) if tnode else ""
            ym = re.search(r"\b(?:19|20)\d{2}\b", ytext) or re.search(r"\b(?:19|20)\d{2}\b", citation)
            if ym:
                year = int(ym.group())
```

- [ ] **Step 4: Pass `references` into the returned questionnaire**

In `parse()`'s `return RawQuestionnaire(...)` call, add the `references` argument (alongside the existing kwargs):

```python
        return RawQuestionnaire(
            qst_id=qst_id, title=title, short_title=short_title, description=description,
            citation=citation, year=year, source_site=self.site, source_url=url,
            instruction_text=instruction_text, scale=None, items=items,
            license=LicenseFlag.unknown(url),
            domain=[], population=[], context_text=None, shared_prompt_text=None,
            references=references)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -v`
Expected: PASS (new reference tests + all existing adapter tests — the standard parsing path is unchanged).

- [ ] **Step 6: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/tests/test_psychology_tools.py
git commit -m "feat(harvester): psychology-tools extracts ol.sources citations + x_references"
```

---

### Task 3: e2e + backfill all 37 + handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psychology_tools_sources.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: Tasks 1-2 + the existing draft engine + CLI.
- Produces: a validating harvest with `publication` + `x_references`; all 37 psychology-tools questionnaires backfilled.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psychology_tools_sources.html` (SYNTHETIC — invented items + a synthetic citation):

```html
<html><head><meta name="description" content="A demo scale for testing."></head>
<body>
<h1>Demo Worry Scale (DWS)</h1>
<p>InstructionsRate each statement.</p>
<form>
  <div class="notable-tr question odd">
    <span class="notable-td prompt"><span class="num">1.</span><span>I notice deadlines</span></span>
    <span class="notable-td response"><label class="aria-label" for="q1_0">Never</label><input id="q1_0" type="radio" name="q1" value="0"></span>
    <span class="notable-td response"><label class="aria-label" for="q1_1">Sometimes</label><input id="q1_1" type="radio" name="q1" value="1"></span>
    <span class="notable-td response"><label class="aria-label" for="q1_2">Often</label><input id="q1_2" type="radio" name="q1" value="2"></span>
  </div>
</form>
<h6>Sources</h6>
<ol class="sources">
  <li class="source"><span class="authors">A Demo , B Tester</span> . A Synthetic Worry Measure . <em class="title">J Test Psych</em> 12: 3-9 <time class="publication-date" datetime="2011">2011</time> .</li>
</ol>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_psychology_tools_references_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_sources.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-worry-scale",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    md = json.loads((out / "questionnaires" / "qst_dws.json").read_text())["metadata"]
    assert md["publication"]["year"] == 2011
    assert "A Demo, B Tester" in md["publication"]["citation"]
    assert md["x_references"] == [md["publication"]["citation"]]
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_psychology_tools_references_harvest_validates -v`
Expected: PASS once Tasks 1-2 are merged.

- [ ] **Step 3: Run the FULL suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psychology_tools_sources.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e psychology-tools references harvest validates"
```

- [ ] **Step 5: Backfill all 37 psychology-tools questionnaires**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json, glob
from pathlib import Path
rows = []
for f in sorted(glob.glob("questionnaire-harvester/output/questionnaires/*.json")):
    m = json.load(open(f))["metadata"]
    if m.get("x_source_site") == "psychology-tools.com":
        rows.append(f"{m['id']}\t{m['x_source_url']}")
Path("/tmp/ptbackfill.tsv").write_text("\n".join(rows) + "\n")
print(len(rows), "psychology-tools questionnaires to re-harvest")
PY
before=$(grep -rl '"publication"' questionnaire-harvester/output/questionnaires/ | xargs grep -l 'psychology-tools.com' 2>/dev/null | wc -l)
while IFS=$'\t' read -r id url; do
  [ -z "$id" ] && continue
  out=$(python -m harvester.cli harvest "$url" --id "$id" 2>&1); rc=$?
  errs=$(python -c "from pathlib import Path; from harvester.validate import validate_tree; e=validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618'); print('OK' if not e else 'ERR '+str(e[0]))")
  if [ $rc -eq 0 ] && [ "$errs" = "OK" ] && echo "$out" | grep -q "^harvested "; then
    git add -A questionnaire-harvester/; echo "OK  $id"
  else
    git clean -fdq questionnaire-harvester/output questionnaire-harvester/questions
    git checkout -q questionnaire-harvester/ 2>/dev/null
    echo "FAIL $id :: rc=$rc errs=$errs :: $(echo "$out" | tail -1)"
  fi
done < /tmp/ptbackfill.tsv
rm -f /tmp/ptbackfill.tsv
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
after=$(for f in $(grep -rl 'psychology-tools.com' questionnaire-harvester/output/questionnaires/); do grep -l '"publication"' "$f"; done | wc -l)
echo "psychology-tools questionnaires WITH publication: was $before, now $after (of 37)"
```

Expected: all 37 re-harvest `OK`; tree validates; most now carry `publication` + `x_references` (a page with no parseable year stays without one — note any). If a page times out transiently, retry once. Do NOT fabricate.

- [ ] **Step 6: Commit the backfill**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): backfill psychology-tools publications + x_references (37 questionnaires)"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note the psychology-tools adapter now extracts the structured `ol.sources` references → `publication` + `metadata.x_references`, and that all 37 psychology-tools questionnaires were backfilled (report how many gained a publication). Do **NOT** `git add` it. No commit for this step.

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
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/psytools-refs
git fetch origin -q
# confirm this branch touches no editor/ or scripts/ files:
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master (editor work) into harvester references branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree** (from the main repo dir; does not alter the main dir's branch or the editor's WIP)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/psytools-refs
git branch -D harvester-psytools-refs-0619   # tip == origin/master after the ff-push
```

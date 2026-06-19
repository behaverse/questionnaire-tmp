# psychology-tools.com Source Adapter — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second source adapter (`psychology-tools.com`) that parses `/test/<slug>` radio-form pages into canonical questionnaires, with host-based CLI dispatch.

**Architecture:** New `PsychologyToolsAdapter` parses the deterministic `.notable-tr.question` form structure into per-item choice options; the CLI dispatches to it (or `PsyToolkitAdapter`) by URL host. Reuses the existing per-item-option draft engine — no schema/draft change.

**Tech Stack:** Python 3, BeautifulSoup, httpx, pytest. Spec: `docs/superpowers/specs/2026-06-19-questionnaire-harvester-psychology-tools-adapter-design.md`.

## Global Constraints

- **Faithfulness (owner directive):** item stems + anchor labels + values kept exactly as on the page; never fabricate or normalise.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/psytools-adapter`, branch `harvester-psytools-0619`). Commit with `git add <paths> && git commit` on the current HEAD; before committing confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-psytools-0619`; after committing confirm the parent via `git rev-parse --short HEAD^`. Never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere.
- **Model:** do NOT use the cheapest (haiku) tier for implementers — it mis-parented commits in prior runs. Use sonnet or higher.
- **Run commands from the worktree root** `.claude/worktrees/psytools-adapter`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **No schema change** — targets schema `v26.0618`; harvester default `--version` is `v26.0618`.
- **Tests use SYNTHETIC fixtures** (invented items) replicating the page structure — never commit a real copyrighted page as a fixture.
- **License posture:** copyrighted instruments → `license: unknown` / `needs-review`; output is staging the owner reviews before any Library ingest (identical to PsyToolkit).

---

### Task 1: `PsychologyToolsAdapter` parser

**Files:**
- Create: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`
- Create: `questionnaire-harvester/tests/test_psychology_tools.py`

**Interfaces:**
- Consumes: `SourceAdapter` (base), `RawQuestionnaire`/`RawItem`/`RawOption` (`harvester.raw`), `LicenseFlag` (`harvester.licensing`).
- Produces: `PsychologyToolsAdapter` (`.site = "psychology-tools.com"`, `.parse(html, url) -> RawQuestionnaire`); `PsychologyToolsParseError`; `_derive_id(title, url) -> str`.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_psychology_tools.py`:

```python
import pytest
from harvester.sources.psychology_tools import (
    PsychologyToolsAdapter, PsychologyToolsParseError, _derive_id)

def _page(rows, *, title="Demo Anxiety Scale (DEMO)", instr=True):
    instr_html = '<p>InstructionsRate each statement.</p>' if instr else ''
    return f"""<html><head><meta name="description" content="A short demo scale."></head>
    <body><h1>{title}</h1>{instr_html}
    <form>{rows}</form></body></html>"""

def _row(name, stem, opts):
    cells = "".join(
        f'<span class="notable-td response"><label class="aria-label">{a}</label>'
        f'<input type="radio" name="{name}" value="{v}"></span>' for a, v in opts)
    return (f'<div class="notable-tr question odd">'
            f'<span class="notable-td prompt"><span class="num">{name[1:]}.</span>'
            f'<span>{stem}</span></span>{cells}</div>')

OPTS3 = [("Never", "0"), ("Sometimes", "1"), ("Often", "2")]

def test_parses_items_anchors_values_and_stem():
    html = _page(_row("q1", "I feel tense", OPTS3) + _row("q2", "I worry a lot", OPTS3))
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/demo-anxiety-scale")
    assert rq.qst_id == "qst_demo"
    assert rq.scale is None and rq.shared_prompt_text is None
    assert len(rq.items) == 2
    assert rq.items[0].text == "I feel tense"
    o = rq.items[0].option
    assert o.input_data_type == "choice" and o.measurement_type == "ordinal" and o.selection == "single"
    assert o.anchors == ["Never", "Sometimes", "Often"]
    assert o.values == [0.0, 1.0, 2.0]
    assert rq.instruction_text == "Rate each statement."
    assert rq.description == "A short demo scale."

def test_derive_id_leading_acronym_and_fallback():
    u = "https://psychology-tools.com/test/adult-adhd-self-report-scale"
    assert _derive_id("Adult ADHD Self-Report Scale (ASRSv1.1)", u) == "qst_asrs"
    assert _derive_id("Patient Health Questionnaire (PHQ-9)", u) == "qst_phq9"
    assert _derive_id("Generalized Anxiety Disorder (GAD-7)", u) == "qst_gad7"
    # no usable acronym -> full /test/ slug (never the generic 'scale')
    assert _derive_id("Some Long Descriptive Title", u) == "qst_adultadhdselfreportscale"

def test_refuses_no_form():
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse("<html><h1>X (X)</h1><p>no form</p></html>",
                                       "https://psychology-tools.com/test/x")

def test_refuses_no_question_rows():
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(""), "https://psychology-tools.com/test/x")

def test_refuses_empty_anchor_label():
    bad = _row("q1", "stem", [("", "0"), ("ok", "1")])
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(bad), "https://psychology-tools.com/test/x")

def test_refuses_non_numeric_value():
    bad = _row("q1", "stem", [("Never", "x"), ("Often", "1")])
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(bad), "https://psychology-tools.com/test/x")

def test_refuses_empty_stem():
    bad = _row("q1", "", OPTS3)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(bad), "https://psychology-tools.com/test/x")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -v`
Expected: FAIL — module `harvester.sources.psychology_tools` does not exist.

- [ ] **Step 3: Implement the adapter**

Create `questionnaire-harvester/src/harvester/sources/psychology_tools.py`:

```python
import re
from bs4 import BeautifulSoup
from harvester.sources.base import SourceAdapter
from harvester.raw import RawQuestionnaire, RawItem, RawOption
from harvester.licensing import LicenseFlag


class PsychologyToolsParseError(ValueError):
    """The psychology-tools.com page isn't a shape this adapter handles (e.g. not a
    `/test/` radio-form page). Surfaced so the harvest SKIPs rather than guessing."""


def _derive_id(title: str, url: str) -> str:
    """qst_<slug>: the leading acronym of the title parenthetical handles messy versioned
    acronyms ("(ASRSv1.1)" -> asrs, "(PHQ-9)" -> phq9, "(GAD-7)" -> gad7). If there is no
    usable acronym, fall back to the full `/test/` URL slug (never the generic last segment
    "scale" the shared derive_qst_id would produce)."""
    m = re.search(r"\(([^)]+)\)", title)
    if m:
        acr = re.match(r"[A-Z0-9]+(?:-[A-Z0-9]+)*", m.group(1).strip())
        if acr:
            slug = re.sub(r"[^a-z0-9]", "", acr.group(0).lower())
            if slug:
                return f"qst_{slug}"
    seg = url.split("?")[0].rstrip("/").rsplit("/", 1)[-1]
    return "qst_" + re.sub(r"[^a-z0-9]", "", seg.lower())


class PsychologyToolsAdapter(SourceAdapter):
    site = "psychology-tools.com"

    def parse(self, html: str, url: str) -> RawQuestionnaire:
        soup = BeautifulSoup(html, "html.parser")

        h1 = soup.find("h1")
        title = h1.get_text(strip=True) if h1 else (
            soup.title.get_text(strip=True) if soup.title else "")
        short_m = re.search(r"\(([^)]+)\)", title)
        short_title = short_m.group(1) if short_m else title
        qst_id = _derive_id(title, url)

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

        instruction_text = None
        for el in soup.find_all(["p", "li"]):
            t = el.get_text(" ", strip=True)
            if re.match(r"^instructions?\b", t, re.I):
                instruction_text = re.sub(r"^instructions?\s*:?\s*", "", t, flags=re.I).strip() or None
                break

        meta = soup.find("meta", attrs={"name": "description"})
        description = ((meta.get("content").strip() if meta and meta.get("content") else "")
                       or (instruction_text or "") or title)

        citation, year = "", None
        for el in soup.find_all(["p", "li", "div", "span"]):
            t = el.get_text(" ", strip=True)
            if re.match(r"^(source|reference)s?\b", t, re.I):
                ym = re.search(r"\b(19|20)\d{2}\b", t)
                if ym:
                    citation = re.sub(r"^(source|reference)s?\s*:?\s*", "", t, flags=re.I).strip()
                    year = int(ym.group())
                break

        return RawQuestionnaire(
            qst_id=qst_id, title=title, short_title=short_title, description=description,
            citation=citation, year=year, source_site=self.site, source_url=url,
            instruction_text=instruction_text, scale=None, items=items,
            license=LicenseFlag.unknown(url),
            domain=[], population=[], context_text=None, shared_prompt_text=None)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -v`
Expected: PASS (all 7 tests).

- [ ] **Step 5: Run the FULL harvester suite (no regressions)**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — existing suite unaffected (new module only).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/tests/test_psychology_tools.py
git commit -m "feat(harvester): PsychologyToolsAdapter — parse /test/ radio-form pages"
```

---

### Task 2: Host-based CLI dispatch

**Files:**
- Modify: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_cli_dispatch.py` (create)

**Interfaces:**
- Consumes: `PsyToolkitAdapter`/`PsyToolkitParseError`, `PsychologyToolsAdapter`/`PsychologyToolsParseError`.
- Produces: `dispatch_adapter(url) -> SourceAdapter` in `cli.py`; `main()` uses it and catches both parse errors.

- [ ] **Step 1: Write the failing test**

Create `questionnaire-harvester/tests/test_cli_dispatch.py`:

```python
import pytest
from harvester.cli import dispatch_adapter
from harvester.sources.psytoolkit import PsyToolkitAdapter
from harvester.sources.psychology_tools import PsychologyToolsAdapter

def test_dispatch_psytoolkit_host():
    a = dispatch_adapter("https://us.psytoolkit.org/survey-library/anxiety-gad7.html")
    assert isinstance(a, PsyToolkitAdapter)

def test_dispatch_psychology_tools_host():
    a = dispatch_adapter("https://psychology-tools.com/test/penn-state-worry-questionnaire")
    assert isinstance(a, PsychologyToolsAdapter)

def test_dispatch_unknown_host_raises():
    with pytest.raises(ValueError):
        dispatch_adapter("https://example.com/foo")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_dispatch.py -v`
Expected: FAIL — `cannot import name 'dispatch_adapter'`.

- [ ] **Step 3: Add the dispatch + wire it into `main()`**

In `questionnaire-harvester/src/harvester/cli.py`, replace the import block (lines 1-7) top with the added imports, and add `dispatch_adapter`. Specifically:

Change the imports at the top to add `urlparse` and the new adapter:

```python
import argparse, sys
from pathlib import Path
from urllib.parse import urlparse
from harvester.sources.base import SourceAdapter
from harvester.sources.psytoolkit import PsyToolkitAdapter, PsyToolkitParseError
from harvester.sources.psychology_tools import PsychologyToolsAdapter, PsychologyToolsParseError
from harvester.dedup import load_scales_index, build_instruction_index
from harvester.draft import draft, write_draft, find_questionnaire_collision
from harvester.validate import validate_tree
from harvester.tracking import upsert_register_row, write_questions


_ADAPTERS = (PsyToolkitAdapter, PsychologyToolsAdapter)


def dispatch_adapter(url: str) -> SourceAdapter:
    """Pick the source adapter for `url` by host (exact or subdomain match on each
    adapter's `.site`). Raises ValueError when no adapter matches."""
    host = (urlparse(url).hostname or "").lower()
    for cls in _ADAPTERS:
        if host == cls.site or host.endswith("." + cls.site):
            return cls()
    raise ValueError(f"no adapter for host {host!r}")
```

Then replace the adapter-instantiation + parse block (old lines 28-33):

```python
    adapter = PsyToolkitAdapter()
    try:
        rq = adapter.parse(adapter.fetch(a.url), a.url)
    except PsyToolkitParseError as e:
        print(f"SKIP {a.url}: {e}")     # unsupported page shape — nothing written
        return 2
```

with:

```python
    try:
        adapter = dispatch_adapter(a.url)
    except ValueError as e:
        print(f"SKIP {a.url}: {e}")     # no adapter for this host — nothing written
        return 2
    try:
        rq = adapter.parse(adapter.fetch(a.url), a.url)
    except (PsyToolkitParseError, PsychologyToolsParseError) as e:
        print(f"SKIP {a.url}: {e}")     # unsupported page shape — nothing written
        return 2
```

(The rest of `main()` — `--id` override, collision guard, draft, validate, register — is unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_dispatch.py -v`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the FULL suite (PsyToolkit path unchanged)**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — the existing PsyToolkit e2e tests still pass through the new dispatch.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_cli_dispatch.py
git commit -m "feat(harvester): host-based CLI adapter dispatch (psytoolkit + psychology-tools)"
```

---

### Task 3: End-to-end, sweep, handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psychology_tools_test.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked local note — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: the adapter (Task 1) + dispatch (Task 2) + the existing draft engine.
- Produces: a validating psychology-tools harvest; a handful of real `/test/` questionnaires.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psychology_tools_test.html` (SYNTHETIC — invented items):

```html
<html><head><meta name="description" content="A demo worry scale for testing."></head>
<body>
<h1>Demo Worry Questionnaire (DWQ)</h1>
<p>InstructionsPlease rate how often each statement applies to you.</p>
<form>
  <div class="notable-tr question odd">
    <span class="notable-td prompt"><span class="num">1.</span><span>I notice deadlines approaching.</span></span>
    <span class="notable-td response"><label class="aria-label">Never</label><input type="radio" name="q1" value="0"></span>
    <span class="notable-td response"><label class="aria-label">Sometimes</label><input type="radio" name="q1" value="1"></span>
    <span class="notable-td response"><label class="aria-label">Often</label><input type="radio" name="q1" value="2"></span>
  </div>
  <div class="notable-tr question even">
    <span class="notable-td prompt"><span class="num">2.</span><span>I plan my week in advance.</span></span>
    <span class="notable-td response"><label class="aria-label">Never</label><input type="radio" name="q2" value="0"></span>
    <span class="notable-td response"><label class="aria-label">Sometimes</label><input type="radio" name="q2" value="1"></span>
    <span class="notable-td response"><label class="aria-label">Often</label><input type="radio" name="q2" value="2"></span>
  </div>
</form>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_psychology_tools_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_test.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-worry-questionnaire",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_dwq.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # per-item distinct prompts; identical 3-point scale dedups to one option
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 2
    assert len({e["option"]["ref"] for e in els}) == 1
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["selection"] == "single"
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_psychology_tools_harvest_validates -v`
Expected: PASS once Tasks 1-2 are merged.

- [ ] **Step 3: Run the FULL harvester suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — all prior tests + the new adapter/dispatch/e2e tests.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psychology_tools_test.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e psychology-tools harvest validates"
```

- [ ] **Step 5: Sweep a handful of real `/test/` pages**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
B=https://psychology-tools.com/test
for u in penn-state-worry-questionnaire health-anxiety-inventory hamilton-anxiety-rating-scale major-depression-inventory geriatric-depression-scale liebowitz-social-anxiety-scale; do
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

Expected: most/all harvest `OK` (a page whose derived id collides with an existing one — e.g. an `epds`/`gad7` — will cleanly SKIP via the collision guard; that's acceptable). Final tree validation `OK`. If a page times out transiently, retry it once. Genuine parse refusals: note them, do NOT fabricate. Report how many of the 6 succeeded + their qst_ids + item counts.

- [ ] **Step 6: Commit the sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest psychology-tools.com /test/ questionnaires"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: bump the State count by the number harvested; add a one-line note that a **second source adapter** (`psychology-tools.com`, `/test/` radio-form pages) + **host-based CLI dispatch** now exist; mention `sources/psychology_tools.py` + `dispatch_adapter`. Do **NOT** `git add` it — `/HANDOFF.md` is gitignored. No commit for this step.

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
git merge --no-ff harvester-psytools-0619 -m "merge: harvester — psychology-tools.com source adapter + host dispatch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git push origin master
```

- [ ] **Clean up the feature worktree**

```bash
git worktree remove .claude/worktrees/psytools-adapter
git branch -d harvester-psytools-0619
```

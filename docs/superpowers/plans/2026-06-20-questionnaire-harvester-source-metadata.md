# Source-Metadata Capture (SP1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture psychology-tools source metadata (meta description, keywords, og, Introduction) into a flagged `source_metadata/<id>.json` sidecar outside `output/`, add copyright-safe `x_keywords` + `x_description_source` to the canonical questionnaire, re-harvest the 40 pages, and surface keywords + a capture note in the review export.

**Architecture:** Adapter extraction in `sources/psychology_tools.py` → new `RawQuestionnaire` fields → a new `source_meta.py` writer (sidecar outside `output/`) wired into `cli.py` harvest → `draft.py` emits the `x_*` markers → `review_export.py` renders them. Re-harvest is idempotent. No schema change.

**Tech Stack:** Python 3 (stdlib + BeautifulSoup), pytest. Spec: `docs/superpowers/specs/2026-06-20-questionnaire-harvester-source-metadata-design.md`.

## Global Constraints

- **Copyright containment:** verbatim source prose (meta description + Introduction) lives ONLY in `questionnaire-harvester/source_metadata/<id>.json` (OUTSIDE `output/`, flagged with a `_notice`, never ingested). Canonical metadata gains only factual `x_keywords` + provenance `x_description_source: "site_meta"`.
- **Deterministic + idempotent:** no timestamps in the sidecar; URL→id map preserves `--id` overrides; re-harvest is additive (no item drift).
- **No schema change; no new dependency.** `x_keywords`/`x_description_source` are `^x_` metadata extensions; the sidecar is outside `output/` (not validated). Default `--version v26.0618`.
- **Scope:** psychology-tools.com only. Non-psychology-tools sources leave `keywords=[]`, `source_meta=None` → no sidecar, no `x_*` markers.
- **SP1 does NOT change the canonical `description`** (SP2 authors the replacement). It only flags provenance.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** isolated worktree `.claude/worktrees/harvester-srcmeta`, branch `harvester-source-metadata-0620`. ALL edits under this worktree. Before each commit confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-source-metadata-0620`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Model:** do NOT use the cheapest (haiku) tier. Use sonnet or higher.
- **Run from the worktree root**; `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- `import_review/` tracked; `source_metadata/` tracked staging; `HANDOFF.md` gitignored (edit on disk, never `git add`).

---

### Task 1: RawQuestionnaire fields + adapter extraction

**Files:**
- Modify: `questionnaire-harvester/src/harvester/raw.py`
- Modify: `questionnaire-harvester/src/harvester/sources/psychology_tools.py`
- Test: `questionnaire-harvester/tests/test_psychology_tools.py`

**Interfaces:**
- Produces: `RawQuestionnaire.keywords: list` + `RawQuestionnaire.source_meta: dict | None`; adapter helpers `_keywords(soup)`, `_og(soup)`, `_introduction(soup)`; `parse()` populates `keywords` + `source_meta`.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psychology_tools.py` (reuses `_row`/`OPTS3`; adds a meta-rich page helper):

```python
def _meta_page(rows, *, title="Demo (DEMO)", desc="A demo measure.",
               keywords="DEMO,demo,test", intro_paras=("Introduction The DEMO is a demo.", "Second para.")):
    intro = "".join(f"<p>{p}</p>" for p in intro_paras)
    return (f'<html><head>'
            f'<meta name="description" content="{desc}">'
            f'<meta name="keywords" content="{keywords}">'
            f'<meta property="og:title" content="{title} - Psychology Tools">'
            f'<meta property="og:url" content="https://psychology-tools.com/demo/">'
            f'<meta property="og:type" content="article">'
            f'</head><body><h1>{title}</h1>'
            f'<section class="intro introduction">{intro}</section>'
            f'<form>{rows}</form></body></html>')

def test_keywords_and_source_meta_extracted():
    rq = PsychologyToolsAdapter().parse(_meta_page(_row("q1", "stem", OPTS3)),
                                        "https://psychology-tools.com/test/x")
    assert rq.keywords == ["DEMO", "demo", "test"]
    assert rq.source_meta["meta_description"] == "A demo measure."
    assert rq.source_meta["keywords"] == ["DEMO", "demo", "test"]
    assert rq.source_meta["og"]["title"] == "Demo (DEMO) - Psychology Tools"
    assert rq.source_meta["og"]["type"] == "article"
    # introduction captured; leading 'Introduction' heading word stripped from para 1
    assert rq.source_meta["introduction"][0] == "The DEMO is a demo."
    assert rq.source_meta["introduction"][1] == "Second para."

def test_no_meta_leaves_keywords_empty_and_source_meta_none():
    html = ('<html><body><h1>X (X)</h1><form>' + _row("q1", "stem", OPTS3) + '</form></body></html>')
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert rq.keywords == []
    assert rq.source_meta is None
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psychology_tools.py -k "keywords or source_meta" -v`
Expected: FAIL — `RawQuestionnaire` has no `keywords`/`source_meta` and the adapter doesn't set them.

- [ ] **Step 3: Add the `RawQuestionnaire` fields**

In `questionnaire-harvester/src/harvester/raw.py`, in `RawQuestionnaire`, after the `references: list = field(default_factory=list)` line, add:

```python
    keywords: list = field(default_factory=list)
    source_meta: dict | None = None
```

- [ ] **Step 4: Add adapter helpers**

In `questionnaire-harvester/src/harvester/sources/psychology_tools.py`, add near the other module-level helpers (after `_source_link`):

```python
def _keywords(soup):
    """The <meta name="keywords"> content as a trimmed list (empty if absent)."""
    m = soup.find("meta", attrs={"name": "keywords"})
    if not m or not m.get("content"):
        return []
    return [k.strip() for k in m["content"].split(",") if k.strip()]


def _og(soup):
    """All <meta property="og:..."> tags as {key-without-og-prefix: content}."""
    og = {}
    for m in soup.find_all("meta"):
        p = m.get("property") or ""
        if p.startswith("og:") and m.get("content"):
            og[p[3:]] = m["content"].strip()
    return og


def _introduction(soup):
    """The page's Introduction section paragraphs (verbatim), leading 'Introduction'
    heading word stripped from the first. Empty list if absent."""
    sec = soup.select_one("section.introduction") or soup.select_one("section.intro")
    if not sec:
        return []
    paras = []
    for p in sec.find_all("p"):
        t = re.sub(r"\s+", " ", p.get_text(" ", strip=True)).strip()
        if t:
            paras.append(t)
    if paras:
        paras[0] = re.sub(r"^\s*Introduction\b[:\s]*", "", paras[0]).strip()
    return [p for p in paras if p]
```

- [ ] **Step 5: Populate `keywords` + `source_meta` in `parse()`**

In `parse()`, the `<meta name="description">` is already read into `meta` (the `meta = soup.find("meta", attrs={"name": "description"})` line). Immediately BEFORE the `return RawQuestionnaire(` statement, add:

```python
        keywords = _keywords(soup)
        og = _og(soup)
        introduction = _introduction(soup)
        meta_desc = meta.get("content").strip() if meta and meta.get("content") else ""
        source_meta = None
        if meta_desc or keywords or og or introduction:
            source_meta = {"meta_description": meta_desc, "keywords": keywords,
                           "og": og, "introduction": introduction}
```

Then add the two fields to the `return RawQuestionnaire(...)` call (alongside `references=references`):

```python
            references=references, keywords=keywords, source_meta=source_meta)
```

- [ ] **Step 6: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (new extraction tests + everything else; other adapters/tests unaffected since the new fields default).

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/raw.py questionnaire-harvester/src/harvester/sources/psychology_tools.py questionnaire-harvester/tests/test_psychology_tools.py
git commit -m "feat(harvester): psychology-tools adapter captures keywords + og + introduction (source_meta)"
```

---

### Task 2: Sidecar writer + canonical markers + CLI wiring

**Files:**
- Create: `questionnaire-harvester/src/harvester/source_meta.py`
- Modify: `questionnaire-harvester/src/harvester/draft.py`, `questionnaire-harvester/src/harvester/cli.py`
- Create: `questionnaire-harvester/tests/fixtures/psychology_tools_meta.html`
- Test: `questionnaire-harvester/tests/test_source_meta.py`, `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Consumes: `RawQuestionnaire.source_meta`/`keywords` (Task 1).
- Produces: `write_source_metadata(rq, source_meta_dir) -> Path | None`; canonical `metadata.x_keywords` + `metadata.x_description_source`; CLI `--source-metadata`.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_source_meta.py`:

```python
import json
from pathlib import Path
from types import SimpleNamespace
from harvester.source_meta import write_source_metadata

def _rq(**kw):
    base = dict(qst_id="qst_x", source_url="https://psychology-tools.com/test/x",
                source_meta={"meta_description": "d", "keywords": ["a"], "og": {"title": "T"},
                             "introduction": ["p1", "p2"]})
    base.update(kw)
    return SimpleNamespace(**base)

def test_write_source_metadata_writes_flagged_json(tmp_path):
    p = write_source_metadata(_rq(), tmp_path)
    assert p == tmp_path / "qst_x.json"
    d = json.loads(p.read_text())
    assert "_notice" in d and "NOT for redistribution" in d["_notice"]
    assert d["id"] == "qst_x" and d["source_url"].endswith("/test/x")
    assert d["meta_description"] == "d" and d["keywords"] == ["a"]
    assert d["og"]["title"] == "T" and d["introduction"] == ["p1", "p2"]

def test_write_source_metadata_skips_when_none(tmp_path):
    assert write_source_metadata(_rq(source_meta=None), tmp_path) is None
    assert list(tmp_path.glob("*.json")) == []
```

Create `questionnaire-harvester/tests/fixtures/psychology_tools_meta.html` (SYNTHETIC):

```html
<html><head>
<meta name="description" content="A demo screening measure for testing.">
<meta name="keywords" content="DEMO,demo,screening">
<meta property="og:title" content="Demo Screening (DEMO) - Psychology Tools">
<meta property="og:url" content="https://psychology-tools.com/demo/">
<meta property="og:type" content="article">
</head><body>
<h1>Demo Screening (DEMO)</h1>
<section class="intro introduction">
  <p>Introduction The DEMO is a demonstration screening measure used in tests.</p>
  <p>It has no clinical meaning.</p>
</section>
<form>
  <div class="notable-tr question"><span class="notable-td prompt"><span class="num">1.</span><span>I feel demo.</span></span>
    <span class="notable-td response"><label class="aria-label">No</label><input type="radio" name="q1" value="0"></span>
    <span class="notable-td response"><label class="aria-label">Yes</label><input type="radio" name="q1" value="1"></span></div>
</form>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_psychology_tools_meta_capture_e2e(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psychology_tools_meta.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    sm = tmp_path / "source_metadata"
    rc = cli.main(["harvest", "https://psychology-tools.com/test/demo-screening",
                   "--out", str(out), "--scales-index", str(tmp_path / "missing.json"),
                   "--register", str(tmp_path / "register.md"), "--questions", str(tmp_path / "questions"),
                   "--source-metadata", str(sm),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qid = "qst_demo"
    md = json.loads((out / "questionnaires" / f"{qid}.json").read_text())["metadata"]
    assert md["x_keywords"] == ["DEMO", "demo", "screening"]
    assert md["x_description_source"] == "site_meta"
    sidecar = json.loads((sm / f"{qid}.json").read_text())
    assert sidecar["introduction"][0].startswith("The DEMO is a demonstration")
    assert "NOT for redistribution" in sidecar["_notice"]
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_source_meta.py questionnaire-harvester/tests/test_cli_e2e.py -k "source_meta or meta_capture" -v`
Expected: FAIL — no `source_meta` module; CLI has no `--source-metadata`; no `x_keywords`/`x_description_source`.

- [ ] **Step 3: Create the writer module**

Create `questionnaire-harvester/src/harvester/source_meta.py`:

```python
import json
from pathlib import Path

_NOTICE = ("Verbatim capture from {url}. Copyright of the source site. Internal reference "
           "for authoring original descriptions / an about page — NOT for redistribution.")


def write_source_metadata(rq, source_meta_dir):
    """Write source_metadata/<id>.json from rq.source_meta (verbatim source capture, flagged
    with a copyright _notice). Returns the path, or None when rq has no source_meta."""
    sm = getattr(rq, "source_meta", None)
    if not sm:
        return None
    source_meta_dir = Path(source_meta_dir)
    source_meta_dir.mkdir(parents=True, exist_ok=True)
    doc = {"_notice": _NOTICE.format(url=rq.source_url), "id": rq.qst_id,
           "source_url": rq.source_url, **sm}
    path = source_meta_dir / f"{rq.qst_id}.json"
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    return path
```

- [ ] **Step 4: Emit the canonical markers in `draft.py`**

In `questionnaire-harvester/src/harvester/draft.py`, after the `if rq.references:` block (the `md["x_references"] = rq.references` lines), add:

```python
    if getattr(rq, "keywords", None):
        md["x_keywords"] = rq.keywords
    if getattr(rq, "source_meta", None):
        md["x_description_source"] = "site_meta"
```

- [ ] **Step 5: Wire the CLI**

In `questionnaire-harvester/src/harvester/cli.py`, add the harvest arg (after `h.add_argument("--questions", ...)`):

```python
    h.add_argument("--source-metadata", default="questionnaire-harvester/source_metadata")
```

And after `write_draft(result, Path(a.out))`, add:

```python
    from harvester.source_meta import write_source_metadata
    write_source_metadata(rq, Path(a.source_metadata))
```

- [ ] **Step 6: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS (writer unit tests + the e2e + everything else).

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/source_meta.py questionnaire-harvester/src/harvester/draft.py questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_source_meta.py questionnaire-harvester/tests/fixtures/psychology_tools_meta.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): write flagged source_metadata sidecar + x_keywords/x_description_source"
```

---

### Task 3: Review-export shows keywords + capture note

**Files:**
- Modify: `questionnaire-harvester/src/harvester/review_export.py`
- Test: `questionnaire-harvester/tests/test_review_export.py`

**Interfaces:** Consumes `metadata.x_keywords` + `metadata.x_description_source`.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_review_export.py`:

```python
def test_render_md_shows_keywords_and_capture_note():
    o = _choice("opt_x", "rating", [0, 1], ["No", "Yes"])
    q = _qst("qst_x", [{"option": {"ref": "opt_x@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}])
    q["metadata"]["x_keywords"] = ["alpha", "beta"]
    q["metadata"]["x_description_source"] = "site_meta"
    md = render_questionnaire_md(q, {"options": {"opt_x": o}, "prompts": {"pr_x_1": _pr("pr_x_1", "q1")},
                                     "instructions": {}, "contexts": {}})
    assert "- keywords: alpha · beta" in md
    assert "source_metadata/qst_x.json" in md
    assert "x_description_source: site_meta" in md

def test_render_md_no_keywords_no_note():
    o = _choice("opt_x", "rating", [0, 1], ["No", "Yes"])
    q = _qst("qst_x", [{"option": {"ref": "opt_x@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}])
    md = render_questionnaire_md(q, {"options": {"opt_x": o}, "prompts": {"pr_x_1": _pr("pr_x_1", "q1")},
                                     "instructions": {}, "contexts": {}})
    assert "- keywords:" not in md
    assert "source_metadata/" not in md
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_review_export.py -k "keywords or capture_note" -v`
Expected: FAIL — the render shows neither.

- [ ] **Step 3: Add keywords + note to `render_questionnaire_md`**

In `review_export.py`, in `render_questionnaire_md`, replace the publication/items block:

```python
    pub = md.get("publication")
    if pub:
        out.append(f"- publication: {pub.get('citation', '')} ({pub.get('year', '')})")
    out.append(f"- items: {len(elements)}\n")
```

with:

```python
    pub = md.get("publication")
    if pub:
        out.append(f"- publication: {pub.get('citation', '')} ({pub.get('year', '')})")
    kws = md.get("x_keywords") or []
    if kws:
        out.append(f"- keywords: {' · '.join(kws)}")
    out.append(f"- items: {len(elements)}\n")
    if md.get("x_description_source") == "site_meta":
        out.append(f"> ⚠ The description above is the source site's text "
                   f"(`x_description_source: site_meta`). Verbatim source meta + introduction "
                   f"captured in `source_metadata/{md.get('id')}.json` (flagged).\n")
```

- [ ] **Step 4: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/review_export.py questionnaire-harvester/tests/test_review_export.py
git commit -m "feat(harvester): review export shows keywords + source-capture note"
```

---

### Task 4: Re-harvest the 40 + regenerate + handoff

**Files:** (data) `questionnaire-harvester/output/**`, `questionnaire-harvester/source_metadata/**`, `questionnaire-harvester/import_review/**`, `register.md`; `HANDOFF.md` (untracked).

- [ ] **Step 1: Re-harvest each psychology-tools page (idempotent, with --source-metadata)**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json, glob, subprocess, sys
m = {}
for f in glob.glob("questionnaire-harvester/output/questionnaires/*.json"):
    md = json.load(open(f))["metadata"]
    if md.get("x_source_site") == "psychology-tools.com":
        m[md["x_source_url"]] = md["id"]
print(f"re-harvesting {len(m)} psychology-tools pages")
ok = skip = 0
for url, qid in sorted(m.items(), key=lambda kv: kv[1]):
    r = subprocess.run([sys.executable, "-m", "harvester.cli", "harvest", url,
                        "--id", qid, "--version", "v26.0618"], capture_output=True, text=True)
    line = (r.stdout + r.stderr).strip().splitlines()[-1] if (r.stdout + r.stderr).strip() else ""
    if r.returncode == 0 and line.startswith("harvested"):
        ok += 1
    else:
        skip += 1; print("SKIP/FAIL", qid, "::", line)
print(f"ok={ok} skip={skip}")
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: `ok=40 skip=0`; tree `OK`. Retry once on a transient timeout. Report any SKIP/FAIL (do not fabricate).

- [ ] **Step 2: Verify capture landed**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
import json, glob
sidecars = len(glob.glob("questionnaire-harvester/source_metadata/*.json"))
kw = src = withintro = 0
for f in glob.glob("questionnaire-harvester/output/questionnaires/*.json"):
    md = json.load(open(f))["metadata"]
    if md.get("x_source_site") != "psychology-tools.com": continue
    if md.get("x_keywords"): kw += 1
    if md.get("x_description_source") == "site_meta": src += 1
for f in glob.glob("questionnaire-harvester/source_metadata/*.json"):
    if json.load(open(f)).get("introduction"): withintro += 1
print(f"sidecars={sidecars} | psych-tools with x_keywords={kw} x_description_source={src} | sidecars-with-introduction={withintro}")
# no copyrighted prose leaked into output/: no questionnaire metadata carries 'introduction' or 'meta_description'
leak = [f for f in glob.glob("questionnaire-harvester/output/questionnaires/*.json")
        if any(k in json.load(open(f))["metadata"] for k in ("introduction", "meta_description"))]
print("output/ prose leak:", leak or "none")
PY
echo "source_metadata under output/? (should be empty):" && ls questionnaire-harvester/output/source_metadata 2>/dev/null || echo "(correctly NOT under output/)"
```

Expected: `sidecars=40`, `x_description_source=40`, `x_keywords` ~ (pages with keywords), `sidecars-with-introduction` > 0, `output/ prose leak: none`, and source_metadata is NOT under output/. Report the numbers.

- [ ] **Step 3: Regenerate the review docs**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli review-export 2>&1 | tail -1
# spot-check qst_assq shows keywords + capture note; its sidecar has the Introduction
python - <<'PY'
import json, pathlib
t = pathlib.Path("questionnaire-harvester/import_review/qst_assq.md").read_text()
print("assq review keywords+note:", "- keywords:" in t and "source_metadata/qst_assq.json" in t)
sc = json.loads(pathlib.Path("questionnaire-harvester/source_metadata/qst_assq.json").read_text())
print("assq sidecar intro paras:", len(sc.get("introduction", [])))
PY
```

Expected: `wrote 158 review doc(s) + README`; assq review shows keywords+note `True`; assq sidecar has intro paragraphs. Report results.

- [ ] **Step 4: Commit the data + regenerated docs**

```bash
git add -A questionnaire-harvester/output questionnaire-harvester/source_metadata questionnaire-harvester/import_review questionnaire-harvester/register.md questionnaire-harvester/questions
git commit -m "data(harvester): capture psychology-tools source_metadata + x_keywords; regenerate review"
```

- [ ] **Step 5: Update the HANDOFF (untracked — on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note the new `source_metadata/<id>.json` sidecars (flagged verbatim capture of meta description + keywords + og + Introduction, OUTSIDE output/, copyright-quarantined), the canonical `x_keywords` + `x_description_source: site_meta` flag, the `--source-metadata` CLI arg, and that SP2 (authored descriptions) is the next step. Do NOT `git add` it.

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
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/harvester-srcmeta
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester source-metadata branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/harvester-srcmeta
git branch -D harvester-source-metadata-0620
```

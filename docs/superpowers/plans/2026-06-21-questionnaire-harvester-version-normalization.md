# Version Normalization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-stamp every harvested questionnaire to one release (`v26.0618`) so `output/` becomes ingestable (all `@version` refs resolve under a single `library ingest --release`).

**Architecture:** A new `versions.py` (`normalize_versions(out_dir, release)`) + a `normalize-versions` CLI subcommand; recursively rewrites questionnaire `@version` ref suffixes + sets `metadata.version`, writing via the canonical `write_entity`. Entities stay versionless. Then run it over `output/` and verify 0 unresolved refs.

**Tech Stack:** Python 3 (stdlib `json`/`re` + `library...writer.write_entity`), pytest. Spec: `docs/superpowers/specs/2026-06-21-questionnaire-harvester-version-normalization-design.md`.

## Global Constraints

- **Content-preserving:** only the version tag changes (questionnaire `metadata.version` + `@vYY.MMDD` ref suffixes). Idempotent. No content/schema change. Entities (options/prompts/…) untouched (versionless by design).
- **Serialization fidelity:** rewrite via `write_entity(out_dir, "questionnaire", q)` (`json.dumps(..., indent=2, ensure_ascii=False, sort_keys=True)`, no trailing newline) → only version/ref lines diff.
- **Target release `v26.0618`.** This makes `output/` ingest-ready only; it does NOT ingest/publish.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** isolated worktree `.claude/worktrees/harvester-normver`, branch `harvester-normalize-versions-0621`. ALL edits under this worktree. Before each commit confirm `git rev-parse --abbrev-ref HEAD` prints `harvester-normalize-versions-0621`; never `git checkout`/`switch`/`reset`/`rebase` or `cd` elsewhere. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Model:** do NOT use the cheapest (haiku) tier. Use sonnet or higher.
- **Run from the worktree root**; `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.

---

### Task 1: `versions.py` + `normalize-versions` CLI

**Files:**
- Create: `questionnaire-harvester/src/harvester/versions.py`
- Modify: `questionnaire-harvester/src/harvester/cli.py`
- Test: `questionnaire-harvester/tests/test_versions.py`, `questionnaire-harvester/tests/test_cli_e2e.py`

**Interfaces:**
- Produces: `normalize_versions(out_dir, release) -> list[str]`; `normalize-versions` subcommand.

- [ ] **Step 1: Write the failing tests**

Create `questionnaire-harvester/tests/test_versions.py`:

```python
import json
from library.importers.survey_db.writer import write_entity
from harvester.versions import normalize_versions


def _q(qid, ver):
    return {"@context": "x",
            "metadata": {"id": qid, "title": "T", "short_title": "T",
                         "x_source_url": "http://example.org/x@notaref", "version": ver},
            "pages": [{"id": "page_main", "elements": [
                {"option": {"ref": f"opt_{qid}_1@{ver}"},
                 "question": {"prompt": {"ref": f"pr_{qid}_1@{ver}"},
                              "instruction": {"ref": f"ins_{qid}@{ver}"}}}]}]}

def test_normalize_restamps_version_and_refs(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a", "v26.0617"))
    changed = normalize_versions(out, "v26.0618")
    assert changed == ["qst_a"]
    q = json.loads((out / "questionnaires" / "qst_a.json").read_text())
    assert q["metadata"]["version"] == "v26.0618"
    el = q["pages"][0]["elements"][0]
    assert el["option"]["ref"] == "opt_qst_a_1@v26.0618"
    assert el["question"]["prompt"]["ref"] == "pr_qst_a_1@v26.0618"
    assert el["question"]["instruction"]["ref"] == "ins_qst_a@v26.0618"
    # a string with a stray '@' but no version suffix is untouched
    assert q["metadata"]["x_source_url"] == "http://example.org/x@notaref"

def test_normalize_idempotent(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_b", "v26.0618"))
    before = (out / "questionnaires" / "qst_b.json").read_text()
    assert normalize_versions(out, "v26.0618") == []
    assert (out / "questionnaires" / "qst_b.json").read_text() == before
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_normalize_versions_cli(tmp_path):
    from library.importers.survey_db.writer import write_entity
    out = tmp_path / "output"
    write_entity(out, "questionnaire", {"@context": "x",
        "metadata": {"id": "qst_z", "title": "T", "short_title": "T", "version": "v26.0617"},
        "pages": [{"id": "page_main", "elements": [
            {"option": {"ref": "opt_z_1@v26.0617"},
             "question": {"prompt": {"ref": "pr_z_1@v26.0617"}}}]}]})
    rc = cli.main(["normalize-versions", "--out", str(out), "--release", "v26.0618"])
    assert rc == 0
    md = json.loads((out / "questionnaires" / "qst_z.json").read_text())["metadata"]
    assert md["version"] == "v26.0618"
```

- [ ] **Step 2: Run to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_versions.py questionnaire-harvester/tests/test_cli_e2e.py -k "normalize" -v`
Expected: FAIL — no `versions` module; `normalize-versions` subcommand unknown.

- [ ] **Step 3: Create `versions.py`**

Create `questionnaire-harvester/src/harvester/versions.py`:

```python
import json
import re
from pathlib import Path

from library.importers.survey_db.writer import write_entity

_REF_SUFFIX = re.compile(r"@v\d{2}\.\d{4}$")


def _restamp_refs(obj, release):
    """Recursively rewrite any string ending in a @vYY.MMDD ref suffix to @<release>."""
    if isinstance(obj, dict):
        return {k: _restamp_refs(v, release) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_restamp_refs(v, release) for v in obj]
    if isinstance(obj, str) and _REF_SUFFIX.search(obj):
        return _REF_SUFFIX.sub("@" + release, obj)
    return obj


def normalize_versions(out_dir, release):
    """Re-stamp every questionnaire's metadata.version + all @version ref suffixes to
    `release` (entities are versionless and untouched). Idempotent — only rewrites files
    that change. Returns the ids changed."""
    qdir = Path(out_dir) / "questionnaires"
    changed = []
    for f in sorted(qdir.glob("*.json")):
        q = json.loads(f.read_text())
        new = _restamp_refs(q, release)
        new.setdefault("metadata", {})["version"] = release
        if new != q:
            write_entity(out_dir, "questionnaire", new)
            changed.append(new["metadata"]["id"])
    return changed
```

- [ ] **Step 4: Add the `normalize-versions` subcommand**

In `questionnaire-harvester/src/harvester/cli.py`, register a subparser alongside the others (after the `check-short-titles` `cst = sub.add_parser(...)` block, before `a = ap.parse_args(argv)`):

```python
    nv = sub.add_parser("normalize-versions")
    nv.add_argument("--out", default="questionnaire-harvester/output")
    nv.add_argument("--release", default="v26.0618")
```

Add the dispatch branch (before the `if a.cmd != "harvest": return 2` guard):

```python
    if a.cmd == "normalize-versions":
        from harvester.versions import normalize_versions
        ids = normalize_versions(Path(a.out), a.release)
        print(f"normalized {len(ids)} questionnaire(s)")
        return 0
```

- [ ] **Step 5: Run the tests + full suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/versions.py questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/test_versions.py questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "feat(harvester): normalize-versions command (re-stamp questionnaires to one release)"
```

---

### Task 2: Normalize the corpus + verify ingest-readiness

**Files:** (data) `questionnaire-harvester/output/questionnaires/**`; `HANDOFF.md` (untracked).

- [ ] **Step 1: Pre-check (confirm the split + unresolved refs exist)**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
from pathlib import Path
from library.loader import load_tree
from library.refs import extract_refs
arts = load_tree(Path("questionnaire-harvester/output"), release="v26.0618")
present = {(a.id, a.version) for a in arts}
unresolved = sum(1 for a in arts for r in extract_refs(a.data)
                 if (r.to_id, r.to_version) not in present)
from collections import Counter
print("versions:", dict(Counter(a.version for a in arts)), "| unresolved refs:", unresolved)
PY
```
Expected (before): two versions present, thousands of unresolved refs.

- [ ] **Step 2: Normalize the real corpus**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m harvester.cli normalize-versions --release v26.0618 2>&1 | tail -1
```
Expected: `normalized 106 questionnaire(s)` (the v26.0617 ones; the 52 already-v26.0618 are unchanged).

- [ ] **Step 3: Verify ingest-readiness (0 unresolved) + tree validates**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python - <<'PY'
from pathlib import Path
from library.loader import load_tree
from library.refs import extract_refs
from collections import Counter
arts = load_tree(Path("questionnaire-harvester/output"), release="v26.0618")
present = {(a.id, a.version) for a in arts}
unresolved = [f"{a.id}->{r.to_id}@{r.to_version}" for a in arts for r in extract_refs(a.data)
              if (r.to_id, r.to_version) not in present]
print("versions:", dict(Counter(a.version for a in arts)))
print("unresolved refs:", len(unresolved), unresolved[:5])
import json, glob
qv=Counter(json.load(open(f))["metadata"]["version"] for f in glob.glob("questionnaire-harvester/output/questionnaires/*.json"))
print("questionnaire metadata.version:", dict(qv))
PY
python -c "from pathlib import Path; from harvester.validate import validate_tree; print('tree:', validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```
Expected: `unresolved refs: 0`; all questionnaire `metadata.version == v26.0618`; tree `OK`. (Note: `load_tree` shows the versionless entities at the release `v26.0618`, which is exactly how `ingest --release v26.0618` will store them — so 0 unresolved means ingest's ref check would pass.) Report the numbers.

- [ ] **Step 4: Commit the re-stamped corpus**

```bash
git add questionnaire-harvester/output/questionnaires
git commit -m "data(harvester): normalize all questionnaire versions to v26.0618 (ingest-ready)"
```

- [ ] **Step 5: Update the HANDOFF (untracked — on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: note the `normalize-versions` command + that all 158 questionnaires are now at `v26.0618` and `output/` is **ingest-ready** (0 unresolved refs under `ingest --release v26.0618`); publishing still gated on review + licensing; ingest also requires adding `output/` to the seed flow (it currently ingests only the survey_db `/tmp/content`). Do NOT `git add` it.

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
cd /home/pedro/Repos/Cursor/questionnaire_apps/.claude/worktrees/harvester-normver
git fetch origin -q
git diff --name-only "$(git merge-base origin/master HEAD)" HEAD | grep -E '^(editor/|scripts/)' || echo "(disjoint from editor work — safe)"
git merge --no-ff origin/master -m "merge: bring master into harvester version-normalization branch"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q
git merge-base --is-ancestor origin/master HEAD && git push origin HEAD:master
```

- [ ] **Clean up the feature worktree**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git worktree remove --force .claude/worktrees/harvester-normver
git branch -D harvester-normalize-versions-0621
```

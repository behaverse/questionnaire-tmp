# Schema Validator (tools/) — Handoff

**Path:** `tools/` · **Stack:** Python 3.12 (jsonschema + referencing) · **Status:** ✅ built (validator green; one stale test) · **Suggested branch:** `work/tools`

> The schema validation tooling for the monorepo. A single registry resolves every archived + live
> schema `$id`/`$ref` URL **locally** (whether or not the schemas are publicly hosted at behaverse.org),
> then validates every `schemas/*/examples/*.json` against its schema and runs cross-schema consistency
> checks. This is the gate that keeps the canonical schemas + their examples internally consistent.
> For deep detail see [README.md](README.md); there is no FOLLOWUPS.md for this component.

## What it is
- **`validate_schemas.py`** — discovers examples under `schemas/<name>/examples/` (and the two-level
  `schemas/recordings/<source>/examples/`), builds a `referencing.Registry` mapping each schema's `$id`
  (live + archived `versions/<ver>/schema.json`) to its local file, and validates each example with
  `Draft202012Validator`. Exit 0 = all pass, 1 = any failure.
- **Cross-schema consistency checks** beyond plain JSON-Schema validation: pinned-scorer consistency
  (Questionnaire `scores[]` → `library_examples/scorers/`), scorer-output validation against Session
  examples, and runtime-example provenance completeness. See `validate_schemas.py:188` onward.
- **`tools/tests/`** — pytest suite (one file per schema family: instrument, questionnaire, runtime,
  response, session, events, viewer_conformance, keyboard/mouse recordings) plus `test_validator.py`
  for the registry/discovery machinery. Fixtures are built inline + from the canonical examples.
- Fits the system as the CI/local gate for the `schemas/` source of truth; shares canonical-hash and
  versioning concerns with the runtime-denormaliser and the schemas docs.

## Run & test
```bash
source .venv/bin/activate            # repo-root venv (pip install -r tools/requirements.txt if fresh)
pytest tools/tests/ -q               # currently 308 pass, 1 fail (stale CalVer assert — see below)
python tools/validate_schemas.py 2>&1 | tail -3   # → "All 47 example(s) passed." + 1 SKIP line
```
The validator prints one PASS/FAIL/SKIP line per example/check; the SKIP is the scorer-conformance stub.

## What's left to do

### Now
- **Fix the stale schema-id test.** `test_questionnaire_schema.py:47` asserts the `$id` ends with
  `/questionnaire/v26.0609/schema.json`, but the live schema is now **`v26.0618`** — this is the sole
  failing test. Update the assert (and prefer asserting "ends with `/schema.json`" or reading the
  expected version from the file, so it stops breaking on every CalVer bump). `tools/tests/test_questionnaire_schema.py:47`

### Next
- **Wire up the scorer-conformance SKIP.** `schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json`
  is a SKIP stub (6 conformance checks "runner not yet implemented"). Hook it to the real scorer/conformance
  runner (see `questionnaire-scorer/`, OD-16 SP1) when that path is ready. `validate_schemas.py:606`
- **Keep the `$id` URL registry in sync on every CalVer bump.** When any schema bumps its `$id`, ensure
  the old version is archived under `schemas/<name>/versions/<ver>/schema.json` so pinned `$ref`s still
  resolve — the registry auto-loads those (`build_registry`, `validate_schemas.py:60`). New schema
  families need a matching `tools/tests/test_<family>_schema.py`.

### Deferred / blocked
- **Public schema hosting.** `$id`s are `https://behaverse.org/schemas/...` but resolution is local-only;
  hosting is deferred (owner). No action here until that flips — the registry is the workaround.

> Note: the seed open-item about `schemas/runtime/examples/` being un-regenerated with ~14 dangling
> refs is **stale** — those 3 runtime examples (`minimal`/`phq9`/`kitchensink`) now exist and pass
> validation + provenance checks. Nothing to do there.

## Conventions & gotchas
- **CalVer everywhere** (`vYY.MMDD`); SemVer level → a `severity` tag. Tests that hard-code a version
  string rot on every bump — see the Now item; prefer version-agnostic assertions.
- Archived schema versions live at `schemas/<name>/versions/<ver>/schema.json` and MUST stay loadable
  so pinned cross-schema `$ref`s resolve; don't delete them.
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing — the **harvester agent shares this checkout** and pushes master.
- Run from repo root with the repo-root `.venv` active; `REPO_ROOT` is derived from the script path.

## References
- [README.md](README.md) — usage + layout
- [`../schemas/`](../schemas/) — the source of truth being validated; [VERSIONING.md](../schemas/VERSIONING.md), [HANDOFF.md](../schemas/HANDOFF.md)
- `questionnaire-runtime-denormaliser/` — shares canonical-hash + runtime-example generation
- `questionnaire-scorer/` — the scorer/conformance runner the SKIP stub waits on (OD-16)
- Root [HANDOFF.md](../HANDOFF.md) — system-wide context

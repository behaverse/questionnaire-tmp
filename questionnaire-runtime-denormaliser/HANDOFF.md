# Runtime Denormaliser — Handoff

**Path:** `questionnaire-runtime-denormaliser/` · **Stack:** pure Python (I/O-free library) · **Status:** ✅ built + merged (57 tests) · **Suggested branch:** `work/denormaliser`

> Pure library (per **OD-18**) that projects a **Schema 2 Questionnaire** into a **Schema 3 Runtime** ready for a viewer: refs inlined, content trimmed to one locale, viewer features reconciled against the Schema 7 manifest, scorer impls pinned, scoring optionally stripped, provenance attached. Consumed by the **Viewer Service** (session-mint) and conceptually by the **Editor** preview (which ports the logic to TS). It is a *faithful projection* — it keeps Schema 2 vocabulary; the Web Viewer does the final option-merge.
> For deep detail see [README.md](README.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md).

## What it is
- **Public API** (`src/denormaliser/__init__.py`): `denormalise(...)`, `RuntimePolicy`, `PreflightError`, `Problem`, `canonical_hash`.
- **`denormalise(questionnaire, locale, runtime_policy, viewer_manifest, resolve_entity, generated_at, schemas_dir=None)`** runs the pipeline: resolve refs → locale-trim → reconcile manifest → pin scorer impls → strip scoring (per policy) → attach provenance. Module-per-stage under `src/denormaliser/` (`resolve.py`, `locale.py`, `manifest.py`, `scorers.py`, `scoring.py`, `provenance.py`).
- **I/O-free by design**: entity resolution is an injected callable `resolve_entity(ref) -> entity body | None`. No DB, no network, no filesystem (except optional schema validation when `schemas_dir` is passed).
- **`canonical_hash`** is shared verbatim with the Viewer Service so its 5-tuple runtime cache keys match what the denormaliser produced — do not fork or rename it without updating VS in lockstep.
- **Preflight contract**: invalid questionnaire × viewer × policy combos raise `PreflightError` carrying every collected `Problem` (unresolved ref, missing locale, no scorer-impl intersection, unsupported widget, unsupported logic action). Callers map this to 422 (see VS).

## Run & test
Pure Python; no Docker, no services needed.
```bash
source ../.venv/bin/activate
cd questionnaire-runtime-denormaliser
pip install -e .[dev]
pytest -q          # 57 tests
```
(From the monorepo root, `pytest questionnaire-runtime-denormaliser/ -q` also works.)

## What's left to do
This component is **essentially complete and merged** — the items below are small/optional follow-ons, not gaps in the shipped behaviour. All are from [FOLLOWUPS.md](FOLLOWUPS.md).

**Next (small, opt-in)**
- **Regenerate `schemas/runtime/examples/` from real output.** The canonical Schema 2 examples (`minimal`/`phq9`/`kitchensink`) reference ~14 reusable entities absent from `schemas/questionnaire/examples/library_examples/` (e.g. `pr_feel_good`, `pr_phq9_2..9`, kitchensink's `pr_essay`/`pr_mood`/`pr_name`/`pr_topics`/`pr_year_born`). They pass `tools/tests` because JSON Schema checks ref *format*, not resolvability. **Author the missing entities first, then run the denormaliser to regenerate the runtime examples.** Shared follow-up with `tools/` + `schemas/`. (FOLLOWUPS item 1)
- **Expand the internal strict runtime schema** (`src/denormaliser/strict_runtime_schema.json`). Currently a light tightening (requires top-level `locale`; scores require `impl`). Could validate the faithful-projection option/item shapes fully once the Web Viewer pins that contract. (FOLLOWUPS item 3)

**Deferred / blocked**
- **Cycle detection in ref resolution.** v1 assumes an acyclic entity graph (guaranteed by hard-pinning, OD-06); a malformed cyclic input would recurse to Python's limit. Add a visited-set guard *only if untrusted inputs become possible*. (FOLLOWUPS item 2)
- **Behavioural-channel reconciliation.** Vacuous for questionnaire input (Schema 2 declares no channels). 🔒 Revisit when cognitive-task inputs (which may declare channels) arrive. (FOLLOWUPS item 4)

## Conventions & gotchas
- **Faithful projection, not a merge.** Output keeps Schema 2 vocabulary; the Web Viewer performs the option-merge. Don't "helpfully" pre-merge options here.
- **`canonical_hash` is a shared contract** with the Viewer Service. Any change to its input normalisation invalidates VS cache keys — change both together or not at all.
- **Run this suite separately** from `library/` and `viewer-service/` pytest sessions (those need Docker/Postgres; this one must not).
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing — the harvester agent shares this checkout and pushes master.

## References
- [README.md](README.md) · [FOLLOWUPS.md](FOLLOWUPS.md)
- Design: OD-18 (Schema 3 runtime; server-side denormaliser) and Schema 7 Viewer Conformance Manifest — see `../design/` and root [HANDOFF.md](../HANDOFF.md) for system-wide context.
- Consumers: `../viewer-service/` (session-mint, runtime cache) and `../editor/` (preview, TS port of this logic).

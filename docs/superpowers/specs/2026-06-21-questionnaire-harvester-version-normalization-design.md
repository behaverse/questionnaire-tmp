# Harvester: version normalization (ingest-readiness)

**Date:** 2026-06-21
**Status:** approved (brainstorming)
**Scope:** make `questionnaire-harvester/output/` ingestable by re-stamping every harvested questionnaire to one consistent release version, so all `@version` refs resolve under a single `library ingest --release`. A `normalize-versions` CLI command + run it over `output/` to `v26.0618`. Does NOT ingest (publishing still waits on the review + licensing gates).

## Problem

The harvested corpus spans two harvest dates with different `--version`: **106 questionnaires pinned `v26.0617`, 52 pinned `v26.0618`** (each questionnaire's element refs `@version` match its own version). The reusable entities (options/prompts/instructions/contexts) carry **no `version` field** — at ingest they all take the single `--release`. So no single `ingest --release` resolves both halves: a dry run of the Library's own `load_tree` + ref check reports **5,544 unresolved refs**. The fix is to normalize every questionnaire (and its ref suffixes) to one release.

## Decision (owner-approved)

- **Target release `v26.0618`** (the latest; already on 52/158; matches the schema `$id`). The 106 `v26.0617` questionnaires are re-stamped to it.
- Only **questionnaires** are touched (they hold `metadata.version` + the `@version` ref pins). Entities stay versionless (they take the release at ingest) — unchanged.
- **Idempotent + content-preserving:** only the version tag changes; re-running is a no-op; serialization preserved via `write_entity`.
- This is a maintenance/data-readiness step, not ingest.

## Design

New `versions.py`:
- `normalize_versions(out_dir, release) -> list[str]` — for each `output/questionnaires/*.json`: recursively rewrite any string value matching a ref suffix `@v\d{2}\.\d{4}$` to `@<release>`, and set `metadata.version = release`. If the result differs from the on-disk JSON, rewrite via `write_entity(out_dir, "questionnaire", q)` and record the id. Returns the ids changed.
  - A "ref" is detected purely by the trailing `@vYY.MMDD` (entity refs are the only such strings; `x_source_url` etc. don't end that way), so the rewrite is location-agnostic (covers option/prompt/instruction/context refs wherever they appear).
- `cli.py`: `normalize-versions` subcommand (`--out` default `questionnaire-harvester/output`, `--release` default `v26.0618`) → prints `normalized N questionnaire(s)`.

No schema change; no new dependency (stdlib `json`/`re` + `write_entity`). Entities, descriptions, short_titles, source_metadata untouched.

## Testing (TDD)

- `normalize_versions`:
  - a tmp tree with a questionnaire at `v26.0617` whose element refs are `@v26.0617` → after `normalize_versions(out, "v26.0618")`: `metadata.version == "v26.0618"` and every element ref ends `@v26.0618`; id is in the returned list.
  - an already-`v26.0618` questionnaire (all refs `@v26.0618`) → not in the returned list and its file is **byte-identical** (idempotent).
  - a string that merely contains an `@` but no version suffix (e.g. an `x_source_url`) is left unchanged.
- CLI: `normalize-versions --out <tmp> --release v26.0618` patches + reports a count.
- **Resolution check (integration):** after normalizing the real `output/`, the Library's `load_tree(out, release="v26.0618")` + `extract_refs` check reports **0 unresolved refs** and a single version `v26.0618` across all artifacts.
- Existing harvester suite stays green.

## Rollout

`normalize-versions --release v26.0618` over `output/` → confirm 0 unresolved refs (dry check) + tree validates at v26.0618 → commit the re-stamped questionnaires. `output/` is now ingest-ready; ingest/publish remains gated on review + licensing.

## Risks

- **Multi-agent git hazard** — isolated worktree `.claude/worktrees/harvester-normver`, branch `harvester-normalize-versions-0621`; commit on HEAD only; ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; HANDOFF on disk only. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Serialization fidelity** — `write_entity` (`sort_keys=True, indent=2`, no trailing newline) so only `version` + ref-suffix lines diff.
- **Faithfulness** — version is a release tag; no content changes. The re-stamp does not imply review/publication.
- **Scope** — entities deliberately untouched (versionless by design); only questionnaire version + ref pins normalized.

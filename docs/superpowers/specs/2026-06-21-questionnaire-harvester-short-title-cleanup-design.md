# Harvester: short_title cleanup

**Date:** 2026-06-21
**Status:** approved (brainstorming)
**Scope:** fix the ~25 junk `short_title`s (descriptive parenthetical fragments like "for adolescents", "revised version", "Short Form", "16-item version", version/citation cruft like "CIA 3.0"/"Rotter, 1966", or whole-name strings) so each questionnaire's `short_title` is a clean acronym (or clean short name). A curated override store + apply/durability/guard (mirrors the SP2 descriptions mechanism) + an improved adapter derivation so future harvests stop producing junk.

## Problem

`short_title` is currently derived as the FIRST parenthetical of the title (`re.search(r"\(([^)]+)\)", title)`), which is often a descriptive qualifier, not the acronym — e.g. "Hare Psychopathy Checklist (Original) (PCL-22)" → "Original" instead of "PCL-22"; "(short version, OCI-R)" → "short version, OCI-R"; titles with no parenthetical keep the whole name. SP2's authored descriptions + the review docs surface `short_title` as the acronym, so junk values are visible. Survey: **25 junk** of 158 (the other 133 are clean acronyms, incl. legitimately stylized ones like BITe / Grit-S / LiES / NODS-CLiP that must NOT be "fixed").

## Decisions (owner-approved)

- **Curated override store** `questionnaire-harvester/short_titles.json` (`{id: "ACRONYM"}`), durable across re-harvest. Values starting with `"TODO"` are placeholders, **skipped** by load/apply (the 6 no-standard-acronym cases are left as TODOs for the owner to fill).
- **Improve the adapter derivation** (both adapters) via a shared `derive_short_title(title)` so future harvests prefer a clean acronym token; existing 133 clean short_titles are NOT re-derived (no re-harvest, no churn).
- 19 confident acronyms applied now; 6 `TODO` placeholders (owner fills): `qst_adolescents`, `qst_ard`, `qst_burnout`, `qst_quotient`, `qst_rotter`, `qst_trust`.
- Out of scope: cleaning the `title` field (separate pass); any schema change; re-harvesting existing data.

## A. Override mechanism (`short_titles.py`)

- `load_short_titles(path) -> {id: short_title}` — reads the JSON map; **drops** entries whose value starts with `"TODO"` (case-insensitive) or is blank.
- `apply_short_title(rq, store_path) -> bool` — if an override exists for `rq.qst_id`, set `rq.short_title` and return True (harvest-path durability; `rq.short_title` already exists, no new field).
- `apply_short_titles_to_output(out_dir, store_path) -> list[str]` — bulk in-place patch: for each `output/questionnaires/*.json` whose id has a (non-TODO) override, set `metadata.short_title` and rewrite via `write_entity(out_dir, "questionnaire", q)` (identical serialization → minimal diff). Returns ids patched.
- `check_short_titles(out_dir) -> list[dict]` — flags canonical `short_title`s that look like junk: contains a comma; a version token (`\d\.\d` or a bare 4-digit year); the words `version`/`form`/`original`; starts with `for `/`the ` (case-insensitive) or a lowercase letter. Returns `[{id, short_title}]` for flagged ids (surfaces what still needs an override).
- CLIs (`cli.py`): harvest gains `--short-titles` (default `questionnaire-harvester/short_titles.json`) and calls `apply_short_title(rq, ...)` after the `--id` override / before draft; new subcommands `apply-short-titles` (bulk) + `check-short-titles` (returns non-zero when any flagged).

## B. Adapter derivation (`naming.py`, shared)

`derive_short_title(title) -> str`:
1. Acronym in a parenthetical (right-most first — the real short form usually trails): a token with ≥2 uppercase letters, length 2–14, no spaces → return it. ("(Original) (PCL-22)" → PCL-22; "(CIA 3.0)" → CIA; "(short version, OCI-R)" → OCI-R; "(Grit-S)" → Grit-S; "(AQ)" → AQ).
2. Else an acronym-style token elsewhere in the title (same test, but skip Titlecase words via `not tok.istitle()` so "Well-Being" isn't picked): e.g. "The WHO-5 Well-Being Index" → WHO-5.
3. Else the title minus a trailing descriptive parenthetical: "Aggressive behavior scale (for adolescents)" → "Aggressive behavior scale".
4. Else the title.

Both adapters replace `short_m = re.search(...); short_title = short_m.group(1) if short_m else title` with `short_title = derive_short_title(title)`. (Verified this keeps existing clean cases correct: PHQ-9→PHQ-9, GAD-7→GAD-7, AQ→AQ.) The harvest-path override (A) still wins over derivation when a curated value exists.

## C. The JSON content

`short_titles.json` — 19 confident + 6 TODO:
```jsonc
{
  "qst_arc": "SQ", "qst_cc": "ZKPQ-50-CC", "qst_cia": "CIA", "qst_ehi": "EHI",
  "qst_gas": "GAS", "qst_gp": "GPS", "qst_gsqs": "GSQS", "qst_happiness": "CHS",
  "qst_intelligence": "EI", "qst_lsas": "LSAS", "qst_npi16": "NPI-16", "qst_ohq": "OHQ",
  "qst_pts": "PTS", "qst_sbs": "SBS", "qst_scsr": "SCS-R", "qst_sf": "LAS-SF",
  "qst_shortversionocir": "OCI-R", "qst_tsis": "TSIS", "qst_who5": "WHO-5",
  "qst_adolescents": "TODO: ABS? (Aggressive Behavior Scale)",
  "qst_ard": "TODO: Dominance Scale (no standard acronym)",
  "qst_burnout": "TODO: Teacher Burnout (no standard acronym)",
  "qst_quotient": "TODO: AQ-10?",
  "qst_rotter": "TODO: Rotter I-E?",
  "qst_trust": "TODO: Trust Scale (no standard acronym)"
}
```

## D. Rollout

`apply-short-titles` (patches the 19) → regenerate review docs (`review-export`; they show `- short_title:`) → `check-short-titles` (reports the 6 remaining TODO junk values) → tree validates at v26.0618 → HANDOFF. Owner later fills the 6 TODOs and re-runs `apply-short-titles` + `review-export`.

## Components & boundaries

| Unit | Responsibility |
|---|---|
| `short_titles.py` (`load_short_titles`, `apply_short_title`, `apply_short_titles_to_output`, `check_short_titles`) | override store IO + apply + bulk patch + junk guard (reuses `write_entity`) |
| `naming.py` (`derive_short_title`) | shared clean-acronym derivation from a title |
| `sources/psytoolkit.py`, `sources/psychology_tools.py` | use `derive_short_title(title)` |
| `cli.py` | harvest `--short-titles` + `apply-short-titles` + `check-short-titles` |
| `short_titles.json` (data) | the curated overrides (19 + 6 TODO) |

No schema change (`short_title` is a core field; values only corrected). `descriptions`/`source_metadata` untouched.

## Testing (TDD)

- **`naming.derive_short_title`:** "(Original) (PCL-22)"→PCL-22; "(CIA 3.0)"→CIA; "(short version, OCI-R)"→OCI-R; "(Grit-S)"→Grit-S; "(AQ)"→AQ; "The WHO-5 Well-Being Index"→WHO-5; "Aggressive behavior scale (for adolescents)"→"Aggressive behavior scale"; "Patient Health Questionnaire-9 (PHQ-9)"→PHQ-9 (no regression).
- **`load_short_titles`:** drops `TODO`/blank values, keeps real ones.
- **`apply_short_title`:** sets `rq.short_title` when override present (non-TODO), returns True; no override → False, unchanged.
- **`apply_short_titles_to_output`:** patches only overridden ids (metadata.short_title), TODO ids untouched, non-overridden questionnaire byte-identical.
- **`check_short_titles`:** flags "for adolescents"/"revised version"/"Short Form"/"16-item version"/"CIA 3.0"/"Rotter, 1966"; does NOT flag clean acronyms (PHQ-9, BITe, Grit-S, WHO-5) or a clean short name ("Teacher Burnout").
- **CLI:** `apply-short-titles --out <tmp>` patches + reports; `check-short-titles` returns non-zero on a planted junk value.
- **harvest durability (integration):** with a `short_titles.json` override for an id, harvesting it yields canonical `metadata.short_title` == the override (not the derived value).
- **adapter integration:** both adapters now produce `derive_short_title(title)` for a synthetic page.
- **rollout:** after `apply-short-titles`, the 19 target ids have their corrected acronym; `check-short-titles` flags exactly the 6 TODO ids; tree validates; review docs show the corrected short_titles.
- Existing harvester suite stays green.

## Risks

- **Multi-agent shared checkout** — isolated worktree `.claude/worktrees/harvester-shorttitles`, branch `harvester-shorttitle-cleanup-0621`; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit gitignored `HANDOFF.md` on disk only. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Don't break stylized acronyms** — BITe/Grit-S/LiES/NODS-CLiP are clean (no spaces); the override store does not touch them and `derive_short_title`'s ≥2-uppercase test preserves them; the guard must not flag them (regression-tested).
- **No churn on existing clean short_titles** — the derivation change affects only future harvests; existing canonical short_titles are patched only for the 19 overridden ids.
- **Serialization fidelity** — bulk patch reuses `write_entity` (`sort_keys=True, indent=2`, no trailing newline) so only `short_title` diffs.
- **Faithfulness** — acronyms are factual instrument labels; the 6 uncertain ones are left as owner-fillable TODOs rather than guessed into canonical.

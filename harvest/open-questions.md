# Questionnaire Harvest — Open Questions

**How to use:** answer inline under each `→ Answer:` line. Each question has my
**Recommended default** — if you agree, just write `confirm`. Answer in any order;
leave blanks and we'll proceed on defaults for the unanswered ones. Anything marked
**(BLOCKER)** should be settled before the first import.

> **2026-06-17 — owner said "go" → all recommended defaults ADOPTED** (changeable any
> time; just edit an answer and tell me). Resolved so far:
> - **Q3 RESOLVED:** the survey_db DB was on disk (`survey_database/data/survey_db.sqlite`,
>   999 KB — the 0-byte files were stale stubs). Corpus regenerated → **113 Options**
>   indexed in `scales-catalogue.md` + `scales-index.json`. Dedup fingerprinting already
>   flagged 5 existing duplicate scales. The dedup baseline is live.
> - **Still genuinely needs your input:** **Q6** (which instruments are important / first
>   pilot pick). I'll proceed on the conservative **Q1** license default (open-license only)
>   until you say otherwise.

---

## Q1 — Licensing / IP policy **(BLOCKER)**
Many instruments on these sites (esp. psychology-tools.com) are **copyrighted** and may
not be redistributable. What's our policy?
- **Recommended default:** import only instruments that are **public-domain or carry an
  explicit open/free-for-research license**; record the license + source URL per
  instrument; **skip** anything unclear or copyrighted (log it as `skipped:license` in
  the registry). When in doubt, ask before importing.
→ Answer:

## Q2 — Workspace location
Plan puts the curation workspace in a new top-level `harvest/` dir, with canonical output
flowing into the existing gitignored `content/` tree.
- **Recommended default:** `harvest/` at repo root, isolated from `library/` code. Confirm?
→ Answer:

## Q3 — Dedup corpus availability **(BLOCKER)**
We dedup new scales against what's already in the library. The survey_db output
(~560 Options, 793 Prompts) is **not currently on disk** (`survey_db.sqlite` is 0 bytes;
there's a `survey_database_2025.zip`).
- **Recommended default:** regenerate the survey_db `content/` from the zipped DB so we can
  dedup against it; treat that corpus as canonical "already in the library." If the DB is
  unrecoverable, we start the catalogue empty and dedup only against web-harvested scales.
  Which is it — regenerate, or start fresh?
→ Answer:

## Q4 — Naming convention for NEW shared scales
When a scale isn't found and must be minted, how do we name the Option id?
- **Recommended default:** `opt_<dimension>_<points>[_<variant>]`, e.g. `opt_agreement_7`,
  `opt_frequency_5`, `opt_frequency_5_never_always` when a variant with different anchors
  is needed. Dimension words from a small controlled list (agreement, frequency,
  intensity, likelihood, satisfaction, truth, quality...). Confirm or adjust?
→ Answer:

## Q5 — Dedup strictness (who decides borderline merges?)
Two 5-point agreement scales with slightly different anchor wording
("Strongly agree" vs "Agree strongly") — merge or keep separate?
- **Recommended default:** **exact normalized match auto-merges**; anything that differs in
  wording/points/values is **kept separate but flagged** in the registry for your call.
  Never silently merge non-identical scales. Confirm?
→ Answer:

## Q6 — Prioritization + first-pass target
The sites list hundreds. How do we rank "importance," and how many for the first pass?
- **Recommended default:** importance = High/Med/Low by (widely-used/highly-cited) ×
  (clear license) × (not already in library) × (priority domain). First pass = the
  **top ~15–20 High** instruments. Any domains to prioritize (e.g., depression/anxiety,
  personality, cognition)? Any must-have instruments by name?
→ Answer:

## Q7 — Translations
Import only the source language (usually English), or capture translations when a site
provides them?
- **Recommended default:** **English-only** for the first pass; capture other languages
  only when the source provides validated translations and it's low-effort. Confirm?
→ Answer:

## Q8 — Scoring / subscales
Capture scoring keys + subscales (OD-16 Scorer + Subscale entities), or import items only?
- **Recommended default:** capture **subscale membership + reverse-scored flags + the
  documented scoring rule as notes**, but **defer building runnable Scorer entities** to a
  later pass (import items first, score later). Confirm?
→ Answer:

## Q9 — Provenance / attribution
What source metadata do we retain per imported instrument?
- **Recommended default:** provenance `{source:"web_harvest", imported_at, importer_version,
  x_source_url, x_source_site, x_harvest_date, x_license}` in questionnaire metadata, plus
  any required attribution text kept in `harvest/sources/<acronym>/source.md`. Confirm?
→ Answer:

## Q10 — Per-instrument Definition of Done
- **Recommended default:** Schema-2-valid + refs resolve + no duplicate scale introduced +
  renders in preview + license recorded + your sign-off in the registry. Confirm?
→ Answer:

## Q11 — Automation level
Agent-curated one-at-a-time (recommended) vs invest now in a generic scraper?
- **Recommended default:** **agent-curated**, building small reusable helpers only as
  patterns repeat; revisit a `library/.../importers/web/` module after ~10 instruments if
  the work is mechanical enough to automate. Confirm?
→ Answer:

## Q12 — Ingestion to the LIVE library
Do harvested instruments go to the live Library (Vercel + Supabase) immediately, or stage
in `content/` for a batch review first?
- **Recommended default:** **stage in `content/`**; ingest to the live Library in reviewed
  **batches** (you approve a batch), never per-instrument auto-push. Confirm?
→ Answer:

---

## Free-form
Anything else about scope, sources, must-have instruments, or constraints:
→

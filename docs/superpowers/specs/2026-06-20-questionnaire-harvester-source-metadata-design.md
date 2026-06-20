# Harvester: source-metadata capture (SP1)

**Date:** 2026-06-20
**Status:** approved (brainstorming)
**Scope:** capture the psychology-tools pages' richer source metadata — `<meta name="description">`, `keywords`, `og:*`, and the **Introduction** section — into a **flagged, non-ingested sidecar** per questionnaire, and mark the canonical questionnaire with factual `x_keywords` + an `x_description_source` provenance flag. Re-harvest the 40 psychology-tools pages; surface keywords + a capture note in the review export. Deterministic, no AI.
**Decomposition:** this is **SP1** of the owner's two-part direction. **SP2 (authored original descriptions, separate spec)** consumes this captured material to replace the canonical `description`. SP1 does NOT author descriptions; it captures the raw material + flags provenance.

## Problem (owner review)

The psychology-tools `description` we store is the site's **SEO meta description** (the site's own copyrighted copy), and the pages also carry an **Introduction** section (longer copyrighted prose) + `keywords` + `og:*`. The owner wants: (a) our canonical description to eventually be our own writing (SP2), and (b) the richer source metadata captured to a file for future use (an about page), with copyright handled. Investigation:
- Each page has `<meta name="description">`, `<meta name="keywords">` (comma list), `og:title/url/type/...`, and a `<section class="intro introduction">` containing several `<p>` paragraphs (the first rendered with an inline "Introduction" heading word).
- The description/introduction prose is the site's copyright; keywords/og are short factual tags.

## Decisions (owner-approved)

- **Capture verbatim, flagged** (owner choice): store the meta description + Introduction paragraphs + keywords + og verbatim in a per-questionnaire sidecar, clearly marked source-copyrighted / internal / not-for-redistribution.
- **Sidecar lives OUTSIDE `output/`** — at `questionnaire-harvester/source_metadata/<id>.json` — so it is never ingested into the Library or published. (`output/` is the ingestable canonical tree; copyrighted prose must not enter it.)
- **Canonical entity gains only copyright-safe fields:** `metadata.x_keywords` (factual tag list) and `metadata.x_description_source` (provenance flag, `"site_meta"` for psychology-tools). The existing `description` stays for now; **SP2 replaces it** with authored prose and flips the flag to `"authored"`.
- **Scope:** psychology-tools.com only (the 40 pages — that's where the rich intro/SEO/keywords are). psytoolkit description-flagging is out of scope (possible small follow-on).
- **Deterministic + idempotent:** no timestamps in the sidecar (so re-harvest produces byte-identical files); no AI.

## Captured sidecar — `questionnaire-harvester/source_metadata/<id>.json`

```jsonc
{
  "_notice": "Verbatim capture from <source_url>. Copyright of psychology-tools.com. Internal reference for authoring original descriptions / an about page — NOT for redistribution.",
  "id": "qst_assq",
  "source_url": "https://psychology-tools.com/test/autism-spectrum-screening-questionnaire",
  "meta_description": "<the <meta name=description> content, verbatim>",
  "keywords": ["ASSQ", "Asperger", "autism", "spectrum", "high-functioning", "test", "questionnaire"],
  "og": { "title": "...", "url": "...", "type": "article" },   // only og:* keys that are present
  "introduction": ["<para 1 (leading 'Introduction' heading word stripped)>", "<para 2>", ...]
}
```

## Extraction (psychology-tools adapter)

- `meta_description`: `<meta name="description">` content (already read for `description`; reuse).
- `keywords`: `<meta name="keywords">` content split on `,`, trimmed, empties dropped.
- `og`: every `<meta property="og:...">` → `{key-without-"og:": content}` (e.g. `title`, `url`, `type`).
- `introduction`: `soup.select_one("section.introduction") or soup.select_one("section.intro")` → each child `<p>` text (whitespace-collapsed); strip a leading `^\s*Introduction\b[:\s]*` from the FIRST paragraph only. Empty/absent → `[]`.
- The adapter sets `RawQuestionnaire.keywords` (list) and `RawQuestionnaire.source_meta` (dict: `{meta_description, keywords, og, introduction}`) — both empty/None for non-psychology-tools sources. `description` is unchanged (still the meta description; SP2 replaces it).

## Components & boundaries

| Unit | Change |
|---|---|
| `raw.py` `RawQuestionnaire` | add `keywords: list = []` and `source_meta: dict | None = None` |
| `sources/psychology_tools.py` (`parse` + helpers `_keywords`, `_og`, `_introduction`) | populate `keywords` + `source_meta` |
| `draft.py` (metadata build) | emit `md["x_keywords"]` (when non-empty) + `md["x_description_source"] = "site_meta"` (when `rq.source_meta` present) |
| `source_meta.py` (new) `write_source_metadata(rq, source_meta_dir)` | serialize `rq.source_meta` → `source_metadata/<id>.json` with the `_notice`; skip when `source_meta` falsy; returns the path or None |
| `cli.py` (harvest) | `--source-metadata` (default `questionnaire-harvester/source_metadata`); call `write_source_metadata` after `write_draft` |
| `review_export.py` (`render_questionnaire_md`) | show `- keywords: a · b · c` (from `x_keywords`) + a `- source material: source_metadata/<id>.json (verbatim intro/meta — flagged)` line when keywords present |
| re-harvest + regen | data only, idempotent |

No schema change (`x_keywords`/`x_description_source` are `^x_` metadata extensions; the sidecar is outside `output/`, not validated). `draft.py` already passes `rq.references`; the new fields are additive.

## Testing (TDD, synthetic fixtures)

- **adapter:** a synthetic page with meta description + `keywords` + `og:*` + a `section.introduction` of 2 `<p>` → `rq.keywords == [...]`, `rq.source_meta["meta_description"]`/`["og"]["title"]`/`["introduction"]` populated, the first introduction paragraph has its leading "Introduction" stripped; a page with NO such metadata → `rq.keywords == []` and `rq.source_meta is None` (or empty). Existing psychology-tools tests stay green.
- **draft:** with `keywords` set → `metadata.x_keywords == [...]`; with `source_meta` set → `metadata.x_description_source == "site_meta"`; without → neither key present.
- **`write_source_metadata`:** writes `source_metadata/<id>.json` with `_notice` + the captured fields; returns None and writes nothing when `source_meta` is falsy; output round-trips via `json.loads`.
- **review_export:** a questionnaire with `x_keywords` → the render shows the keywords line + the source-material note; without → neither line.
- **integration (synthetic harvest):** `harvest` of a synthetic psychology-tools fixture → `source_metadata/<id>.json` written + `x_keywords`/`x_description_source` on the canonical questionnaire; tree validates at v26.0618.
- **re-harvest sweep:** re-harvest the 40 psychology-tools pages (idempotent URL→id map) → 40 `source_metadata/*.json`; every psychology-tools questionnaire has `x_keywords` (when the page had keywords) + `x_description_source == "site_meta"`; tree validates; regenerate review docs (158); spot-check qst_assq/qst_aq show keywords + the capture note, and `source_metadata/qst_assq.json` has the Introduction paragraphs.
- Existing harvester suite stays green.

## Scope / out of scope

- **In:** capture (meta desc, keywords, og, introduction) → flagged sidecar; `x_keywords` + `x_description_source` on canonical; re-harvest the 40; review-export keywords + note; regenerate review docs.
- **Out:** authoring/replacing the canonical `description` (**SP2**); psytoolkit source-metadata; an HTML/rendered about page (a downstream consumer of the sidecar); any schema change; storing introduction/description prose inside `output/`.

## Risks

- **Multi-agent shared checkout** — isolated worktree `.claude/worktrees/harvester-srcmeta`, branch `harvester-source-metadata-0620`; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit gitignored `HANDOFF.md` on disk only. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **Copyright containment** — verbatim source prose lives ONLY in `source_metadata/` (outside `output/`, flagged, never ingested/published); canonical carries only factual keywords + a provenance flag.
- **Idempotency** — no timestamps; URL→id map preserves `--id` overrides; re-harvest is additive (no item drift).
- **Faithfulness** — captured text is verbatim from the source; canonical description unchanged in SP1 (SP2 authors the replacement). The `x_description_source: "site_meta"` flag makes the current provenance explicit pending SP2.

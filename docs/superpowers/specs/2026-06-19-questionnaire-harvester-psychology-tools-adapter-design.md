# New site adapter: psychology-tools.com

**Date:** 2026-06-19
**Status:** approved (brainstorming)
**Scope:** a second source adapter (`psychology-tools.com`) + host-based CLI dispatch — reuses the existing per-item-option draft engine; NO schema or draft change.
**Extends:** the `SourceAdapter` interface; first non-PsyToolkit source.

## Problem

The harvester has one source (PsyToolkit, 118 questionnaires). To grow the corpus beyond it we
add a **second source adapter**. The README named `psychologytools.com` and `arabpsychology.net`,
but investigation found both unsuitable: `psychologytools.com` is a commercial paywalled SPA;
`arabpsychology.com` (the `.net` is dead) is an Arabic glossary/article site whose `scales.`
subdomain exposes items only as semi-structured prose with no structured response scale.

**`psychology-tools.com`** (hyphenated — a distinct site) is a clean, server-rendered repository of
interactive tests. Each `/test/<slug>` page is an HTML form where every item is a radio group with
**fully structured** response options (anchor labels + score values), plus an instruction. This
fits the existing per-item-option engine directly — no prose parsing.

Confirmed page structure (e.g. `/test/adult-adhd-self-report-scale`, ASRS v1.1, 18 items × 5-point):

```html
<form>
  <div class="notable-tr question ...">
    <span class="notable-td prompt"><span class="num">1.</span><span>…item stem…</span></span>
    <span class="notable-td response"><label class="aria-label">Never</label><input type="radio" name="q1" value="0"></span>
    <span class="notable-td response"><label class="aria-label">Rarely</label><input type="radio" name="q1" value="1"></span>
    … (5 response cells) …
  </div>
  … (one .question div per item) …
</form>
<p>Instructions…</p>
```

## Decisions (owner-approved)

- **Target `psychology-tools.com`** (not the two README-named sites — both unsuitable, see above).
- **Structured radio-group parse** — each `.notable-tr.question` div → one item; stem from
  `.notable-td.prompt`; per-item response `Option` from the `.notable-td.response` cells
  (anchor = `label.aria-label` text, value = `input[value]`), **in DOM order, verbatim**.
- **Reuse the per-item-option engine** — items become `RawItem(text=<stem>, option=RawOption(
  input_data_type="choice", measurement_type="ordinal", selection="single", anchors, values))`.
  The existing `draft()` builds per-item choice options (counter ids) + per-item prompts; identical
  option sets dedup, per-item scoring variations (e.g. ASRS's 0/1 cells) stay distinct. No schema/
  draft change.
- **Host-based CLI dispatch** — a registry maps URL host → adapter (`us.psytoolkit.org` →
  `PsyToolkitAdapter`; `psychology-tools.com` → `PsychologyToolsAdapter`).
- **Same license posture** — copyrighted instruments → `license: unknown` / `needs-review`;
  output is staging the owner reviews before any Library ingest (identical to PsyToolkit).

## Architecture

```
harvest <url>
  → dispatch_adapter(url)  # by host → PsyToolkitAdapter | PsychologyToolsAdapter
  → adapter.parse(adapter.fetch(url), url) → RawQuestionnaire
  → draft → write_draft → validate_tree → write_questions → upsert_register_row   # all unchanged
```

### Components

| Unit | Responsibility | Depends on |
|---|---|---|
| `sources/psychology_tools.py` (`PsychologyToolsAdapter`, `PsychologyToolsParseError`) | parse a `/test/<slug>` page → `RawQuestionnaire` | `raw.py`, `bs4` |
| `cli.py` (host dispatch) | pick the adapter for a URL; map each adapter's ParseError → `SKIP` | both adapters |
| `draft.py` / schema | UNCHANGED — per-item choice options already supported | — |

## Parsing (`sources/psychology_tools.py`)

- **`site = "psychology-tools.com"`**; `fetch` inherits the base (httpx).
- **Title** → `<h1>`; **short_title** → the title's parenthetical if present.
- **id (site-specific rule)** — the title parenthetical's *leading* acronym run handles messy
  versioned acronyms: take `^[A-Z0-9-]+` of the parenthetical (so `(ASRSv1.1)` → `asrs`,
  `(PHQ-9)` → `phq9`, `(GAD-7)` → `gad7`), sanitised → `qst_<acr>`. If the parenthetical yields no
  usable acronym, fall back to the **full `/test/` slug** sanitised (unique, never the generic
  `qst_scale` the shared `derive_qst_id` would produce from the last URL segment). The existing
  **collision guard** handles clashes with PsyToolkit ids (e.g. `qst_asrs`) — clean SKIP, resolvable
  with `--id`.
- **Items** → each `div.notable-tr.question` (a `.question` row) is one item:
  - **stem** = `.notable-td.prompt` text with the leading `.num` span removed, stripped — verbatim.
  - **option** = the ordered `.notable-td.response` cells → `anchors` = each `label.aria-label`
    text (verbatim), `values` = each `input[type=radio]` `value` cast to float. `measurement_type
    ="ordinal"`, `selection="single"`, `dimension="rating"`.
- **Instruction** → the page's "Instructions…" paragraph (strip a leading "Instructions" label),
  → `instruction_text`; the existing temporal-context split still applies.
- **Citation / year** → best-effort from a "Source"/reference section if present; `publication`
  emitted only when both citation and year are found (as today). Absent → omitted (reference often
  stays in the description).
- `scale=None`, `shared_prompt_text=None`.

### Refusals (clean `PsychologyToolsParseError` → CLI `SKIP`, nothing written)
- URL host is the site but the path is not a `/test/` page, or no `<form>` / no `.question` rows.
- A `.question` row with no response cells, an empty anchor label, an empty stem, or a non-numeric
  radio value. Never fabricate or silently truncate.

## CLI host dispatch (`cli.py`)

Replace the hardcoded `adapter = PsyToolkitAdapter()` with a host→adapter registry:

- A small `dispatch_adapter(url) -> SourceAdapter` keyed on `urlparse(url).host` (suffix match):
  `us.psytoolkit.org`/`psytoolkit.org` → `PsyToolkitAdapter`; `psychology-tools.com` →
  `PsychologyToolsAdapter`. Unknown host → a clear error (`SKIP <url>: no adapter for host …`).
- The `try/except` widens to catch **both** adapters' parse errors as a tuple
  `(PsyToolkitParseError, PsychologyToolsParseError)` → printed as `SKIP`, exit 2, nothing written
  (no refactor of the existing `PsyToolkitParseError`). The rest of `main()` (draft → validate →
  register) is unchanged.

## Scope / out of scope

- **In:** `/test/<slug>` single-form tests with radio-group items (the common shape). A first
  sweep of a handful of `/test/` pages, calibrated against saved fixtures.
- **Out (this iteration):** category-index crawling (`/cat/<x>` enumeration — operator passes test
  URLs); non-radio tests (sliders/free-text) if any exist on the site → refuse cleanly; the two
  unsuitable README sites.

## Testing (TDD)

- **Synthetic fixtures** (NOT a real copyrighted page) replicating the `.notable-tr.question` /
  `.notable-td.prompt` / `.notable-td.response` structure with invented items, to test parsing
  without committing copyrighted content.
- **Unit (`psychology_tools`):** item count = `.question` row count; per-item anchors + float
  values read verbatim in DOM order; stem excludes the `.num`; instruction extracted; the
  site-specific id rule (`(ASRSv1.1)`→`asrs`, `(PHQ-9)`→`phq9`, no-acronym→full slug); refusals
  (no form / empty anchor / empty stem / non-numeric value / non-`/test/` path).
- **Unit (`cli` dispatch):** `dispatch_adapter` returns the right adapter per host; unknown host
  → SKIP.
- **e2e:** a synthetic `/test/` HTML fixture → harvest → validates against `schemas/` at `v26.0618`;
  per-item prompts + per-item choice options; identical-scale items dedup, varied-scale items stay
  distinct.
- Existing harvester suite (70) + PsyToolkit path stay green (dispatch leaves PsyToolkit unchanged).
- Then sweep a handful of real `/test/` pages; the whole `output/` tree must validate at `v26.0618`.

## Risks

- **Multi-agent shared checkout** — isolated worktree; commit on HEAD only (verify branch + parent
  before/after each commit); never checkout/reset/switch or `cd` elsewhere; do not use the cheapest
  model tier for implementers; edit the gitignored `HANDOFF.md` on disk only.
- **id quality** — versioned acronyms are messy; the leading-acronym rule + full-slug fallback +
  collision guard keep ids unique and owner-reviewable.
- **HTML drift / fixture fidelity** — synthetic fixtures mirror the live structure; the real sweep
  is the integration check. If a real page diverges from `.notable-tr.question`, the adapter
  refuses cleanly rather than mis-parsing.
- **Copyright** — same posture as PsyToolkit: `needs-review` / `license: unknown`, staging only,
  owner reviews before ingest; tests use synthetic (non-copyrighted) fixtures.

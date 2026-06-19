# psychology-tools.com adapter: extract structured references (Sources)

**Date:** 2026-06-19
**Status:** approved (brainstorming)
**Scope:** fix `PsychologyToolsAdapter` citation extraction to read the structured `Sources` section; backfill `publication` (+ a new `x_references` list) across all 37 already-harvested psychology-tools questionnaires. NO schema change.
**Extends:** the psychology-tools adapter (`2026-06-19-...-adapter-design.md`).

## Problem

Every psychology-tools `/test/` page carries a structured references section, but the adapter never captured it — so **all 37 harvested psychology-tools questionnaires have no `publication`**. The current citation heuristic scans `p`/`li`/`div`/`span` for text starting with "source"/"reference"; the real section is an `<h6>Sources</h6>` heading followed by `<ol class="sources">`, so the heuristic matches nothing usable.

Confirmed structure (e.g. Q-CHAT, Hamilton anxiety):

```html
<h6>Sources</h6>
<ol class="sources">
  <li class="source">
    <span class="authors">…</span> … <em class="title">…</em>
    <span class="vol">…</span> <abbr class="publication journal">…</abbr>
    <span class="pages">…</span> <time class="publication-date" datetime="1959">1959</time>.
  </li>
  <!-- some pages list 2+ <li class="source"> -->
</ol>
```

So each page exposes one or more fully-structured bibliographic citations with an explicit year (`time.publication-date`).

## Decisions (owner-approved)

- **Citation** = the first `ol.sources li.source` element's text, whitespace-normalized and tidied around punctuation (the hCard spans introduce stray spaces: `"Allison , S"` → `"Allison, S"`). This populates `publication.citation`.
- **Year** = `time.publication-date` (its `datetime` attribute if present, else its text); fall back to a 4-digit year (`\b(?:19|20)\d{2}\b`) anywhere in the citation text. Populates `publication.year`.
- **All sources** (owner choice **A**) — capture every `li.source` citation string verbatim (tidied) in a new `metadata.x_references` list, so multi-source pages lose nothing. Uses the existing `x_*` metadata convention; no schema change.
- `publication` is still emitted only when both citation and year are found (existing draft gate); pages without `ol.sources` produce no `publication` and no `x_references`.
- **Backfill:** re-harvest all 37 existing psychology-tools questionnaires from their stored `x_source_url`, preserving ids via `--id`, to add `publication` + `x_references`.

## Design

### Parser (`sources/psychology_tools.py`)

Replace the existing citation block:

```python
        citation, year = "", None
        for el in soup.find_all(["p", "li", "div", "span"]):
            t = el.get_text(" ", strip=True)
            if re.match(r"^(source|reference)s?\b", t, re.I):
                ym = re.search(r"\b(19|20)\d{2}\b", t)
                if ym:
                    citation = re.sub(r"^(source|reference)s?\s*:?\s*", "", t, flags=re.I).strip()
                    year = int(ym.group())
                break
```

with structured extraction from `ol.sources`:

- A helper `_clean_citation(li) -> str`: `li.get_text(" ", strip=True)`, collapse whitespace, and tidy punctuation spacing (`re.sub(r"\s+([,.;:])", r"\1", ...)`).
- Collect `sources = [_clean_citation(li) for li in soup.select("ol.sources li.source") if _clean_citation(li)]`.
- `citation = sources[0] if sources else ""`.
- `year`: from the **first** `li.source`'s `time.publication-date` (`.get("datetime")` else `.get_text()`), parsed with `re.search(r"\b(?:19|20)\d{2}\b", …)`; fall back to the same regex over `citation`.
- Pass `sources` (the full list) into the returned `RawQuestionnaire` so the drafter can emit `x_references` (see below).

### Carrying `x_references` through to output

`metadata.x_references` is questionnaire-level metadata. The cleanest path that matches the existing `x_*` pattern:
- Add an optional `references: list = field(default_factory=list)` to `RawQuestionnaire` (raw.py).
- In `draft.py`, when assembling the questionnaire `metadata` dict, add `if rq.references: md["x_references"] = rq.references`.
- The PsyToolkit adapter leaves `references=[]` (unchanged behavior — no `x_references` emitted for it).

(Alternative considered: stuff references into the existing `LicenseFlag.x_metadata()` — rejected; references aren't license data and don't belong there.)

### Backfill re-harvest

Enumerate `output/questionnaires/*.json` whose `metadata.x_source_site == "psychology-tools.com"`; for each, re-harvest `metadata.x_source_url` with `--id <existing id>`. Re-harvesting the same URL is idempotent (collision guard returns None for the same source URL) and now adds `publication` + `x_references`. The whole `output/` tree must validate at `v26.0618` after.

## Scope / out of scope

- **In:** structured `ol.sources` citation + year + `x_references`; `RawQuestionnaire.references` + `draft` emission; backfill all 37.
- **Out:** PsyToolkit citation path (unchanged); a native schema `references` field (stays an `x_` extension); the deferred-layout and scoring workstreams (separate).

## Testing (TDD)

- **Unit (`psychology_tools`):** a synthetic page with one `ol.sources li.source` (incl. `time.publication-date`) → `rq.citation` tidied, `rq.year` correct, `rq.references == [that citation]`; a two-source page → citation = first, `references` = both, year from the first; a page with **no** `ol.sources` → `citation==""`, `year is None`, `references==[]`. Punctuation-tidy assertion (`"X , Y"` → `"X, Y"`).
- **Unit (`draft`):** a `RawQuestionnaire` with `references=[…]` → `metadata.x_references` present; with `references=[]` → key absent. Existing PsyToolkit draft tests unaffected (they pass `references=[]`).
- **e2e:** a synthetic psychology-tools page with a Sources section → harvest → `metadata.publication` + `metadata.x_references` present; validates at `v26.0618`.
- Existing harvester suite stays green.
- **Backfill:** re-harvest the 37; spot-check several now have `publication` + `x_references`; tree validates; report how many of 37 gained a publication (pages genuinely lacking a parseable year stay without one).

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `sources/psychology_tools.py` | parse `ol.sources` → citation/year/references | `bs4` |
| `raw.py` | `RawQuestionnaire.references` field | — |
| `draft.py` | emit `metadata.x_references` when present | `raw.py` |

## Risks

- **Multi-agent shared checkout** — isolated worktree; commit on HEAD only (verify branch+parent before/after each commit); all edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit the gitignored `HANDOFF.md` on disk only. (`origin/master` is moving with the editor agent — merge inside the worktree and fast-forward-push, as done for the layout branch.)
- **Citation tidying vs faithfulness** — whitespace/punctuation-spacing tidy is metadata formatting, not item/scale content; the words and the year are preserved verbatim.
- **`x_references` is questionnaire-level** — confirm `metadata` accepts arbitrary `^x_` keys (it does; the harvester already adds several `x_*` metadata fields that validate).

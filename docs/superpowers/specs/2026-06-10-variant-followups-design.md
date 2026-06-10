# Instrument/variant follow-ups — Design Spec

**Date drafted:** 2026-06-10
**Component:** library-web (render) + library importer/query (cleanups).
**Follows:** [OD-21 instrument-family grouping](2026-06-09-instrument-id-grouping-design.md) (the `variant` field was added there, default `"base"`, plumbed schema → importer → index → card → types but never rendered).

**Background.** During OD-21 review we checked whether the multi-form instrument families were genuine variants or import duplicates. Comparing **prompts + response options** (not just prompts) confirmed **all 8 families are genuine variants** — the forms differ by their answer scale (e.g. `grit8` uses a 5-pt similarity scale while `x_grit8` uses 7-pt agreement; ASRS Part-A uses a 5-pt ARCES frequency scale vs the full form's 7-pt frequency). The `x_`-prefixed forms are typically the same items re-administered with a standardized scale. So: **no deduping**, and `variant` is a real, useful concept.

Per the project owner's steer, `variant` is treated as a **forward-looking** capability (for hand-authored/edited questionnaires); backfilling or curating labels for the legacy imports — and surfacing the response-scale distinction — is **deferred to a future QA pass once editing features exist**. This spec only makes `variant` render when present, plus two trivial cleanups.

---

## 1 — Scope

### In scope
1. **Render `variant`** in the web UI when it is present and not `"base"`:
   - Catalogue card (`ResultRow`) — a small variant tag after the title.
   - Detail header (`MetadataHeader`) — variant shown near the title.
2. **Cleanups:**
   - Remove the orphaned `query.list_cards` (no callers since OD-21 switched the catalogue list to `list_instrument_groups`).
   - Rename the importer's local `variant` variable (the `short_title` source) so it no longer shadows `meta["variant"]`.

### Out of scope (deferred to a future QA pass with editing)
- Backfilling / curating per-form variant labels for the 64 legacy imports (they stay `"base"`).
- Surfacing the response-scale / measurement-type distinction between variants.
- Any de-duplication or merging of family forms (confirmed they are genuine variants, not duplicates).

### Non-goals
- No schema, importer-output, API-shape, or re-seed changes. `variant` already exists end-to-end; this only renders it and removes dead code. (No live re-seed required — all current data is `"base"`, so nothing visibly changes until edited/future content carries a real variant.)

---

## 2 — Render `variant` (forward-looking)

The field is on `CatalogueCard` (`variant: string | null`) and on the resolved-definition metadata. Display it only when meaningful: `variant && variant !== "base"`.

### 2.1 `ResultRow` (catalogue card)
After the title `Link` (which already shows `short_title` as a muted parenthetical), render the variant as a small muted tag — distinct from `short_title` (an abbreviation like "PHQ-9") because `variant` names the *form* (e.g. "Part A screener"). Suggested: a subtitle line below the id, or an inline tag after the title, styled with existing tokens (`text-ink-faint` / a subtle pill). Exact placement/markup chosen in the plan to match the card's visual rhythm; it must read as the form's name, not repeat `short_title`. This appears both for standalone singleton cards and for each form expanded under an instrument family (the family collapsed header does **not** aggregate variant — forms differ — so variant shows per-form on expansion).

### 2.2 `MetadataHeader` (detail page)
Show `meta.variant` (when not `"base"`) near the title, consistent with how `short_title` is rendered there. The `DefMetadata` type must include `variant?: string | null` (add if absent).

### 2.3 Behaviour with current data
All imported questionnaires have `variant: "base"`, so nothing renders today — verified via a unit test using a non-`"base"` fixture. The display lights up automatically when content carries a real variant.

---

## 3 — Cleanups

### 3.1 Remove orphaned `list_cards`
`library/src/library/query.py::list_cards` has no callers (grep across `src` + `tests` finds only a docstring mention in `_card_where_sort`). Remove the function. Keep `_card_where_sort` (still used by `_all_matching_cards`), `_card_select`, `_CARD_COLS`, and `PaginatedCards` (still used by `/v1/search`). Update the `_card_where_sort` docstring to drop the `list_cards` reference.

### 3.2 Rename the importer `variant` shadow
In `library/src/library/importers/survey_db/questionnaire.py`, the local `variant` (lines ~102–109) holds the legacy `surveys.variant` value mapped to `meta["short_title"]`, while `meta["variant"] = "base"` (line ~195) is the new OD-21 field. Rename the local to something unambiguous (e.g. `short_title_src`) so the two distinct concepts don't share the name `variant`. No behaviour change.

---

## 4 — Testing
- **library-web:** `ResultRow` renders the variant tag when `variant` is a non-base string and renders nothing variant-related when `variant` is `"base"`/`null` (two cases). `MetadataHeader` shows the variant when present. Existing catalogue/detail tests stay green.
- **library:** removing `list_cards` keeps the full suite green (no test referenced it). The importer rename keeps the importer unit + smoke tests green (no behaviour change; `meta["variant"]` still `"base"`, `meta["short_title"]` still the legacy value).

---

## 5 — Definition of done
1. A non-`"base"` `variant` renders on the catalogue card and detail header; `"base"`/absent renders nothing; covered by tests.
2. `list_cards` removed; `library/` suite green.
3. Importer local `variant` renamed (no shadow); importer tests + smoke green.
4. The response-scale finding (variants differ by answer scale; legacy variant labels need curation) is recorded as a deferred QA item in `library/FOLLOWUPS.md`, not implemented.
5. No schema/API/re-seed changes; frontend build clean.

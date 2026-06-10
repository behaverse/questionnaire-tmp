# Instrument/variant follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the `variant` field (when not `"base"`) on the catalogue card and detail header, and do two trivial cleanups (remove orphaned `list_cards`; rename an importer name-shadow).

**Architecture:** Pure render + cleanup. `variant` already exists end-to-end (schema → importer → index → `CatalogueCard`); this displays it. No schema/API/re-seed changes — all current data is `"base"`, so nothing visibly changes until edited/future content carries a real variant. Legacy variant curation + response-scale surfacing are recorded as deferred QA items.

**Tech Stack:** React 19 + TypeScript + Tailwind + Vitest (library-web); Python + pytest (library).

**Spec:** [docs/superpowers/specs/2026-06-10-variant-followups-design.md](../specs/2026-06-10-variant-followups-design.md)

**Conventions:** frontend tasks run from `library-web/` (`npm test`, `npm run build`); Python tasks `source .venv/bin/activate` + `DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q`. Branch: `variant-followups`.

---

## Task 1: Render `variant` on the catalogue card (`ResultRow`)

**Files:**
- Modify: `library-web/src/catalogue/ResultRow.tsx`
- Test: `library-web/src/catalogue/ResultRow.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append inside the `describe('ResultRow', …)` block in `library-web/src/catalogue/ResultRow.test.tsx`:
```tsx
  it('shows a variant tag when the form has a non-base variant', () => {
    render(<MemoryRouter><ResultRow card={{ ...card, variant: 'Part A screener' }} /></MemoryRouter>)
    expect(screen.getByText('Part A screener')).toBeInTheDocument()
  })

  it('shows no variant tag for the default "base" variant', () => {
    render(<MemoryRouter><ResultRow card={{ ...card, variant: 'base' }} /></MemoryRouter>)
    expect(screen.queryByText('base')).toBeNull()
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ResultRow 2>&1 | tail -8`
Expected: the "non-base variant" test FAILS ("Part A screener" not found).

- [ ] **Step 3: Render the variant tag**

In `library-web/src/catalogue/ResultRow.tsx`, immediately AFTER the title `</Link>` and BEFORE the `<p className="mt-1 font-mono text-xs text-ink-faint">{card.id}</p>` line, insert:
```tsx
      {card.variant && card.variant !== 'base' && (
        <span className="ml-2 inline-block rounded bg-paper-sunken px-1.5 py-0.5 align-middle font-sans text-xs font-medium text-ink-soft">
          {card.variant}
        </span>
      )}
```
(A small muted pill after the title — names the *form*, distinct from the `short_title` abbreviation parenthetical. `bg-paper-sunken`/`text-ink-soft` are existing tokens.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- ResultRow 2>&1 | tail -6`
Expected: PASS (both new tests + the existing two).

- [ ] **Step 5: Commit**

```bash
git add library-web/src/catalogue/ResultRow.tsx library-web/src/catalogue/ResultRow.test.tsx
git commit -m "feat(library-web): render non-base variant tag on catalogue cards"
```

---

## Task 2: Render `variant` on the detail header (`MetadataHeader`)

**Files:**
- Modify: `library-web/src/api/types.ts` (add `variant` to `DefMetadata`)
- Modify: `library-web/src/detail/MetadataHeader.tsx`
- Test: `library-web/src/detail/MetadataHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

Append inside the `describe('MetadataHeader', …)` block in `library-web/src/detail/MetadataHeader.test.tsx`:
```tsx
  it('shows the variant tag when the form has a non-base variant', () => {
    render(
      <MemoryRouter>
        <MetadataHeader meta={{ ...meta, variant: 'Part A screener' }} version="v26.0602" allVersions={[]} lang="en" onLang={() => {}} onDownload={() => {}} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Part A screener')).toBeInTheDocument()
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- MetadataHeader 2>&1 | tail -8`
Expected: FAIL — `variant` is not a `DefMetadata` field (TS) and isn't rendered.

- [ ] **Step 3: Add `variant` to `DefMetadata`**

In `library-web/src/api/types.ts`, in the `DefMetadata` interface, add after the `short_title?: string` line:
```ts
  variant?: string | null
```

- [ ] **Step 4: Render the variant in `MetadataHeader`**

In `library-web/src/detail/MetadataHeader.tsx`, immediately AFTER the `short_title` block:
```tsx
      {meta.short_title && meta.short_title !== meta.title && (
        <p className="mt-1.5 font-serif text-lg text-ink-faint">{meta.short_title}</p>
      )}
```
insert:
```tsx
      {meta.variant && meta.variant !== 'base' && (
        <p className="mt-2">
          <span className="inline-block rounded bg-paper-sunken px-2 py-0.5 font-sans text-sm font-medium text-ink-soft">
            {meta.variant}
          </span>
        </p>
      )}
```

- [ ] **Step 5: Run test + build**

Run: `npm test -- MetadataHeader 2>&1 | tail -6` (expect PASS)
Run: `npm run build 2>&1 | tail -2` (expect clean — confirms the `DefMetadata` type addition compiles)

- [ ] **Step 6: Commit**

```bash
git add library-web/src/api/types.ts library-web/src/detail/MetadataHeader.tsx library-web/src/detail/MetadataHeader.test.tsx
git commit -m "feat(library-web): render non-base variant on the detail header"
```

---

## Task 3: Remove the orphaned `query.list_cards`

**Files:**
- Modify: `library/src/library/query.py`

- [ ] **Step 1: Confirm it's orphaned**

Run: `grep -rn "list_cards" library/src library/tests --include=*.py`
Expected: only the definition (`def list_cards`) and the docstring mention inside `_card_where_sort`. No callers. (If any caller appears, STOP and report — the plan assumed none.)

- [ ] **Step 2: Delete the function**

In `library/src/library/query.py`, delete the entire `list_cards` function (the `def list_cards(conn: psycopg.Connection, entity_type: str, *, q: str | None, limit: int, offset: int, … ) -> tuple[list[dict], int]:` block — it builds the count + `_card_select` rows query with `LIMIT/OFFSET` and returns `[dict(zip(_CARD_COLS, r)) for r in rows], total`). Keep `_card_where_sort`, `_card_select`, `_CARD_COLS`, `_all_matching_cards`, and `list_instrument_groups`.

- [ ] **Step 3: Update the `_card_where_sort` docstring**

In `library/src/library/query.py`, change the `_card_where_sort` docstring from:
```python
    """Build the WHERE clause + params + ORDER BY for an enriched catalogue-card query.
    Shared by list_cards (flat, paginated) and _all_matching_cards (all rows, grouped)."""
```
to:
```python
    """Build the WHERE clause + params + ORDER BY for an enriched catalogue-card query.
    Used by _all_matching_cards (all rows), which powers the instrument-grouped list."""
```

- [ ] **Step 4: Run the full Library suite**

Run: `source .venv/bin/activate && DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q 2>&1 | tail -2`
Expected: PASS (same count as before — nothing referenced `list_cards`).

- [ ] **Step 5: Commit**

```bash
git add library/src/library/query.py
git commit -m "refactor(library): remove orphaned list_cards (catalogue list uses list_instrument_groups)"
```

---

## Task 4: Rename the importer `variant` name-shadow

**Files:**
- Modify: `library/src/library/importers/survey_db/questionnaire.py`

- [ ] **Step 1: Rename the local variable**

In `library/src/library/importers/survey_db/questionnaire.py`, the block that maps the legacy `surveys.variant` to `short_title` currently reads:
```python
    variant = str(s.get("variant") or "").strip()
    if variant:
        if len(variant) > 64:
            if loss:
                loss.add("approximated", f"surveys.{s.get('survey_id') or qid}.variant",
                         f"variant truncated from {len(variant)} to 64 chars for short_title")
            variant = variant[:64]
        meta["short_title"] = variant
```
Rename the local `variant` → `short_title_src` (it's the source of `short_title`, NOT the OD-21 `meta["variant"]` field, which stays `"base"`):
```python
    short_title_src = str(s.get("variant") or "").strip()
    if short_title_src:
        if len(short_title_src) > 64:
            if loss:
                loss.add("approximated", f"surveys.{s.get('survey_id') or qid}.variant",
                         f"variant truncated from {len(short_title_src)} to 64 chars for short_title")
            short_title_src = short_title_src[:64]
        meta["short_title"] = short_title_src
```
Leave `meta["variant"] = "base"` (further down) unchanged.

- [ ] **Step 2: Run importer tests + smoke**

Run: `DOCKER_CONFIG=/tmp/lib_docker pytest library/tests/unit/importers/test_questionnaire.py library/tests/integration/test_importer_run.py -q 2>&1 | tail -2`
Expected: PASS (pure rename — `meta["short_title"]` + `meta["variant"]` unchanged).

- [ ] **Step 3: Commit**

```bash
git add library/src/library/importers/survey_db/questionnaire.py
git commit -m "refactor(importer): rename local variant->short_title_src (avoid shadowing meta['variant'])"
```

---

## Task 5: Record the deferred QA items

**Files:**
- Modify: `library/FOLLOWUPS.md`

- [ ] **Step 1: Append the QA section**

At the end of `library/FOLLOWUPS.md`, append:
```markdown

## Data quality — deferred to a QA pass (needs editing features)

Surfaced during the OD-21 instrument/variant follow-up (2026-06-10):

- **Variant labels for legacy imports.** All 64 imported questionnaires have `variant: "base"`; the genuine per-form variants (8 instrument families) are distinguished only by id + item count. Curating human-readable variant labels (e.g. ASRS "Full" / "Part A screener" / "Inattentive" / "Part A + Inattentive") needs editing/curation tooling.
- **Surface the response-scale distinction.** The multi-form families are genuine variants differing by their answer scale (e.g. `grit8` 5-pt similarity vs `x_grit8` 7-pt agreement; ASRS Part-A's 5-pt ARCES frequency vs the full form's 7-pt frequency). This scale / measurement-type distinction is not surfaced on cards; surfacing it is a QA-pass enhancement.
```

- [ ] **Step 2: Commit**

```bash
git add library/FOLLOWUPS.md
git commit -m "docs(library): record deferred variant-curation + response-scale QA items"
```

---

## Self-review (completed during planning)

**Spec coverage:** §2.1 ResultRow render → Task 1. §2.2 MetadataHeader render + `DefMetadata.variant` → Task 2. §2.3 base/non-base behaviour → tested in Tasks 1+2. §3.1 remove `list_cards` → Task 3. §3.2 rename importer shadow → Task 4. §4 testing → tests in Tasks 1–4. §5 DoD item 4 (record QA finding) → Task 5.

**Placeholder scan:** no TBD/TODO; every step has concrete code/commands. The render markup is fully specified (not "style appropriately").

**Type consistency:** `card.variant`/`meta.variant` are the existing `CatalogueCard.variant` (already typed `string | null`) and the newly-added `DefMetadata.variant?: string | null` (Task 2 Step 3). The `'base'` sentinel string matches the importer default and the schema default. Test fixtures use `{ ...card, variant: … }` / `{ ...meta, variant: … }` spreads over the existing fixtures.

---

## Notes for the executor
- No re-seed / running stack needed (the local stack was torn down; all data is `"base"` so the UI is unchanged until future content carries a variant — the tests prove the render path).
- Tasks are independent; commit each separately.
- Do NOT touch the schema, importer output shape, API, `CatalogueGroup` aggregation, or the detail page beyond `MetadataHeader`.

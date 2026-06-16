# Editor Translation Panel (ED-E2) — Design Spec

**Date:** 2026-06-16
**Component:** **Editor**, sub-project **ED-E2** (the deferred side-by-side translation workflow from ED-E). Owner-requested 2026-06-16 after finding the per-entity "Fork to edit → type" path too clunky for translating a whole questionnaire.
**Builds on:** ED-E (per-locale content editors + `editingLocale` + the source-text hint), ED-C4 (`forkRefAction` — fork a Library ref into the pool + repoint all occurrences), the `resolved` store map (preview-shared resolved entity bodies), the untranslated/translated tree dots.
**Stack:** React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright.

---

## 1 — Problem

Today, translating a Library-opened questionnaire means: switch **Editing language** → for each item, click **"Fork to edit"** on the prompt, then the option, then context/instruction, then type the target text in each editor — one entity at a time, with no overview of progress. Every string is translatable, but the workflow is tedious and easy to lose your place in.

## 2 — Solution: a full-width Translation view

A **"Translate" button in the topbar** (next to the Editing-language switcher) opens a full-width in-app view that replaces the 3-pane workspace (a mode, with a "← Back to editor" control). It is driven by the current **`editingLocale`**:

- If `editingLocale` is unset or equals the primary language, the view shows: *"Pick a non-primary Editing language (top bar) to translate."* — no table.
- Otherwise it lists **every translatable string**, source (primary, read-only) on the left and an editable **target** field on the right.

### Rows
Grouped by the structure order (page → element), one entry per **unique entity** (deduplicated by ref, so a shared response scale or shared instruction appears **once**, not per item). Each entity contributes rows:
- **prompt / context / instruction / message** → one row (the `text`).
- **option** → one row per **choice label** (`content[locale].options[i].text`), plus a row for the option's `label` and `units` when present.

Each row shows: left = source text (primary locale; `(empty)` if the source itself has none); right = target `<input>`/`<textarea>`; a **status** select (draft/complete/validated) bound to that entity-locale's status; and a green (filled)/amber (empty) dot. A header shows a **progress count** ("18 / 47 translated") and a **"show untranslated only"** filter.

### Auto-fork on edit (the key win)
When the user edits a row whose entity is a read-only **Library ref** (present in `resolved`, not in `pool`), `setTranslation` **auto-forks it first** (`forkRefAction`, which copies it into the pool as `<id>@<pinnedVer>.dev1` and repoints every occurrence), then writes `content[target]`. Because forking repoints all occurrences, a **shared option is forked once** and its translated labels apply to every item using it. Pool (already-drafted/forked) entities are written directly. A one-time note in the header explains: *"Editing a translation makes a local editable copy of Library content."* No per-row confirm prompt (forking is non-destructive).

## 3 — Architecture

- **`editor/src/translate/collect.ts`** — pure `collectTranslatable(model, pool, resolved, primary, target): TransGroup[]`. Walks the model elements; for each unique entity ref (or inline option) gathers `{ entityRef | inlinePath, kind, label, rows: TransRow[] }` where each `TransRow` = `{ id, field, source, target, status, done }`. `field` identifies the slot: `'text'` | `{ option: 'label'|'units' } | { choice: index }`. Dedup by ref via a seen-set. Reads content from `pool[ref] ?? resolved[ref]` (or the inline option). No store/React deps — unit-testable.
- **`editor/src/translate/apply.ts`** — `setTranslation(args)` (impure helper used by the panel): given the entity ref/inline path + field + target locale + value (text or status), ensure a pool copy exists (if it's a ref not in pool → `await forkRefAction(ref)`, then resolve the now-pooled ref from the model), then produce the updated entity body and `upsertPoolEntity`. Pure body-transform functions (`setText/setChoiceText/setOptionLabel/setUnits/setStatus`) reuse the existing option/content ops where possible.
- **`editor/src/translate/TranslationPanel.tsx`** — renders the grouped rows, the progress count, the filter, and the empty-state; calls `setTranslation` on edit; reads `model/pool/resolved/editingLocale` from the store.
- **`editor/src/state/store.ts`** — add a UI flag `translateView: boolean` + `setTranslateView` (NOT serialized; cleared on `loadModel`/`reset`).
- **`editor/src/app/Topbar.tsx`** — a **"Translate"** toggle button (active styling when on). **`EditorWorkspace`/`App`** — when `translateView` is on, render `<TranslationPanel>` full-width instead of the grid (keep the topbar).

**Dedup + write integrity:** the matrix groups by entity, so editing the shared option's "strongly agree" label writes once to the (forked) option entity; all referencing items re-resolve to it. After an auto-fork, the panel re-derives rows from the updated model/pool, so subsequent edits to the same entity write directly (no re-fork).

## 4 — Data flow / edges

- Edit a **pool** entity's target → `upsertPoolEntity` directly.
- Edit a **ref** entity's target → `forkRefAction(ref)` → read new pooled ref at the model slot → `upsertPoolEntity`. The first keystroke triggers the fork; the field stays focused with the typed value (write the full value after fork resolves).
- **Offline / fork fails** (Library unreachable, body not resolvable) → the row shows an inline "couldn't load this entity to translate" note; no crash. (Refs not yet in `resolved` — e.g. preview closed — are shown read-only with a hint to open the preview, since their source/body isn't available.)
- Switching the **Editing language** in the top bar updates the target column live. Closing the view returns to the editor with all edits already in the model/pool.
- Scores referencing piping/logic are irrelevant here; this view is content-text only.

## 5 — Testing

- `collect.ts` (unit): rows for prompt/context/instruction/message/option-labels; **shared entity deduped to one group**; source/target/status/done computed from pool vs resolved; inline option handled.
- `apply.ts` (unit): pool entity → direct write; ref entity → fork-then-write (mock `forkRefAction`); choice-label/label/units/status writes via the body transforms; round-trips Schema-2-valid.
- `TranslationPanel` (RTL): renders grouped rows with source + target; typing a target writes through; progress count updates; "show untranslated only" filters; empty-state when editing language == primary.
- Playwright smoke: open Translate (editing language = fr), type a prompt translation + an option choice label, assert the tree dots go green and the preview (fr) shows the translated text; screenshot.

## 6 — Non-goals (→ FOLLOWUPS)
- Placeholder/Help text translation (rarer; same mechanism, deferred).
- Page/Section/Block **title** translations (different `translations[locale]` field, deferred since ED-E).
- Bulk/auto-machine translation, import/export of translation files (XLIFF/CSV).
- Writing translations back to the shared Library (OD-08-blocked; translations live in the local pool + bundle export).

## 7 — Success criteria
1. A "Translate" topbar toggle opens a full-width source→target view listing every translatable string, deduped by entity.
2. Typing a target translation persists it, **auto-forking Library refs** (shared options forked once → applied everywhere); pool entities written directly.
3. Per-row status + a progress count + "untranslated only" filter; the tree dots and preview reflect edits live.
4. Empty-state guidance when the editing language is the primary.
5. All suites green; a screenshot of the panel translating into `fr`.

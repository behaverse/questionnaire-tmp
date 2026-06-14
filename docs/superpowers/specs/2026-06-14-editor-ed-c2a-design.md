# Editor ED-C2a (Entity Pool + Prompt Editor + New-Item Creation) — Design Spec

**Date drafted:** 2026-06-14
**Author:** Editor ED-C2 brainstorming session (2026-06-14)
**Component:** **Editor**, sub-project **ED-C** (item/Question/Option authoring + OD-15 reusable-entity workflow). ED-C is sliced C1..C4; **C2** is sub-sliced **C2a** (this spec) + **C2b**. C2a delivers the editor-local **entity pool**, the **Prompt editor**, and **new-item creation** — i.e. authoring a brand-new question-item from scratch.
**Builds on:** ED-A (model/shell), ED-B (preview + resolver/bundle), ED-C1 (inline Option editor + canvas `ItemEditor`). Memories `project_editor_ed_a`, `project_editor_ed_b`, `project_editor_ed_c1`.
**Stack:** unchanged (Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright). Reuses ED-C1's `OptionEditor`/`ops` and ED-B's `resolveEntities`/`fetchEntityBody`.
**Authoritative source documents:**

- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) §7 (Prompt fields: `name`/`construct`/`dimension`/`topics`/`reversed`/`content`), §3 (entity inventory), §16 (construct vs dimension, reversed).
- [design/07_editor.md](../../../design/07_editor.md) §2 (create-inline; "principal authoring surface for new reusable entities").
- `schemas/questionnaire/schema.json` `$defs`: `Prompt`, `PromptRef` (version regex `^v\d{2}\.\d{4}(\.dev\d+)?$` — the `.devN` draft suffix), `QuestionInline`, `PageElementInlineItem`, `OptionInline`.
- ED-C1 spec `docs/superpowers/specs/2026-06-14-editor-ed-c1-design.md` (the C1..C4 + C2a/C2b decomposition, the local-pool foundation).
- Editor code: `editor/src/state/{store,types}.ts` (`Draft = {model, source, savedAt}` → extend), `editor/src/persistence/{indexeddb,file,library}.ts`, `editor/src/preview/{resolver,PreviewPane}.tsx` (injectable `fetchEntity`), `editor/src/canvas/{Canvas,ItemEditor}.tsx`, `editor/src/option/`.

---

## 1 — Scope (ED-C2a)

### 1.1 In scope

- **The editor-local entity pool** (`editor/src/pool/`):
  - Store slice `pool: Record<string, EntityBody>` keyed by full pinned ref (`pr_q1@v26.0609.dev1`); actions `upsertPoolEntity(ref, body)`, `removePoolEntity(ref)`, included in `reset()`.
  - **Persistence:** `Draft` gains `entities: Record<string, EntityBody>`; `saveDraft(model, source, pool)` + `loadDraft` round-trip it; the App autosave + boot-restore extend to carry the pool. (Back-compat: an old draft without `entities` loads with an empty pool.)
  - **Bundle export:** a new **"Export bundle"** action emits `{ questionnaire, entities }` (the shape ED-B's preview resolver consumes); plain **Export** still emits the questionnaire JSON only.
  - **Minting** (`editor/src/pool/mint.ts`, pure): `draftVersion(metadataVersion)` → strip any existing `.devN`, append `.dev1` (e.g. `v26.0609` → `v26.0609.dev1`); `mintEntityId(prefix, existingIds)` → first free `<prefix>_new_<n>` not in `existingIds`. Deterministic (no `Date`).
- **Pool-first, live preview:** PreviewPane's `fetchEntity` becomes a **pool-aware fetcher** — `pool[ref]` (read fresh) else `fetchEntityBody(ref)` (Library, cached). PreviewPane subscribes to `pool` and **re-resolves on model-OR-pool change** (so editing a pool prompt's text updates the preview live); Library results stay cached, pool entities are not cached.
- **Prompt editor** (`editor/src/entity/PromptEditor.tsx`, controlled `{ prompt, locale, onChange }`): per-locale **text** (primary language; writes `content.{lang}.{status:'draft', text}`) + `name` + `construct` + `dimension` + `topics` (comma-separated ↔ `string[]`) + `reversed` (checkbox). Pure field helpers as needed; emits canonical `Prompt` body (`id` + `content` required by schema; the editor preserves `id`).
- **ItemEditor integration:** when a selected inline item's `question.prompt.ref` **resolves to a pool entity**, the ItemEditor shows the **PromptEditor** (editable) above the Option editor; edits call `upsertPoolEntity(ref, body)`. A prompt ref **not** in the pool (a Library pin) keeps the read-only chip + a "fork to edit (ED-C4)" note.
- **New-item creation:** a **"+ Add item"** action in the canvas (page or section element list, beside ED-C1/ED-A controls): mint a new pool **Prompt** (`pr_new_<n>@<draftVersion>`, empty primary-locale text `{status:'draft', text:''}`) + a **default inline Option** (choice / ordinal / single, 2 placeholder rows "Option 1"/"Option 2", values 0/1) + append an inline item `{ question: { prompt: { ref } }, option }` to the page/section; select it → the ItemEditor opens with the PromptEditor + Option editor. A new item is intentionally **invalid until the prompt text is filled** (surfaced by the banner, not blocked).
- **Tests:** pure `mint.ts` + pool helpers (TDD); PromptEditor RTL; new-item-creation integration (store: add item → pool gains a prompt, page gains an inline item; round-trips valid once text filled; bundle export round-trips); a Playwright "add item → type prompt → preview shows it" smoke + screenshot.

### 1.2 Non-goals (deferred)

- **No Context / Instruction editors**, no **Message** authoring (→ ED-C2b).
- **No pick-from-Library**, no hard-pin/upgrade UI (→ ED-C3).
- **No editing or forking of Library-pinned content** — Library-ref prompts stay read-only with a fork note (→ ED-C4).
- **No multi-locale translation** — primary language only (→ ED-E).
- **No promotion of pool entities to real Library versions** (assign published `@vYY.MMDD`, submit) — OD-08-blocked.
- **No Solution / scoring / logic authoring** (→ ED-D / out of scope).
- **No saved-Item or saved-Question entities** (`it_*`/`q_*`) — C2a authors *inline* items referencing pool Prompts + inline Options. (Promoting an inline item to a saved Library entity is a later/curation concern.)

---

## 2 — Architecture

- **`editor/src/pool/mint.ts`** (pure): `draftVersion(metadataVersion: string): string`, `mintEntityId(prefix: string, existingIds: Iterable<string>): string`. No React/store.
- **`editor/src/pool/collectIds.ts`** (pure, or fold into mint): gather all entity ids/refs in the model + pool for uniqueness.
- **Store slice** (in `editor/src/state/store.ts`): add `pool` + `upsertPoolEntity`/`removePoolEntity`; extend `loadModel`/`reset`. The pool lives beside `model`.
- **Persistence:** extend `editor/src/state/types.ts` `Draft` with `entities`; `editor/src/persistence/indexeddb.ts` `saveDraft(model, source, pool)`; `editor/src/persistence/file.ts` gains `exportBundle(model, pool)` (download `{questionnaire, entities}`); App wires autosave/restore/export-bundle.
- **`editor/src/pool/poolFetcher.ts`**: `makePoolFetcher(getPool: () => Record<string, EntityBody>): FetchEntity` → `async (ref) => getPool()[ref] ?? fetchEntityBody(ref)`. The editor builds it from the store and injects into PreviewPane; PreviewPane re-resolves on pool change.
- **`editor/src/entity/PromptEditor.tsx`**: controlled prompt-body editor.
- **`editor/src/canvas/ItemEditor.tsx`** (extend): show PromptEditor for pool prompts; wire `upsertPoolEntity`.
- **`editor/src/canvas/Canvas.tsx`** (extend): "+ Add item" composer (mint prompt → pool, default option, append inline item, select).
- **`editor/src/pool/newItem.ts`** (pure): `buildNewItem(model, pool, draftVersion) => { item, promptRef, promptBody }` — the pure composer the Canvas action calls (keeps the mutation logic testable).

Dependency direction: `pool/` (pure) → `model/` + ED-B `resolver`/`library`; `entity/` → `model`; canvas composes. Store holds model + pool.

## 3 — Canonical Prompt body (target)

```jsonc
{
  "id": "pr_new_1",
  "name": "marry_foreign",            // optional
  "construct": "sensation_seeking",   // optional
  "dimension": "agreement",           // optional
  "topics": ["risk_taking"],          // optional
  "reversed": false,                  // optional (default false)
  "content": { "en": { "status": "draft", "text": "…stem text…" } }   // required
}
```
Stored in the pool under key `pr_new_1@v26.0609.dev1`. `id` + `content` are schema-required (`content.{lang}.text` is `minLength:1` — empty text is transiently invalid, surfaced by the banner). `topics` UI: comma-separated string ↔ trimmed non-empty `string[]` (omit the field when empty).

## 4 — Data flow: authoring a new item

1. Author selects a page/section, clicks **"+ Add item"**.
2. `buildNewItem` mints `promptRef = pr_new_<n>@<draftVersion>` + an empty Prompt body + a default inline Option; returns the inline item element.
3. The Canvas action: `upsertPoolEntity(promptRef, promptBody)` then `applyEdit(m => insertNode(m, [...path,'elements'], end, item))`, then `select(itemPath)`.
4. ItemEditor renders: PromptEditor (pool prompt, editable) + OptionEditor (inline option). Editing the prompt → `upsertPoolEntity`; editing the option → `updateNodeProps` (ED-C1).
5. Preview (if open) resolves the pool prompt + inline option → renders live; the validation banner flags the empty prompt until filled.
6. **Export bundle** → `{questionnaire, entities}` re-validates (questionnaire Schema-2-valid; entities are the pool bodies).

## 5 — Decisions / to verify during build

- **Draft version source:** derive from `metadata.version` (strip existing `.devN`, append `.dev1`). If `metadata.version` is absent/malformed, fall back to a constant valid `v00.0001.dev1`? No — the scaffold always sets `version`; if missing, use the current schema CalVer `v26.0609.dev1` as a documented fallback. (Confirm `metadata.version` is always present from ED-A's scaffold + Library loads.)
- **Pool key = full ref** (`id@version`), matching how `resolveDocument`/`collectRefs` key things; `parseRef` (ED-B) splits it. The PromptEditor edits `pool[ref]`; renaming `id` is **out of C2a** (would re-key the pool + repoint the item — a later nicety).
- **Live-preview-on-pool-edit mechanism:** PreviewPane reads `pool` via a store selector; its resolve effect deps include `pool`; pool entities are not cached (read fresh each resolve), Library fetches cached in a ref-keyed map that survives pool edits. Verify a prompt-text edit updates the preview within the debounce.
- **Default option:** choice/ordinal/single, rows `[{index:1,value:0},{index:2,value:1}]` + content `en.options [{1,"Option 1"},{2,"Option 2"}]`, `status:draft`. (Reuses ED-C1 `ops` shapes.)
- **"+ Add item" placement:** in the canvas element-list view for a selected page or section (the same view that has "+ Add section"); for the questionnaire root, items aren't direct children (pages are) so no "+ Add item" there.
- **Back-compat draft load:** a pre-C2a IndexedDB draft (no `entities`) loads with `pool = {}`.

## 6 — Success criteria

ED-C2a is done when: with any questionnaire open, the author can click **"+ Add item"**, get a new editable inline item, **type a new prompt** (stored in the pool) and adjust its **Option**, see it render in the **live preview** (pool-resolved), and **export a `{questionnaire, entities}` bundle** that re-validates (questionnaire Schema-2-valid); the pool **survives reload** (IndexedDB); editing a pool prompt updates the preview live; all suites green + a screenshot delivered.

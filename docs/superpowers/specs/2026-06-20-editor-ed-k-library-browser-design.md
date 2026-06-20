# ED-K — Library Entity Browser (design)

**Date:** 2026-06-20 · **Status:** approved (owner, 2026-06-20) · **Stage:** ED-K (editor, under `editor/`)

## Problem

The editor can author questionnaires and (via the ED-J2 "Translate Library entities" workbench) batch-translate Library entities. But there's no way to **browse the Library, inspect an individual entity, and edit or augment it**. The owner wants a single "Library entities" workspace that unifies browse → inspect → edit → translate, **replacing** the translate-only workbench (translation folds in as one tab).

Two realities shape the design:
- The **Library is read-only** (no write API; OD-08/Identity-gated). So "edit/augment" means **local edits exported as a contribution file** for a curator to ingest — never a live write-back. (Same contribution flow the workbench already uses, generalized.)
- The standalone entity editors (`PromptEditor`, `OptionEditor`, `ContextEditor`, `InstructionEditor`, `MessageEditor`) are pure `body + locale + onChange` components with **zero store coupling** — directly reusable over a Library-fetched body. The questionnaire-coupled `ItemEditor` is **not** reusable and is out of scope.

## Decisions (owner-approved)

1. **Full structural editing** (not just content/translations). Editing reuses the full entity editors, so structural fields (prompt `construct`/`dimension`/`reversed`; option `measurement_type`/choice `value`/validation; etc.) are editable — for the 5 types that have editors.
2. **Replace + fold in the workbench.** The new "Library entities" browser replaces the "Translate Library entities" start-screen entry; translation becomes the inspector's **Translate** tab. The workbench's reusable internals (`fields.ts`, `apply.ts`, `load.ts`, IndexedDB session persistence) are kept; `TranslationWorkbench.tsx` is removed once the browser covers its capabilities (final phase).
3. **All types browsable.** Browse/inspect every Library type (`prompt, option, item, question, message, context, instruction, placeholder, help, regex, solution, scorer`); **edit + translate** the 5 with editors (`prompt, option, context, instruction, message`); **inspect-only** for the other 7 (a clear "editing not supported yet" note).
4. **Contribution carries the full entity body** (because of decision 1). This **supersedes** the J2/D4b translation-only content-patch bundle. New shape (see Architecture). Read-only Library → export only.

## Architecture

Master/detail, reusing existing units:

```
"Library entities" view (App.libraryBrowser flag; start-screen card)
├─ Left: LibraryEntityList   — type selector (12 types) + search (id/content, picker.ts helpers)
│                              + status filter; rows show id/title/version + edited/status badges
└─ Right: EntityInspector(ref) — tabs:
     • Inspect   — read-only resolved view of the entity (all types)
     • Edit      — PromptEditor / OptionEditor / ContextEditor / InstructionEditor / MessageEditor
                   (the 5 editable types); read-only note for the other 7
     • Translate — per-locale content fields + Auto (translateText) + per-locale status
   shared local edit session: fetched bodies in a `bodies` map, autosaved to IndexedDB,
   "✓ Saved / Saving…" indicator, per-entity status; "Download contribution" export
```

### Reused units (read-only on these; no behavior change unless noted)
- **Library read API** — `editor/src/persistence/library.ts`: `listAllEntities`, `fetchEntityBody`, `searchEntities`, `latestVersion`, `parseRef`, `PREFIX_TYPE`. The browser's data client mirrors the workbench's `defaultWbClient` (list + fetch).
- **Browse/search helpers** — `editor/src/library/picker.ts` (`searchableText`, `bodySnippet`) + the throttled-content-index pattern (`mapLimit`, cap 300, module cache). The new `LibraryEntityList` renders **inline** (not the modal `LibraryPicker`); shared list logic is extracted into a small `entityList` helper or reused from `picker.ts`.
- **Entity editors** — `PromptEditor`, `OptionEditor`, `ContextEditor`, `InstructionEditor`, `MessageEditor` (+ `option/ops.ts`). Used directly with `{ body, locale, onChange }`.
- **Translate machinery** — `editor/src/translate/workbench/fields.ts` (`entityFields`), `editor/src/translate/apply.ts` (`applyTranslation`/`applyStatus`), `editor/src/translate/translateClient.ts` (`translateText`).
- **Session persistence** — `editor/src/persistence/indexeddb.ts` (`saveWorkbench`/`loadWorkbench` pattern), but under a **new key** (`library-session`) so it doesn't collide with the questionnaire draft or the (removed) workbench slot.

### New units
- `editor/src/library/browser/LibraryEntityList.tsx` — inline browse list (type + search + status filter).
- `editor/src/library/browser/EntityInspector.tsx` — the detail pane with Inspect/Edit/Translate tabs, wiring the right editor per type.
- `editor/src/library/browser/LibraryBrowser.tsx` — the top-level view holding the edit session (bodies map, persistence, contribution export) + master/detail layout.
- `editor/src/library/browser/contribution.ts` — the new full-body contribution builder + download.
- `editor/src/library/browser/session.ts` (or extend `indexeddb.ts`) — `saveLibrarySession`/`loadLibrarySession`.

### Edit session model
- Selecting an entity fetches its body (via the read API) and shows it. Editing it makes a **local working copy** in the session `bodies` map keyed by `id@version` (the source pin). No questionnaire model is involved (so `forkRefAction` — which repoints a loaded model — is **not** used; the browser holds bodies directly, exactly as the workbench does).
- Edits flow through the editors' `onChange` → update `bodies` → mark dirty → debounced autosave to IndexedDB → "✓ Saved". Per-entity per-locale status (draft/complete/validated) via `applyStatus`; **complete/validated locks the editors read-only** (consistent with the workbench fix).
- The session restores on reopen (so in-progress edits survive reload).

### Contribution export (new format, supersedes the translation bundle)
```json
{
  "schema": "questionnaire-contribution/v1",
  "generated_at": "<ISO>",
  "entries": [
    { "id": "opt_agreement_7", "source_version": "v26.0606", "type": "option", "body": { …full edited entity body… } }
  ]
}
```
Only entities the user actually edited are included. Downloaded as `library-contribution.<timestamp>.json`. A curator ingests these into `questionnaire-library-content` (separate, owner step). The old `translations.<lang>.json` content-patch export is removed (folded into this).

### Batch translate (kept from the workbench)
A list-level action **"Auto-translate untranslated → [target locale]"** runs `translateText` over the loaded entities' untranslated fields (throttled via `mapLimit`), so "translate all at once" survives the fold-in.

## Data flow
1. User opens "Library entities" → picks a type + (optional) search/status filter → `listAllEntities` populates the list (content search lazily indexes bodies, capped 300).
2. User selects an entity → `fetchEntityBody` (cached) → Inspect shows the resolved body.
3. User edits (Edit tab) or translates (Translate tab) → `onChange`/`applyTranslation`/`applyStatus` update the session `bodies[id@ver]` → dirty → debounced `saveLibrarySession` → "✓ Saved".
4. User clicks "Download contribution" → `buildContribution(editedBodies)` → JSON download.

## Error handling
- Library fetch/list failure → inline error in the list/inspector; never crashes (mirrors the workbench).
- Non-editable type on the Edit tab → a clear "Editing isn't supported yet for `<type>` — inspect + translate only" message (Inspect/Translate still work).
- Translate failure → per-field inline error (as today); manual editing unaffected.
- Status complete/validated → editors read-only (flip to draft to edit).
- IndexedDB unavailable → editing still works in-memory; the "Saved" indicator degrades to absent (no throw).

## Testing
- `LibraryEntityList`: type switch + search filter (id/content) + status filter narrow the rows (injected client).
- `EntityInspector`: tab switching; each of the 5 editors mounts with a body + emits `onChange`; non-editable type shows the inspect-only note.
- Edit session: an edit updates `bodies`; `buildContribution` emits the documented full-body shape for edited entities only; round-trips through `saveLibrarySession`/`loadLibrarySession`.
- Translate tab: `entityFields` + `applyTranslation` + Auto (mocked `translateText`) writes the target + status.
- Lock-on-complete: marking complete makes the editors/textareas read-only.
- Contribution builder unit test (full-body shape; only-edited entities).
- e2e: open Library entities → browse a type → inspect → edit a prompt → mark complete → Download contribution (stubbed Library list/fetch).
- All existing suites stay green; the removed workbench's reusable modules keep their tests.

## Non-goals (v1)
- **No live Library write** — contribution export only (OD-08).
- **No editing of the 7 editor-less types** (`item, question, placeholder, help, regex, solution, scorer`) — inspect-only (+ translate where they have a `content` map).
- **No creating brand-new entities here** — that remains the questionnaire editor's authoring flow (ED-C).
- **No scorer editing/authoring** (separate concern).
- **No structural-diff/merge UI** — the contribution is the full body; the curator handles versioning/merge on ingest.

## Decomposition (phases → one plan, three task groups)
- **K1 — Browse + Inspect + nav.** `LibraryEntityList` + `EntityInspector` Inspect tab + `LibraryBrowser` shell + start-screen "Library entities" card + App wiring. (Workbench still present.) Browse/inspect read-only; no editing yet.
- **K2 — Edit session + Edit tab + contribution export.** Local `bodies` session + IndexedDB persistence + "Saved" indicator; the 5 structural editors wired into the Edit tab (read-only note for the rest); per-entity status + lock-on-complete; `contribution.ts` + Download.
- **K3 — Translate tab + batch + remove old workbench.** Per-entity Translate tab (`entityFields`/`applyTranslation`/Auto/status) + list-level batch translate; remove `TranslationWorkbench.tsx` + its start-screen card + the old `translations.<lang>.json` export (keep `fields/apply/load`/persistence).

Each phase lands editor-only to master via the multi-agent isolate-push pattern (see `project_editor_ed_i`). Currently ~419 unit + e2e green; keep them green.

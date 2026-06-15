# Editor ED-C4 (OD-05 Override + Fork) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-C4 brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-C** (item/Question/Option authoring + OD-15 reusable-entity workflow); ED-C is sliced C1..C4. **C4** (this spec) is the **final ED-C slice**: the OD-05 reference-override + fork surface. **Completes ED-C.**
**Builds on:** ED-C1..C3b — the entity pool (`.devN` drafts), the pool editors (PromptEditor / OptionEditor / Context / Instruction / Message), pick-from-Library + hard-pinned read-only refs, the Library entity-body endpoint + client, and the C3b `repoint`-all mechanic. Memories `project_editor_ed_c3a`, `project_editor_ed_c3b`, `project_editor_ed_c2a`, `project_od15_reusable_entity_pivot`.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright (editor-only).
**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §3: "**Override surface** (per OD-05): on a reference, the author may freely edit `position`, `required`, and `show_if`. Any edit to a non-overridable field (`prompt`, `type`, `properties`, `validation`, `tags`, default option-set, per-question `style`) opens a **fork dialog** with three actions: (a) **derive locally** — create a study-scoped fork in this questionnaire only, (b) **propose a new shared version** — open a Library PR through the contribution workflow, or (c) **cancel**." OD-05 (resolved 2026-05-21) + OD-06 (hard-pin) + OD-08 (Identity — blocks the contribution/PR path).
- Editor code: the read-only Library-ref chips in `editor/src/canvas/ItemEditor.tsx` (prompt/context/instruction/option) + `editor/src/canvas/MessagePane.tsx` + the Canvas element-list ref chips; `editor/src/persistence/library.ts` (`fetchEntityBody`, `parseRef`); the store (`pool`, `upsertPoolEntity`, `applyEdit`, the C3a picker slice pattern); `editor/src/model/tree.ts` (`upgradeRef` = replace-all repoint, `updateNodeProps`); `editor/src/pool/mint.ts` (`draftVersion` — same `.devN` rule).

---

## 1 — Scope (ED-C4)

### 1.1 In scope

- **`forkVersion(pinnedVersion)`** (`editor/src/library/forkVersion.ts`, pure): strip any existing `.devN`, append `.dev1` (e.g. `v26.0609` → `v26.0609.dev1`). Same rule as `draftVersion` but applied to the *entity's pinned version* (provenance: "forked from v26.0609"). Robust to malformed → returns a valid `…dev1` (fallback `v26.0609.dev1`).
- **`repointRef(model, oldRef, newRef)`** in `editor/src/model/tree.ts`: the generic pure replace-all-occurrences repoint (the existing `upgradeRef` is the same mechanic — **rename `upgradeRef` → `repointRef`, keep `upgradeRef` as a thin re-export alias** so C3b's `upgradeRefAction` keeps working).
- **Fork flow** (`editor/src/library/fork.ts` orchestration helper + store action): `forkRef(ref)` →
  1. `fetchEntityBody(ref)` (the C3a `/definition` endpoint) — the body to copy;
  2. compute `forkRef = "<id>@<forkVersion(pinnedVer)>"` (id from `parseRef`);
  3. `upsertPoolEntity(forkRef, body)` (the pool copy is now editable);
  4. `applyEdit(m => repointRef(m, ref, forkRef))` (repoint every occurrence in this questionnaire — study-scoped fork);
  5. on body-fetch failure → surface an error (no repoint).
  Implemented as a store action `forkRefAction(ref)` (async) using an injectable fetcher (default `fetchEntityBody`) for testability.
- **Fork dialog** (`editor/src/library/ForkDialog.tsx`, modal via a store slice mirroring the picker): three actions —
  - **Derive locally** → `forkRefAction(ref)` then close; the chip becomes the editable pool editor.
  - **Propose a new shared version** → **disabled** button + tooltip "Needs Identity / Library write (OD-08)".
  - **Cancel** → close.
  Store slice: `fork: { ref } | null` + `openFork(ref)` / `closeFork()` (cleared in `reset()`); an App-level `ForkDialog` host renders it.
- **"Fork to edit" trigger** — replace the static "fork to edit (ED-C4)" note on each read-only Library-ref chip (ItemEditor prompt/context/instruction/option + MessagePane + Canvas element-list refs) with a **"Fork to edit" button** → `openFork(ref)`.
- **`required` safe-override** (OD-05 freely-editable): a **`required` checkbox** on item elements (saved-item-ref + inline item) editing the page-element `required` via `updateNodeProps(itemPath, { required })`. (The other OD-05 free overrides: `position` = tree reorder, already shipped; `show_if` = ED-D.)
- **Tests:** pure `forkVersion`; `repointRef` (replace-all, immutable; `upgradeRef` alias still works); store `forkRefAction` (injected fetcher → pool gains the fork + ref repointed) + `openFork`/`closeFork`; `ForkDialog` RTL (derive → forkRefAction; propose disabled; cancel); chip "Fork to edit" wiring; `required` checkbox; a Playwright fork smoke (stubbed `/definition`) + screenshot.

### 1.2 Non-goals (deferred)

- **No "propose a new shared version" / Library write / contribution PR** — OD-08-blocked (the button is disabled).
- **No `show_if` editing** (the third OD-05 free override) — that's the logic builder, **ED-D**.
- **No translation** (→ ED-E).
- **No per-occurrence forking** — derive-locally is study-scoped (all occurrences of the ref). Per-occurrence is a possible later refinement.
- **No deep/auto fork of nested refs** — forking a saved **Item** gives a local Item binding (`{question:{ref}, option:{ref}}` copied to the pool); its nested question/option are still Library refs the author can fork further. (A dedicated saved-Item editor isn't in scope; forking surfaces the binding, and the nested prompt/option keep their own "Fork to edit".)
- **No diff** of the original vs forked content (out of scope; the author edits the fresh pool copy).

---

## 2 — Architecture

- **`editor/src/library/forkVersion.ts`** (pure): `forkVersion(pinnedVersion) → string`.
- **`editor/src/model/tree.ts`**: rename `upgradeRef` → `repointRef` (generic replace-all repoint); `export const upgradeRef = repointRef` (back-compat for C3b's `upgradeRefAction`).
- **Store**: `fork: { ref: string } | null` slice + `openFork(ref)` / `closeFork()`; `forkRefAction(ref, fetchBody?)` (async; default `fetchEntityBody`) doing fetch → `upsertPoolEntity` → `applyEdit(repointRef)`. `reset()` clears `fork`.
- **`editor/src/library/ForkDialog.tsx`** — modal (derive / propose-disabled / cancel), injectable for RTL; an App host renders it when `fork` is set.
- **Chips** (ItemEditor / MessagePane / Canvas) — the static fork note → a "Fork to edit" button calling `openFork(ref)`.
- **`required` checkbox** — in ItemEditor for the selected item element (and/or the Canvas element row), wired to `updateNodeProps(itemPath, { required })`.

Dependency direction: `library/` (forkVersion + ForkDialog + fork action) + `model/tree` → store; UI reads the store. Reuses `parseRef`/`fetchEntityBody` (C3a) + the picker-slice + `upgradeRef`/replace-all (C3b) patterns wholesale.

## 3 — Fork data flow

1. Author selects an item whose prompt is a **Library** ref `pr_x@v26.0609` (not in pool) → ItemEditor shows the read-only chip + **"Fork to edit"**.
2. Click → `openFork("pr_x@v26.0609")` → `ForkDialog` opens (derive / propose-disabled / cancel).
3. **Derive locally** → `forkRefAction("pr_x@v26.0609")`: `fetchEntityBody` → body `{id:"pr_x", content:{…}}`; `forkRef = "pr_x@v26.0609.dev1"`; `upsertPoolEntity(forkRef, body)`; `applyEdit(repointRef(m, "pr_x@v26.0609", "pr_x@v26.0609.dev1"))`; `closeFork()`.
4. The prompt ref now points at a **pool** entity → ItemEditor renders the editable `PromptEditor` (it's a pool prompt). Edits persist to the pool; the preview re-resolves to the forked body; the bundle export carries it. The original Library version is untouched (a local copy).
5. (OD-06 interplay: the forked ref is `.devN`, so C3b's staleness check never flags it — drafts aren't Library pins.)

## 4 — Decisions / to verify during build

- **`repointRef` rename:** keep `export function repointRef(...)` + `export const upgradeRef = repointRef` so C3b's `upgradeRefAction` import is unbroken; update the store's fork action to use `repointRef`.
- **Fork repoints ALL occurrences** (study-scoped). The common case is one occurrence; multi-use refs all become the local fork (intended). The body fetch happens once; the repoint is a pure replace-all.
- **forkRef version:** `forkVersion(pinnedVer)`. If the pinned version is already `.devN` (a pool draft — shouldn't reach a "Fork" button since pool drafts render editable, not as read-only chips), `forkVersion` still strips+re-appends `.dev1` (idempotent-ish, harmless).
- **Body-fetch failure:** `forkRefAction` leaves the model unchanged + sets a transient error (a small "fork failed — Library unavailable" message in the dialog or a console-surfaced note); does NOT repoint. Confirm the surface during build (dialog inline error preferred).
- **`required` placement:** simplest is a checkbox in the ItemEditor for the selected item element. Confirm whether to also surface it on Canvas element rows (defer if it complicates the list).
- **Chips covered:** prompt/context/instruction/option (ItemEditor) + message (MessagePane) + saved-item/message (Canvas list). The same "Fork to edit" → `openFork(ref)` pattern for each.

## 5 — Success criteria

ED-C4 is done when: a Library-pinned ref shows a **"Fork to edit"** action → the fork dialog (derive-locally enabled; propose-shared disabled with an OD-08 note; cancel); **derive-locally** copies the entity into the pool as `<id>@<pinnedVer>.dev1`, repoints the ref (all occurrences), and the chip becomes the editable pool editor whose edits preview live + export in the bundle and round-trip Schema-2-valid; the OD-05 **`required`** override is editable on item refs; never writes to the Library (OD-08). All suites green + a screenshot delivered. **This completes ED-C.**

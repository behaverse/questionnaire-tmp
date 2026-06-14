# Editor ED-A (App Shell + Canonical Model + Structure Tree) — Design Spec

**Date drafted:** 2026-06-14
**Author:** Editor ED-A brainstorming session (2026-06-14)
**Component:** **Editor**, sub-project **ED-A** — the first of six stages (see §0 decomposition). The custom React + TypeScript authoring tool researchers use to create, adapt, version, and translate questionnaires, producing canonical Schema 2 JSON. ED-A is the structural foundation: open/create/load/save + the five-concept structure tree + Schema-2-valid round-trip.
**Target repo:** `questionnaire-editor` (built in the current folder under `editor/` for now; mirrors `library-web/` + `web-viewer/`; migrates at the deferred repo split per [design/14_repository_topology.md](../../../design/14_repository_topology.md)).
**Stack (locked by OD-01 — no SurveyJS):** Vite · React 19 · TypeScript · Tailwind CSS · vitest + React Testing Library + Playwright chromium smoke (mirrors `web-viewer/` / `library-web/`). State: Zustand + Immer. Drag-and-drop: dnd-kit. Validation: Ajv (in-browser).
**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) — the Editor component spec: 11 capability areas, user flows (A/B/C), the OD-01/03/05/06/11 referenced decisions.
- [design/05_data_model.md](../../../design/05_data_model.md) §"Schema 2" + [schemas/questionnaire/schema.json](../../../schemas/questionnaire/schema.json) — Schema 2 v26.0609, the canonical JSON ED-A reads/writes.
- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) — the OD-15 eleven-entity content model; §14 page-element shapes; §15 page composition (the shapes ED-A's tree renders as ref chips).
- Memory `project_pagination_model` (OD-12) — the five-concept structure (Block, Page, Section, Subscale, Tag); pages stay top-level addressable.
- ODs **OD-01** (custom React, no SurveyJS), **OD-03** (preview = renderer library — ED-B), **OD-05** (reference overrides), **OD-06** (hard-pin + CalVer), **OD-08** (Identity — blocked, deferred), **OD-12** (5-concept structure).
- `library-web/` + `web-viewer/` — the sibling SPAs whose Vite/React 19/TS/Tailwind + vitest conventions ED-A mirrors.

---

## 0 — Decomposition of the Editor (ED-A → ED-F)

The Editor is too big for one spec/plan cycle. Mirroring the Viewer Service (VS-A..E) and Web Viewer (WV-A..F), it is sliced so **every stage ends with an author-visible, end-to-end-testable increment**, and the heavy building blocks (renderer library, WASM evaluator, Scorer) block only the stages that genuinely need them. Decomposition confirmed with the owner 2026-06-14.

| Stage | Contents | Depends on | Gate |
|---|---|---|---|
| **ED-A** (this spec) | New `editor/` SPA. Open/create/load/save a Schema-2 questionnaire; in-memory canonical model + Ajv round-trip validation; the 5-concept tree (Block ▸ Page ▸ Section ▸ Item/Message) in a left rail with drag-reorder + move-across-parents; main canvas + right-hand inspector for **structural** nodes + `metadata` (`style`/`flow`). Leaf content is reorder/delete/move-only (ref chips). Persistence = browser-local (IndexedDB autosave) + file open/save + open-from-Library. | Schema 2 (built), Library read API (live) | Load a real Library questionnaire → edit structure/metadata → export → **round-trips Schema-2-valid** |
| **ED-B** | Inline WYSIWYG preview: split-pane using `@behaverse/questionnaire-renderer` (OD-03) directly; live re-render on edit; language + device-frame pickers. Resolves the **denormaliser-for-preview** question (port a JS denormaliser / wasm / service — a real design question for that stage). | ED-A, renderer lib, denormaliser | Loaded questionnaire renders in-pane identically to the Web Viewer |
| **ED-C** | Item / Question / Option authoring + the OD-15 reusable-entity workflow: type-aware item editor; pick-from-Library (embedded read-only browser) vs create-inline; hard-pin `@vYY.MMDD` (OD-06) + the OD-05 override/fork surface. | ED-A, Library read API | Author a new item end-to-end; references hard-pinned; round-trips valid |
| **ED-D** | Logic + validation + scoring builders: structured skip/visibility/piping/branching/randomization + per/cross-question validation + `scores[]` (OD-16). Live checks via `@behaverse/expression-evaluator` (OD-11) + the reference Scorer. | ED-A/C, evaluator, Scorer | Authored expressions validate + preview-evaluate identically to the viewer |
| **ED-E** | Translation interface: side-by-side source/target, one row per translatable text element, per-row status, completeness indicator (over the language-keyed `content` map). | ED-A/C | Add a locale, translate, round-trips valid |
| **ED-F** | Preview deployment + export: "Open in viewer" → ephemeral VS `preview` deployment; export canonical JSON / PDF / printable summary. | ED-A.., VS deployment API | Real preview deployment opens in the live Web Viewer; JSON re-validates |

Build order: **ED-A → ED-B → ED-C → ED-D → ED-E → ED-F**. Each stage gets its own spec → plan → subagent-driven TDD build → review → merge to master locally + push (no PRs).

**Cut / deferred across the whole Editor (YAGNI / OD-08-blocked):** projects + collaborators/roles/invites (cap. 1), submit-to-Library / contribution PRs / review threads (cap. 11), cross-user translation memory (cap. 7) — all **Identity-blocked**. Full version-control UI (cap. 9: side-by-side diff, branching, tags) is descoped to a thin "autosave + export" in ED-A; the rich diff/branch UI is a later optional stage only if wanted. Format-specific importers (cap. 10) stay separate tools; the Editor surface is a generic "load canonical JSON" entry point.

---

## 1 — Scope (ED-A)

### 1.1 In scope

- A new `editor/` Vite + React 19 + TS + Tailwind SPA (package `questionnaire-editor`), mirroring `web-viewer/` / `library-web/` conventions (tsconfig layout, vitest + RTL, npm scripts, theme tokens for a polished default look).
- **Canonical model layer** (pure TS, no React) — the testable heart, built TDD-first (§3):
  - `parse(json)` / `serialize(model)` — load/round-trip canonical Schema 2 **with hard-pinned references intact** (page elements stay as `{ref: "it_…@v…"}` / `{ref: "msg_…@v…"}`; never resolved/inlined in ED-A).
  - **Tree operations** as pure functions: `insertNode`, `deleteNode`, `moveNode` (across parents), `reorder`, `updateNodeProps`, `updateMetadata` — each takes a model, returns a new model, never produces structurally-invalid output.
  - **Node addressing** by stable id/path so selection + DnD target the right node deterministically.
  - `validate(model)` — Ajv wrapper over the **bundled** Schema 2 (+ Schema 1 for `$ref`s; all `$id`s registered, mirroring `tools/validate_schemas.py`'s registry).
- **State store** (§3.4) — Zustand + Immer holding the canonical model + UI state (selection, expanded nodes, dirty flag, last validation result).
- **Persistence layer** (§5):
  - **IndexedDB autosave** — the working draft continuously autosaves (debounced) for crash recovery; reload restores the in-progress draft.
  - **File open/save** — import a `.json` from disk; **Export** the canonical JSON (download).
  - **Open from Library** — fetch one **unresolved** definition by id+version from the live read API (refs kept). ED-A fetches only the questionnaire JSON; never reusable-entity bodies.
- **The 3-pane shell** (§4) — confirmed IA "3-pane + preview-split":
  - **Topbar** — questionnaire title, locale indicator (inert in ED-A; wired in ED-B/E), `✓ Validate`, `▢ Preview` (disabled placeholder — ED-B fills it), `Export`/`Save`, dirty indicator.
  - **Start screen / file menu** — New · Open file · Open from Library (id+version).
  - **StructureTree** (left) — Block ▸ Page ▸ Section ▸ Item/Message; drag-reorder + move-across-parents via dnd-kit (accessible); selection; expand/collapse; add/delete structural nodes.
  - **Canvas** (center) — the selected node's children as a reorderable list; items/messages as **read-only ref chips**; `+ Add` for structural children only.
  - **Inspector** (right) — type-aware: questionnaire `metadata` / Block / Page / Section get editable title + `style` + `flow` panels (per the inheritance rules in 05_data_model); a selected Item/Message shows its refs + structural `required`/`position` context read-only (full editing in ED-C; `show_if` in ED-D).
- **Live validation** — Ajv runs on demand (`✓ Validate`) and on load; inline error surfacing keyed to nodes where possible. Opening an invalid file is allowed (you can see what's wrong). **Export is allowed when invalid, with a warning** (researchers save WIP and fix later — a file editor must not trap work).
- **Testing & the gate** (§6) — heavy TDD on model ops + validation; **round-trip property tests against real Library fixtures**; RTL for pane interactions; a Playwright chromium smoke (load → reorder → export → re-validate) with a screenshot for owner review.

### 1.2 Non-goals (deferred to ED-B..F)

- **No inline preview / renderer-library embedding** — the `▢ Preview` button is a disabled placeholder (→ ED-B).
- **No item / Question / Option authoring**, no pick-from-Library browser, no create-inline, no entity-body resolution, no hard-pin upgrade/diff UI, no OD-05 fork dialog (→ ED-C). Leaf content is reorder/delete/move-only.
- **No logic / validation / scoring builders**, no expression editing (incl. `show_if`), no WASM evaluator, no Scorer (→ ED-D).
- **No translation interface**, no per-row status editing; the locale indicator is inert (→ ED-E).
- **No preview deployment, no PDF / printable-summary export** — canonical JSON export only (→ ED-F).
- **No version diff / branching / tags / snapshot list** — autosave + export only.
- **No backend, no auth, no projects/collaborators** (OD-08-blocked).
- **No format-specific importers** — the only import is "load canonical Schema 2 JSON."

---

## 2 — Stack rationale

- **Static SPA, no backend.** ED-A is single-user, local/offline (OD-08 blocks the multi-user backend). A pure SPA mirrors `library-web/`/`web-viewer/`, deploys trivially, and needs nothing running. The FastAPI + Postgres backend nominated in design/07 §"Implementation stack" (OD-04) belongs to the auth'd, multi-user future and is deferred with the rest of OD-08.
- **Zustand + Immer** for state — tiny, ergonomic immutable tree edits, trivial to test, no Redux boilerplate. (Alternatives considered: `useReducer`+Context — more wiring; Redux Toolkit — heavier than needed.)
- **dnd-kit** for the tree — accessible (keyboard DnD), actively maintained, React-19-ready; the structure tree's reorder/move is the one genuinely interaction-heavy surface in ED-A.
- **Ajv in-browser** — the same validator family used by `tools/` + `web-viewer/`; we bundle Schema 2 (+ Schema 1) and register `$id`s so `$ref`s resolve offline.
- **Refs intact, not resolved.** ED-A operates on canonical Schema 2 as-authored. This keeps the only network dependency to "fetch one questionnaire JSON," lets the tree render items as ref chips, and defers entity-body resolution (needed for preview/authoring) to ED-B/ED-C. From the Library we request the unresolved definition (refs kept), not `?resolved=true`.

---

## 3 — Canonical model layer (the testable core)

### 3.1 Model shape
The in-memory model is the parsed canonical Schema 2 object plus a derived, stable node-id index for addressing (ids assigned to structural nodes lacking one; never serialized if not part of the schema). Serialization re-emits canonical Schema 2 with references preserved byte-for-byte where unedited.

### 3.2 Tree operations (pure functions)
`insertNode(model, parentPath, index, node)`, `deleteNode(model, path)`, `moveNode(model, fromPath, toParentPath, index)`, `reorder(model, parentPath, fromIndex, toIndex)`, `updateNodeProps(model, path, patch)`, `updateMetadata(model, patch)`. Each returns a new model (Immer); each preserves structural well-formedness (e.g. a Section cannot become a child of a Section if the schema forbids it — enforced + unit-tested).

### 3.3 Validation
`validate(model) → {valid, errors}` via Ajv over the bundled schemas. Errors carry JSON Pointer paths mapped, where possible, to tree nodes for inline display.

### 3.4 State store
Zustand store: `{model, selection, expandedIds, dirty, validation, source}` with actions wrapping the pure ops + persistence triggers. UI subscribes to slices.

---

## 4 — UI / IA (3-pane + preview-split)

Confirmed skeleton: **Topbar** over **left StructureTree · center Canvas · right Inspector**. The center is preview-split-ready: ED-B will split the canvas into `Canvas | LivePreview` behind the topbar's `▢ Preview` toggle, leaving tree + inspector visible. ED-A ships the panes; the Preview toggle is present but disabled.

Type-aware inspector panels by selected node: **Questionnaire** (metadata + top-level `style`/`flow`), **Block**, **Page**, **Section** (each: title + `style` + `flow`), **Item/Message** (refs + structural context, read-only in ED-A).

---

## 5 — Persistence

- **IndexedDB** (`behaverse-editor`, store `drafts`): the working draft autosaves (debounced ~500 ms). On boot, restore the last draft if present; otherwise show the start screen.
- **File**: Open (`<input type=file>` / drag-drop a `.json`) → parse → validate → load. Export → serialize → download `.json` (filename from `metadata.id`/title). Export allowed when invalid, with a confirm-warning.
- **Library**: a small read client (configurable base URL via Vite env, like `web-viewer/`) fetches the unresolved definition by id+version. The full embedded Library browser is ED-C; ED-A's "Open from Library" is a minimal id+version form.

---

## 6 — Testing & the gate

- **Unit (TDD):** every tree op + the validation wrapper — pure functions, heavy coverage incl. edge cases (move across parents, delete selection, invalid-parent rejection).
- **Round-trip property tests:** real Library fixtures (e.g. AISS, PHQ-9, checked into `editor/src/__fixtures__/`): load → no-op → serialize → **semantically identical + Schema-2-valid**; load → restructure → still valid.
- **Component (RTL):** tree selection/expand, drag-reorder (dnd-kit testing utilities), canvas reorder, inspector edits, start-screen flows, export-when-invalid warning.
- **Playwright chromium smoke:** boot → open a fixture → reorder a page / move an item → export → re-validate the downloaded JSON; capture a **screenshot** for the owner to react to (reuse the `library-web/` script pattern).
- **The gate:** the round-trip property test + the smoke both green; a real Library questionnaire restructures + round-trips Schema-2-valid.

---

## 7 — Open questions / to verify during build

- **Library unresolved-definition endpoint.** Confirm the live read API serves the **unresolved** canonical definition (refs intact) — the documented route is `…/definition?resolved=true`; verify `resolved=false` (or the default) returns refs. If only resolved form is available, ED-A falls back to file-import for refs-intact content and logs a follow-up.
- **Schema-2 `$ref` registration in browser Ajv.** Mirror `tools/validate_schemas.py`'s registry (Schema 2 → Schema 1 `$id`s) so validation resolves fully offline.
- **Real fixture selection.** Pick 2–3 representative questionnaires (a Likert instrument like AISS, a scored one like PHQ-9, one with sections/matrix) for the round-trip suite.
- **Node-id strategy.** Confirm structural nodes carry stable ids in canonical Schema 2 (pages do per OD-12 / pagination memory); assign ephemeral ids only where the schema has none, and never serialize them.

---

## 8 — Success criteria

ED-A is done when: a researcher can (a) start a new questionnaire or open one from file or the Library, (b) restructure it — reorder/move/delete/add blocks, pages, sections; reorder/move/delete items & messages; edit metadata + `style`/`flow` — via a polished 3-pane UI, (c) see validation results, and (d) export canonical Schema 2 JSON that **round-trips valid**; with the working draft surviving a reload (IndexedDB). All suites green; a screenshot delivered for owner review.

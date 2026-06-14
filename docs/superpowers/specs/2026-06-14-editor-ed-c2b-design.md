# Editor ED-C2b (Context / Instruction + Message Authoring) — Design Spec

**Date drafted:** 2026-06-14
**Author:** Editor ED-C2 brainstorming session (2026-06-14)
**Component:** **Editor**, sub-project **ED-C** (item/Question/Option authoring + OD-15 reusable-entity workflow); ED-C is sliced C1..C4, C2 sub-sliced **C2a + C2b**. **ED-C2b** (this spec) adds the auxiliary content entities: **Context** + **Instruction** on a Question, and standalone **Message** authoring on pages.
**Builds on:** ED-A (model/shell), ED-B (preview/resolver/bundle), ED-C1 (Option editor + canvas `ItemEditor`/routing), ED-C2a (entity **pool** + `.devN` minting + bundle export + pool-first live preview + `PromptEditor` + "+ Add item"). Memories `project_editor_ed_c2a`, `project_editor_ed_c1`, `project_editor_ed_b`, `project_editor_ed_a`.
**Stack:** unchanged (Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright).
**Authoritative source documents:**

- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) §4 (Message: `type` string-array + content), §5 (Context: content), §6 (Instruction: optional `dimension` + content), §8 (Question = Prompt + optional Context + Instruction), §15 (Message as a Page element).
- `schemas/questionnaire/schema.json` `$defs`: `Message` (required `id`+`type`+`content`; `type` array minItems 1, unique), `Context` (required `id`+`content`), `Instruction` (required `id`+`content`; optional `dimension` pattern `^[a-z][a-z0-9_]+$`), `MessageContent`/`ContextContent`/`InstructionContent` (`{status, text}`, `text` minLength 1), `QuestionInline` (`prompt` + optional `context`/`instruction` refs), `MessageRef` (page element).
- ED-C2a spec/code: the pool (`editor/src/pool/`), `editor/src/entity/PromptEditor.tsx`, `editor/src/canvas/{ItemEditor,Canvas}.tsx`, the store `pool`/`upsertPoolEntity`/`removePoolEntity`, `pool/mint.ts` (`draftVersion`/`mintEntityId`/`collectIds`), `pool/newItem.ts` (`buildNewItem`).

---

## 1 — Scope (ED-C2b)

### 1.1 In scope

- **`ContentTextEditor`** (`editor/src/entity/ContentTextEditor.tsx`) — a reusable controlled component editing a `{content: {lang: {status, text}}}` map for one locale: `{ content, locale, label, onChange(content) }`. Writes `content.{lang}.{status:'draft', text}`; the shared shape behind Context, Instruction, and Message bodies. (PromptEditor is left unchanged — no refactor.)
- **Context + Instruction on a Question** (in `ItemEditor`, below the Prompt editor):
  - **Context section:** absent → **"+ Add context"** mints a pool `Context` (`ctx_new_<n>@<draftVersion>`, empty primary-locale text) + sets `question.context = {ref}`. Present & **pool** → `ContextEditor` (a `ContentTextEditor`) wired to `upsertPoolEntity`, with **Remove** (unset `question.context` + `removePoolEntity`). Present & **not-in-pool** (Library pin) → read-only chip + "fork to edit (ED-C4)".
  - **Instruction section:** same pattern → pool `Instruction` (`ins_new_<n>@…`), edited via `InstructionEditor` = `ContentTextEditor` + an optional `dimension` text field; Remove unsets `question.instruction` + drops the pool entity.
- **Message authoring** (a pool entity used as a page element):
  - Canvas **"+ Add message"** (beside "+ Add item"/"+ Add section", `kind === 'page' || 'section'`): mint a pool `Message` (`msg_new_<n>@<draftVersion>`, `type: ["information"]`, empty primary-locale text) + append a `MessageRef` `{ ref }` element + select it.
  - Selecting a **pool** message element routes the canvas to a **`MessageEditor`**: a `type` tags field (comma-separated ↔ `string[]`, non-empty; defaults preserved) + a `ContentTextEditor` for the body, wired to `upsertPoolEntity`. A Library-pinned message ref stays a read-only chip (edit/fork is ED-C4).
- **Pure minters** (`editor/src/pool/newEntities.ts`): `buildContext(ids, draftVer, locale)`, `buildInstruction(ids, draftVer, locale)`, `buildMessage(ids, draftVer, locale)` → `{ ref, body }` each (mirroring `newItem.ts`). Bodies are canonical (`id` + required fields; empty text transiently invalid).
- Everything flows through the existing **pool → live preview → bundle export** (pool-aware since C2a — no new wiring).
- **Tests:** pure `newEntities.ts` minters; `ContentTextEditor`/`ContextEditor`/`InstructionEditor`/`MessageEditor` RTL; ItemEditor add/edit/remove context+instruction; Canvas "+ Add message" + pool-message routing; a Playwright "+ Add message + + Add context, type both, preview" smoke + screenshot.

### 1.2 Non-goals (deferred)

- **No pick-from-Library** (→ ED-C3); **no editing/forking of Library-pinned** context/instruction/message (→ ED-C4) — those stay read-only chips + fork note.
- **No multi-locale translation** — primary language only (→ ED-E).
- **No standalone Placeholder / Help / RegEx / Solution editors** — Placeholder/Help are already inline-editable inside ED-C1's Option editor; standalone authoring of these isn't needed yet.
- **No saved Question/Item entities** (`q_*`/`it_*`) — C2b keeps authoring *inline* items + pool content entities.
- **No `type` controlled vocabulary picker** for Message — a free comma-tag input (open vocabulary per OD-15 §4); preferred values documented, not enforced.

---

## 2 — Architecture

- **`editor/src/entity/ContentTextEditor.tsx`** — reusable per-locale text editor (`{content, locale, label, onChange}`). Pure-ish; no store.
- **`editor/src/entity/ContextEditor.tsx`** — wraps `ContentTextEditor` for a Context body (`{context, locale, onChange}`).
- **`editor/src/entity/InstructionEditor.tsx`** — `ContentTextEditor` + a `dimension` input (`{instruction, locale, onChange}`).
- **`editor/src/entity/MessageEditor.tsx`** — `type` tags input (comma↔array) + `ContentTextEditor` (`{message, locale, onChange}`).
- **`editor/src/pool/newEntities.ts`** (pure): `buildContext`/`buildInstruction`/`buildMessage` minters returning `{ ref, body }`.
- **`editor/src/canvas/ItemEditor.tsx`** (extend): Context + Instruction sections under the Prompt editor — add/edit/remove, pool-aware (mirrors the prompt branch).
- **`editor/src/canvas/Canvas.tsx`** (extend): "+ Add message" action; route a selected pool-message element to `MessageEditor`.

Dependency direction unchanged: `entity/` + `pool/` (pure minters) → `model`/store; canvas composes. Reuses `mintEntityId`/`draftVersion`/`collectIds` (mint.ts) and `upsertPoolEntity`/`removePoolEntity` (store).

## 3 — Canonical bodies (targets)

```jsonc
// Context (ctx_new_1@v26.0609.dev1)
{ "id": "ctx_new_1", "content": { "en": { "status": "draft", "text": "When we say 'X' we mean…" } } }

// Instruction (ins_new_1@…)
{ "id": "ins_new_1", "dimension": "agreement", "content": { "en": { "status": "draft", "text": "Rate each on the scale." } } }

// Message (msg_new_1@…)
{ "id": "msg_new_1", "type": ["information"], "content": { "en": { "status": "draft", "text": "Welcome…" } } }
```
`text` is `minLength:1` (empty = transiently invalid → banner). `dimension` omitted when empty. Message `type` must stay non-empty (default `["information"]`; the editor preserves at least one tag — if the author clears it, that's surfaced as invalid rather than silently re-defaulted).

## 4 — Data flow (e.g. add a context)

1. In `ItemEditor`, the Context section shows "+ Add context" (no `question.context`).
2. Click → `buildContext(collectIds(model,pool), draftVersion(metadata.version), locale)` → `{ref, body}`; `upsertPoolEntity(ref, body)`; `applyEdit(m => updateNodeProps(m, [...itemPath,'question'], { context: { ref } }))`.
3. The section now shows `ContextEditor(pool[ref])`; edits → `upsertPoolEntity(ref, …)`; the ED-B preview (pool-aware) renders the context live.
4. **Remove** → `applyEdit` unset `question.context` (delete the key) + `removePoolEntity(ref)`.
5. **Export bundle** carries the context body in `entities`.

(Message follows the same mint→pool→append-element→edit pattern; Instruction is identical to Context plus the `dimension` field.)

## 5 — Decisions / to verify during build

- **Unset a question sub-ref:** `updateNodeProps` uses `Object.assign` (can't delete a key). Add a small `unsetQuestionRef(model, itemPath, key)` (Immer `delete draft…[key]`) or a generic `deleteAtPath` — confirm the cleanest minimal helper during build (prefer extending `tree.ts` with `unsetNodeProp(model, path, key)` if no equivalent exists).
- **Remove drops the pool entity** (chosen): removing Context/Instruction unsets the question ref AND `removePoolEntity(ref)`. (A pool entity referenced by multiple questions is not a C2b scenario — minted per add.)
- **Message `type` empty:** the editor must not silently re-default; an empty tag list is invalid (Schema-2 `minItems:1`) and surfaced by the banner. New messages default `["information"]` so they start valid-by-shape (text still empty until typed).
- **Routing precedence in Canvas:** a selected message element that is a **pool** message → `MessageEditor`; a Library-pinned message stays in the element-list/read-only path. Inline-item routing (ED-C1) unchanged.
- **`dimension` field** on Instruction is a free text input validated by the schema pattern at export (banner surfaces a bad value); the editor doesn't pre-validate.

## 6 — Success criteria

ED-C2b is done when: an author can (a) add a **Context** and an **Instruction** to a question (new pool entities), edit their text (+ Instruction `dimension`), see them in the live preview, and remove them; and (b) add a **Message** to a page (new pool entity), set its `type` tags + text, see it render in the preview; with everything carried in the **bundle export** and the questionnaire round-tripping Schema-2-valid once text is filled; all suites green + a screenshot delivered.

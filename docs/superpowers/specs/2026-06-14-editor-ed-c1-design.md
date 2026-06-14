# Editor ED-C1 (Inline Option Editor) — Design Spec

**Date drafted:** 2026-06-14
**Author:** Editor ED-C brainstorming session (2026-06-14)
**Component:** **Editor**, sub-project **ED-C** (item / Question / Option authoring + the OD-15 reusable-entity workflow), first slice **ED-C1**. ED-C is itself sliced ED-C1..C4 (see §0). ED-C1 delivers the **type-aware Option editor** for inline content.
**Builds on:** ED-A (structural shell + canonical model, merged) and ED-B (inline WYSIWYG preview, merged). Memories `project_editor_ed_a`, `project_editor_ed_b`.
**Stack:** unchanged (Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright). Reuses ED-B's `@behaverse/questionnaire-renderer` `deriveWidget` for the live widget hint.
**Authoritative source documents:**

- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) §9 (Option entity — structural vs `content` fields, Variant α), §13 (UI-input-widget derivation), §18 group B/F/G (resolved Option/validation/widget sub-questions).
- [design/07_editor.md](../../../design/07_editor.md) §2 (visual structure editor — inline authoring), §"Resolved decisions" (OD-05).
- `schemas/questionnaire/schema.json` `$defs`: `OptionInline`, `OptionBase`, `OptionChoiceStructural`, `OptionContent`, `OptionChoiceContent`, `PlaceholderInline`, `HelpInline`, `RegEx`/inline regex. ED-C1 emits `OptionInline`.
- ED-A model layer (`editor/src/model/`: `types.ts`, `path.ts` `getAtPath`/`updateNodeProps`, `validation.ts`); ED-B preview (`editor/src/preview/`) which already re-renders live on model change.

---

## 0 — ED-C decomposition (confirmed with owner 2026-06-14)

ED-C (item/Question/Option authoring + OD-15 reusable-entity workflow) is too big for one spec. Sliced:

| Slice | Delivers | Gate |
|---|---|---|
| **ED-C1** (this spec) | **Inline Option editor** — edit the Option of an existing inline item, and a Section's `shared_option`. Type triple + choice rows + numeric bounds + inline placeholder/help/regex + per-locale content (primary language). Live preview + round-trip valid. | Edit an item's inline Option → preview reflects it → round-trips Schema-2-valid |
| **ED-C2** | **Local entity pool + Prompt/Question authoring + new-item creation.** Editor-managed pool (entities keyed by id, `.devN` draft versions, persisted in the draft, feeds the ED-B resolver pool-first, bundle export). Prompt (content + `name`/`construct`/`dimension`/`topics`/`reversed`) + optional Context/Instruction editors → Question → new inline Item from the canvas. | Author a brand-new item (new prompt + option) end-to-end → previews → round-trips valid |
| **ED-C3** | **Pick-from-Library + hard-pinning (OD-06).** Embedded read-only Library browser (live `/v1/entities` + `/v1/search`); selecting inserts a hard-pinned `@vYY.MMDD` ref; newer-version notification + explicit upgrade (never silent). | Pick a real Library entity into an item; ref hard-pinned; upgrade surfaced |
| **ED-C4** | **OD-05 override/fork surface.** On a ref: edit `position`/`required`/`show_if` freely; a content edit opens the fork dialog → "derive locally" (copy to pool as a new `.devN`, repoint) or cancel. "Propose shared version" (Library PR) shown disabled (OD-08-blocked). | Edit a referenced entity's content → fork dialog → derive-locally creates a pool copy + repoints |

Build order ED-C1 → C2 → C3 → C4, each its own spec → plan → subagent-driven TDD build → review → merge.

**Foundational decision (owner-approved):** new/forked content lives in an **editor-local entity pool** with `.devN` draft versions (`@vYY.MMDD.devN`, allowed by the Schema-2 version regex); the questionnaire references pool entities normally; preview resolves the pool before the Library; export becomes a self-contained `{questionnaire, entities}` bundle. The pool is *introduced in ED-C2* (where ref-only Prompts first require it), not ED-C1.

---

## 1 — Scope (ED-C1)

### 1.1 In scope

- **The Option editor** (`editor/src/option/`), a controlled component editing one Option object:
  - **Type triple:** `input_data_type` ∈ {choice, number, text}; `measurement_type` ∈ {nominal, ordinal, interval, ratio}; for `choice`, `selection` ∈ {single, multiple} + optional `min_selected`/`max_selected`.
  - **Choice rows** (when `input_data_type: choice`): a table of `{index, value, text}` rows — `index` auto-managed (1-based, contiguous), `value` numeric **or null** ("prefer not to say"), `text` per-locale; add / remove / reorder rows. Structural `{index, value}` go to the Option's top-level `options[]`; `text` goes to `content.{lang}.options[]` keyed by the same `index`.
  - **Numeric** (when `number`): `min` / `max` / `step` (top-level) + per-locale `units` (in `content`).
  - **Text** (when `text`): inline `input_validation` (a regex string) + inline `placeholder` (`PlaceholderInline` — `{content:{lang:{status,text}}}`). (Ref forms for placeholder/help/regex are ED-C3/C4.)
  - **Inline `help`** (`HelpInline`) — optional per-locale tooltip text.
  - **Per-locale content** edited for the questionnaire's **primary language** (`metadata.language`); a read-only locale indicator shows which language is being edited. `label` + `units` + per-choice `text` + `status` live under `content.{lang}`. (Full side-by-side translation is ED-E.)
  - **Derived-widget hint:** call the renderer's `deriveWidget()` on the current triple and show "Renders as: Radio / Checkbox / Number input / Text input / (unsupported)".
  - Always emits a **canonical `OptionInline`** (passes Schema-2 validation): structural fields top-level, translatable fields under `content`, `selection`+`options` present iff `choice`.
- **Editing targets:** (a) an **inline item** whose `option` is inline (`PageElementInlineItem` with `OptionInline`); (b) a **Section's `shared_option`** (inline). Selecting such a node shows the editor in the **Canvas** (center pane) — an "Item editor" view (ED-C1: the Option section; the Question/prompt section is a read-only ref placeholder until ED-C2).
- **Pure mutation helpers** (`editor/src/option/ops.ts`): `setInputDataType`, `setMeasurementType`, `setSelection`, `setMinMaxSelected`, `addChoice`, `removeChoice`, `reorderChoice`, `setChoiceValue`, `setChoiceText`, `setLabel`, `setUnits`, `setBounds`(min/max/step), `setInputValidation`, `setPlaceholderText`, `setHelpText` — each `(option, …) => option` (pure), keeping the Option canonical (e.g. switching to `number` drops `options`/`selection`; switching to `choice` ensures `options`+`selection` exist). Edits applied to the model via `applyEdit(m => updateNodeProps(m, optionPath, newOption))` — actually replace the option subtree at its path (a dedicated `setOption(model, path, option)` thin wrapper over Immer, or reuse `updateNodeProps` on the parent with the `option` key).
- **Live validation + preview:** edits re-run Ajv (existing banner) and the ED-B preview re-renders live (already wired). Invalid intermediate states are allowed (e.g. an empty choice list) and surfaced, not blocked.
- **Tests:** pure `ops.ts` unit tests (each mutation → canonical, round-trip Ajv-valid); RTL editor tests (type switch swaps fields; add/edit/reorder choice updates the model; derived-widget hint updates); a live-preview integration test; a Playwright screenshot.

### 1.2 Non-goals (deferred)

- **No Prompt / Context / Instruction / Question authoring**, no new-item creation, no entity pool, no bundle export (→ ED-C2). ED-C1 edits the Option of items that **already exist** (loaded from file/Library/fixture).
- **No pick-from-Library**, no `@vYY.MMDD` ref insertion, no ref-form placeholder/help/regex (→ ED-C3).
- **No editing of a *referenced* Option** (`{ref: "opt_…"}`), no OD-05 fork dialog (→ ED-C4). A ref option stays a read-only chip with a "pick/fork in a later stage" note.
- **No multi-locale translation UI** — ED-C1 edits the primary language only (→ ED-E).
- **No Solution / scoring / logic fields** on the Option (those are ED-D / out of scope).
- **No saved-Item-ref editing** — the whole item is a ref → C3/C4.

---

## 2 — Architecture

- **`editor/src/option/ops.ts`** — pure canonical-preserving mutation helpers (the testable core). No React, no store.
- **`editor/src/option/OptionEditor.tsx`** — controlled component: props `{ option, locale, onChange(option) }`. Renders the type triple, the type-specific sub-editor (ChoiceRows / NumericBounds / TextValidation), the inline placeholder/help editors, and the derived-widget hint. Calls `ops.*` then `onChange`.
- **`editor/src/option/ChoiceRows.tsx`** — the choice table (add/remove/reorder/value/text), dnd-kit reuse optional (or simple up/down buttons — see §5).
- **`editor/src/canvas/ItemEditor.tsx`** — shown by the Canvas when the selected node is an inline item or a section with `shared_option`: a read-only Question/prompt summary (ref chip; editable in ED-C2) + the `OptionEditor` wired to `applyEdit`. The Canvas (`editor/src/canvas/Canvas.tsx`) routes to `ItemEditor` for those node kinds instead of the ED-A "no children" message.
- **Model integration:** a thin `setOptionAtPath(model, optionPath, option)` (Immer) — or reuse `updateNodeProps` on the item with `{ option }`. The option's path is the selected item's path + `['option']`, or the section's path + `['shared_option']`.

Dependency direction stays clean: `option/` (pure ops + components) depends on `model/` + the renderer's `deriveWidget`; the Canvas composes them.

## 3 — Canonical Option shape (target output)

ED-C1 always produces a valid `OptionInline`:
```jsonc
{
  "input_data_type": "choice",        // | "number" | "text"
  "measurement_type": "ordinal",
  "selection": "single",               // choice only
  "min_selected": 0, "max_selected": 2, // choice+multiple only, optional
  "min": 0, "max": 168, "step": 1,     // number only
  "options": [ { "index": 1, "value": 0 }, … ],   // choice only (structural)
  "input_validation": "^(19|20)\\d{2}$",          // text only, inline regex
  "placeholder": { "content": { "en": { "status": "draft", "text": "e.g. 5" } } }, // inline
  "help": { "content": { "en": { "status": "draft", "text": "…" } } },             // inline
  "content": {
    "en": { "status": "draft", "label": "7-point agreement",
            "units": "h/week",                                   // number
            "options": [ { "index": 1, "text": "strongly disagree" }, … ] } // choice
  }
}
```
Switching `input_data_type` prunes irrelevant fields (e.g. → `number` removes `options`/`selection`/per-choice `text`; → `choice` ensures `selection` + at least the structural `options[]` and the `content.{lang}.options[]` parallel array exist and stay index-aligned).

## 4 — UX / UI

- **Canvas item-editor view:** when an inline item (inline option) or a section with `shared_option` is selected, the Canvas shows: a header (the item/section id + a read-only prompt ref chip with "Prompt editing arrives in ED-C2"), then the **Option editor**. For other selections the Canvas keeps its ED-A behavior.
- The editor is laid out for room (full canvas width): the type triple as a compact row, then the type-specific section (the choice table is the widest — a proper table with per-row value + text inputs + remove + up/down).
- The derived-widget hint sits near the type triple so the author sees the rendered consequence.
- Live: every change calls `applyEdit`; the ED-B preview (if open) updates within its debounce; the validation banner reflects validity.

## 5 — Decisions / to verify during build

- **Choice reorder mechanism:** prefer simple up/down buttons + an explicit `index` recompute (deterministic, easy to test) over dnd-kit for the rows table (dnd-kit is already used for the tree; rows are a smaller surface). Reorder renumbers `index` contiguously and keeps the structural `options[]` and `content.{lang}.options[]` parallel arrays aligned.
- **`value` editing:** numeric input; empty → `null` (the "doesn't contribute" case). Non-numeric input rejected.
- **Status field:** new/edited content defaults `status: "draft"`; ED-C1 does not surface a status control (ED-E owns status workflow) — it just writes `draft` and preserves an existing status if present.
- **Index alignment invariant:** `ops.ts` guarantees the structural `options[]` (index,value) and `content.{lang}.options[]` (index,text) stay aligned by `index` after every mutation — unit-tested.
- **Editing a section `shared_option` that is absent:** offer an "add shared option" affordance only if the section already has one in ED-C1? → ED-C1 edits an EXISTING `shared_option`; creating one from scratch is fine to include if cheap (adds an empty inline option) — confirm during build, default to edit-existing.

## 6 — Success criteria

ED-C1 is done when: selecting an inline item (or a matrix section's shared option) opens an Option editor in the canvas; the author can change the response type and all its parameters (choices with values + labels, numeric bounds + units, text validation + placeholder/help), see the derived widget kind and the live preview update, and the questionnaire **round-trips Schema-2-valid**; all suites green + a screenshot delivered.

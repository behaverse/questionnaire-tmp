# Editor ED-E (Translation Interface) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-E brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-E** (translation interface). ED-E lets authors edit content in non-primary locales. Scoped to the **editing-locale-switcher** approach (reuses every existing per-locale editor); the rich side-by-side translation matrix (design §7) is a deferred follow-on (E2).
**Builds on:** ED-C (the entity pool + `PromptEditor`/`ContextEditor`/`InstructionEditor`/`MessageEditor`/`OptionEditor`, all already `locale`-parameterized; `option/ops.ts` setters all take a `locale` arg), ED-A (`updateMetadata`, the Inspector questionnaire-root branch, the store). Memories `project_editor_ed_c2b`, `project_editor_ed_c1`, `project_od15_reusable_entity_pivot`.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · Immer · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §7 (Translation interface): side-by-side source/target rows, one per translatable text, with a `draft`/`complete`/`validated` status. (The full matrix is E2; ED-E delivers per-locale editing + status via a locale switcher.)
- Schema 2 `v26.0602` (`schemas/questionnaire/schema.json`): **language-keyed `content`** on Prompt/Context/Instruction/Message/Placeholder/Help/Option/Subscale/Regex/Solution — `{ <locale>: { status, text|label|units|options[] } }` (`status` ∈ draft|complete|validated). `metadata.language` (required primary) + `metadata.available_languages` (optional `string[]`, `uniqueItems`). **NOT language-keyed (plain strings):** `metadata.title`/`description`, per-question/cross-question validation messages, Score `name`/`description`. Page/Section/Block use a separate `translations: { <locale>: {status, title?, description?} }` map.
- Editor (key enabler): the content editors + `option/ops.ts` setters ALREADY take `locale`; only `editor/src/canvas/ItemEditor.tsx` (line ~18: `const locale = String(model.metadata.language ?? 'en')`) hardcodes the primary. `editor/src/inspector/Inspector.tsx` edits `metadata.language` but NOT `available_languages`. `editor/src/preview/PreviewPane.tsx` has an independent locale picker (`available_locales ?? [primary]`). Library-ref entities are read-only (translate by forking — ED-C4).

---

## 1 — Scope (ED-E)

### 1.1 In scope

- **`available_languages` manager** — `editor/src/inspector/LanguagesField.tsx` (in the Inspector questionnaire-root branch): the primary `metadata.language` as a non-removable chip + `available_languages` as removable chips + an add-input (validated against the schema locale pattern). Writes via a new `setAvailableLanguages(model, langs)` tree helper (dedupe; primary implicit; delete the key when empty).
- **Editing-locale switcher** — store UI-state `editingLocale: string | null` + `setEditingLocale`; an `EditingLocaleSwitcher` in the topbar (`<select>` over `[primary, ...available_languages]`). `ItemEditor`/`MessagePane` use `editingLocale ?? metadata.language` instead of the hardcoded primary → the existing editors edit the chosen locale. Missing `content[locale]` auto-creates on first edit (existing behaviour). Independent of the preview's picker.
- **Per-locale `status`** — a status `<select>` (draft/complete/validated) in `ContentTextEditor` + `PromptEditor` (bound to `content[locale].status`) and `OptionEditor` (via a new `setStatus(opt, locale, status)` op).
- **Source-text hint** — when editing a non-primary locale, `ContentTextEditor`/`PromptEditor` show a read-only "primary: '<source text>'" reference (the minimal nod to §7's side-by-side).
- **Tests:** pure (`setAvailableLanguages`, store `editingLocale`, `setStatus`); RTL (`LanguagesField`, `EditingLocaleSwitcher`, `ItemEditor` locale wiring, status + source hint); a Playwright smoke + screenshot.

### 1.2 Non-goals (deferred → FOLLOWUPS / E2)

- **Side-by-side translation matrix** (§7: all translatable strings × locales, bulk status) — the richer follow-on (E2).
- **Page/Section/Block title `translations`** (+ metadata `translations`) — different field shape (`translations[locale]`, not `content`); deferred.
- **Validation-message / metadata-title localization** — plain strings in Schema 2 (schema gap; design §5 calls them translatable). Out of scope — flagged for an upstream schema decision.
- **Translation-memory / auto-translate** suggestions.
- **Non-destructive locale removal**: removing a language from `available_languages` does NOT prune authored `content[locale]` entries (deliberate — avoids silent data loss).
- The Logic/Validation/Scoring → Inspector tabs consolidation (pending from ED-D4).

---

## 2 — Architecture & components

- **`editor/src/state/store.ts`** — add `editingLocale: string | null` (init null) + `setEditingLocale(locale: string | null)`; clear to null in `loadModel` + `reset`. Consumers resolve `editingLocale ?? model.metadata.language ?? 'en'`.
- **`editor/src/model/tree.ts`** — `setAvailableLanguages(model, langs: string[])` (Immer): normalize = dedupe + drop the entry equal to `model.metadata.language`; if empty → `delete draft.metadata.available_languages` else set it.
- **`editor/src/inspector/LanguagesField.tsx`** (new) — primary chip ("primary", non-removable) + removable chips for `available_languages` + add-input (rejects codes not matching `^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$`). Wired via `applyEdit(setAvailableLanguages(...))`. Rendered in `Inspector.tsx`'s questionnaire branch (near the Language field).
- **`editor/src/EditingLocaleSwitcher.tsx`** (new) — `<select aria-label="Editing language">` over `[primary, ...available_languages]` (deduped), value = effective editing locale, onChange → `setEditingLocale`. Mounted in the topbar (where Export/Validate live). Shows a "translating <locale>" affordance when ≠ primary.
- **`editor/src/canvas/ItemEditor.tsx` + `MessagePane.tsx`** — replace the hardcoded `const locale = metadata.language` with `const locale = useEditorStore(s => s.editingLocale) ?? String(model.metadata.language ?? 'en')`. No change to the downstream editors (already `locale`-parameterized).
- **`editor/src/entity/ContentTextEditor.tsx` + `PromptEditor.tsx`** — add a status `<select>` bound to `content[locale].status` and, when `locale !== primary`, a read-only source-text line (`content[primary]?.text`).
- **`editor/src/option/ops.ts` + `OptionEditor.tsx`** — `setStatus(opt, locale, status)` (mirror `setLabel`); a status `<select>` in `OptionEditor` for `content[locale].status`.

**Dependency direction:** store (`editingLocale`) + `model/tree` (`setAvailableLanguages`) → `LanguagesField` + `EditingLocaleSwitcher` + the `ItemEditor`/`MessagePane` locale wiring; the content editors gain a status control + source hint; `option/ops` gains `setStatus`. Reuses every existing per-locale editor + op. No preview change (its picker stays independent + already reflects `available_languages`).

## 3 — Data flow + edge semantics

**Editing locale:** topbar switcher → `setEditingLocale` → `ItemEditor`/`MessagePane` resolve `editingLocale ?? primary` → existing editors read/write `content[locale]`; editing a not-yet-translated locale auto-creates `content[locale] = {status:'draft', text}`. Pool-entity + inline-option `content` maps persist via the existing `upsertPoolEntity`/`updateNodeProps` + Draft autosave + bundle export (no new persistence path).

**available_languages:** add → `setAvailableLanguages([...current, code])` (dedupe; primary dropped from the list; empty → key removed); remove → filtered set. The preview picker + the editing switcher both read `[primary, ...available_languages]`. Primary never removable, always first.

**status:** the `<select>` writes `content[locale].status` (default `'draft'` on create); per-locale + independent.

**Edge semantics:** editing-locale removed-while-selected → switcher falls back to primary (only offers valid options); orphaned `content[locale]` is left intact (non-destructive removal). Library refs read-only (translate by forking, ED-C4). Empty target locale → editors show empty fields + the "primary: '<source>'" hint; saving creates the entry. Malformed locale code → add-input rejects inline (no write). All writes Schema-2-valid (`available_languages` deduped/`uniqueItems`).

## 4 — Test plan

- `setAvailableLanguages` — set/dedupe/drop-primary/delete-on-empty/immutable/Schema-2-valid.
- store `editingLocale` — default null; `setEditingLocale`; cleared on `loadModel`/`reset`.
- `LanguagesField` (RTL) — primary non-removable chip; add valid code appends; malformed rejected; remove filters.
- `ItemEditor` locale wiring (RTL) — `editingLocale='fr'` → editing a prompt writes `content.fr.text`, primary untouched; switch back shows primary.
- `ContentTextEditor`/`PromptEditor` (RTL) — status `<select>` writes `content[locale].status`; source-text hint shows primary text on an untranslated locale.
- `option/ops` `setStatus` — writes `content[locale].status`; immutable; existing setters unaffected.
- `EditingLocaleSwitcher` (RTL) — lists `[primary, ...available_languages]`; selecting calls `setEditingLocale`.
- Playwright — add `fr`, switch editing language to `fr`, edit a prompt, switch the preview to `fr`, confirm the translated text renders; screenshot.

## 5 — Success criteria

1. `metadata.available_languages` is manageable from the Inspector (add/remove; primary always included); round-trips Schema-2-valid.
2. The "Editing language" switcher makes the entire `content`-based surface (prompts/options/contexts/instructions/messages/placeholders/help) edit the chosen locale, reusing the existing editors; missing entries auto-create.
3. Per-locale `status` is editable; a source-text hint shows the primary string.
4. The preview renders the chosen locale (its picker reflects added languages) — a translation is visible end-to-end.
5. All suites green; a screenshot delivered showing translation working.

The rich side-by-side translation matrix (§7) is the deferred E2 follow-on.

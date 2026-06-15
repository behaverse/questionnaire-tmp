# Editor ED-D2b (Piping + Randomization) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-D2b brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-D** (logic / validation / scoring builders), slice **D2** (logic rules), sub-slice **D2b**. **D2b COMPLETES ED-D2.** D2a delivered the Logic panel + skip/branch/visibility authoring + live visibility-rule preview; **D2b** adds **piping** authoring + live same-page piping preview, and the **randomization** checkboxes.
**Builds on:** ED-D2a (`editor/src/logic/{RuleEditor,LogicPanel,ruleOps,targets,visibility}.{ts,tsx}`, `model/tree.ts updateLogic`), ED-D1 (`ExpressionInput`, `useEvaluator`, `collectIdCatalogue`, `makeBindings`, `filterPageVisible`). Memories `project_editor_ed_d2a`, `project_editor_ed_d1`.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · Immer · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §4: "Piping — insert answer to question X into the prompt of question Y"; "Randomization — page order, question order within a page / section, page order within a block (seed strategy is on the deployment)".
- Schema 2 `v26.0602` (`schemas/questionnaire/schema.json`): `LogicRule` `type:'piping'` → `action.source` + `action.field_path` (line 727, `field_path` is just `{type:'string'}` — **no format regex; empirical**). Randomization booleans: `Page.randomize` (510), `Section.randomize` (541), `Block.randomize` (636), `FlowInstrument.randomize_pages` (708) — all boolean, default false.
- **Canonical `field_path` format (empirical, from the viewer):** `web-viewer/src/app/App.tsx:498` builds `field = \`pages.${pageId}.elements.${trialIndex - 1}.prompt\`` and `web-viewer/src/logic/piping.ts:8` matches by **exact string equality** (`r.action.field_path === field`). The App rewrites `element.question.prompt.content[locale].text` **before** handing the element to the (piping-unaware) `StepRenderer`. **The viewer only applies piping to question prompts** (`...elements.{idx}.prompt`); `.label`/message/section-child paths appear in an example but are NOT wired — so authoring them would silently not fire in production.
- `pipedText` (port target): `web-viewer/src/logic/piping.ts` — matching `type:'piping'` rule whose `field_path === field` AND condition true → `bindings.var(action.source)`, array `', '`-joined else `String`; else `original`.
- Editor: `editor/src/model/types.ts` (`flow?: unknown`; `Page/Section/Block.randomize` ride `[k]:unknown`), `editor/src/model/tree.ts` (`updateNodeProps`, `unsetNodeProp`, `updateMetadata`/`updateLogic` patterns), `editor/src/inspector/{Inspector,fields}.tsx`, `editor/src/preview/PreviewPane.tsx` (`filterPageVisible` already wired).

---

## 1 — Scope (ED-D2b)

### 1.1 In scope

- **Piping target catalogue** — `editor/src/logic/pipingTargets.ts` (pure): `collectPipingTargets(model)` → `PipingTarget[]` (`{ fieldPath, label }`), one per top-level prompt-bearing item: `fieldPath = 'pages.'+page.id+'.elements.'+i+'.prompt'` (i = position in `page.elements`, the viewer's `trialIndex-1`), `label = '<page title|id> › <element id|#i>'`. Skips messages/sections. Null-safe.
- **Piping transform** — `editor/src/logic/piping.ts` (pure, port of the viewer): `pipedText(fieldPath, original, rules, ev, bindings)` (first matching valid+true piping rule → source value [array `', '`-joined], else original) and `applyPiping(page, rules, ev, bindings)` → new `RuntimePage` with each top-level item's `question.prompt.content[locale].text` rewritten where a rule fires.
- **Piping authoring** — extend `RuleEditor` for `type:'piping'`: a `source` question-id dropdown (`collectIdCatalogue.questionIds`, current-value-preserving) + a `field_path` **picker** over `collectPipingTargets` (shows `label`, emits `fieldPath` — NO manual path typing). Threaded `pipingTargets` from `LogicPanel`.
- **Piping validation** — extend `validateRule` to take a 3rd param `pipingPaths: string[] = []` (defaulted → D2a back-compat): piping `source` empty=**error** (presence only — a source may be a question *or* score id, so no unknown-id check; the dropdown guarantees validity); `field_path` empty=**error**, present-but-not-in-`pipingPaths`=**warning**. (Removes the D2a blanket "arrives in D2b" warning.)
- **Live same-page piping preview** — `PreviewPane` applies `applyPiping` AFTER `filterPageVisible` (visibility first, then pipe the survivors). Answering the source re-renders → re-pipes live. Malformed condition → original (false-safe).
- **Randomization** — `model/tree.ts` `updateFlow(model, patch)` (Immer; merges into `model.flow`; deletes keys set to `undefined`; drops `flow` if it becomes empty). `inspector/fields.tsx` `CheckboxField` (mirrors `TextField`). Inspector branches gain checkboxes: page/section "Randomize element order" + block "Randomize page order in block" (→ `updateNodeProps(sel!, {randomize})` on check, `unsetNodeProp(sel!, 'randomize')` on uncheck); questionnaire-root "Randomize page order" (→ `updateFlow(m, {randomize_pages:true})` / `{randomize_pages:undefined}`). Author-only.
- **Completes ED-D2.**
- **Tests:** pure (`collectPipingTargets`, `pipedText`/`applyPiping`, `validateRule` piping + 3-arg back-compat, `updateFlow`); RTL (`RuleEditor` piping fields, `Inspector` randomize checkboxes, `PreviewPane` live piping); a Playwright smoke + screenshot (piped prompt + a randomize checkbox).

### 1.2 Non-goals (deferred → FOLLOWUPS)

- **Non-prompt piping targets** (label / message / section-child) — not wired in the viewer; authoring them would silently not fire. Revisit when the viewer applies them.
- **Option-order randomization** — not in Schema 2 v26.0602.
- **Preview shuffle/seed simulation** — randomization is author-only; the preview doesn't reorder (and must not crash on the flags).
- **Nested AND/OR rule-builder**; the **tabs consolidation** of global panels (D3/D4).

---

## 2 — Architecture & components

- **`editor/src/logic/pipingTargets.ts`** (pure) — `PipingTarget = { fieldPath: string; label: string }`; `collectPipingTargets(model): PipingTarget[]`. Walk `model.pages`; for each top-level element with a `question` (item), push `{ fieldPath: \`pages.${page.id}.elements.${i}.prompt\`, label: \`${page.title ?? page.id} › ${(el as {id?}).id ?? '#'+i}\` }`.
- **`editor/src/logic/piping.ts`** (pure, port of `web-viewer/src/logic/piping.ts` + the App rewrite):
  - `pipedText(fieldPath, original, rules, ev, bindings)`: for each `type:'piping'` rule with `action.field_path === fieldPath`, valid (`ev.check(cond) === null`) + true (`ev.condition`): `const v = bindings.var(String(action.source)); return v == null ? original : Array.isArray(v) ? v.join(', ') : String(v)`. No match → `original`.
  - `applyPiping(page, rules, ev, bindings)`: new page; for each top-level element with a `question.prompt.content`, for the locale(s) present, set `text = pipedText('pages.'+page.id+'.elements.'+i+'.prompt', currentText, rules, ev, bindings)`. Shallow-clone the element/question/prompt/content path being written (no input mutation). Non-item elements untouched. (Locale: rewrite each locale key present in `prompt.content`, or at minimum the preview's active locale — implementation rewrites every locale entry's `text` via the same fieldPath, since the viewer keys piping by element path not locale.)
- **`editor/src/logic/ruleOps.ts`** — `validateRule(rule, targets, pipingPaths: string[] = [])` (3rd arg defaulted → D2a 2-arg calls unchanged). Piping branch: `action.source` empty → error "choose a source question" (presence only — no unknown-id check, since a source may be a question or a score id); `action.field_path` empty → error "choose a target prompt", present-but-not-in-`pipingPaths` → warning "unknown target". No source-unknown warning anywhere (the dropdown guarantees a valid pick).
- **`editor/src/logic/RuleEditor.tsx`** — piping branch: `TargetSelect` for `source` (options `catalogue.questionIds`) + `TargetSelect` for `field_path` (options = `pipingTargets.map(t=>t.fieldPath)`, but display the `label`). Add a `pipingTargets: PipingTarget[]` prop. A label-aware select variant (or a small map fieldPath→label) renders friendly text while storing the path.
- **`editor/src/logic/LogicPanel.tsx`** — compute `collectPipingTargets(model)` + pass to `RuleEditor`; pass `pipingTargets.map(t=>t.fieldPath)` into `validateRule` for the attention count.
- **`editor/src/model/tree.ts`** — `updateFlow(model, patch: Record<string, unknown>)`: Immer; `const flow = {...(model.flow as object ?? {}), ...patch}`; delete keys whose value is `undefined`; if `Object.keys(flow).length === 0` delete `draft.flow` else `draft.flow = flow`.
- **`editor/src/inspector/fields.tsx`** — `CheckboxField({label, checked, onChange})` (mirrors `TextField`).
- **`editor/src/inspector/Inspector.tsx`** — add `CheckboxField`s: page/section ("Randomize element order"), block ("Randomize page order in block"), questionnaire-root ("Randomize page order"). Set via `updateNodeProps`/`updateFlow`; unset via `unsetNodeProp`/`updateFlow({...:undefined})`.
- **`editor/src/preview/PreviewPane.tsx`** — after `visiblePages`, add `const pipedPages = evaluator ? visiblePages.map((p) => applyPiping(p, model.logic ?? [], evaluator, bindings)) : visiblePages` and render `pipedPages`.

**Dependency direction:** `logic/{pipingTargets,piping}` + `model/tree` (`updateFlow`) → `RuleEditor`/`LogicPanel`/`Inspector`/`PreviewPane`. Reuses D1/D2a wholesale.

## 3 — Data flow

**Authoring:** type→piping in `RuleEditor` → source dropdown + field_path picker write `action`; `summarizeRule` (D2a) renders `pipe {source} → {field_path} if {cond}`.

**Preview:** `pages → filterPageVisible (D2a) → applyPiping (D2b) → render`. `answers` is editor state, so answering the source re-renders → re-pipes. Filter-before-pipe means hidden targets aren't piped. `scope:'all'` pipes cross-page (global answers); `scope:'page'` only same-page sources are answerable — both correct.

**Randomization:** checkbox check → `updateNodeProps(sel!, {randomize:true})` (page/section/block) or `updateFlow(m, {randomize_pages:true})` (root); uncheck → `unsetNodeProp(sel!, 'randomize')` / `updateFlow(m, {randomize_pages:undefined})`. Clean canonical output (no `false` litter). Preview ignores the flags (no shuffle, no crash).

## 4 — Error handling

- Piping `source`/`field_path` empty → **error**; `field_path` present-but-not-a-current-target → **warning** (the item may be added/renamed; imported stale paths stay editable, shown ⚠). No source-unknown warning (source may be a question or score id; the dropdown guarantees validity). Pickers keep an out-of-catalogue current value selectable (D2a `TargetSelect`).
- Preview: malformed piping condition (`ev.check !== null`) → rule skipped → original prompt text (false-safe). A `field_path` matching no rendered element → no-op.
- Randomization: booleans only; no validation. Unset removes the key (and `updateFlow` drops an emptied `flow`).

## 5 — Test plan

- `pipingTargets` — one target per top-level item prompt with the exact path + label; skips messages/sections; null-safe.
- `piping` — `pipedText` scalar/array/no-match/false/malformed; `applyPiping` rewrites matched prompt, leaves others, no mutation, composes after visibility.
- `ruleOps` — `validateRule(rule, targets, pipingPaths)`: piping source-empty=error, field_path-empty=error, field_path-not-in-pipingPaths=warning, valid piping rule=no errors, no source-unknown warning; **3-arg-default back-compat** (D2a 2-arg calls unchanged).
- `RuleEditor` — piping source dropdown + field_path picker emit `action`; out-of-catalogue value selectable; type switch keeps condition.
- `tree.updateFlow` — set/clear `randomize_pages`; drops empty flow; immutable.
- `Inspector` — randomize checkboxes on page/section/block + root; toggle round-trips Schema-2-valid; uncheck unsets.
- `PreviewPane` — a piping rule rewrites the target prompt after the source is answered; hidden target not piped.
- Playwright — author a piping rule, answer the source, screenshot the piped prompt + a randomize checkbox.

## 6 — Success criteria

1. Piping authored via source dropdown + field_path **picker** (no manual typing), emitting canonical `pages.{pageId}.elements.{idx}.prompt`; `validateRule` enforces presence (errors) + unknown (warnings).
2. Preview pipes live (source answer, array-joined) once the source is answered; visibility-then-piping order; malformed → original.
3. Randomization checkboxes author cleanly (unset removes the key) + round-trip Schema-2-valid; author-only (preview doesn't shuffle / crash).
4. All suites green; a screenshot delivered (piped text + a randomize checkbox).
5. **ED-D2 is COMPLETE** — skip/branch/visibility/piping authored; visibility + piping execute in preview; randomization flags authored.

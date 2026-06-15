# Editor ED-D4 (Scoring Builder — Author-Only) — Design Spec

**Date drafted:** 2026-06-15
**Author:** Editor ED-D4 brainstorming session (2026-06-15)
**Component:** **Editor**, sub-project **ED-D** (logic / validation / scoring builders), slice **D4** (scoring). **ED-D4 is scoped author-only**: the `scores[]` authoring panel. The **live score preview** (design §6) is deferred to a follow-on (D4b) — see Non-goals + the feasibility note.
**Builds on:** ED-D2a/D3a/D3b (the `LogicPanel`/`ValidationPanel` pattern; `updateLogic`/`updateValidation`; `RuleIssue`; the store picker slice `openPicker(etype, onPick)` from ED-C3a; `LibraryPicker`). Memories `project_editor_ed_d3b`, `project_editor_ed_c3a`, `project_od16_scoring_resolved`.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · Immer · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §6 (Scoring builder). Post-OD-16, scoring is NOT in-JSON formulas — it's external Scorer Library entities; the editor authors `scores[]` referencing them. (§6's "live evaluation against a synthetic sample response" is the deferred D4b piece.)
- [project_od16_scoring_resolved](memory) — OD-16: external Scorer Library entity (`scr_*`); `scores[]: {id, scorer, path}` referencing JSON-Pointer paths into the Scorer's structured output; on-demand scoring.
- Schema 2 `v26.0602` (`schemas/questionnaire/schema.json`): `Score` (`Questionnaire.scores[]`) = `{ id: string(^[a-z][a-z0-9_]*$), scorer: string(^scr_[a-z0-9_]+@v\d{2}\.\d{4}$), path: string(^(/[^/]*)+$ — JSON Pointer), name?: string, description?: string, x_*? }`, required `[id, scorer, path]`. The `Scorer` entity (`scr_*`) carries `output_schema` (paths source) + `implementations[]` (wasm url+sha256 / http / python / r) — used by the deferred live preview, not by D4 authoring.
- Feasibility (from the ED-D4 exploration): `scorer` IS a registered Library etype + servable, but **zero scorers are seeded** in the live Library; the editor's `parseRef` lacks the `scr_` prefix; the editor has **no Viewer Service** to serve scorer wasm + no denormaliser to pin `impl`. → live score preview is infeasible without bundling a reference scorer + porting the executor → **deferred**.
- Editor (mirror/extend): `editor/src/logic/{ValidationPanel,ValidationRuleEditor,validationRuleOps}.{ts,tsx}`, `editor/src/model/tree.ts` (`updateValidation`), `editor/src/persistence/library.ts` (`PREFIX_TYPE`/`parseRef`), `editor/src/library/LibraryPicker.tsx` + the store picker slice, `editor/src/inspector/Inspector.tsx` (hosts Logic + Validation panels).

---

## 1 — Scope (ED-D4, author-only)

### 1.1 In scope

- **Typed model + helper + parseRef fix** — `Score` type + `scores?: Score[]` on `Questionnaire`; `updateScores(model, scores)` (Immer; set, or delete when empty — mirror `updateValidation`); add `scr: 'scorer'` to `PREFIX_TYPE` in `persistence/library.ts` so `parseRef('scr_*@vYY.MMDD')` resolves + the Library picker/`fetchEntityBody` work for scorers.
- **`logic/scoreOps.ts`** (pure) — `newScore(existing)` (first-free `score_N` id; `scorer:''`, `path:''`); `summarizeScore(score)`; `validateScore(score, allScores)` → `{errors: RuleIssue[]}` (reuse `RuleIssue`): id empty/bad-pattern=error + duplicate=warning; scorer empty=error / bad `scr_*@vYY.MMDD`=error; path empty=error / bad JSON-Pointer=error.
- **`logic/ScoreEditor.tsx`** — id `<input>` (aria "Score id") + scorer `<input>` (aria "Scorer ref", manual) + "Pick from Library" button (`openPicker('scorer', ref => onChange({...score, scorer: ref}))`) + path `<input>` (aria "Score path", JSON-Pointer) + optional name/description inputs + inline issues. All controlled.
- **`logic/ScoringPanel.tsx`** — mirror `ValidationPanel`: list (`summarizeScore`) + "**+ Add score**" (distinct label) + delete + "N need attention"; writes via `applyEdit(updateScores(...))`; row labels `aria-label="Edit score N"`; heading "Scores"; a one-line note that scoring runs in the deployed viewer (no live preview yet). Mounted in the Inspector `kind==='questionnaire'` branch after `<ValidationPanel/>`.
- **Tests:** pure (`updateScores`, `parseRef` scr, `scoreOps`); RTL (`ScoreEditor`, `ScoringPanel`, Inspector mount); a Playwright smoke + screenshot.

### 1.2 Non-goals (deferred → D4b / FOLLOWUPS)

- **Live score preview** (design §6) — needs a bundled reference-scorer wasm + a ported executor (input-assembly + sha256-verify + compile + JSON-Pointer + cache) + impl-pinning; reference-scorers-only. `score()` stays null in preview; score-referencing logic/validation conditions remain inert in preview (as today).
- **Path autocomplete from the scorer's `output_schema`** — pairs with D4b (needs the resolved scorer body); D4 uses validated manual JSON-Pointer entry.
- **Unknown-scorer / unknown-path warnings** — need the resolved scorer body (D4b).
- **Seeding Scorer entities into the Library** — a Library-content task, not the editor's.
- **Subscale / `x_show_score` display-policy authoring**; translation (ED-E); the Logic/Validation/Scoring → Inspector tabs consolidation.

---

## 2 — Architecture & components

- **`editor/src/model/types.ts`** — add:
  ```ts
  export interface Score {
    id: string
    scorer: string
    path: string
    name?: string
    description?: string
  }
  ```
  add `scores?: Score[]` to `Questionnaire`.
- **`editor/src/model/tree.ts`** — `updateScores(model, scores: Score[])` (Immer; `scores.length === 0` → `delete draft.scores` else `draft.scores = scores`).
- **`editor/src/persistence/library.ts`** — add `scr: 'scorer'` to `PREFIX_TYPE`.
- **`editor/src/logic/scoreOps.ts`** (pure):
  - `newScore(existing): Score` — `id = 'score_' + n` (smallest free); `{ id, scorer: '', path: '' }`.
  - `summarizeScore(score): string` — `\`${score.id || '?'}: ${score.scorer || '(no scorer)'} → ${score.path || '(no path)'}\``.
  - `validateScore(score, allScores): { errors: RuleIssue[] }` — `RuleIssue` from `./ruleOps`. id: empty→error, not `/^[a-z][a-z0-9_]*$/`→error, dup in `allScores`→warning. scorer: empty→error, not `/^scr_[a-z0-9_]+@v\d{2}\.\d{4}$/`→error. path: empty→error, not `/^(\/[^/]*)+$/`→error.
- **`editor/src/logic/ScoreEditor.tsx`** — props `{score, allScores, onChange, onDelete}`. id input; scorer input + "Pick from Library" (uses `useEditorStore`'s `openPicker('scorer', ref => onChange({...score, scorer: ref}))`); path input; name/description inputs; issues list (red error / amber warning, same idiom).
- **`editor/src/logic/ScoringPanel.tsx`** — reads `model.scores ?? []`; attention via `validateScore(s, scores)`; add/edit/delete via `updateScores`; list/summary/expand idiom from `ValidationPanel`; "+ Add score"; "Edit score N" rows; "Scores" heading; the deployed-viewer note.
- **`editor/src/inspector/Inspector.tsx`** — `<ScoringPanel />` after `<ValidationPanel />` in the questionnaire branch.

**Dependency direction:** `model/{types,tree}` + `persistence/library` (parseRef) + `logic/scoreOps` (pure) → `ScoreEditor`/`ScoringPanel` → store via `applyEdit` + the picker slice. No `validation.ts`/`PreviewPane` changes (live preview deferred).

## 3 — Data flow + semantics

**Authoring:** "+ Add score" → `newScore(scores)` → `updateScores`; edits replace-by-index; delete by index. Scorer set via manual input OR `openPicker('scorer', …)` (inserts a hard-pinned `@vYY.MMDD` ref; the live Library has no scorers, so manual is the working path today). Path = manual JSON-Pointer. Round-trips Schema-2-valid once filled.

**Validation (`validateScore`, non-blocking):** id required+pattern (error) + dup (warning); scorer required + `scr_*@vYY.MMDD` pattern (error); path required + JSON-Pointer pattern (error). "N need attention" counts error-level scores. No unknown-scorer/unknown-path checks (need the resolved scorer body → D4b).

**Honest labelling:** the panel notes scoring runs in the deployed viewer (no live score in preview yet) — consistent with skip/branch's "runs in the deployed viewer" note.

**Error-safety:** Ajv validates the whole questionnaire each edit; an unfinished score (`scorer`/`path` required by schema) is Ajv-invalid until filled — same "save WIP, flag it" behaviour as ED-D2's empty-condition rule; both the banner + inline `validateScore` flag it. A `score(id)` referenced by a logic/validation condition still resolves null in preview (unchanged).

## 4 — Test plan

- `updateScores` — set/replace/clear-on-empty/immutable/Schema-2-valid.
- `parseRef` — `scr_phq9@v26.0602` → `{etype:'scorer', id:'scr_phq9', version:'v26.0602'}`; existing prefixes unaffected.
- `scoreOps` — `newScore` first-free `score_N` (`[score_1,score_3]`→`score_2`); `summarizeScore` incl. "(no scorer)"/"(no path)"; `validateScore` id empty/bad/dup, scorer empty/bad-pattern, path empty/bad-JSON-Pointer, valid→none.
- `ScoreEditor` (RTL) — id/scorer/path(+name/description) inputs; edits emit; "Pick from Library" calls `openPicker('scorer', …)`; inline issues (empty path→error, bad scorer→error).
- `ScoringPanel` (RTL) — list summaries; "+ Add score" appends auto-id score; delete by index; attention count; Inspector mount present at root / absent for a page selection; no collision with Logic/Validation panels.
- Playwright — add a score (scorer `scr_phq9@v26.0602` + path `/total`), assert summary `score_1: scr_phq9@v26.0602 → /total` + no banner, screenshot the panel.

## 5 — Success criteria

1. `scores[]` typed + edited via `updateScores`; `parseRef` resolves `scr_` refs; round-trips Schema-2-valid.
2. Scoring panel (root Inspector, below Validation) does CRUD — auto-`score_N` id, scorer (manual + Library picker), JSON-Pointer path, name/description — with per-field validation (id/scorer/path errors + dup-id warning).
3. The panel notes scoring runs in the deployed viewer (no live score in preview yet).
4. All suites green; a screenshot delivered showing an authored score.

This completes the **authoring** surface of ED-D (logic + validation + scoring). The live score preview is the deferred D4b follow-on.

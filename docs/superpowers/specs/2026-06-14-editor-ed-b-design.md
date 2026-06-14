# Editor ED-B (Inline WYSIWYG Preview) — Design Spec

**Date drafted:** 2026-06-14
**Author:** Editor ED-B brainstorming session (2026-06-14)
**Component:** **Editor**, sub-project **ED-B** — the second of six stages (ED-A..F; decomposition in `docs/superpowers/specs/2026-06-14-editor-ed-a-design.md` §0). Adds a live split-pane WYSIWYG preview that renders the in-progress questionnaire using the Web Viewer's renderer library directly (OD-03 — the preview *is* the deployed renderer, not a separate engine).
**Builds on:** ED-A (built + merged 2026-06-14; memory `project_editor_ed_a`). ED-A delivers the static SPA, the canonical Schema-2 model (refs intact), the Zustand store, and the 3-pane "preview-split" shell with a **disabled `▢ Preview` placeholder** that ED-B now fills.
**Stack:** unchanged from ED-A (Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright). New dependency: the Web Viewer renderer library, consumed locally.
**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §8 (Preview), §"Resolved decisions" (OD-03).
- [design/08_viewer.md](../../../design/08_viewer.md) §"visual fidelity" (strict-presentation within the physical envelope — drives the device-frame picker).
- `web-viewer/src/renderer/` — the OD-03 renderer library (public surface `src/renderer/index.ts`; built via `npm run build:lib` → `web-viewer/dist-lib/`). Key exports: `StepRenderer` (presentational, takes `elements`+`locale`+`answers`+`onAnswer`), `mergeOptions`, `deriveWidget`, and the **`Runtime`/`RuntimeElement`/`ItemElement`/`SectionElement`/`ContentEntity`/`OptionEntity`** types (`web-viewer/src/renderer/types.ts`). The renderer does the option-merge, widget derivation, and locale selection itself.
- `questionnaire-runtime-denormaliser/src/denormaliser/` (OD-18) — the canonical Python denormaliser. ED-B replicates only **pass 1 `resolve_refs`** (`resolve.py`) + a subset of **pass 6 `assemble_runtime`** (shape) in TS; its golden fixtures (`tests/fixtures/mini_phq.py`, `tests/fixtures/*`) are reused as shared resolve-step test vectors. Memory `project_runtime_denormaliser_built`.
- `design/05a_reusable_entities.md` §13 (widget derivation — done by the renderer, not ED-B) + §3 entity prefixes (`pr_`/`opt_`/`it_`/`q_`/`msg_`/`ctx_`/`ins_`/`ph_`/`help_`/`rx_`).
- ED-A memory `project_editor_ed_a`; the Library read API (live) for entity-body resolution.

---

## 1 — Scope (ED-B)

### 1.1 In scope

- **`projectForPreview(model, resolveEntity)` — a pure TS "resolve-and-shape" module** (`editor/src/preview/`), the genuinely new work:
  - **Resolve refs:** recursively inline every `{ "ref": "<id>@<version>", ...siblings }` object with the referenced entity body (sibling keys win over the body; `ref` dropped; recurse into the resolved body so nested/transitive refs resolve) — faithfully mirroring the Python denormaliser's `resolve_refs` (`resolve.py`).
  - **Shape:** assemble the renderer's `Runtime` shape (`metadata`, `pages[].elements[]`, optional `blocks`, `style`/`flow`, a stub `provenance`). The **full `content` language map is kept** (no locale-trim) so the renderer picks the locale.
  - **Unresolvable refs** are left as a marker the renderer shows as an `UnsupportedElement`/placeholder (collect-all, never throw) — honest "referenced entity unavailable".
  - Pure + injectable `resolveEntity(ref) => entityBody | null`; no I/O inside `projectForPreview`.
- **`resolveEntity` implementation** (`editor/src/preview/resolver.ts`): checks **inline** entities first (entities embedded in the draft), then a **Library entity-body client** (extends ED-A's `persistence/library.ts`), **cached by `ref@version`** in memory. Async (returns a promise); `projectForPreview` consumes a pre-resolved entity map (resolution is done first, then the pure shape step runs synchronously — see §2).
- **Embed the renderer library** (`@behaverse/questionnaire-renderer`, OD-03): consume `web-viewer/dist-lib` via a **local path dependency**; a prepare/predev step ensures `dist-lib` is built (`cd ../web-viewer && npm run build:lib`). Import `StepRenderer` + its precompiled CSS + the `Runtime`/element types.
- **Preview pane UI** (`editor/src/preview/PreviewPane.tsx`):
  - The ED-A `▢ Preview` topbar toggle is **enabled**; toggling splits the center into **`Canvas | Preview`** (left tree + right inspector stay visible).
  - **Language picker** over `metadata.available_languages` (instant — renderer re-picks locale, no re-projection).
  - **Device-frame picker** (mobile-portrait / tablet / desktop) constraining render width per design/08 strict-presentation "physical envelope".
  - **Scope toggle:** default **selected-page** preview (keeps the author's current edit in view) + a **whole-questionnaire** option (all steps, scrollable).
  - **Throwaway local answer state** — a real `onAnswer` into local React state so widgets are interactive to inspect; answers are discarded (no capture, no submission).
  - Live **debounced** re-projection on model change; a small "resolving…" affordance while Library fetches are in flight; an error/placeholder state for unresolved refs.
- **Tests** (§7): pure `projectForPreview` unit tests (incl. shared denormaliser vectors for the resolve step), RTL preview-render + language/device/live-edit tests, a Playwright smoke that toggles Preview and screenshots.

### 1.2 Non-goals (deferred)

- **No live logic / `show_if` / branching / skip / piping** — the preview is static structural (→ ED-D). The renderer is presentational; the web-viewer logic engine + WASM evaluator are NOT embedded in ED-B.
- **No scoring / score preview**, no scorer pinning (→ ED-D).
- **No cross-question or per-question validation evaluation** in the preview (→ ED-D).
- **No "Open in viewer" / preview deployment**, no PDF/printable export (→ ED-F). ED-B is the *inline* preview only.
- **No response capture/submission** — answers in the preview are throwaway.
- **No locale-trimming, manifest-reconcile, scorer-pinning, or score-stripping** — those denormaliser passes are unnecessary for visual preview and belong to the canonical Python denormaliser used by the real deployment path (ED-F via the Viewer Service).
- **No item/Question/Option authoring** (still ED-C) — ED-B previews whatever ED-A can produce/load.

---

## 2 — Architecture

Two-step pipeline, separating I/O (resolution) from a pure transform (shape):

1. **Collect + resolve refs (async, cached).** Walk the draft, gather every `ref`, resolve each via `resolveEntity` (inline → Library client, cached by `ref@version`), producing an in-memory `Map<ref, body|null>`. Library misses/offline → `null` (→ placeholder).
2. **`projectForPreview(model, resolvedMap) => Runtime` (pure, sync).** Inline bodies (sibling-key override, transitive), keep full `content` maps, assemble the `Runtime`/element shape. Unit-tested against the Python denormaliser's golden fixtures for the resolve step.

The store (`useEditorStore`) gains preview UI state only where it must be shared (the `▢ Preview` toggle); the preview's locale/device/scope/answers are **local** to `PreviewPane` (throwaway). Re-projection is driven by a debounced effect on `model` + the resolved-entity cache.

**Module layout** (`editor/src/preview/`): `project.ts` (pure shape+resolve-inlining), `resolver.ts` (inline+Library entity client + cache), `PreviewPane.tsx` (split-pane UI: language/device/scope pickers + `StepRenderer` host + throwaway answers), `frames.ts` (device-frame dimensions). Renderer types imported from the library.

**Dependency on the renderer library:** local-path consume of `web-viewer/dist-lib` (built by `npm run build:lib`). React is externalized by the lib (peer dep) — editor's React 19 satisfies it. A `predev`/`pretest`/`prebuild` step builds `dist-lib` if absent (mirrors how `web-viewer` builds its evaluator/scorer artifacts).

---

## 3 — Data shapes

`projectForPreview` outputs the renderer's `Runtime` (`web-viewer/src/renderer/types.ts`): `{ provenance, metadata{id,title,description?,language}, locale?, available_locales?, style?, flow?, blocks?, pages: [{id,title?,elements:[...]}], ... }`. Elements are `ItemElement` (`{question{prompt,context?,instruction?}, option, required?, show_if?}`), `SectionElement` (`{title?, shared_option?, elements[]}`), or `MessageElement` (`ContentEntity`). The renderer merges options (`structural options[]` × `content.<locale>.options[]` on `index`) and derives widgets itself — ED-B does **not** replicate that.

`show_if` strings may be present on resolved elements; in ED-B they are **ignored** (passed through, not evaluated) since there is no logic engine. The renderer renders the element regardless.

---

## 4 — Entity resolution detail

`resolveEntity(ref)`: parse `ref` into `{prefix, id, version}` (e.g. `pr_aiss_q_2@v26.0602`). Map prefix → Library entity type. Resolution order: **inline** (some drafts embed entities) → **Library read API** entity-body fetch (by type+id+version), cached. The exact Library endpoint (`/v1/entities/{type}/{id}` ± version, or the resolution-bundle endpoint) is verified during build (spec §7 of ED-A flagged the analogous `resolved=false` check). On miss/offline/error → `null` → placeholder. Caching is per `ref@version` so live re-projection on every keystroke does not refetch.

---

## 5 — Preview UI / UX

- The center region is a CSS split (`Canvas | Preview`) when Preview is on; the toggle persists for the session. Tree + inspector remain mounted.
- **Device frames** set a fixed pixel width (e.g. mobile 390, tablet 768, desktop 100%) and center the render in a bordered "device" container; height scrolls. This realises design/08's "presentation reproduced as authored within the physical envelope of the chosen viewport."
- **Language picker** lists `metadata.available_languages` (fallback to `metadata.language`); changing it sets the `locale` prop on the renderer.
- **Scope toggle**: selected-page (default) renders only the currently-selected page's steps; whole-questionnaire renders all pages.
- Applies the **theme tokens** (ED-A reuses them) so the preview looks like a themed viewer.

## 6 — Error / edge handling

- Unresolved ref → renderer `UnsupportedElement`/placeholder card; a non-blocking banner counts how many refs are unavailable (e.g. "3 referenced entities not loaded").
- A draft that fails `projectForPreview` (malformed) → a friendly "cannot preview" message in the pane, never a crash (mirrors ED-A's stale-selection guard discipline).
- Library fetch in flight → "resolving…" affordance; failures are cached as `null` but **retryable** via a "retry resolution" action.

## 7 — Testing & gate

- **Unit (pure):** `projectForPreview` — nested/transitive ref inlining, sibling-key override, inline vs resolved-map, unresolvable→placeholder marker, full-content-map preserved, blocks/style/flow passthrough. **Reuse the Python denormaliser's golden fixtures** (`questionnaire-runtime-denormaliser/tests/fixtures/`) as shared vectors for the resolve step (assert the TS resolve output matches the Python `resolve_refs` result on the same input).
- **`resolver.ts`:** inline-first, Library-fetch (injected fake fetch), cache-by-`ref@version` (no refetch), miss→null.
- **Component (RTL):** PreviewPane renders a fixture's prompts/options/widgets via the real `StepRenderer`; language switch changes rendered text; device switch changes container width; an inspector edit live-updates the preview (debounced).
- **Playwright smoke:** load a fixture → toggle `▢ Preview` → assert a known prompt renders in the preview pane → screenshot `ed-b-preview.png` for the owner.
- **Gate:** a loaded real questionnaire (inline-content fixture, e.g. kitchensink's inline items) renders in the preview pane identically in structure to what the Web Viewer would show; language + device pickers work; preview updates live on edit.

## 8 — Success criteria

ED-B is done when: with a questionnaire open in the editor, toggling Preview shows a live, themed, device-framable WYSIWYG render of the questionnaire (selected page or whole) in any available language, produced by the **actual Web Viewer renderer** fed by a thin resolve-and-shape projection; edits reflect live; unresolved references degrade gracefully; all suites green + a screenshot delivered.

## 9 — Open questions / to verify during build

- **Library entity-body endpoint** — confirm the live read API serves individual reusable-entity bodies by type+id (+version) suitable for `resolveEntity`, or whether the resolution-bundle endpoint is the right source. Fall back to inline-only preview + a FOLLOWUPS note if not.
- **dist-lib consume mechanics** — exact local-path/package-name wiring (`file:../web-viewer` + import path `questionnaire-web-viewer/renderer`, or a Vite alias) and the prepare-step ordering so `dist-lib` is present for `dev`/`test`/`build`.
- **Renderer CSS** — import the precompiled `renderer.css` without clashing with the editor's Tailwind (the lib uses a scoped `qv-theme` build; verify no global bleed).
- **Shared-vector mechanism** — how to run the Python `resolve_refs` to capture expected outputs for the TS test (commit captured JSON vectors vs invoking Python in CI). Prefer committed JSON vectors derived from the denormaliser fixtures.

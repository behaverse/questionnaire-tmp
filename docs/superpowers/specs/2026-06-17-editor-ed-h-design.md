# ED-H — Editor UX & Visual Refresh (design)

**Date:** 2026-06-17
**Status:** approved (owner, 2026-06-17) — un-parks the editor for a UX/visual pass
**Stage:** ED-H (continues the ED-A..G editor lineage, under `editor/`)
**Owner direction:** "improve its UI, usability and potentially add more features" → first stage = **UX + visual refresh** with the **calm pro instrument** aesthetic (Linear/Notion-adjacent: neutral surfaces, one confident accent, real icons, efficient-but-breathable spacing). Features ride on top in later stages.

## Problem

The editor is feature-complete (ED-A..G) but its authoring **chrome** is raw default-Tailwind and technical:

1. **Raw IDs everywhere the author edits.** The left structure tree and the centre canvas item rows label every item with its entity ref (`pr_bisbas_q_1@v26.0606`) or the literal text "inline item" — never the question text. The live preview shows the real prompt, but the surfaces you *edit* on do not. You cannot scan your own questionnaire without clicking each row.
2. **Topbar overload.** Eight flat, undifferentiated buttons in one row (Home · Editing language · Check for updates · Open preview · ✓ Validate · ▢ Preview · Translate · Export · Export bundle), competing with the title. No primary/secondary hierarchy.
3. **Plain chrome.** Tiny ALL-CAPS gray micro-labels, hairline gray borders, system font, flat gray-fill selection, no accent, glyph icons (`▣ ▤ ▦ ✉ ◉ ✕`). No deliberate visual identity. (The participant-facing viewer has a polished theme system; the editor frame never got one.)
4. **Inspector pile-up.** At the questionnaire root, three global panels (Logic / Validation / Scoring) stack vertically in one long scroll — the long-noted "consolidate into tabs" was never done.

These reinforce each other: fixing the look and the readable labels together is simultaneously the visual restyle *and* the biggest daily-friction win, with no backend/Identity blockers.

## Goals

- A deliberate **"calm pro instrument"** visual system for the editor chrome, applied consistently.
- Structural surfaces (tree, canvas) show **human-readable content** with the id demoted to a secondary affordance.
- A **topbar with clear hierarchy** (modes vs primary action vs utilities) — fewer visible controls.
- Logic / Validation / Scoring consolidated into **inspector tabs**.

## Non-goals (explicit guardrails)

- **No behavior change.** Logic, validation, scoring, piping, translation, preview rendering, persistence, export, and Library/staleness/fork flows all keep their current semantics. This is presentation + information architecture only.
- **No schema change.** Canonical Schema 2 round-trip is unchanged; the round-trip gate stays green.
- **No new authoring capability.** (Auto-translate, live score preview, etc. are later stages.)
- **No change to the participant-facing renderer** (`web-viewer` lib) or the preview output — it already looks right. Only the editor's own chrome changes. (The preview pane's surrounding controls may adopt the tokens, but the rendered questionnaire is untouched.)
- **No backend / no Identity-gated work.**

## Approach — three slices, built in order

Build order is **foundation-first** so later slices inherit the new look. Each slice lands on master with all suites green + a Playwright screenshot before the next begins.

### ED-H1 — Visual system foundation + polish sweep

The token layer everything else consumes.

- **Tokens.** Add editor-chrome CSS custom properties to `editor/src/index.css` (namespaced `--qv-ed-*`): `surface`, `panel`, `border`, `border-strong`, `text`, `muted`, `accent`, `accent-soft`, `danger`, plus radius/shadow scale. Map the semantic ones into `editor/tailwind.config.ts` `theme.extend.colors` (e.g. `ed-surface`, `ed-panel`, `ed-border`, `ed-accent`, `ed-muted`) so components use `bg-ed-panel`, `text-ed-muted`, `border-ed-border`, `ring-ed-accent`, etc. Single source of truth; restyling later is a token edit.
- **Accent discipline.** Indigo accent used *sparingly*: active tab, primary button, selected tree-row marker (left-border + soft tint, replacing flat `bg-slate-200`), focus ring. Neutrals carry everything else.
- **Type & labels.** A small type scale; field labels become **sentence-case** muted text (retire the `text-xs uppercase tracking-wide` micro-labels in `inspector/fields.tsx` and panel headers).
- **Icons.** Add **`lucide-react`** (approved). Replace structural glyphs and action glyphs with consistent line icons (tree node kinds, topbar actions, delete/add, status). Icons get `aria-label`/`aria-hidden` as appropriate; existing accessible names (`aria-label`s already on rows/buttons) are preserved so tests and screen readers keep working.
- **Polish sweep** applying tokens across: `inspector/fields.tsx`, panel/section headers, `tree/StructureTree.tsx` rows, `canvas/Canvas.tsx` item cards, the `Resizer` in `app/EditorWorkspace.tsx`, hover/focus states, the start screen (`app/StartScreen.tsx`).

**Out of H1:** the topbar regroup and inspector tabs (those are H3) — but H1 *does* restyle the existing topbar/inspector in place with tokens so nothing looks half-done between slices.

### ED-H2 — Readable content labels

- **Shared helper** `resolveNodeLabel(model, path, pool, resolved, locale) → { text: string | null, id: string | null }` (new module, e.g. `editor/src/tree/nodeLabel.ts`). Resolution mirrors the existing translation-dot logic in `StructureTree.tsx`:
  - item → `question.prompt.ref` → `(pool[ref] ?? resolved[ref]).content[locale].text` (fall back to primary locale, then any locale).
  - message → `el.ref` → same content lookup.
  - section → `el.title`. page/block → `title`.
  - `id` = the ref id (without `@version`) for ref-bearing nodes, else the node `id`.
- **Tree** (`tree/treeModel.ts` + `tree/StructureTree.tsx`): rows render `text` as the primary label and `id` as a small muted secondary line (or inline-dim suffix) + `title` tooltip. When `text` is null (unresolved: Library ref with preview closed / no content), fall back to showing `id` as primary (current behavior) so nothing regresses offline. Keep numbering (`num.`) and translation dots. `buildTreeRows` either takes a resolver callback or rows carry `{text, id}` resolved in the component — implementation choice for the plan, pure + unit-tested either way.
- **Canvas** (`canvas/Canvas.tsx`): the item-row `label` (currently `el.ref` or "inline item") uses the same helper — text primary, id secondary chip/tooltip. The kind chip, Required checkbox, UpgradeBadge, ForkButton, and delete stay. The `aria-label={`Delete ${label}`}` keeps a stable, meaningful name.
- **Truncation/empty:** long prompts truncate with title tooltip; brand-new unedited items (empty prompt text) show a muted placeholder like "Untitled item" + id, not a blank row.

### ED-H3 — Topbar hierarchy + inspector tabs

- **Topbar** (`app/Topbar.tsx`): regroup into clusters.
  - **Left:** Home (icon button) · title + unsaved dot · `EditingLocaleSwitcher`.
  - **Right — modes:** `Preview` and `Translate` as a small **segmented toggle group** (clearly stateful; current on/off styling becomes the segmented active state).
  - **Right — primary:** an **`Export ▾` menu** folding in {Export JSON (the current primary `Export`), Export bundle, Open standalone preview (current "Open preview")}. The invalid-schema confirm on JSON export is preserved.
  - **Right — utilities:** `Validate` as a compact status-aware chip (✓ when valid / ⚠ count when not); "Check for updates" demoted — the `⬆ N updates` badge stays prominent only when `staleness` is non-empty, with a quiet refresh affordance (icon button / menu item) otherwise.
  - Net: ~8 always-visible controls → ~4 clusters. All existing actions remain reachable; only grouping/labels/icons change. A lightweight dropdown menu component (focus-managed, click-outside, Esc) is introduced for `Export ▾` (and reused if convenient) — no new dependency.
- **Inspector tabs** (`inspector/Inspector.tsx`): at the questionnaire root, render metadata fields, then a **tabbed section** "Logic · Validation · Scoring" mounting `LogicPanel` / `ValidationPanel` / `ScoringPanel` one at a time (instead of all three stacked). A minimal local tab state; each panel component is unchanged internally. Non-root inspectors (page/section/block/item) are unchanged except for the H1 restyle.

## Components / files touched (indicative)

- H1: `index.css`, `tailwind.config.ts`, `inspector/fields.tsx`, `tree/StructureTree.tsx`, `canvas/Canvas.tsx`, `app/EditorWorkspace.tsx` (Resizer), `app/StartScreen.tsx`, `app/Topbar.tsx` (in-place restyle), `package.json` (+lucide-react). New: a tiny `ui/` for shared primitives (Icon wrappers / Button / Menu) if it reduces repetition.
- H2: new `tree/nodeLabel.ts` (+ test), `tree/treeModel.ts`, `tree/StructureTree.tsx`, `canvas/Canvas.tsx`.
- H3: `app/Topbar.tsx`, `inspector/Inspector.tsx`, new `ui/Menu.tsx` + `ui/Tabs.tsx` (or co-located), tests.

## Testing & verification

- **Unit (vitest):** existing tests that query the old raw-id labels or old button text get updated per slice (expected churn — H2 changes tree/canvas labels; H3 changes topbar/inspector queries). New pure-logic tests: `resolveNodeLabel` (resolved / fallback / locale-fallback / empty cases), tab switching, menu open/close. Keep the Schema-2 round-trip and all logic/validation/scoring/translation tests green and untouched in intent.
- **E2e (Playwright):** re-run the **full** `npm run e2e` suite after each slice (the project has repeatedly hit "e2e rot" — new global panels/menus create strict-mode selector ambiguities; scope selectors and fix all specs, not just the new one). Add one onboarding/shell smoke per slice that asserts the new structure and captures a screenshot.
- **Typecheck/build:** `npm run typecheck` clean; `npm run build` still emits `index.html` + `preview.html` + wasm + sample.
- **Screenshots:** capture the refreshed landing + 3-pane view (and topbar/tree/inspector crops) after each slice via the existing chromium script pattern, for owner review. Owner reacts to screenshots — show, don't describe.

## Risks

- **Test churn** from label/button-text changes is the main cost — accepted; bounded to query updates, not logic.
- **e2e selector ambiguity** from the new `Export ▾` menu and segmented toggles — mitigated by scoping selectors to their cluster and running the full suite (the recorded lesson from ED-E/ED-F).
- **Accessibility regressions** from swapping glyphs to icons — mitigated by preserving existing `aria-label`s and marking decorative icons `aria-hidden`.
- **Accent overuse** drifting from "calm" — mitigated by the token discipline (accent only on active/primary/selected/focus).

## Definition of done (per slice)

H1: tokens + lucide-react in; chrome visibly restyled to "calm pro instrument"; all suites + full e2e green; typecheck/build clean; screenshot captured.
H2: tree + canvas show readable text (id secondary), offline fallback intact; `resolveNodeLabel` unit-tested; suites + e2e green; screenshot.
H3: topbar regrouped to ~4 clusters with `Export ▾` menu + segmented mode toggles; Logic/Validation/Scoring in inspector tabs; all actions reachable; suites + e2e green; screenshot.

Stage done when H1+H2+H3 are merged to master (local merge + push, **no PR** per project policy), HANDOFF updated to un-park the editor and record ED-H, and a `project_editor_ed_h` memory written.

# Web Viewer Visual Polish — Theme System Foundation (Stage 1) — Design Spec

**Date drafted:** 2026-06-13
**Author:** Visual Polish brainstorming session (owner-driven, 2026-06-12 → 2026-06-13)
**Component:** **Web Viewer** (`web-viewer/`) — the owner-requested **Visual Polish** pass (HANDOFF "ACTIVE TASK"). **Pure presentation**: no functional code changes (logic engine, resume, submission, navigation semantics are untouched).
**Target:** `web-viewer/` only. No Viewer Service, schema, denormaliser, or Library change.
**Stage:** **1 of 2** (Foundation). Stage 2 (full theme set + contrast tests + gallery polish) is a follow-on spec/plan.

**Authoritative source documents:**

- Memory `feedback_web_viewer_visual_direction` (owner directive 2026-06-11): Typeform-class **focus mode** is the default; the default theme must feel opinionated/polished, never a Google-Forms/LimeSurvey grey scaffold.
- [design/08_viewer.md](../../../design/08_viewer.md) §"Presentation modes" (focus default), §"Cross-viewer contract" (physical-envelope-only adaptation), §"Theming" (theme bundle → `--qv-*`).
- `web-viewer/FOLLOWUPS.md` — the visual-polish candidate list (focus-ring restyle, optical centring, transitions, choice-card states, theme typography).
- **OD-01** (custom React/TS renderer, no SurveyJS) and **OD-03** (the renderer is *also* a published library the Editor preview consumes — visual changes to `src/renderer/` flow into the Editor).
- The WV-A spec [`2026-06-11-web-viewer-wv-a-design.md`](2026-06-11-web-viewer-wv-a-design.md) §6 (focus-mode design rationale) and the existing theme plumbing: `src/app/theme.ts`, `src/index.css`, `src/renderer/lib.css`, `tailwind.config.ts`.
- WCAG 2.1 AA; the existing `vitest-axe` widget/matrix tests; the Viewer Service's "AA-contrast-at-save" theme rule (VS-E) as the precedent for per-theme contrast validation.

---

## 0 — Origin & process note

This pass was brainstormed **interactively against the running viewer**: a temporary lookbook page (`web-viewer/public/lookbook.html`) rendered candidate styles over the live fixtures via injected CSS, and the owner reacted to real screenshots across several rounds. That lookbook is a **throwaway brainstorming aid** — it is **deleted as part of this work** and **replaced by a first-class, registry-driven gallery** (§6). The visual decisions it produced are captured below.

**Locked owner decisions (from the brainstorm):**

1. **Default theme = "Minimal"** (the no-card, borderless-rows, monochrome-accent direction — "C").
2. **Ship all nine explorations as selectable built-in themes** (the "theme gallery" idea is a keeper): Warm, Minimal, Warm-mesh, Soft-float, Dotted-cool, Dotted-warm, Sage, Lavender, Artsy.
3. **Coloured themes colour the *card surface*** (Sage/Lavender were rejected as "washed out" when only the page was tinted) — the card carries the colour, option rows sit white on top, selection is a filled accent.
4. **The "view all themes at once" capability is a permanent feature**, and the whole theme-authoring process must be **documented and streamlined** so a future agent can be told *"work on the questionnaire themes/UI"* and have a clear, repeatable path.
5. **Theme model lives viewer-side** (presets selected by id), **no Schema-7 / VS theme-bundle CalVer bump now** (extending the VS bundle to carry full tokens is a documented future option).

---

## 1 — Scope assessment (Stage 1 of 2)

The work is bigger than a CSS touch-up: to ship structurally different themes (serif vs sans, card vs no-card, dotted/grid/mesh backgrounds, neobrutalist option style) from data, the viewer needs a **richer theme model** than today's palette+font+spacing. Stage 1 builds the foundation and proves the structural range with three reference themes; Stage 2 fills in the rest.

| # | Stage-1 concern | In scope |
|---|---|---|
| A | **Theme token model** (`ViewerTheme` type) + **registry/loader** | Yes |
| B | **Renderer/chrome plumbing** — consume tokens via an extended `--qv-*` set + structural `data-*` flags; refactor widgets off hard-coded `slate-*` utilities onto semantic `qv-*` classes | Yes |
| C | **Universal polish baseline** (focus-ring restyle, optical centring, transition tuning, choice-card states) — inherited by every theme | Yes |
| D | **Default theme = Minimal**, fully realised on the new model | Yes |
| E | **2 more reference themes** proving range: **Sage** (coloured card) + **Artsy** (neobrutalist/grid/Bricolage) | Yes |
| F | **Gallery** — productionised, registry-driven, dev-only route | Yes (v1) |
| G | **Docs** — `THEMES.md` token reference + "working on themes" runbook | Yes |
| H | **Per-theme WCAG-AA contrast check** (automated test over the registry) | Yes |
| — | Remaining 6 themes, gallery visual polish, optional VS-bundle token extension | **Stage 2 / deferred** |

---

## 2 — A: The theme token model

A new module `src/theme/types.ts` defines `ViewerTheme` — a structured, serialisable token object. Grouped fields (illustrative shape; exact field names finalised in the plan):

```ts
export interface ViewerTheme {
  id: string                 // stable key, e.g. 'minimal'
  name: string               // human label for the gallery, e.g. 'Minimal'
  surface: {                 // the page background behind the content
    kind: 'plain' | 'dots' | 'grid' | 'mesh'
    background: string       // base colour or gradient
    pattern?: string         // dot/grid colour (for dots|grid)
    patternSize?: string     // e.g. '22px'
  }
  card: {
    enabled: boolean         // false = no-card (content sits on the page)
    surface?: string         // card fill (coloured for Sage/Lavender)
    border?: string
    radius?: string
    shadow?: string
    padding?: string
  }
  prompt: { fontFamily: string; weight: number; size: string; color: string; letterSpacing?: string }
  secondary: { color: string }                     // context/instruction text
  options: {
    variant: 'borderless' | 'outline' | 'filled' | 'brutal'
    surface: string; border: string; radius: string
    hoverBorder?: string; hoverSurface?: string
    selected: { surface: string; border: string; color: string; shadow?: string }
  }
  badge: { border: string; color: string; surface: string; radius: string
           selected: { border: string; color: string; surface: string } }
  button: { surface: string; color: string; radius: string; shadow?: string; fontFamily?: string; weight?: number }
  accent: string            // progress bar + misc accent
  motion?: { stepInMs?: number; stepOutMs?: number; easing?: string }
  fonts?: string[]          // webfont families to load (Google Fonts), if any
}
```

Design rationale:
- **Faithful to the cross-viewer contract** — every field is a *physical-envelope* property (colour, type, spacing, radius, shadow, background). Nothing here can reorder/split/substitute structure.
- **Serialisable** — a theme is plain data, so a future agent (or a future VS-bundle extension) can author one without touching component code.
- **`variant` enums** capture the *structural* style differences (borderless vs filled vs neobrutalist option cards; card vs no-card) as a small closed set the renderer knows how to render — not arbitrary CSS, which keeps themes safe and reviewable.

### Registry / loader (`src/theme/registry.ts`)
- Exports `THEMES: Record<string, ViewerTheme>` and `DEFAULT_THEME_ID = 'minimal'`.
- `getTheme(id?)` → the theme or the default.
- **Theme selection precedence** (resolved): `?theme=<id>` URL param (dev/preview) → the VS theme bundle's `id` if it names a built-in → `DEFAULT_THEME_ID`. The VS bundle's *palette* still overrides matching tokens (back-compat: existing deployments that send a palette keep working — see §4 mapping).
- `fonts` are loaded once per active theme via an injected `<link>` to Google Fonts (only if the theme declares any; Minimal uses system/Inter and declares none).

---

## 3 — B: Renderer & chrome plumbing

Today widgets hard-code Tailwind colour utilities (`border-slate-200`, `hover:border-slate-300`, `bg-primary/5`, etc.). Stage 1 routes all *visual* (non-layout) styling through the theme model.

**Mechanism — semantic CSS classes driven by CSS variables + structural data-attributes:**

- A **theme root** element (the app `<main>` and, in the renderer library, the renderer's outer wrapper) receives:
  - the full `--qv-*` variable set (extended — see below), applied by `applyTheme(theme)` in `src/app/theme.ts`;
  - structural flags: `data-card={on|off}`, `data-option-variant={borderless|outline|filled|brutal}`, `data-surface={plain|dots|grid|mesh}`.
- **New semantic component classes** defined in `src/index.css` **and mirrored in `src/renderer/lib.css`** (kept in sync — hard constraint): `.qv-card`, `.qv-prompt`, `.qv-secondary`, `.qv-option`, `.qv-option-badge`, `.qv-button`, `.qv-surface`. Their properties read from the `--qv-*` variables; variant-specific rules are gated by the `data-*` attributes (e.g. `[data-option-variant="brutal"] .qv-option { … hard border + offset shadow … }`).
- **Widgets refactor** (`RadioGroup`, `CheckboxGroup`, `NumberInput`, `TextInput`, `MatrixGroup`, `MessageBlock`, `UnsupportedElement`, `ItemRenderer`, `SectionRenderer`): swap the hard-coded colour utilities for the `qv-*` classes. **Tailwind layout utilities (flex, gap, padding, grid) stay.** DOM structure, roles, `aria-*`, `tabindex`, and element order are **unchanged** (preserves the `vitest-axe` and structural tests; only colour/shape moves to tokens).

**Extended `--qv-*` set** (superset of today's `--qv-primary/secondary/success/warning/error/background/font-family/base-size/space-unit`): add the token-derived variables the classes need — e.g. `--qv-card-surface`, `--qv-card-radius`, `--qv-card-shadow`, `--qv-card-border`, `--qv-prompt-font`, `--qv-prompt-weight`, `--qv-prompt-size`, `--qv-option-surface`, `--qv-option-border`, `--qv-option-radius`, `--qv-option-selected-surface`, `--qv-option-selected-color`, `--qv-badge-*`, `--qv-button-*`, `--qv-surface-bg`, `--qv-surface-pattern`. `tailwind.config.ts` keeps its existing `primary/…/surface/font-theme` aliases (back-compat); new tokens are consumed via the `qv-*` classes, not new Tailwind aliases (avoids bloating the config).

**`applyTheme` grows** from "set 6 palette vars" to "emit the full variable set from a `ViewerTheme` + set the structural `data-*` attributes + ensure the theme's webfonts are loaded." It remains a pure DOM side-effect function (testable).

---

## 4 — Back-compat with the existing VS theme bundle

The VS still sends a `theme` bundle at `/sessions/new` (palette + typography + spacing). Mapping rule (no VS change):
- If the bundle carries an `id` matching a built-in → use that built-in as the base.
- The bundle's **palette/typography/spacing values override** the corresponding tokens (so a deployment that customised its blue still gets its blue, now on the polished Minimal structure).
- If the bundle names no built-in and carries only a palette → apply the **default (Minimal)** structure with the palette overrides (today's behaviour, visually upgraded).

This keeps every existing deployment working and means "themes are viewer-side presets" without breaking the VS contract.

---

## 5 — C: Universal polish baseline (every theme inherits)

Baked into the renderer/chrome and the base CSS, theme-independent:

1. **Focus-ring restyle.** The step heading `h2[tabindex="-1"]` no longer shows the raw black box on programmatic focus: give it `outline: none` **on the heading specifically** (it receives focus only for screen-reader announcement, not as an interactive control). **All genuinely interactive controls keep a visible, restyled focus ring** (`:focus-visible` → a 2px accent ring via `--qv-primary`), satisfying WCAG 2.4.7. This is the one a11y-sensitive change; the plan verifies keyboard focus is still announced and visible on controls.
2. **Optical centring.** Nudge the single-question column up ~4vh (the lone-question-in-a-tall-viewport "adrift" fix) via the content wrapper.
3. **Transition tuning.** Retune `qv-step-in/out` timing/easing (currently 220/200 ms) for a calmer slide+fade; keep the `prefers-reduced-motion` disable. Exact curve set in the plan; `motion` tokens can override per theme.
4. **Choice-card states.** Richer hover and a clearer selected state, plus the A/B/C letter badges — all driven by the `options`/`badge` tokens so each theme styles them in its own key.

---

## 6 — F: The theme gallery (permanent, registry-driven)

Replace the throwaway `lookbook.html` with a **first-class gallery** that reads the **same registry** the live viewer uses (single source of truth — it can never drift from the real themes):

- A **dev-only route/view** (e.g. `?gallery=1` handled in the app, or a small standalone `src/gallery/` entry built into the dev server) that renders **every registered theme** across the existing fixtures (`widgets`/`mini`/`matrix`/`branch`), with "All / one-up / fixture-switch" controls — the lookbook's UX, but backed by `THEMES` instead of injected CSS.
- **Dev-only**: gated behind `import.meta.env.DEV` (or excluded from the production build) so it never ships in a participant bundle. Documented in `THEMES.md` as the canonical "view all themes at once" surface.
- Reuses the real `applyTheme` per tile (via per-iframe or per-scope theme application), so what the gallery shows **is** what a deployment renders.

---

## 7 — G: Documentation & streamlined workflow

- **`web-viewer/THEMES.md`** — the durable reference:
  - the `ViewerTheme` token model (field-by-field, with the `variant` enums and what each renders);
  - **"Add or edit a theme in one file"** — copy a token file under `src/theme/themes/`, register it, preview in the gallery;
  - the **constraints** every theme must hold (WCAG-AA contrast, cross-viewer physical-envelope-only, keep tests green, `index.css`↔`lib.css` sync);
  - the **verify loop**: run the gallery → eyeball across fixtures → run the contrast test + `npm test` → screenshot.
- **A short "working on themes" runbook** (a section in `THEMES.md` + a pointer from `HANDOFF.md`): the standing request *"work on the questionnaire themes/UI"* maps to brainstorm-in-gallery → edit token file(s) → verify → merge+push. This is what makes future theme work a repeatable, low-overhead loop.

---

## 8 — H: Per-theme WCAG-AA contrast check

A vitest test (`src/theme/contrast.test.ts`) iterates `THEMES` and asserts AA contrast (≥ 4.5:1 normal text, ≥ 3:1 large text/UI) for the load-bearing pairs of each theme: prompt vs card/page surface, option text vs option surface, **selected option text vs selected (filled) surface**, button text vs button surface, badge text vs badge surface, secondary text vs surface. Mirrors the VS "AA-at-save" rule and guarantees the shipped palette set is accessible. A tiny self-contained contrast util (sRGB→luminance→ratio); gradient/pattern surfaces test against their effective base colour (documented approximation).

---

## 9 — Reference themes delivered in Stage 1

Three themes, chosen to exercise every branch of the model:

- **Minimal** (`minimal`, **the default**) — `card.enabled:false`, `surface:plain` white, `options.variant:'borderless'`, monochrome selected (left-bar inset), Inter, underline inputs. Proves the no-card + borderless path.
- **Sage** (`sage`) — `card.enabled:true` with a **coloured card surface**, `surface:plain` near-white page, `options.variant:'outline'` white rows, **filled** deep-green selected, Inter. Proves the coloured-card + filled-selected path.
- **Artsy** (`artsy`) — `card.enabled:true` hard-edged, `surface:grid` (yellow + square grid), `options.variant:'brutal'` (hard border + offset shadow), pink-fill selected, Bricolage Grotesque, webfont loaded via `fonts`. Proves the neobrutalist + patterned-surface + webfont path.

The other six (Warm, Warm-mesh, Soft-float, Dotted-cool, Dotted-warm, Lavender) are **Stage 2** — by then every code path they need exists, so they are pure data files.

---

## 10 — Files touched (Stage 1)

**New:**
- `src/theme/types.ts` (`ViewerTheme`), `src/theme/registry.ts` (registry + default + selection), `src/theme/themes/{minimal,sage,artsy}.ts`, `src/theme/contrast.ts` + `src/theme/contrast.test.ts`.
- `src/gallery/` (dev-only gallery entry) — or an app-level `?gallery` view.
- `web-viewer/THEMES.md`.

**Modified:**
- `src/app/theme.ts` — `applyTheme` emits the full variable set + `data-*` flags + font loading; bundle→theme mapping (§4).
- `src/index.css` **and** `src/renderer/lib.css` — the extended `--qv-*` defaults (Minimal as fallback) + the `qv-*` semantic component classes + variant rules + retuned keyframes (kept **in sync**).
- `src/app/App.tsx` — optical-centring wrapper; pass the resolved theme to `applyTheme`; dev `?gallery` hand-off.
- `src/renderer/*` widgets + `ItemRenderer`/`SectionRenderer`/`StepRenderer` — swap hard-coded colour utilities for `qv-*` classes (no structural/aria changes).
- `src/app/chrome/{NavButtons,ProgressBar,StepTransition,LocaleSwitcher,ErrorScreen}.tsx` — `qv-*` classes for accent/surface.
- `tailwind.config.ts` — only if a new alias is genuinely needed (prefer the `qv-*` classes).
- `HANDOFF.md` / `web-viewer/FOLLOWUPS.md` — point at `THEMES.md` and the gallery; mark the polish candidates addressed.

**Removed:**
- `web-viewer/public/lookbook.html` (+ any `lookbook2`) — superseded by the gallery.

---

## 11 — Constraints (must hold)

- **Pure presentation** — no change to the logic engine, resume, submission, navigation semantics, event/response payloads, or the Schema 7 manifest's declared capabilities.
- **WCAG 2.1 AA** — keyboard-completable, visible focus on all interactive controls (restyled, not removed), AA contrast per theme (§8); `vitest-axe` tests stay green.
- **Cross-viewer fidelity** — themes change only the physical envelope; never reorder/split/substitute structure (matrix still scrolls horizontally; a Section stays one focus view).
- **OD-03 / library sync** — `src/renderer/` stays a clean boundary (no `app/` imports); `src/index.css` ↔ `src/renderer/lib.css` token block kept identical; **`npm run build:lib` still succeeds** and the built lib renders themed (the Editor preview inherits the polish).
- **Tests** — the **173 web-viewer tests** stay green; DOM/structure assertions that key on old utility classes are updated to the new (still-accessible) markup; add the contrast test.
- **Theme-driven, not hard-coded** — prefer `--qv-*`/`qv-*` over literal hex in components.

---

## 12 — Verification plan

1. `cd web-viewer && npm test` — all green (incl. new contrast test + updated assertions).
2. `npm run build` and `npm run build:lib` — both succeed; the manifest check passes.
3. **Gallery review** — open the dev gallery, eyeball all Stage-1 themes across `widgets`/`mini`/`matrix`/`branch`; screenshot (chromium) for the owner.
4. **a11y spot-check** — keyboard-traverse the default theme: focus visible on every control, heading announced, no black box; reduced-motion respected.
5. **Live smoke** (optional, if a VS+Library stack is up) — mint a real session, confirm the default theme renders and a VS palette override still applies.

---

## 13 — Out of scope (Stage 2 / later)

- The remaining six built-in themes (pure data files on this model).
- Gallery visual refinement / per-theme thumbnails / non-dev exposure.
- Extending the **VS theme bundle / Schema 7** to carry full structural tokens (currently viewer-side presets; flagged as a future CalVer-bump decision, not done now).
- Date-question widget, fully-lazy evaluator, theme re-fetch on resume (pre-existing FOLLOWUPS, unrelated).

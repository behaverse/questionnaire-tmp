# Web Viewer Themes

The Web Viewer is **themed by data**. A theme is a `ViewerTheme` token object
(`src/theme/types.ts`) describing only *physical-envelope* properties — surface,
card, prompt type, option style, badge, button, accent, motion. Themes never
change structure (the cross-viewer fidelity contract); they only restyle.

## View all themes at once

`npm run dev`, then open **http://localhost:5173/gallery.html**. It renders every
registered theme in the real viewer across the `widgets` / `mini` / `matrix` /
`branch` fixtures, reading `src/theme/registry.ts` (single source of truth — it
can never drift). The gallery is **dev-only** (excluded from the production build).

You can also preview one theme directly: `http://localhost:5173/?fixture=widgets&theme=<id>`.

## Add or edit a theme (one file)

1. Copy an existing token file in `src/theme/themes/` (e.g. `sage.ts`) to
   `src/theme/themes/<id>.ts`, give it a unique `id` + `name`, and set the tokens.
   - `card.enabled: false` → no-card (content on the page); `true` → a card surface
     (colour the **card** for a strong identity — washed-out tinted *pages* were rejected).
   - `options.variant`: `borderless` (minimal), `outline` (white rows), `filled`,
     or `brutal` (hard border + offset shadow).
   - `surface.kind`: `plain` | `dots` | `grid` | `mesh` (+ `pattern`/`patternSize`).
   - `fonts`: Google-Fonts specs to load (e.g. `'Bricolage Grotesque:wght@600;700;800'`);
     omit for system/Inter.
2. Register it in `src/theme/registry.ts` (`import` + add to `THEMES`).
3. Preview in the gallery; iterate.

## Constraints every theme must hold

- **WCAG 2.1 AA contrast** — `src/theme/contrast.test.ts` sweeps the registry and
  asserts AA for prompt/secondary/selected-option/button/badge pairs. Run
  `npx vitest run src/theme/contrast.test.ts`; fix colours until green (never weaken the test).
- **Visible focus** — interactive controls use `:focus-visible` rings via `qv-focusable`
  / `.qv-button` / `.qv-input`; the step heading is `outline:none` (it receives focus
  only for screen-reader announcement). Don't remove control focus rings.
- **Synced CSS** — the semantic classes live in a `qv-theme` block that must be
  byte-identical in `src/index.css` and `src/renderer/lib.css` (the renderer is also a
  published library, OD-03). `src/theme/sync.test.ts` enforces it.
- **No structural change** — tokens only; never reorder/split/substitute elements.

## Verify loop (for "work on the questionnaire themes/UI" requests)

1. Edit token file(s) / the `qv-theme` CSS block.
2. `npm run dev` → gallery → eyeball across fixtures; screenshot for the owner.
3. `npm test` (incl. contrast + sync) and `npm run build` and `npm run build:lib` — all green.
4. Merge to master + push (no PRs).

# Web Viewer Visual Polish — Theme System Foundation (Stage 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Web Viewer's ad-hoc inline styling with a structured, data-driven **theme system** (token model + registry + semantic CSS), ship a polished **Minimal default** plus **Sage** and **Artsy** reference themes, bake in the universal polish (focus-ring, optical centring, transitions, card states), and provide a permanent **registry-driven gallery** + **`THEMES.md`** authoring docs — all pure-presentation, with the 173 tests staying green.

**Architecture:** A `ViewerTheme` token object (one TS type) describes every physical-envelope property (surface, card, prompt type, option style/variant, badge, button, accent, motion). A registry holds the built-in themes; `applyTheme(theme)` emits an extended `--qv-*` CSS-variable set + structural `data-*` flags onto `document.documentElement`. Renderer/chrome consume **semantic `qv-*` classes** (defined once in a synced block in `index.css` + `lib.css`) that read those variables. Themes are viewer-side presets selected by id; the existing VS theme bundle still overrides the palette subset (back-compat). A dev-only gallery renders all registered themes from the same registry.

**Tech Stack:** Vite + React 19 + TypeScript + Tailwind; vitest + @testing-library/react + vitest-axe; Playwright (chromium via `library-web/node_modules`) for screenshots.

**Spec:** [docs/superpowers/specs/2026-06-13-web-viewer-visual-polish-theme-system-design.md](../specs/2026-06-13-web-viewer-visual-polish-theme-system-design.md)

**Working directory for all commands:** `web-viewer/`. Branch `wv-visual-polish` is already checked out (the spec is committed there).

---

## File structure (Stage 1)

**New files:**
- `src/theme/types.ts` — the `ViewerTheme` interface.
- `src/theme/contrast.ts` — sRGB contrast-ratio util.
- `src/theme/contrast.test.ts` — AA assertion over the registry.
- `src/theme/themes/minimal.ts`, `src/theme/themes/sage.ts`, `src/theme/themes/artsy.ts` — token data files.
- `src/theme/registry.ts` — `THEMES`, `DEFAULT_THEME_ID`, `getTheme`, `resolveThemeId`.
- `src/theme/registry.test.ts` — selection/precedence tests.
- `src/theme/cssvars.ts` — `themeToVars(theme)` + `surfaceImage(surface)` (pure: token object → `{ vars, attrs }`).
- `src/theme/cssvars.test.ts`.
- `src/theme/sync.test.ts` — asserts the `qv-theme` block is byte-identical in `index.css` and `lib.css`.
- `gallery.html` + `src/gallery/main.tsx` — the dev-only gallery (Vite multi-page entry).
- `web-viewer/THEMES.md` — token reference + "working on themes" runbook.

**Modified files:**
- `src/app/theme.ts` — `applyTheme` rewritten to consume `ViewerTheme` via `cssvars.ts`; keep the legacy `Theme` (VS bundle) type + a `bundleToThemeId` mapper.
- `src/index.css` + `src/renderer/lib.css` — the synced `qv-theme` block (extended vars + `qv-*` classes); retuned keyframes.
- `src/app/bootstrap.ts` — `parseParams` gains `theme`.
- `src/app/App.tsx` — apply resolved theme in fixture + mint boot; wrap step content in `.qv-card`; optical-centring class; dev `?gallery` note (gallery is its own entry, no app change needed beyond theme apply).
- `src/renderer/ItemRenderer.tsx`, `SectionRenderer.tsx`, `StepRenderer.tsx`, `widgets/{RadioGroup,CheckboxGroup,NumberInput,TextInput,MatrixGroup,MessageBlock,UnsupportedElement}.tsx` — swap hard-coded colour utilities for `qv-*` classes.
- `src/app/chrome/{NavButtons,ProgressBar,StepTransition,LocaleSwitcher,ErrorScreen}.tsx` — `qv-*` for accent/surface.
- `vite.config.ts` — register `gallery.html` as a dev/build input (dev-only).
- `web-viewer/FOLLOWUPS.md`, `HANDOFF.md` — point at `THEMES.md`/gallery; mark candidates done.

**Removed:**
- `web-viewer/public/lookbook.html` (the throwaway brainstorming aid).

---

## Task 1: Contrast utility

**Files:**
- Create: `web-viewer/src/theme/contrast.ts`
- Test: `web-viewer/src/theme/contrast.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/theme/contrast.test.ts
import { contrastRatio, meetsAA } from './contrast'

test('black on white is 21:1', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
})
test('white on white is 1:1', () => {
  expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1)
})
test('handles 3-digit hex', () => {
  expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0)
})
test('meetsAA: white on deep green #4F6F52 passes (>=4.5)', () => {
  expect(meetsAA('#ffffff', '#4F6F52')).toBe(true)
})
test('meetsAA: mid-grey #a1a1aa on white fails for normal text', () => {
  expect(meetsAA('#a1a1aa', '#ffffff')).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/theme/contrast.test.ts`
Expected: FAIL — `Failed to resolve import './contrast'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/theme/contrast.ts
function parseHex(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function relLuminance(hex: string): number {
  const srgb = parseHex(hex).map((v) => v / 255)
  const lin = srgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

/** WCAG contrast ratio between two solid hex colours (order-independent). */
export function contrastRatio(a: string, b: string): number {
  const la = relLuminance(a)
  const lb = relLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** AA pass for the given text size (normal text >= 4.5, large/UI >= 3). */
export function meetsAA(fg: string, bg: string, large = false): boolean {
  return contrastRatio(fg, bg) >= (large ? 3 : 4.5)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/theme/contrast.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/theme/contrast.ts web-viewer/src/theme/contrast.test.ts
git commit -m "feat(web-viewer): WCAG contrast util for theme validation"
```

---

## Task 2: ViewerTheme type + Minimal theme + registry + selection

**Files:**
- Create: `web-viewer/src/theme/types.ts`, `web-viewer/src/theme/themes/minimal.ts`, `web-viewer/src/theme/registry.ts`
- Test: `web-viewer/src/theme/registry.test.ts`

- [ ] **Step 1: Write the type**

```ts
// src/theme/types.ts
export type SurfaceKind = 'plain' | 'dots' | 'grid' | 'mesh'
export type OptionVariant = 'borderless' | 'outline' | 'filled' | 'brutal'

export interface ViewerTheme {
  id: string
  name: string
  /** Google-Fonts family specs to load (e.g. 'Bricolage Grotesque:wght@600;700;800'); omit for system fonts. */
  fonts?: string[]
  surface: { kind: SurfaceKind; background: string; pattern?: string; patternSize?: string }
  card: { enabled: boolean; surface?: string; border?: string; borderWidth?: string; radius?: string; shadow?: string; padding?: string }
  prompt: { fontFamily: string; weight: number; size: string; color: string; letterSpacing?: string }
  secondary: { color: string }
  options: {
    variant: OptionVariant
    surface: string; border: string; radius: string
    hoverSurface?: string; hoverBorder?: string
    selected: { surface: string; border: string; color: string; shadow?: string }
  }
  badge: {
    border: string; color: string; surface: string; radius: string
    selected: { border: string; color: string; surface: string }
  }
  button: { surface: string; color: string; radius: string; shadow?: string; fontFamily?: string; weight?: number }
  accent: string
  motion?: { stepInMs?: number; stepOutMs?: number; easing?: string }
}
```

- [ ] **Step 2: Write the Minimal theme (the default)**

```ts
// src/theme/themes/minimal.ts
import type { ViewerTheme } from '../types'

export const minimal: ViewerTheme = {
  id: 'minimal',
  name: 'Minimal',
  surface: { kind: 'plain', background: '#ffffff' },
  card: { enabled: false },
  prompt: { fontFamily: 'Inter, system-ui, sans-serif', weight: 500, size: '2.05rem', color: '#18181b', letterSpacing: '-0.02em' },
  secondary: { color: '#71717a' },
  options: {
    variant: 'borderless',
    surface: 'transparent', border: 'transparent', radius: '10px',
    hoverSurface: '#f4f4f5', hoverBorder: 'transparent',
    selected: { surface: 'transparent', border: 'transparent', color: '#18181b', shadow: 'inset 3px 0 0 #18181b' },
  },
  badge: {
    border: 'transparent', color: '#a1a1aa', surface: 'transparent', radius: '7px',
    selected: { border: 'transparent', color: '#18181b', surface: 'transparent' },
  },
  button: { surface: '#18181b', color: '#ffffff', radius: '9px' },
  accent: '#18181b',
}
```

> Note: `secondary.color` is `#71717a` (not the lighter `#a1a1aa` used in the prototype) so it passes AA on white — Task 4 enforces this.

- [ ] **Step 3: Write the registry**

```ts
// src/theme/registry.ts
import type { ViewerTheme } from './types'
import { minimal } from './themes/minimal'

export const DEFAULT_THEME_ID = 'minimal'

export const THEMES: Record<string, ViewerTheme> = {
  [minimal.id]: minimal,
}

export function getTheme(id?: string | null): ViewerTheme {
  return (id && THEMES[id]) || THEMES[DEFAULT_THEME_ID]
}

/**
 * Resolve which built-in theme to use.
 * Precedence: explicit ?theme= (dev/preview) → VS bundle id naming a built-in → default.
 */
export function resolveThemeId(opts: { themeParam?: string | null; bundleId?: string | null }): string {
  if (opts.themeParam && THEMES[opts.themeParam]) return opts.themeParam
  if (opts.bundleId && THEMES[opts.bundleId]) return opts.bundleId
  return DEFAULT_THEME_ID
}
```

- [ ] **Step 4: Write the failing test**

```ts
// src/theme/registry.test.ts
import { THEMES, DEFAULT_THEME_ID, getTheme, resolveThemeId } from './registry'

test('default theme is minimal and is registered', () => {
  expect(DEFAULT_THEME_ID).toBe('minimal')
  expect(THEMES.minimal).toBeDefined()
})
test('getTheme falls back to default for unknown/empty id', () => {
  expect(getTheme('nope').id).toBe('minimal')
  expect(getTheme(null).id).toBe('minimal')
  expect(getTheme('minimal').id).toBe('minimal')
})
test('resolveThemeId precedence: param > bundle > default', () => {
  expect(resolveThemeId({ themeParam: 'minimal', bundleId: null })).toBe('minimal')
  expect(resolveThemeId({ themeParam: 'unknown', bundleId: null })).toBe('minimal')
  expect(resolveThemeId({ bundleId: 'minimal', themeParam: null })).toBe('minimal')
  expect(resolveThemeId({})).toBe('minimal')
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web-viewer && npx vitest run src/theme/registry.test.ts`
Expected: PASS (3 tests). (Type file has no runtime test; tsc validates it in the full build later.)

- [ ] **Step 6: Commit**

```bash
git add web-viewer/src/theme/types.ts web-viewer/src/theme/themes/minimal.ts web-viewer/src/theme/registry.ts web-viewer/src/theme/registry.test.ts
git commit -m "feat(web-viewer): ViewerTheme model + registry + Minimal default theme"
```

---

## Task 3: Sage + Artsy reference themes

**Files:**
- Create: `web-viewer/src/theme/themes/sage.ts`, `web-viewer/src/theme/themes/artsy.ts`
- Modify: `web-viewer/src/theme/registry.ts`
- Test: `web-viewer/src/theme/registry.test.ts` (extend)

- [ ] **Step 1: Write the Sage theme (coloured card)**

```ts
// src/theme/themes/sage.ts
import type { ViewerTheme } from '../types'

export const sage: ViewerTheme = {
  id: 'sage',
  name: 'Sage',
  surface: { kind: 'plain', background: '#F6F8F5' },
  card: { enabled: true, surface: '#D4E3CE', border: '#BBD2B3', borderWidth: '1px', radius: '24px',
    shadow: '0 22px 50px -20px rgba(40,80,40,.30), 0 2px 8px rgba(40,80,40,.06)', padding: '2.75rem 2.75rem 2.25rem' },
  prompt: { fontFamily: 'Inter, system-ui, sans-serif', weight: 600, size: '2.05rem', color: '#243024', letterSpacing: '-0.015em' },
  secondary: { color: '#566B52' },
  options: {
    variant: 'outline',
    surface: '#ffffff', border: '#C3D7BC', radius: '12px',
    hoverSurface: '#ffffff', hoverBorder: '#9FBF96',
    selected: { surface: '#4F6F52', border: '#4F6F52', color: '#ffffff', shadow: '0 6px 16px rgba(79,111,82,.25)' },
  },
  badge: {
    border: '#C3D7BC', color: '#5C6E58', surface: '#ffffff', radius: '7px',
    selected: { border: '#ffffff', color: '#4F6F52', surface: '#ffffff' },
  },
  button: { surface: '#4F6F52', color: '#ffffff', radius: '11px' },
  accent: '#4F6F52',
}
```

- [ ] **Step 2: Write the Artsy theme (neobrutalist, grid surface, webfont)**

```ts
// src/theme/themes/artsy.ts
import type { ViewerTheme } from '../types'

export const artsy: ViewerTheme = {
  id: 'artsy',
  name: 'Artsy',
  fonts: ['Bricolage Grotesque:wght@600;700;800'],
  surface: { kind: 'grid', background: '#FFE066', pattern: 'rgba(26,26,26,0.11)', patternSize: '30px' },
  card: { enabled: true, surface: '#ffffff', border: '#1A1A1A', borderWidth: '3px', radius: '6px',
    shadow: '12px 12px 0 0 #FF3D8B', padding: '2.5rem' },
  prompt: { fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", weight: 800, size: '2.35rem', color: '#1A1A1A', letterSpacing: '-0.01em' },
  secondary: { color: '#8A4A6E' },
  options: {
    variant: 'brutal',
    surface: '#ffffff', border: '#1A1A1A', radius: '4px',
    hoverSurface: '#ffffff', hoverBorder: '#1A1A1A',
    selected: { surface: '#FF3D8B', border: '#1A1A1A', color: '#ffffff', shadow: '4px 4px 0 0 #1A1A1A' },
  },
  badge: {
    border: '#1A1A1A', color: '#1A1A1A', surface: '#FFE066', radius: '3px',
    selected: { border: '#1A1A1A', color: '#FF3D8B', surface: '#ffffff' },
  },
  button: { surface: '#FF3D8B', color: '#ffffff', radius: '4px', shadow: '4px 4px 0 0 #1A1A1A', fontFamily: "'Bricolage Grotesque', sans-serif", weight: 700 },
  accent: '#FF3D8B',
}
```

- [ ] **Step 3: Register them**

Modify `src/theme/registry.ts` — update the imports and the `THEMES` map:

```ts
import { minimal } from './themes/minimal'
import { sage } from './themes/sage'
import { artsy } from './themes/artsy'
// ...
export const THEMES: Record<string, ViewerTheme> = {
  [minimal.id]: minimal,
  [sage.id]: sage,
  [artsy.id]: artsy,
}
```

- [ ] **Step 4: Extend the registry test**

Append to `src/theme/registry.test.ts`:

```ts
test('sage and artsy are registered with their ids', () => {
  expect(THEMES.sage?.name).toBe('Sage')
  expect(THEMES.artsy?.name).toBe('Artsy')
  expect(resolveThemeId({ themeParam: 'sage' })).toBe('sage')
  expect(resolveThemeId({ bundleId: 'artsy' })).toBe('artsy')
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd web-viewer && npx vitest run src/theme/registry.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add web-viewer/src/theme/themes/sage.ts web-viewer/src/theme/themes/artsy.ts web-viewer/src/theme/registry.ts web-viewer/src/theme/registry.test.ts
git commit -m "feat(web-viewer): Sage (coloured-card) + Artsy (neobrutalist) reference themes"
```

---

## Task 4: Per-theme WCAG-AA contrast test

**Files:**
- Test: `web-viewer/src/theme/contrast.test.ts` (extend with a registry sweep)

- [ ] **Step 1: Add the registry contrast sweep**

Append to `src/theme/contrast.test.ts`:

```ts
import { THEMES } from './registry'
import type { ViewerTheme } from './types'

/** Background a given text sits on (card surface if carded, else page background). */
function effectiveBg(t: ViewerTheme): string {
  return t.card.enabled && t.card.surface ? t.card.surface : t.surface.background
}

describe('every built-in theme meets WCAG AA on its load-bearing pairs', () => {
  for (const t of Object.values(THEMES)) {
    const bg = effectiveBg(t)
    test(`${t.id}: prompt vs surface`, () => {
      // large heading text → AA-large (>=3)
      expect(meetsAA(t.prompt.color, bg, true)).toBe(true)
    })
    test(`${t.id}: secondary text vs surface`, () => {
      expect(meetsAA(t.secondary.color, bg)).toBe(true)
    })
    test(`${t.id}: selected option text vs selected surface`, () => {
      expect(meetsAA(t.options.selected.color, t.options.selected.surface)).toBe(true)
    })
    test(`${t.id}: button text vs button surface`, () => {
      expect(meetsAA(t.button.color, t.button.surface)).toBe(true)
    })
    test(`${t.id}: selected badge text vs selected badge surface`, () => {
      expect(meetsAA(t.badge.selected.color, t.badge.selected.surface)).toBe(true)
    })
  }
})
```

- [ ] **Step 2: Run the test**

Run: `cd web-viewer && npx vitest run src/theme/contrast.test.ts`
Expected: PASS. If any pair fails, **adjust the offending colour in the theme file** (darken the text / accent) until it passes — do not weaken the assertion. (The values in Tasks 2–3 were chosen to pass; this step is the guard.)

- [ ] **Step 3: Commit**

```bash
git add web-viewer/src/theme/contrast.test.ts
git commit -m "test(web-viewer): assert every built-in theme meets WCAG AA contrast"
```

---

## Task 5: cssvars — token object → variables + attributes

**Files:**
- Create: `web-viewer/src/theme/cssvars.ts`
- Test: `web-viewer/src/theme/cssvars.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/theme/cssvars.test.ts
import { themeToVars } from './cssvars'
import { minimal } from './themes/minimal'
import { sage } from './themes/sage'
import { artsy } from './themes/artsy'

test('minimal: no-card → transparent card vars + borderless option variant attr', () => {
  const { vars, attrs } = themeToVars(minimal)
  expect(vars['--qv-card-surface']).toBe('transparent')
  expect(vars['--qv-card-padding']).toBe('0px')
  expect(vars['--qv-prompt-color']).toBe('#18181b')
  expect(vars['--qv-option-selected-shadow']).toBe('inset 3px 0 0 #18181b')
  expect(attrs['data-card']).toBe('off')
  expect(attrs['data-option-variant']).toBe('borderless')
  expect(attrs['data-surface']).toBe('plain')
})
test('sage: card vars carry the coloured surface + padding', () => {
  const { vars, attrs } = themeToVars(sage)
  expect(vars['--qv-card-surface']).toBe('#D4E3CE')
  expect(vars['--qv-card-padding']).toBe('2.75rem 2.75rem 2.25rem')
  expect(attrs['data-card']).toBe('on')
  expect(attrs['data-option-variant']).toBe('outline')
})
test('artsy grid: surface image is a two-axis grid gradient sized by patternSize', () => {
  const { vars, attrs } = themeToVars(artsy)
  expect(vars['--qv-surface-bg']).toBe('#FFE066')
  expect(vars['--qv-surface-image']).toContain('linear-gradient')
  expect(vars['--qv-surface-size']).toBe('30px 30px')
  expect(vars['--qv-card-border-width']).toBe('3px')
  expect(attrs['data-surface']).toBe('grid')
  expect(attrs['data-option-variant']).toBe('brutal')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/theme/cssvars.test.ts`
Expected: FAIL — cannot resolve `./cssvars`.

- [ ] **Step 3: Write the implementation**

```ts
// src/theme/cssvars.ts
import type { ViewerTheme } from './types'

function surfaceImage(s: ViewerTheme['surface']): { image: string; size: string } {
  if (s.kind === 'dots' && s.pattern) {
    return { image: `radial-gradient(${s.pattern} 1.2px, transparent 1.3px)`, size: `${s.patternSize ?? '22px'} ${s.patternSize ?? '22px'}` }
  }
  if (s.kind === 'grid' && s.pattern) {
    const sz = s.patternSize ?? '30px'
    return {
      image: `linear-gradient(${s.pattern} 1px, transparent 1px), linear-gradient(90deg, ${s.pattern} 1px, transparent 1px)`,
      size: `${sz} ${sz}`,
    }
  }
  // plain | mesh → the background string carries everything
  return { image: 'none', size: 'auto' }
}

export function themeToVars(t: ViewerTheme): { vars: Record<string, string>; attrs: Record<string, string> } {
  const card = t.card
  const { image, size } = surfaceImage(t.surface)
  const vars: Record<string, string> = {
    '--qv-primary': t.accent,
    '--qv-surface-bg': t.surface.background,
    '--qv-surface-image': image,
    '--qv-surface-size': size,
    '--qv-card-surface': card.enabled ? (card.surface ?? '#ffffff') : 'transparent',
    '--qv-card-border': card.enabled ? (card.border ?? 'transparent') : 'transparent',
    '--qv-card-border-width': card.enabled ? (card.borderWidth ?? '1px') : '0px',
    '--qv-card-radius': card.enabled ? (card.radius ?? '0px') : '0px',
    '--qv-card-shadow': card.enabled ? (card.shadow ?? 'none') : 'none',
    '--qv-card-padding': card.enabled ? (card.padding ?? '0px') : '0px',
    '--qv-prompt-font': t.prompt.fontFamily,
    '--qv-prompt-weight': String(t.prompt.weight),
    '--qv-prompt-size': t.prompt.size,
    '--qv-prompt-color': t.prompt.color,
    '--qv-prompt-spacing': t.prompt.letterSpacing ?? '0',
    '--qv-secondary-color': t.secondary.color,
    '--qv-option-surface': t.options.surface,
    '--qv-option-border': t.options.border,
    '--qv-option-radius': t.options.radius,
    '--qv-option-hover-surface': t.options.hoverSurface ?? t.options.surface,
    '--qv-option-hover-border': t.options.hoverBorder ?? t.options.border,
    '--qv-option-selected-surface': t.options.selected.surface,
    '--qv-option-selected-border': t.options.selected.border,
    '--qv-option-selected-color': t.options.selected.color,
    '--qv-option-selected-shadow': t.options.selected.shadow ?? 'none',
    '--qv-badge-border': t.badge.border,
    '--qv-badge-color': t.badge.color,
    '--qv-badge-surface': t.badge.surface,
    '--qv-badge-radius': t.badge.radius,
    '--qv-badge-selected-border': t.badge.selected.border,
    '--qv-badge-selected-color': t.badge.selected.color,
    '--qv-badge-selected-surface': t.badge.selected.surface,
    '--qv-button-surface': t.button.surface,
    '--qv-button-color': t.button.color,
    '--qv-button-radius': t.button.radius,
    '--qv-button-shadow': t.button.shadow ?? 'none',
    '--qv-button-font': t.button.fontFamily ?? t.prompt.fontFamily,
    '--qv-button-weight': String(t.button.weight ?? 600),
    '--qv-font-family': t.prompt.fontFamily,
    '--qv-step-in-ms': `${t.motion?.stepInMs ?? 220}ms`,
    '--qv-step-out-ms': `${t.motion?.stepOutMs ?? 200}ms`,
    '--qv-step-ease': t.motion?.easing ?? 'ease-out',
  }
  const attrs: Record<string, string> = {
    'data-card': card.enabled ? 'on' : 'off',
    'data-option-variant': t.options.variant,
    'data-surface': t.surface.kind,
  }
  return { vars, attrs }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/theme/cssvars.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/theme/cssvars.ts web-viewer/src/theme/cssvars.test.ts
git commit -m "feat(web-viewer): themeToVars — token object → CSS vars + structural attrs"
```

---

## Task 6: The synced `qv-theme` CSS block (index.css + lib.css) + sync test

**Files:**
- Modify: `web-viewer/src/index.css`, `web-viewer/src/renderer/lib.css`
- Test: `web-viewer/src/theme/sync.test.ts`

- [ ] **Step 1: Replace the `:root` block in `src/index.css`**

Replace the entire current content of `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* qv-theme:start — keep this block byte-identical in src/index.css and src/renderer/lib.css */
:root {
  --qv-primary: #18181b;
  --qv-secondary: #613583;
  --qv-success: #26734d;
  --qv-warning: #8f6000;
  --qv-error: #a51d2d;
  --qv-background: #ffffff;
  --qv-font-family: Inter, system-ui, sans-serif;
  --qv-base-size: 16px;
  --qv-space-unit: 8px;
  --qv-surface-bg: #ffffff;
  --qv-surface-image: none;
  --qv-surface-size: auto;
  --qv-card-surface: transparent;
  --qv-card-border: transparent;
  --qv-card-border-width: 0px;
  --qv-card-radius: 0px;
  --qv-card-shadow: none;
  --qv-card-padding: 0px;
  --qv-prompt-font: var(--qv-font-family);
  --qv-prompt-weight: 500;
  --qv-prompt-size: 2.05rem;
  --qv-prompt-color: #18181b;
  --qv-prompt-spacing: -0.02em;
  --qv-secondary-color: #71717a;
  --qv-option-surface: transparent;
  --qv-option-border: transparent;
  --qv-option-radius: 10px;
  --qv-option-hover-surface: #f4f4f5;
  --qv-option-hover-border: transparent;
  --qv-option-selected-surface: transparent;
  --qv-option-selected-border: transparent;
  --qv-option-selected-color: #18181b;
  --qv-option-selected-shadow: inset 3px 0 0 #18181b;
  --qv-badge-border: transparent;
  --qv-badge-color: #a1a1aa;
  --qv-badge-surface: transparent;
  --qv-badge-radius: 7px;
  --qv-badge-selected-border: transparent;
  --qv-badge-selected-color: #18181b;
  --qv-badge-selected-surface: transparent;
  --qv-button-surface: #18181b;
  --qv-button-color: #ffffff;
  --qv-button-radius: 9px;
  --qv-button-shadow: none;
  --qv-button-font: var(--qv-font-family);
  --qv-button-weight: 600;
  --qv-step-in-ms: 220ms;
  --qv-step-out-ms: 200ms;
  --qv-step-ease: ease-out;
}
html { font-size: var(--qv-base-size); }
body { font-family: var(--qv-font-family); background-color: var(--qv-surface-bg); background-image: var(--qv-surface-image); background-size: var(--qv-surface-size); }

.qv-card {
  background: var(--qv-card-surface);
  border: var(--qv-card-border-width) solid var(--qv-card-border);
  border-radius: var(--qv-card-radius);
  box-shadow: var(--qv-card-shadow);
  padding: var(--qv-card-padding);
}
.qv-prompt {
  font-family: var(--qv-prompt-font);
  font-weight: var(--qv-prompt-weight);
  font-size: var(--qv-prompt-size);
  color: var(--qv-prompt-color);
  letter-spacing: var(--qv-prompt-spacing);
  line-height: 1.2;
}
.qv-prompt:focus { outline: none; }
.qv-secondary { color: var(--qv-secondary-color); }
.qv-option {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem; cursor: pointer; font-size: 1.125rem;
  border: 2px solid var(--qv-option-border);
  background: var(--qv-option-surface);
  border-radius: var(--qv-option-radius);
  transition: background-color .16s ease, border-color .16s ease, box-shadow .16s ease, transform .16s ease;
}
.qv-option:hover { background: var(--qv-option-hover-surface); border-color: var(--qv-option-hover-border); }
.qv-option[data-selected="true"] {
  background: var(--qv-option-selected-surface);
  border-color: var(--qv-option-selected-border);
  color: var(--qv-option-selected-color);
  box-shadow: var(--qv-option-selected-shadow);
}
[data-option-variant="brutal"] .qv-option:hover { transform: translate(-1px, -1px); box-shadow: 5px 5px 0 0 #1A1A1A; }
.qv-option-badge {
  display: grid; place-items: center; height: 1.5rem; width: 1.5rem; flex-shrink: 0;
  font-size: 0.75rem; font-weight: 600;
  border: 1px solid var(--qv-badge-border);
  color: var(--qv-badge-color);
  background: var(--qv-badge-surface);
  border-radius: var(--qv-badge-radius);
}
[data-option-variant="brutal"] .qv-option-badge { border-width: 2px; }
.qv-option[data-selected="true"] .qv-option-badge {
  border-color: var(--qv-badge-selected-border);
  color: var(--qv-badge-selected-color);
  background: var(--qv-badge-selected-surface);
}
.qv-input {
  border: 2px solid var(--qv-option-border);
  border-radius: var(--qv-option-radius);
  padding: 0.75rem 1rem; font-size: 1.125rem; background: #ffffff;
}
.qv-input:focus-visible { outline: none; border-color: var(--qv-primary); box-shadow: 0 0 0 3px color-mix(in srgb, var(--qv-primary) 28%, transparent); }
.qv-button {
  background: var(--qv-button-surface); color: var(--qv-button-color);
  border-radius: var(--qv-button-radius); box-shadow: var(--qv-button-shadow);
  font-family: var(--qv-button-font); font-weight: var(--qv-button-weight);
}
.qv-button:focus-visible, .qv-focusable:focus-visible {
  outline: none; box-shadow: 0 0 0 2px var(--qv-surface-bg), 0 0 0 4px var(--qv-primary);
}

@keyframes qv-step-in  { from { opacity: 0; transform: translateY(1rem) } to { opacity: 1; transform: none } }
@keyframes qv-step-out { to   { opacity: 0; transform: translateY(-0.75rem) } }
.qv-step-enter { animation: qv-step-in var(--qv-step-in-ms) var(--qv-step-ease) both; }
.qv-step-leave { animation: qv-step-out var(--qv-step-out-ms) ease-in both; }
@media (prefers-reduced-motion: reduce) {
  .qv-step-enter, .qv-step-leave { animation: none; }
}
/* qv-theme:end */
```

- [ ] **Step 2: Make `src/renderer/lib.css` contain the identical block**

Replace the entire content of `src/renderer/lib.css` with the **exact same text** as `src/index.css` from Step 1 (the `@tailwind` directives + the full `qv-theme:start … qv-theme:end` block). They must be byte-identical between the markers (Step 4 enforces it).

- [ ] **Step 3: Write the sync test**

```ts
// src/theme/sync.test.ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function block(path: string): string {
  const txt = readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
  const start = txt.indexOf('/* qv-theme:start')
  const end = txt.indexOf('/* qv-theme:end */')
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return txt.slice(start, end)
}

test('the qv-theme block is byte-identical in index.css and lib.css', () => {
  expect(block('../index.css')).toBe(block('../renderer/lib.css'))
})
```

- [ ] **Step 4: Run the test**

Run: `cd web-viewer && npx vitest run src/theme/sync.test.ts`
Expected: PASS. (If it fails, the two blocks differ — copy index.css's block verbatim into lib.css.)

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/index.css web-viewer/src/renderer/lib.css web-viewer/src/theme/sync.test.ts
git commit -m "feat(web-viewer): synced qv-theme CSS block (extended vars + semantic classes)"
```

---

## Task 7: Rewrite `applyTheme` + bundle mapping

**Files:**
- Modify: `web-viewer/src/app/theme.ts`
- Test: `web-viewer/src/app/theme.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
// src/app/theme.test.ts
import { applyTheme, bundleToThemeId } from './theme'
import { getTheme } from '../theme/registry'

afterEach(() => {
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-card')
  document.documentElement.removeAttribute('data-option-variant')
  document.documentElement.removeAttribute('data-surface')
})

test('applyTheme(minimal) sets vars + structural attrs on <html>', () => {
  applyTheme(getTheme('minimal'))
  const el = document.documentElement
  expect(el.style.getPropertyValue('--qv-prompt-color')).toBe('#18181b')
  expect(el.style.getPropertyValue('--qv-card-padding')).toBe('0px')
  expect(el.getAttribute('data-card')).toBe('off')
  expect(el.getAttribute('data-option-variant')).toBe('borderless')
})
test('applyTheme(sage) sets the coloured card surface + data-card=on', () => {
  applyTheme(getTheme('sage'))
  expect(document.documentElement.style.getPropertyValue('--qv-card-surface')).toBe('#D4E3CE')
  expect(document.documentElement.getAttribute('data-card')).toBe('on')
})
test('bundleToThemeId returns the bundle theme_id when it names a built-in, else null', () => {
  expect(bundleToThemeId({ theme_id: 'sage' })).toBe('sage')
  expect(bundleToThemeId({ theme_id: 'corporate-blue' })).toBe(null)
  expect(bundleToThemeId(null)).toBe(null)
})
test('applyTheme overlays a VS palette override on top of the base theme', () => {
  applyTheme(getTheme('minimal'), { palette: { primary: '#0055ff' } })
  expect(document.documentElement.style.getPropertyValue('--qv-primary')).toBe('#0055ff')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web-viewer && npx vitest run src/app/theme.test.ts`
Expected: FAIL — `applyTheme`/`bundleToThemeId` signature mismatch / not exported.

- [ ] **Step 3: Rewrite `src/app/theme.ts`**

```ts
// src/app/theme.ts
import type { ViewerTheme } from '../theme/types'
import { THEMES } from '../theme/registry'
import { themeToVars } from '../theme/cssvars'

/** The VS theme bundle shape returned by POST /sessions/new (palette + typography + spacing). */
export type Theme = {
  theme_id?: string
  name?: string
  palette?: Record<string, string>
  typography?: { font_family?: string; base_size?: number }
  spacing?: { unit?: number }
  logo_url?: string | null
  custom_css?: string | null
} | null

const loadedFonts = new Set<string>()

function ensureFonts(theme: ViewerTheme): void {
  if (!theme.fonts?.length || typeof document === 'undefined') return
  const families = theme.fonts.map((f) => `family=${f.replace(/ /g, '+')}`).join('&')
  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  if (loadedFonts.has(href)) return
  loadedFonts.add(href)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

/** Map a VS bundle to a built-in theme id, or null if it names none. */
export function bundleToThemeId(bundle: Theme): string | null {
  return bundle?.theme_id && THEMES[bundle.theme_id] ? bundle.theme_id : null
}

/**
 * Apply a built-in ViewerTheme to the document, then overlay any palette/typography
 * overrides from the VS bundle (back-compat: a deployment's custom colours still win).
 */
export function applyTheme(theme: ViewerTheme, bundle?: Theme): void {
  const el = document.documentElement
  const { vars, attrs } = themeToVars(theme)
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  ensureFonts(theme)
  // VS bundle overrides (only the subset it carries)
  if (bundle?.palette?.primary) { el.style.setProperty('--qv-primary', bundle.palette.primary); el.style.setProperty('--qv-button-surface', bundle.palette.primary); el.style.setProperty('--qv-accent', bundle.palette.primary) }
  for (const key of ['secondary', 'success', 'warning', 'error', 'background'] as const) {
    const v = bundle?.palette?.[key]
    if (v) el.style.setProperty(`--qv-${key}`, v)
  }
  if (bundle?.typography?.font_family) el.style.setProperty('--qv-font-family', bundle.typography.font_family)
  if (bundle?.typography?.base_size) el.style.setProperty('--qv-base-size', `${bundle.typography.base_size}px`)
  if (bundle?.spacing?.unit) el.style.setProperty('--qv-space-unit', `${bundle.spacing.unit}px`)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web-viewer && npx vitest run src/app/theme.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/theme.ts web-viewer/src/app/theme.test.ts
git commit -m "feat(web-viewer): applyTheme consumes ViewerTheme + overlays VS bundle palette"
```

---

## Task 8: Refactor renderer widgets to `qv-*` classes

**Files:**
- Modify: `src/renderer/widgets/{RadioGroup,CheckboxGroup,NumberInput,TextInput,MatrixGroup,MessageBlock,UnsupportedElement}.tsx`, `src/renderer/ItemRenderer.tsx`, `src/renderer/SectionRenderer.tsx`
- Tests: existing widget tests must stay green (they key on roles/text, not classes).

> Approach: swap colour/shape utilities for `qv-*` classes; **keep layout utilities and all DOM/aria/roles**. The option `<label>` gains `data-selected={selected}` so the CSS selected-state applies.

- [ ] **Step 1: RadioGroup** — replace the `<label>` and badge `<span>` in `src/renderer/widgets/RadioGroup.tsx`:

Replace the `className={...}` on the `<label>` (lines 36–41) with:

```tsx
          <label key={c.index} data-selected={selected} className="qv-option">
```

Replace the badge `<span>` (lines 49–53) with:

```tsx
            {keyHints && (
              <span aria-hidden className="qv-option-badge">{LETTERS[i]}</span>
            )}
```

(The `<input … className="sr-only" />` and `<span>{c.text}</span>` stay unchanged.)

- [ ] **Step 2: CheckboxGroup** — in `src/renderer/widgets/CheckboxGroup.tsx`, replace the `<label>` className with `data-selected={isOn} className="qv-option"` and keep the checkbox input. The checkbox keeps `className="h-5 w-5 accent-[var(--qv-primary)]"`. If a letter/badge span exists, give it `className="qv-option-badge"`.

- [ ] **Step 3: NumberInput** — in `src/renderer/widgets/NumberInput.tsx`, replace the input className `w-40 rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-primary focus:outline-none` with `w-40 qv-input`.

- [ ] **Step 4: TextInput** — in `src/renderer/widgets/TextInput.tsx`, replace the input className `w-full max-w-md rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-primary focus:outline-none` with `w-full max-w-md qv-input`.

- [ ] **Step 5: MatrixGroup** — in `src/renderer/widgets/MatrixGroup.tsx`:
  - title `<h2>`: change `className="text-2xl font-semibold leading-snug sm:text-3xl"` → `className="qv-prompt"` (keep `tabIndex={-1}`).
  - radios keep `className="h-5 w-5 accent-[var(--qv-primary)]"`.
  - error row highlight `bg-error/5` and the `text-error` alert stay (semantic error colour, theme-independent).

- [ ] **Step 6: MessageBlock** — in `src/renderer/widgets/MessageBlock.tsx`, replace `text-slate-700` with `qv-secondary` is wrong (messages are primary copy); instead change `className="whitespace-pre-line text-xl leading-relaxed text-slate-700"` → `className="whitespace-pre-line text-xl leading-relaxed"` and add inline `style={{ color: 'var(--qv-prompt-color)' }}` so message text follows the theme ink.

- [ ] **Step 7: UnsupportedElement** — leave as-is (it intentionally uses semantic `warning` colours, theme-independent).

- [ ] **Step 8: ItemRenderer** — in `src/renderer/ItemRenderer.tsx`:
  - prompt `<h2>`: `className="text-2xl font-semibold leading-snug sm:text-3xl"` → `className="qv-prompt"` (keep `tabIndex={-1}`).
  - context `<p>`: `className="text-base text-slate-500"` → `className="qv-secondary text-base"`.
  - instruction `<p>`: `className="text-sm italic text-slate-500"` → `className="qv-secondary text-sm italic"`.
  - error `<p>` keeps `text-error`.

- [ ] **Step 9: SectionRenderer** — in `src/renderer/SectionRenderer.tsx`, title `<h2>`: `className="text-2xl font-semibold leading-snug sm:text-3xl"` → `className="qv-prompt"` (keep `tabIndex={-1}`).

- [ ] **Step 10: Run the renderer test suite**

Run: `cd web-viewer && npx vitest run src/renderer`
Expected: PASS — all existing renderer/widget/matrix tests + axe checks green (roles/text unchanged).

- [ ] **Step 11: Commit**

```bash
git add web-viewer/src/renderer
git commit -m "refactor(web-viewer): route renderer widgets through qv-* theme classes"
```

---

## Task 9: Chrome + App — accent classes, card wrapper, optical centring

**Files:**
- Modify: `src/app/chrome/{NavButtons,ProgressBar,StepTransition,LocaleSwitcher,ErrorScreen}.tsx`, `src/app/App.tsx`

- [ ] **Step 1: NavButtons** — in `src/app/chrome/NavButtons.tsx`, change the Next button className `rounded-lg bg-primary px-6 py-2.5 text-lg font-medium text-white shadow-sm hover:opacity-90` → `qv-button px-6 py-2.5 text-lg hover:opacity-90`. Add `qv-focusable` to both the Back and Next buttons (so `:focus-visible` shows the accent ring). Back button keeps its text styling + add `qv-focusable`.

- [ ] **Step 2: ProgressBar** — in `src/app/chrome/ProgressBar.tsx`, change the fill `<div>` `className="h-full bg-primary transition-[width] duration-300"` → `className="h-full transition-[width] duration-300"` with inline `style={{ width: …, background: 'var(--qv-primary)' }}` (keep the existing width style; merge background into it).

- [ ] **Step 3: StepTransition** — no change needed (it already toggles `qv-step-enter`/`qv-step-leave`, which the new keyframes drive via the motion vars).

- [ ] **Step 4: LocaleSwitcher** — in `src/app/chrome/LocaleSwitcher.tsx`, add `qv-focusable` to the `<select>` and change `bg-surface` to keep working (it maps to `--qv-background`; leave as-is).

- [ ] **Step 5: ErrorScreen** — in `src/app/chrome/ErrorScreen.tsx`, change the retry button `rounded-lg bg-primary px-5 py-2.5 text-white font-medium` → `qv-button qv-focusable px-5 py-2.5`.

- [ ] **Step 6: App — card wrapper + optical centring** — in `src/app/App.tsx`, in the ready-view `return`:
  - The content container currently is:
    `<div ref={stepContainer} className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-24">`
    Change `justify-center` → `justify-center` (unchanged) but add an optical-centring offset by changing `py-24` → `pb-32 pt-16` (more bottom than top padding nudges the centred content up ~one step).
  - Wrap the `StepRenderer` + `NavButtons` inside the `<StepTransition>` in a card div:

```tsx
        <StepTransition stepKey={state.stepIndex}>
          <div className="qv-card">
            <StepRenderer
              elements={pipedElements}
              locale={locale}
              answers={state.answers}
              onAnswer={handleAnswer}
              requiredErrors={[...state.stepErrors, ...state.validationErrors.map((e) => e.key)]}
              errorMessages={errorMessages}
              keyHints={keyHints}
              strings={{ required: t(locale, 'required_error'), unsupported: t(locale, 'unsupported') }}
            />
            <NavButtons
              locale={locale}
              canBack={state.stepIndex > 0}
              onBack={() => { /* keep the existing onBack body unchanged */
                clearAuto()
                const p = pipeline.current
                if (p) {
                  p.batcher.add(ev.clicked(p.agent, 'back_button', { sessionId: p.identity.sessionId }, nowIso()))
                  p.batcher.add(ev.navigated(p.agent, `step_${state.stepIndex - 1}`, { sessionId: p.identity.sessionId }, nowIso()))
                }
                dispatch({ type: 'back' })
              }}
              onNext={() => advance('click')}
            />
          </div>
        </StepTransition>
```

- [ ] **Step 7: App — apply the resolved theme at boot** — in `src/app/App.tsx`:
  - Add imports: `import { getTheme, resolveThemeId } from '../theme/registry'` and update the existing `applyTheme` import (now takes a `ViewerTheme`). Keep `import { applyTheme, bundleToThemeId } from './theme'` and `import type { Theme } from './theme'`.
  - In the **fixture** boot branch (currently `dispatch({ type: 'boot_success', …, theme: null, … })`), before dispatch add:
    `applyTheme(getTheme(resolveThemeId({ themeParam: params.theme })))`
  - In the **mint** success branch, replace `applyTheme(res.theme as Theme)` with:
    ```ts
    const bundle = res.theme as Theme
    applyTheme(getTheme(resolveThemeId({ bundleId: bundleToThemeId(bundle) })), bundle)
    ```
  - In the **resume** branch, replace `applyTheme(null)` with:
    `applyTheme(getTheme(DEFAULT_THEME_ID))` and add `DEFAULT_THEME_ID` to the registry import. (Resume doesn't re-fetch the bundle — a known FOLLOWUP; default theme is correct here.)

- [ ] **Step 8: bootstrap — parse `?theme=`** — in `src/app/bootstrap.ts`, in `parseParams`, add `theme: params.get('theme')` to the returned object and add `theme: string | null` to its return type.

- [ ] **Step 9: Run the full app + chrome tests**

Run: `cd web-viewer && npx vitest run src/app`
Expected: PASS. (If a test asserts the old `bg-primary` class on a button, update it to assert the button role/text or the `qv-button` class.)

- [ ] **Step 10: Run the whole suite + build**

Run: `cd web-viewer && npm test && npm run build`
Expected: all tests green; clean build; the Schema 7 manifest check passes.

- [ ] **Step 11: Commit**

```bash
git add web-viewer/src/app
git commit -m "feat(web-viewer): card wrapper + optical centring + qv-* chrome + theme-at-boot"
```

---

## Task 10: The registry-driven gallery (dev-only) + remove the lookbook

**Files:**
- Create: `web-viewer/gallery.html`, `web-viewer/src/gallery/main.tsx`
- Modify: `web-viewer/vite.config.ts`
- Remove: `web-viewer/public/lookbook.html`

- [ ] **Step 1: Add the gallery HTML entry**

```html
<!-- web-viewer/gallery.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Web Viewer — Theme Gallery (dev)</title>
  </head>
  <body>
    <div id="gallery-root"></div>
    <script type="module" src="/src/gallery/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Add the gallery app** — renders every registered theme across the fixtures via iframes to the real viewer (`/?fixture=…&theme=…`), so it always matches what deployments render.

```tsx
// src/gallery/main.tsx
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { THEMES } from '../theme/registry'

const FIXTURES = ['widgets', 'mini', 'matrix', 'branch'] as const
const ids = Object.keys(THEMES)

function Gallery() {
  const [fixture, setFixture] = useState<(typeof FIXTURES)[number]>('widgets')
  const [solo, setSolo] = useState<string | 'all'>('all')
  const shown = solo === 'all' ? ids : [solo]
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#15181d', color: '#e7ecf2', minHeight: '100vh' }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 18px', borderBottom: '1px solid #2b323b', position: 'sticky', top: 0, background: '#15181d', zIndex: 5 }}>
        <strong style={{ fontSize: 15 }}>Theme Gallery</strong>
        <span style={{ color: '#9aa4b2', fontSize: 12 }}>Live viewer per theme — single source of truth (src/theme/registry.ts).</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: '#9aa4b2' }}>Fixture{' '}
            <select value={fixture} onChange={(e) => setFixture(e.target.value as never)}>
              {FIXTURES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <button onClick={() => setSolo('all')}>All</button>
          {ids.map((id) => <button key={id} onClick={() => setSolo(id)}>{THEMES[id].name}</button>)}
        </span>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: solo === 'all' ? 'repeat(3, 1fr)' : '1fr', gap: 14, padding: 14 }}>
        {shown.map((id) => (
          <figure key={id} style={{ margin: 0, background: '#0e1116', borderRadius: 11, overflow: 'hidden' }}>
            <figcaption style={{ padding: '7px 11px', fontSize: 13 }}><b>{THEMES[id].name}</b> <span style={{ color: '#9aa4b2' }}>{id}</span></figcaption>
            <iframe title={id} src={`/?fixture=${fixture}&theme=${id}`} style={{ width: '100%', height: solo === 'all' ? 520 : 760, border: 0, display: 'block', background: '#fff' }} />
          </figure>
        ))}
      </div>
    </div>
  )
}

createRoot(document.getElementById('gallery-root')!).render(<Gallery />)
```

- [ ] **Step 3: Register the gallery as a dev/build input (dev-only)** — in `web-viewer/vite.config.ts`, add `gallery.html` to `build.rollupOptions.input` **only in dev/non-production** so it is served by `npm run dev` but excluded from the participant production bundle. Example shape (adapt to the existing config object):

```ts
import { resolve } from 'node:path'
// inside defineConfig(({ mode }) => ({ ...
  build: {
    rollupOptions: {
      input: mode === 'production'
        ? { main: resolve(__dirname, 'index.html') }
        : { main: resolve(__dirname, 'index.html'), gallery: resolve(__dirname, 'gallery.html') },
    },
  },
// }))
```

If the current `vite.config.ts` is not a function form, convert `defineConfig({...})` → `defineConfig(({ mode }) => ({...}))` preserving all existing options (plugins, etc.).

- [ ] **Step 4: Remove the throwaway lookbook**

```bash
git rm web-viewer/public/lookbook.html
```

- [ ] **Step 5: Verify the gallery renders** — start the dev server and screenshot via the installed chromium:

```bash
cd web-viewer && (npm run dev > /tmp/wv-dev.log 2>&1 &) && sleep 8
cat > /tmp/shoot-gallery.mjs <<'EOF'
import pkg from '/home/pedro/Repos/Cursor/questionnaire_apps/library-web/node_modules/playwright/index.js'
const { chromium } = pkg
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1800, height: 1100 }, deviceScaleFactor: 1.4 })
await p.goto('http://localhost:5173/gallery.html', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
await p.screenshot({ path: '/tmp/gallery.png', fullPage: true })
await b.close(); console.log('ok')
EOF
node /tmp/shoot-gallery.mjs
```

Then view `/tmp/gallery.png` — confirm Minimal, Sage, Artsy each render correctly across the fixture switch, the prompt has no black focus box, content is optically centred, and the cards/colours match the approved designs. Show the screenshot to the owner.

- [ ] **Step 6: Commit**

```bash
git add web-viewer/gallery.html web-viewer/src/gallery/main.tsx web-viewer/vite.config.ts
git rm web-viewer/public/lookbook.html
git commit -m "feat(web-viewer): dev-only registry-driven theme gallery; remove throwaway lookbook"
```

---

## Task 11: Docs + HANDOFF/FOLLOWUPS + final verification

**Files:**
- Create: `web-viewer/THEMES.md`
- Modify: `web-viewer/FOLLOWUPS.md`, `HANDOFF.md`

- [ ] **Step 1: Write `web-viewer/THEMES.md`**

```markdown
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
```

- [ ] **Step 2: Update `web-viewer/FOLLOWUPS.md`** — mark the visual-polish candidates as addressed (focus-ring, optical centring, transitions, choice-card states, theme typography) and add a pointer: "Theme authoring: see `THEMES.md` + the dev gallery at `/gallery.html`. Stage 2 (remaining 6 built-in themes + gallery polish) pending."

- [ ] **Step 3: Update `HANDOFF.md`** — in the "Visual Polish" active-task section, note Stage 1 done (theme token model + registry + Minimal default + Sage/Artsy + gallery + `THEMES.md`), and that Stage 2 (the other six themes + optional VS-bundle token extension) is the next cycle. Point future theme work at `web-viewer/THEMES.md`.

- [ ] **Step 4: Full verification**

Run:
```bash
cd web-viewer && npm test
npm run build
npm run build:lib
```
Expected: all web-viewer tests green (original 173 + the new theme tests); both builds succeed (the lib build proves the renderer's themed CSS still compiles for the Editor preview).

- [ ] **Step 5: a11y spot-check** — with `npm run dev` running, keyboard-traverse `http://localhost:5173/?fixture=widgets`: Tab moves focus with a **visible accent ring** on options/inputs/buttons; the heading shows **no black box**; `prefers-reduced-motion` disables the step animation. Screenshot for the owner.

- [ ] **Step 6: Commit + finish the branch**

```bash
git add web-viewer/THEMES.md web-viewer/FOLLOWUPS.md HANDOFF.md
git commit -m "docs(web-viewer): THEMES.md authoring runbook + gallery; HANDOFF/FOLLOWUPS"
```

Then follow the standing pattern (no PRs): use the `superpowers:finishing-a-development-branch` skill to merge `wv-visual-polish` → `master` locally and push.

---

## Self-review checklist (completed by the plan author)

- **Spec coverage:** token model (T2), registry/selection (T2–3), renderer plumbing (T5–6, T8–9), back-compat bundle override (T7), universal polish — focus-ring/centring/transitions/card-states (T6, T9), default Minimal (T2), Sage+Artsy reference themes (T3), gallery (T10), docs+runbook (T11), per-theme AA contrast (T1, T4), index↔lib sync (T6), build:lib (T11). All spec sections map to a task.
- **Placeholder scan:** every code step shows complete code; CSS/theme files are given in full; widget edits give exact old→new strings.
- **Type consistency:** `ViewerTheme` fields (T2) are consumed unchanged by `themeToVars` (T5), `applyTheme` (T7), the contrast sweep (T4), and the themes (T3); `resolveThemeId`/`getTheme`/`bundleToThemeId` signatures match across T2/T3/T7/T9; CSS var names in T5/T6 line up; `data-*` attribute values (`on|off`, variant, surface) match between T5, T6 CSS, and T9.
```

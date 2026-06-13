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
  if (bundle?.palette?.primary) {
    el.style.setProperty('--qv-primary', bundle.palette.primary)
    el.style.setProperty('--qv-button-surface', bundle.palette.primary)
  }
  for (const key of ['secondary', 'success', 'warning', 'error', 'background'] as const) {
    const v = bundle?.palette?.[key]
    if (v) el.style.setProperty(`--qv-${key}`, v)
  }
  if (bundle?.typography?.font_family) el.style.setProperty('--qv-font-family', bundle.typography.font_family)
  if (bundle?.typography?.base_size) el.style.setProperty('--qv-base-size', `${bundle.typography.base_size}px`)
  if (bundle?.spacing?.unit) el.style.setProperty('--qv-space-unit', `${bundle.spacing.unit}px`)
}

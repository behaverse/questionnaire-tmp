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

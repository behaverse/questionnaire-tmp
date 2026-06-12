export type Theme = {
  theme_id?: string
  name?: string
  palette?: Record<string, string>
  typography?: { font_family?: string; base_size?: number }
  spacing?: { unit?: number }
  logo_url?: string | null
  custom_css?: string | null
} | null

const PALETTE = ['primary', 'secondary', 'success', 'warning', 'error', 'background'] as const

export function themeToCssVars(theme: Theme): Record<string, string> {
  if (!theme) return {}
  const vars: Record<string, string> = {}
  for (const key of PALETTE) {
    const v = theme.palette?.[key]
    if (v) vars[`--qv-${key}`] = v
  }
  if (theme.typography?.font_family) vars['--qv-font-family'] = theme.typography.font_family
  if (theme.typography?.base_size) vars['--qv-base-size'] = `${theme.typography.base_size}px`
  if (theme.spacing?.unit) vars['--qv-space-unit'] = `${theme.spacing.unit}px`
  return vars
}

export function applyTheme(theme: Theme): void {
  for (const [k, v] of Object.entries(themeToCssVars(theme))) document.documentElement.style.setProperty(k, v)
}

export type SurfaceKind = 'plain' | 'dots' | 'grid' | 'mesh'
export type OptionVariant = 'borderless' | 'outline' | 'filled' | 'brutal'

export interface ViewerTheme {
  id: string
  name: string
  /** Google-Fonts family specs to load (e.g. 'Bricolage Grotesque:wght@600;700;800'); omit for system fonts. */
  fonts?: string[]
  surface: {
    kind: SurfaceKind; background: string
    /** For kind 'dots'|'grid': the CSS colour of the pattern lines/dots (e.g. 'rgba(26,26,26,0.11)') and the tile size (e.g. '30px'). */
    pattern?: string; patternSize?: string
  }
  /** When enabled is false, the other card fields are ignored — consumers MUST gate on card.enabled (themeToVars does). */
  card: { enabled: boolean; surface?: string; border?: string; borderWidth?: string; radius?: string; shadow?: string; padding?: string }
  prompt: { fontFamily: string; weight: number; size: string; color: string; letterSpacing?: string }
  secondary: { color: string }
  options: {
    variant: OptionVariant
    surface: string; border: string; radius: string
    /** Omit for no hover change (falls back to the base option surface/border). */
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

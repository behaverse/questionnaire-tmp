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

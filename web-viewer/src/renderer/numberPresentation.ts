export type NumberPresentation = 'slider' | 'rating' | 'input'

const MAX_RATING_POINTS = 11

/** Pick how a number.* widget should render. A valid `layout` hint wins; otherwise: bounded
 *  small-integer scales become rating buttons, wider/finer bounded ranges a slider, and
 *  unbounded numbers a plain input. */
export function numberPresentation(
  option: { min?: number; max?: number; step?: number },
  layout?: string,
): NumberPresentation {
  const bounded = option.min != null && option.max != null
  if (layout === 'input') return 'input'
  if (layout === 'slider') return bounded ? 'slider' : 'input'
  if (layout === 'rating') return bounded ? 'rating' : 'input'
  const { min, max } = option
  if (min == null || max == null) return 'input'
  const step = option.step ?? 1
  const integerStep = Number.isInteger(step) && step > 0
  if (integerStep) {
    const points = (max - min) / step + 1
    if (points <= MAX_RATING_POINTS) return 'rating'
  }
  return 'slider'
}

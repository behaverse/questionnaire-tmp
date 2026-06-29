import { describe, it, expect } from 'vitest'
import { numberPresentation } from './numberPresentation'

describe('numberPresentation', () => {
  it('small bounded integer scales → rating', () => {
    expect(numberPresentation({ min: 1, max: 7, step: 1 })).toBe('rating')   // FSQ/SHS
    expect(numberPresentation({ min: 1, max: 9, step: 1 })).toBe('rating')   // RPS
    expect(numberPresentation({ min: 0, max: 10, step: 1 })).toBe('rating')  // 11 points (boundary)
  })
  it('wide or fine bounded ranges → slider', () => {
    expect(numberPresentation({ min: 0, max: 100, step: 1 })).toBe('slider') // SECS (101 pts)
    expect(numberPresentation({ min: 0, max: 5, step: 0.5 })).toBe('slider') // non-integer step
  })
  it('unbounded → input', () => {
    expect(numberPresentation({ step: 1 })).toBe('input')
    expect(numberPresentation({ min: 0 })).toBe('input')
  })
  it('a valid style.layout hint overrides the auto rule', () => {
    expect(numberPresentation({ min: 1, max: 7, step: 1 }, 'slider')).toBe('slider')
    expect(numberPresentation({ min: 0, max: 100, step: 1 }, 'rating')).toBe('rating')
    expect(numberPresentation({ min: 1, max: 7, step: 1 }, 'input')).toBe('input')
    expect(numberPresentation({ min: 1, max: 7, step: 1 }, 'matrix')).toBe('rating') // unknown hint ignored
  })
  it('slider/rating hints fall back to input when unbounded', () => {
    expect(numberPresentation({ step: 1 }, 'slider')).toBe('input')
    expect(numberPresentation({ step: 1 }, 'rating')).toBe('input')
    expect(numberPresentation({ min: 0 }, 'slider')).toBe('input')
    expect(numberPresentation({ min: 0 }, 'rating')).toBe('input')
    expect(numberPresentation({ max: 10 }, 'slider')).toBe('input')
    expect(numberPresentation({ max: 10 }, 'rating')).toBe('input')
  })
})

import { describe, it, expect } from 'vitest'
import { previewPlayerUrl } from './preview'

describe('previewPlayerUrl', () => {
  it('builds a player URL that previews the questionnaire and returns to this page', () => {
    const u = new URL(previewPlayerUrl('qst_phq9@v26.0602', 'en'))
    // default dev player base
    expect(u.origin).toBe('http://localhost:5173')
    expect(u.searchParams.get('preview')).toBe('qst_phq9@v26.0602')
    expect(u.searchParams.get('locale')).toBe('en')
    // tells the player which VS to fetch the preview runtime from
    expect(u.searchParams.get('viewer_url')).toBe('http://localhost:8001')
    // comes back to the current Library page on Done
    expect(u.searchParams.get('return_url')).toBe(window.location.href)
  })
})

import { describe, test, expect } from 'vitest'
import { checkGuard } from './_guard'

const req = (headers: Record<string, string>) =>
  new Request('https://editor.example/api/translate', { method: 'POST', headers })

describe('checkGuard — origin mode (no shared secret)', () => {
  const env = {}
  test('same-origin request is allowed', () => {
    expect(checkGuard(req({ origin: 'https://editor.example', host: 'editor.example' }), env).ok).toBe(true)
  })
  test('cross-origin request is forbidden', () => {
    const r = checkGuard(req({ origin: 'https://evil.example', host: 'editor.example' }), env)
    expect(r).toMatchObject({ ok: false, status: 403 })
  })
  test('no-Origin request (curl/server) is forbidden without the secret', () => {
    const r = checkGuard(req({ host: 'editor.example' }), env)
    expect(r).toMatchObject({ ok: false, status: 403 })
  })
  test('an extra allow-listed origin passes', () => {
    const r = checkGuard(req({ origin: 'https://portal.example', host: 'editor.example' }),
      { TRANSLATE_ALLOWED_ORIGINS: 'https://portal.example, https://x.example' })
    expect(r.ok).toBe(true)
  })
})

describe('checkGuard — shared-secret mode', () => {
  const env = { TRANSLATE_SHARED_SECRET: 's3cr3t' }
  test('correct bearer passes even with no Origin', () => {
    expect(checkGuard(req({ authorization: 'Bearer s3cr3t' }), env).ok).toBe(true)
  })
  test('wrong bearer is unauthorized', () => {
    expect(checkGuard(req({ authorization: 'Bearer nope' }), env)).toMatchObject({ ok: false, status: 401 })
  })
  test('missing bearer is unauthorized even from a same-origin browser', () => {
    const r = checkGuard(req({ origin: 'https://editor.example', host: 'editor.example' }), env)
    expect(r).toMatchObject({ ok: false, status: 401 })
  })
})

describe('checkGuard — rate limiting', () => {
  test('the Nth+1 request from one IP in the window is 429', () => {
    const env = { TRANSLATE_RATE_LIMIT: '3' }
    const headers = { origin: 'https://editor.example', host: 'editor.example', 'x-vercel-forwarded-for': '9.9.9.9' }
    const results = Array.from({ length: 4 }, () => checkGuard(req(headers), env))
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true)
    expect(results[3]).toMatchObject({ ok: false, status: 429 })
  })

  test('a spoofed x-forwarded-for cannot escape the per-IP limit when a trusted header is present', () => {
    const env = { TRANSLATE_RATE_LIMIT: '1' }
    const base = { origin: 'https://editor.example', host: 'editor.example', 'x-vercel-forwarded-for': '7.7.7.7' }
    expect(checkGuard(req({ ...base, 'x-forwarded-for': 'a.a.a.a' }), env).ok).toBe(true)
    // same trusted IP, different (rotated) XFF → still the same bucket → blocked
    expect(checkGuard(req({ ...base, 'x-forwarded-for': 'b.b.b.b' }), env)).toMatchObject({ ok: false, status: 429 })
  })

  test('a junk TRANSLATE_RATE_LIMIT falls back to the default instead of disabling the limiter', () => {
    const env = { TRANSLATE_RATE_LIMIT: 'not-a-number' }
    const headers = { origin: 'https://editor.example', host: 'editor.example', 'x-vercel-forwarded-for': '5.5.5.5' }
    const results = Array.from({ length: 31 }, () => checkGuard(req(headers), env))
    expect(results.slice(0, 30).every((r) => r.ok)).toBe(true)   // default cap is 30/min
    expect(results[30]).toMatchObject({ ok: false, status: 429 })
  })
})

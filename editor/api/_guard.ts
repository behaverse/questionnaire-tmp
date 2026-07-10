// editor/api/_guard.ts — access guard for the /api/translate Vercel Function.
//
// /api/translate spends an Anthropic (or AI-Gateway) key on every call, so an open endpoint is a
// direct cost-abuse / quota-exhaustion vector. This guard applies three layered, infra-free controls:
//
//   1. Same-origin / origin allow-list. Browser requests from the editor SPA carry an `Origin` that
//      matches the function's own `Host`; anything cross-origin (or with a forged/other Origin) is
//      rejected. `TRANSLATE_ALLOWED_ORIGINS` (comma-separated) adds extra permitted origins.
//   2. Optional hard lock. If `TRANSLATE_SHARED_SECRET` is set, a matching `Authorization: Bearer`
//      is REQUIRED (constant-time compared) — this also lets non-browser/no-Origin callers through
//      when they hold the secret, and closes the endpoint completely otherwise.
//   3. Per-instance IP rate limit (`TRANSLATE_RATE_LIMIT`/min, default 30) as defense-in-depth.
//
// NOTE: this is not a substitute for a real Identity-JWT gate (the editor has no login flow wired
// yet — that is the Phase-1 follow-up). Origin can be forged by non-browser clients, and the rate
// limiter is per warm instance, not global. It removes the trivial "script the public URL" abuse.

type Env = Record<string, string | undefined>
export type GuardResult = { ok: true } | { ok: false; status: number; message: string }

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false // no Origin (curl/server-to-server) — only the shared secret admits these
  const extra = (env.TRANSLATE_ALLOWED_ORIGINS ?? '')
    .split(',').map((s) => s.trim()).filter(Boolean)
  if (extra.includes(origin)) return true
  // default: same-origin — the Origin's host must equal the request Host
  const host = request.headers.get('host')
  try {
    return !!host && new URL(origin).host === host
  } catch {
    return false
  }
}

function clientIp(request: Request): string {
  // Prefer platform-hardened headers; raw X-Forwarded-For[0] is client-controlled behind an
  // appending proxy. On Vercel x-vercel-forwarded-for is spoof-safe.
  for (const h of ['x-vercel-forwarded-for', 'x-real-ip']) {
    const v = (request.headers.get(h) ?? '').trim()
    if (v) return v.split(',')[0].trim()
  }
  const xff = (request.headers.get('x-forwarded-for') ?? '').trim()
  return xff ? xff.split(',')[0].trim() : 'unknown'
}

// module-level: survives across requests on a warm (Fluid) instance. Bounded so a flood of distinct
// IPs (or spoofed header values) can't grow it without limit.
const _hits = new Map<string, number[]>()
const _MAX_BUCKETS = 10_000

function rateLimited(request: Request, env: Env): boolean {
  // A junk TRANSLATE_RATE_LIMIT falls back to the default rather than silently disabling the limiter.
  const parsed = Number(env.TRANSLATE_RATE_LIMIT ?? '30')
  const limit = Number.isFinite(parsed) ? parsed : 30
  if (limit <= 0) return false
  const now = Date.now()
  const windowStart = now - 60_000
  const ip = clientIp(request)
  const recent = (_hits.get(ip) ?? []).filter((t) => t > windowStart)
  recent.push(now)
  if (recent.length === 0) _hits.delete(ip)   // never happens (just pushed) — guards future edits
  else _hits.set(ip, recent)
  // Evict buckets whose window has fully elapsed; hard-cap the map size as a backstop.
  if (_hits.size > _MAX_BUCKETS) {
    for (const [k, ts] of _hits) if (ts.every((t) => t <= windowStart)) _hits.delete(k)
    if (_hits.size > _MAX_BUCKETS) _hits.clear()
  }
  return recent.length > limit
}

export function checkGuard(request: Request, env: Env): GuardResult {
  const secret = env.TRANSLATE_SHARED_SECRET?.trim()
  if (secret) {
    const auth = request.headers.get('authorization') ?? ''
    const presented = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
    if (!presented || !constantTimeEqual(presented, secret))
      return { ok: false, status: 401, message: 'unauthorized' }
  } else if (!originAllowed(request, env)) {
    return { ok: false, status: 403, message: 'forbidden origin' }
  }
  if (rateLimited(request, env))
    return { ok: false, status: 429, message: 'rate limit exceeded' }
  return { ok: true }
}

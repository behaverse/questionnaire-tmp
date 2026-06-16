/** Run `fn` over `items` with at most `limit` promises in flight; results keep input order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const n = Math.max(1, limit)
  const workers = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return results
}

/** Call `fn`, retrying up to `retries` times with a fixed backoff. Rethrows the last error. */
export async function withRetry<R>(fn: () => Promise<R>, opts: { retries?: number; backoffMs?: number } = {}): Promise<R> {
  const retries = opts.retries ?? 1
  const backoffMs = opts.backoffMs ?? 250
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn() }
    catch (e) { lastErr = e; if (attempt < retries) await new Promise((r) => setTimeout(r, backoffMs)) }
  }
  throw lastErr
}

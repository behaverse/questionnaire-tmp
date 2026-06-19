const ENDPOINT = (import.meta.env.VITE_TRANSLATE_URL as string | undefined) ?? '/api/translate'

export async function translateText(
  text: string, sourceLang: string, targetLang: string, kind?: string,
  opts: { fetchImpl?: typeof fetch; endpoint?: string } = {},
): Promise<string> {
  const f = opts.fetchImpl ?? fetch
  const res = await f(opts.endpoint ?? ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, sourceLang, targetLang, kind }),
  })
  if (!res.ok) throw new Error(`translate failed (${res.status})`)
  const data = (await res.json()) as { translation?: string }
  return data.translation ?? ''
}

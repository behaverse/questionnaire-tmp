// editor/api/translate.ts — Vercel Function (web-standard). Thin wrapper around translateField.
import { translateField } from '../src/translate/translateCore'
import { makeGenerate } from './_provider'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

export async function POST(request: Request): Promise<Response> {
  let input: unknown
  try { input = await request.json() } catch { return json({ error: 'invalid JSON' }, 400) }
  try {
    const generate = await makeGenerate(process.env)
    const translation = await translateField(input as Record<string, string>, generate)
    return json({ translation })
  } catch (e) {
    const status = (e as { status?: number }).status ?? 502
    return json({ error: (e as Error).message ?? 'translation failed' }, status)
  }
}

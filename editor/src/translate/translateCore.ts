const LANG_RE = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/

export interface TranslateInput { text?: string; sourceLang?: string; targetLang?: string; kind?: string }

function badRequest(message: string): Error & { status: number } {
  return Object.assign(new Error(message), { status: 400 })
}

/** Validate + build the prompt + clean the output. `generate` is injected so this is testable
 *  without the AI SDK; the serverless handler passes the real model call. */
export async function translateField(
  input: TranslateInput,
  generate: (p: { system: string; prompt: string }) => Promise<string>,
): Promise<string> {
  const text = typeof input.text === 'string' ? input.text.trim() : ''
  const src = String(input.sourceLang ?? '')
  const tgt = String(input.targetLang ?? '')
  if (!text) return ''
  if (text.length > 5000) throw badRequest('text too long (max 5000 chars)')
  if (!LANG_RE.test(src) || !LANG_RE.test(tgt)) throw badRequest('invalid language code')
  if (src === tgt) return text
  const kind = typeof input.kind === 'string' && input.kind ? input.kind : 'text'
  const system =
    `You are a professional translator for psychological and clinical questionnaires. ` +
    `Translate the user's "${kind}" field from ${src} to ${tgt}. ` +
    `Preserve {placeholders}, inline markdown/HTML, numbers, and a formal clinical register. ` +
    `Return ONLY the translated text — no quotes, labels, or commentary.`
  const out = await generate({ system, prompt: text })
  return (out ?? '').trim()
}

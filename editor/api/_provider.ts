// Shared by the Vercel function (api/translate.ts) and the dev shim (vite.config.ts).
// Resolves a translate `generate({system,prompt})` fn from env, choosing the model + provider:
//   - TRANSLATE_MODEL overrides the model. A value WITHOUT a "/" (e.g. "claude-haiku-4-5") is a
//     direct-provider model; a value WITH a "/" (e.g. "anthropic/claude-haiku-4-5") routes through
//     the Vercel AI Gateway.
//   - With no TRANSLATE_MODEL: prefer a direct Anthropic key if present (no Vercel card needed),
//     otherwise fall back to the AI Gateway default.
type Env = Record<string, string | undefined>
type Generate = (p: { system: string; prompt: string }) => Promise<string>

export async function makeGenerate(env: Env): Promise<Generate> {
  const { generateText } = await import('ai')
  const explicit = env.TRANSLATE_MODEL?.trim()
  const direct = !!env.ANTHROPIC_API_KEY && (!explicit || !explicit.includes('/'))

  if (direct) {
    const { createAnthropic } = await import('@ai-sdk/anthropic')
    const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY })
    const model = anthropic(explicit || 'claude-haiku-4-5')
    return async ({ system, prompt }) => (await generateText({ model, system, prompt })).text
  }

  const model = explicit || 'anthropic/claude-haiku-4-5' // AI Gateway provider/model string
  return async ({ system, prompt }) => (await generateText({ model, system, prompt })).text
}

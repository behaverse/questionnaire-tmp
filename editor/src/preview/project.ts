import type { Runtime, PinnedScore } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'
import { resolveDocument, type Lookup, type RefProblem } from './resolve'
import { scorerImpl } from '../logic/scorers/registry'

export function projectForPreview(model: Questionnaire, lookup: Lookup): { runtime: Runtime; problems: RefProblem[] } {
  const { resolved, problems } = resolveDocument(model, lookup)
  const r = resolved as Record<string, unknown>
  const meta = (r.metadata ?? {}) as Record<string, unknown>
  const language = String(meta.language ?? 'en')
  const runtime: Runtime = {
    provenance: { preview: true },
    metadata: {
      id: String(meta.id ?? 'qst_preview'),
      title: String(meta.title ?? ''),
      description: meta.description as string | undefined,
      language,
    },
    locale: language,
    available_locales: (meta.available_languages as string[] | undefined) ?? [language],
    style: r.style as Record<string, unknown> | undefined,
    flow: r.flow as Record<string, unknown> | undefined,
    blocks: r.blocks as Runtime['blocks'],
    pages: (r.pages as Runtime['pages']) ?? [],
  }
  const modelScores = (r.scores as { id: string; scorer: string; path: string; name?: string; description?: string }[] | undefined) ?? []
  const pinned: PinnedScore[] = []
  for (const s of modelScores) {
    const impl = scorerImpl(s.scorer)
    if (impl) pinned.push({ ...s, impl })
  }
  runtime.scores = pinned
  runtime.x_show_score_live = r.x_show_score_live as boolean | undefined
  return { runtime, problems }
}

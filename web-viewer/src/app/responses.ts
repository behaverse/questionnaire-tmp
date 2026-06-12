import { deriveWidget } from '../renderer/derive'
import { isItem, isMessage, isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import { mergeOptions } from '../renderer/merge'
import type { AnswerValue, ContentEntity, ItemElement, Runtime, RuntimeElement } from '../renderer/types'

export type SessionIdentity = {
  sessionId: string
  agentId: string
  sessionIndex: number
  instrumentId: string
  language: string
}
export type ElementIndex = {
  pageIndex: number
  pageId: string
  trialIndex: string
  timelineId?: string
  sectionId?: string
  rowIndex?: number
}
export type RowTiming = { trialStart: string; responseAt: string; responseTimeS: number | null }
export type RowContext = {
  identity: SessionIdentity
  index: ElementIndex
  responseId: number
  timing: RowTiming
  attempt?: { revises: number; revision: number }
}
export type Schema5Row = Record<string, unknown>

function timelineIdFor(runtime: Runtime, pageId: string): string | undefined {
  return (runtime.blocks ?? []).find((b) => b.page_ids?.includes(pageId))?.id
}

/** Map every submittable element key → its page/trial coordinates (same keys as steps.ts). */
export function buildRuntimeIndex(runtime: Runtime): Map<string, ElementIndex> {
  const map = new Map<string, ElementIndex>()
  runtime.pages.forEach((page, p) => {
    const timelineId = timelineIdFor(runtime, page.id)
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      const base: ElementIndex = { pageIndex: p + 1, pageId: page.id, trialIndex: String(i + 1), ...(timelineId ? { timelineId } : {}) }
      if (isSection(el)) {
        el.elements.forEach((c, j) => {
          map.set(elementKey(c, sectionChildFallback(key, j)), { ...base, sectionId: key, rowIndex: j })
        })
      } else {
        map.set(key, base)
      }
    })
  })
  return map
}

const text = (e: ContentEntity | undefined, locale: string) => e?.content?.[locale]?.text

export function stimulusFor(el: RuntimeElement, fallbackKey: string, locale: string): {
  stimulus_id: string
  stimulus_type: string
  stimulus_description: string
} {
  if (isItem(el)) {
    const parts = [el.question.context, el.question.instruction, el.question.prompt].filter(Boolean) as ContentEntity[]
    const ids = parts.map((p) => p.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
    return {
      stimulus_id: ids.length > 0 ? ids.join('+') : fallbackKey,
      stimulus_type: el.question.context || el.question.instruction ? 'composite' : 'text',
      stimulus_description: parts.map((p) => text(p, locale)).filter(Boolean).join(' '),
    }
  }
  return {
    stimulus_id: elementKey(el, fallbackKey),
    stimulus_type: 'instruction',
    stimulus_description: (isMessage(el) ? text(el, locale) : undefined) ?? '',
  }
}

function baseRow(ctx: RowContext, blockType: string): Schema5Row {
  const { identity, index, responseId, timing } = ctx
  return {
    response_id: responseId,
    agent_id: identity.agentId,
    session_index: identity.sessionIndex,
    session_id: identity.sessionId,
    activity_index: 1,
    language: identity.language,
    instrument_id: identity.instrumentId,
    instrument_repetition: 0,
    ...(index.timelineId ? { timeline_id: index.timelineId } : {}),
    multitask_type: '',
    block_index: index.pageIndex,
    block_name: index.pageId,
    block_type: blockType,
    transformation_name: 'identity',
    trial_index: index.trialIndex,
    trial_start_datetime: timing.trialStart,
    response_datetime: timing.responseAt,
    ...(timing.responseTimeS !== null ? { response_time: timing.responseTimeS } : {}),
    ...(ctx.attempt ? { x_response_revises: ctx.attempt.revises, x_response_revision: ctx.attempt.revision } : {}),
  }
}

const ctxKeyFallback = (ctx: RowContext) =>
  ctx.index.sectionId !== undefined && ctx.index.rowIndex !== undefined
    ? sectionChildFallback(ctx.index.sectionId, ctx.index.rowIndex)
    : pageElementFallback(ctx.index.pageId, Number(ctx.index.trialIndex) - 1)

function safeMerge(opt: ItemElement['option'], locale: string) {
  try {
    return mergeOptions(opt, locale)
  } catch {
    return []
  }
}

export function buildItemRow(ctx: RowContext, el: ItemElement, answer: AnswerValue, locale: string): Schema5Row {
  const row: Schema5Row = { ...baseRow(ctx, 'test'), ...stimulusFor(el, ctxKeyFallback(ctx), locale) }
  const opt = el.option
  if (opt.id) row.option_id = opt.id
  row.option_data_type = opt.input_data_type
  row.measurement_type = opt.measurement_type
  const kind = deriveWidget(opt) ?? ''
  const extras: Record<string, unknown> = {}
  if (ctx.index.sectionId !== undefined) {
    extras.section_id = ctx.index.sectionId
    extras.row_index = ctx.index.rowIndex
  }
  if (kind.startsWith('choice.')) {
    row.option_count = opt.options?.length ?? 0
    const choices = safeMerge(opt, locale)
    if (kind.endsWith('.single')) {
      const c = choices.find((ch) => ch.value === answer)
      if (c) {
        row.response_option_index = c.index
        row.response_description = c.text
        if (typeof c.value === 'number') row.response_numeric = c.value
      }
    } else {
      const values = Array.isArray(answer) ? answer : []
      const picked = choices.filter((ch) => values.includes(ch.value))
      row.response_count = picked.length
      row.response_description = picked.map((ch) => ch.text).join('; ')
      extras.values = values
      extras.indices = picked.map((ch) => ch.index)
    }
  } else if (kind.startsWith('number.')) {
    if (typeof answer === 'number') row.response_numeric = answer
  } else if (typeof answer === 'string') {
    row.response_description = answer
  }
  if (Object.keys(extras).length > 0) row.additional_measures = JSON.stringify(extras)
  return row
}

export function buildMessageRow(ctx: RowContext, el: RuntimeElement, locale: string, action: 'click' | 'key'): Schema5Row {
  return {
    ...baseRow(ctx, 'instruction'),
    ...stimulusFor(el, ctxKeyFallback(ctx), locale),
    response_description: 'acknowledged',
    input_action_type: action,
  }
}

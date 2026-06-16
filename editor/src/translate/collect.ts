import type { Questionnaire, EntityBody } from '../model/types'
import { pathKey, type NodePath } from '../model/path'
import type { TransGroup, TransRow, TransKind } from './types'

type Body = Record<string, unknown> & { content?: Record<string, { status?: string; text?: string; label?: string; units?: string; options?: Array<{ index: number; text?: string }> }> }

const text = (b: Body | undefined, loc: string) => String(b?.content?.[loc]?.text ?? '')
const status = (b: Body | undefined, loc: string) => String(b?.content?.[loc]?.status ?? 'draft')

export function collectTranslatable(
  model: Questionnaire,
  pool: Record<string, EntityBody>,
  resolved: Record<string, EntityBody | null>,
  primary: string,
  target: string,
): TransGroup[] {
  const groups: TransGroup[] = []
  const seen = new Set<string>()
  const bodyOf = (ref: string): Body | undefined => (pool[ref] ?? resolved[ref] ?? undefined) as Body | undefined

  const textGroup = (ref: string, kind: TransKind, title: string) => {
    if (seen.has(ref)) return
    seen.add(ref)
    const b = bodyOf(ref)
    const tgt = text(b, target)
    groups.push({
      groupId: ref, entityRef: ref, inlinePath: null, kind, title,
      rows: [{ id: `${ref}:${JSON.stringify({ t: 'text' })}`, fieldLabel: kindLabel(kind), field: { t: 'text' }, source: text(b, primary), target: tgt, status: status(b, target), done: !!tgt.trim() }],
    })
  }

  const optionGroup = (ref: string | null, inlinePath: NodePath | null, body: Body | undefined, title: string) => {
    const groupId = ref ?? `inline:${pathKey(inlinePath as NodePath)}`
    if (seen.has(groupId)) return
    seen.add(groupId)
    const rows: TransRow[] = []
    const cEn = body?.content?.[primary]
    const cTg = body?.content?.[target]
    const push = (field: TransRow['field'], fieldLabel: string, src: string, tgt: string) =>
      rows.push({ id: `${groupId}:${JSON.stringify(field)}`, fieldLabel, field, source: src, target: tgt, status: status(body, target), done: !!tgt.trim() })
    if (cEn?.label !== undefined || cTg?.label !== undefined) push({ t: 'opt-label' }, 'Label', String(cEn?.label ?? ''), String(cTg?.label ?? ''))
    if (cEn?.units !== undefined || cTg?.units !== undefined) push({ t: 'opt-units' }, 'Units', String(cEn?.units ?? ''), String(cTg?.units ?? ''))
    for (const ch of cEn?.options ?? cTg?.options ?? []) {
      const i = ch.index
      const srcTxt = String(cEn?.options?.find((o) => o.index === i)?.text ?? '')
      const tgtTxt = String(cTg?.options?.find((o) => o.index === i)?.text ?? '')
      push({ t: 'choice', index: i }, `Choice ${i}`, srcTxt, tgtTxt)
    }
    if (rows.length) groups.push({ groupId, entityRef: ref, inlinePath, kind: 'option', title, rows })
  }

  const visitElement = (el: Record<string, unknown>, path: NodePath) => {
    const q = el.question as Record<string, unknown> | undefined
    const promptRef = (q?.prompt as { ref?: string } | undefined)?.ref
    if (promptRef) textGroup(promptRef, 'prompt', promptRef)
    const ctxRef = (q?.context as { ref?: string } | undefined)?.ref
    if (ctxRef) textGroup(ctxRef, 'context', ctxRef)
    const insRef = (q?.instruction as { ref?: string } | undefined)?.ref
    if (insRef) textGroup(insRef, 'instruction', insRef)
    // message element: { ref }
    if (typeof el.ref === 'string' && el.ref.startsWith('msg_')) textGroup(el.ref, 'message', el.ref)
    // option: ref or inline
    const optKey = 'shared_option' in el ? 'shared_option' : 'option'
    const opt = el[optKey] as { ref?: string } | Body | undefined
    if (opt && typeof opt === 'object') {
      if ('ref' in opt && typeof opt.ref === 'string') optionGroup(opt.ref, null, bodyOf(opt.ref), opt.ref)
      else if ('input_data_type' in (opt as object)) optionGroup(null, [...path, optKey] as NodePath, opt as Body, 'inline option')
    }
  }

  for (let pi = 0; pi < (model.pages?.length ?? 0); pi++) {
    const page = model.pages[pi]
    page.elements?.forEach((el, ei) => {
      visitElement(el as Record<string, unknown>, ['pages', pi, 'elements', ei])
      const sec = el as { elements?: Record<string, unknown>[] }
      sec.elements?.forEach((sub, si) => visitElement(sub, ['pages', pi, 'elements', ei, 'elements', si]))
    })
  }
  return groups
}

function kindLabel(k: TransKind): string {
  return k === 'prompt' ? 'Prompt' : k === 'context' ? 'Context' : k === 'instruction' ? 'Instruction' : k === 'message' ? 'Message' : 'Option'
}

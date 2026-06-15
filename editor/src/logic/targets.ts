import type { Questionnaire } from '../model/types'

export interface LogicTargets { pageIds: string[]; elementKeys: string[] }

/** Targets for logic rules: page ids (skip/branch `skip_to`) + element/section keys
 *  (visibility `target_id`). Element keys are the `id` fields the renderer keys on. */
export function collectLogicTargets(model: Questionnaire): LogicTargets {
  const pageIds = new Set<string>()
  const elementKeys = new Set<string>()
  for (const page of (model.pages ?? [])) {
    if (typeof page.id === 'string') pageIds.add(page.id)
    for (const el of (page.elements ?? [])) {
      const id = (el as { id?: unknown }).id
      if (typeof id === 'string') elementKeys.add(id)
      const children = (el as { elements?: unknown }).elements
      if (Array.isArray(children)) {
        for (const c of children) {
          const cid = (c as { id?: unknown }).id
          if (typeof cid === 'string') elementKeys.add(cid)
        }
      }
    }
  }
  return { pageIds: [...pageIds], elementKeys: [...elementKeys] }
}

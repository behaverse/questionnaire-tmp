import type { Questionnaire } from '../model/types'

export interface PipingTarget { fieldPath: string; label: string }

/** True for a top-level item element: an inline item (has `question`) or a saved-item ref
 *  (`ref` starting `it_`). Messages (`msg_`) and sections (`elements`) are not prompt targets. */
function isItemElement(el: unknown): boolean {
  if (!el || typeof el !== 'object') return false
  if ('question' in el) return true
  const ref = (el as { ref?: unknown }).ref
  return typeof ref === 'string' && ref.startsWith('it_')
}

/** Piping targets: one question-prompt path per top-level item, in the canonical
 *  `pages.{pageId}.elements.{index}.prompt` format the Web Viewer matches against. */
export function collectPipingTargets(model: Questionnaire): PipingTarget[] {
  const out: PipingTarget[] = []
  for (const page of (model.pages ?? [])) {
    (page.elements ?? []).forEach((el, i) => {
      if (!isItemElement(el)) return
      const id = (el as { id?: unknown }).id
      out.push({
        fieldPath: `pages.${page.id}.elements.${i}.prompt`,
        label: `${page.title ?? page.id} › ${typeof id === 'string' ? id : '#' + i}`,
      })
    })
  }
  return out
}

import { elementKey, pageElementFallback } from '@behaverse/questionnaire-renderer'
import type { RuntimeElement, RuntimePage } from '@behaverse/questionnaire-renderer'

/** Page-level elements as the {key, element}[] StepRenderer wants. StepRenderer
 *  renders Sections (and their children) internally, so only flatten one level. */
export function flattenPage(page: RuntimePage): { key: string; element: RuntimeElement }[] {
  return page.elements.map((element, i) => ({ key: elementKey(element, pageElementFallback(page.id, i)), element }))
}

import type { RuntimeElement } from './types'

/** Stable answer key: the element's own id when present, else a positional fallback. */
export function elementKey(el: RuntimeElement, fallback: string): string {
  const id = (el as { id?: unknown }).id
  return typeof id === 'string' && id.length > 0 ? id : fallback
}
export const pageElementFallback = (pageId: string, i: number) => `${pageId}__el${i}`
export const sectionChildFallback = (sectionKey: string, j: number) => `${sectionKey}__r${j}`

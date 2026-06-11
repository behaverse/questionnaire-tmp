import type { ItemElement, MessageElement, RuntimeElement, SectionElement } from './types'

export function isItem(el: RuntimeElement): el is ItemElement {
  return typeof el === 'object' && el !== null && 'question' in el && 'option' in el
}
export function isSection(el: RuntimeElement): el is SectionElement {
  return typeof el === 'object' && el !== null && 'elements' in el && Array.isArray((el as SectionElement).elements)
}
export function isMessage(el: RuntimeElement): el is MessageElement {
  return typeof el === 'object' && el !== null && 'content' in el && !isItem(el) && !isSection(el)
}

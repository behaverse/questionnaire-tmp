import type {
  ResolvedDefinition, DefElement, DefPage, ResolvedOption, LangContent,
} from '../api/types'

export interface OptionChoice { index: number; text: string; value?: number }
export interface ItemBlock {
  kind: 'item'
  number: number
  stem: string
  context?: string
  instruction?: string
  required: boolean
  options: OptionChoice[]
  dimension?: string
  reversed?: boolean
  subscales?: string[]
  unresolved: boolean
}
export interface MessageBlock { kind: 'message'; text: string; unresolved: boolean }
export interface SectionBlock { kind: 'section'; id?: string; sharedOptions: OptionChoice[]; items: ItemBlock[] }
export type Block = ItemBlock | MessageBlock | SectionBlock
export interface RenderPage { id?: string; title?: string; blocks: Block[] }
export interface RenderModel { pages: RenderPage[] }

function pick(content: Record<string, LangContent> | undefined, lang: string, primary: string): LangContent | undefined {
  if (!content) return undefined
  return content[lang] ?? content[primary] ?? content[Object.keys(content)[0]]
}

function optionsOf(option: ResolvedOption | undefined, lang: string, primary: string): OptionChoice[] {
  const c = pick(option?.content, lang, primary)
  if (!c?.options) return []
  return c.options.map((o) => ({
    index: o.index,
    text: o.text ?? '',
    value: option?.options?.find((v) => v.index === o.index)?.value,
  }))
}

export function buildRenderModel(def: ResolvedDefinition, lang: string): RenderModel {
  const primary = def.metadata.language ?? 'en'
  let counter = 0

  function item(el: DefElement, sharedOption?: ResolvedOption): ItemBlock {
    counter += 1
    const prompt = el.question?.prompt
    const stemC = pick(prompt?.content, lang, primary)
    const option = el.option ?? sharedOption
    return {
      kind: 'item',
      number: counter,
      stem: stemC?.text ?? '',
      context: pick(el.question?.context?.content, lang, primary)?.text,
      instruction: pick(el.question?.instruction?.content, lang, primary)?.text,
      required: el.required ?? false,
      options: optionsOf(option, lang, primary),
      dimension: prompt?.dimension,
      reversed: prompt?.reversed,
      subscales: prompt?.subscales,
      unresolved: prompt?._unresolved === true,
    }
  }

  function block(el: DefElement): Block {
    // In Schema-2 only a Section carries a nested elements[] array (matrix or grouped items).
    if (el.elements) {
      // Section (matrix): shared option once, child items beneath
      return {
        kind: 'section',
        id: el.id,
        sharedOptions: optionsOf(el.shared_option, lang, primary),
        items: el.elements.map((child) => item(child, el.shared_option)),
      }
    }
    if (el.question) return item(el)
    // message (has content, no question)
    const c = pick(el.content, lang, primary)
    return { kind: 'message', text: c?.text ?? '', unresolved: el._unresolved === true }
  }

  const pages: RenderPage[] = (def.pages ?? []).map((p: DefPage) => ({
    id: p.id,
    title: p.title,
    blocks: (p.elements ?? []).map(block),
  }))
  return { pages }
}

import type {
  ResolvedDefinition, DefElement, DefPage, ResolvedOption, LangContent,
} from '../api/types'

export interface OptionChoice { index: number; text: string; value?: number }
export interface ItemBlock {
  kind: 'item'
  number: number
  stem: string
  stemFallbackLang?: string
  context?: string
  contextFallbackLang?: string
  instruction?: string
  instructionFallbackLang?: string
  required: boolean
  options: OptionChoice[]
  optionsFallbackLang?: string
  dimension?: string
  reversed?: boolean
  subscales?: string[]
  unresolved: boolean
  widget?: string | null
  showIf?: string
}
export interface MessageBlock { kind: 'message'; text: string; unresolved: boolean; fallbackLang?: string }
export interface SectionBlock {
  kind: 'section'
  id?: string
  sharedOptions: OptionChoice[]
  sharedOptionsFallbackLang?: string
  items: ItemBlock[]
}
export type Block = ItemBlock | MessageBlock | SectionBlock
export interface RenderPage { id?: string; title?: string; blocks: Block[] }
export interface RenderModel { pages: RenderPage[] }

// Pick the best language for a content map and report which language was actually used:
// requested language -> the questionnaire's primary language -> the first language present.
function pick(
  content: Record<string, LangContent> | undefined, lang: string, primary: string,
): [LangContent | undefined, string | undefined] {
  if (!content) return [undefined, undefined]
  if (content[lang]) return [content[lang], lang]
  if (content[primary]) return [content[primary], primary]
  const first = Object.keys(content)[0]
  return first !== undefined ? [content[first], first] : [undefined, undefined]
}

// When a piece of text was shown in a language other than the one requested, return that
// language code (so the UI can flag it as a fallback); otherwise undefined.
function fallback(used: string | undefined, requested: string): string | undefined {
  return used && used !== requested ? used : undefined
}

function optionsOf(
  option: ResolvedOption | undefined, lang: string, primary: string,
): [OptionChoice[], string | undefined] {
  const [c, used] = pick(option?.content, lang, primary)
  if (!c?.options) return [[], undefined]
  const choices = c.options.map((o) => ({
    index: o.index,
    text: o.text ?? '',
    value: option?.options?.find((v) => v.index === o.index)?.value,
  }))
  return [choices, used]
}

const CHOICE_M = new Set(['nominal', 'ordinal', 'interval', 'ratio'])
const NUMBER_M = new Set(['ratio', 'interval'])
const TEXT_M = new Set(['nominal', 'interval', 'ratio'])

/** design/05a §13 widget table, mirrored locally for export. Null for undefined combos. */
function deriveWidget(option: ResolvedOption | undefined): string | null {
  if (!option) return null
  const i = option.input_data_type
  const m = option.measurement_type ?? ''
  const s = option.selection
  if (i === 'choice' && CHOICE_M.has(m) && s === 'single') return `choice.${m}.single`
  if (i === 'choice' && m === 'nominal' && s === 'multiple') return 'choice.nominal.multiple'
  if (i === 'number' && NUMBER_M.has(m)) return `number.${m}`
  if (i === 'text' && TEXT_M.has(m)) return `text.${m}`
  return null
}

export function buildRenderModel(def: ResolvedDefinition, lang: string): RenderModel {
  const primary = def.metadata.language ?? 'en'
  let counter = 0

  function item(el: DefElement, sharedOption?: ResolvedOption): ItemBlock {
    counter += 1
    const prompt = el.question?.prompt
    const [stemC, stemLang] = pick(prompt?.content, lang, primary)
    const [ctxC, ctxLang] = pick(el.question?.context?.content, lang, primary)
    const [insC, insLang] = pick(el.question?.instruction?.content, lang, primary)
    const option = el.option ?? sharedOption
    const [options, optLang] = optionsOf(option, lang, primary)
    return {
      kind: 'item',
      number: counter,
      stem: stemC?.text ?? '',
      stemFallbackLang: fallback(stemLang, lang),
      context: ctxC?.text,
      contextFallbackLang: ctxC?.text ? fallback(ctxLang, lang) : undefined,
      instruction: insC?.text,
      instructionFallbackLang: insC?.text ? fallback(insLang, lang) : undefined,
      required: el.required ?? false,
      options,
      optionsFallbackLang: options.length ? fallback(optLang, lang) : undefined,
      dimension: prompt?.dimension,
      reversed: prompt?.reversed,
      subscales: prompt?.subscales,
      unresolved: prompt?._unresolved === true,
      widget: deriveWidget(option),
      showIf: el.show_if,
    }
  }

  function block(el: DefElement): Block {
    // In Schema-2 only a Section carries a nested elements[] array (matrix or grouped items).
    if (el.elements) {
      // Section (matrix): shared option once, child items beneath
      const [sharedOptions, sharedLang] = optionsOf(el.shared_option, lang, primary)
      return {
        kind: 'section',
        id: el.id,
        sharedOptions,
        sharedOptionsFallbackLang: sharedOptions.length ? fallback(sharedLang, lang) : undefined,
        items: el.elements.map((child) => item(child, el.shared_option)),
      }
    }
    if (el.question) return item(el)
    // message (has content, no question)
    const [c, msgLang] = pick(el.content, lang, primary)
    return {
      kind: 'message',
      text: c?.text ?? '',
      unresolved: el._unresolved === true,
      fallbackLang: c?.text ? fallback(msgLang, lang) : undefined,
    }
  }

  const pages: RenderPage[] = (def.pages ?? []).map((p: DefPage) => ({
    id: p.id,
    title: p.title,
    blocks: (p.elements ?? []).map(block),
  }))
  return { pages }
}

import {
  deriveWidget, mergeOptions, isSection, isMessage, RenderError,
  type ItemElement, type SectionElement, type MessageElement,
  type RuntimeElement, type OptionEntity, type MergedChoice,
} from '@behaverse/questionnaire-renderer'

export interface ItemView {
  id: string
  prompt: string
  context?: string
  instruction?: string
  widget: string | null
  choices: MergedChoice[]
  choicesError?: string
  required: boolean
  show_if?: string
  option: OptionEntity
}

export function itemView(item: ItemElement, locale: string, fallbackId: string): ItemView {
  const q = item.question
  const prompt = q.prompt?.content?.[locale]?.text ?? ''
  const context = q.context?.content?.[locale]?.text
  const instruction = q.instruction?.content?.[locale]?.text
  const option = item.option
  const widget = deriveWidget(option)
  let choices: MergedChoice[] = []
  let choicesError: string | undefined
  if (widget && widget.startsWith('choice')) {
    try { choices = mergeOptions(option, locale) }
    catch (e) { if (!(e instanceof RenderError)) throw e; choicesError = e.message }
  }
  return {
    id: item.id ?? fallbackId,
    prompt, context, instruction,
    widget, choices, choicesError,
    required: Boolean(item.required),
    show_if: item.show_if,
    option,
  }
}

export interface FlatEntry {
  item?: ItemElement
  message?: MessageElement
  sectionTitle?: string
}

/** Depth-first flatten: sections contribute their title to each child entry, and their
 *  `shared_option` fills in items that don't carry their own `option`. */
export function flattenElements(
  elements: RuntimeElement[],
  sharedOption?: OptionEntity,
  sectionTitle?: string,
): FlatEntry[] {
  const out: FlatEntry[] = []
  for (const el of elements) {
    if (isSection(el)) {
      const sec = el as SectionElement
      out.push(...flattenElements(sec.elements, sec.shared_option ?? sharedOption, sec.title ?? sectionTitle))
    } else if (typeof el === 'object' && el !== null && 'question' in el) {
      const item = el as ItemElement
      const withOption = item.option ? item : ({ ...item, option: sharedOption } as ItemElement)
      out.push({ item: withOption, sectionTitle })
    } else if (isMessage(el)) {
      out.push({ message: el as MessageElement, sectionTitle })
    }
  }
  return out
}

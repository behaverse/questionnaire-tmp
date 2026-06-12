import { RenderError, type MergedChoice, type OptionEntity } from './types'

export function mergeOptions(option: OptionEntity, locale: string): MergedChoice[] {
  const structural = option.options ?? []
  if (structural.length === 0) return []
  const texts = option.content?.[locale]?.options
  if (!texts) throw new RenderError(`option ${option.id ?? '<inline>'}: no '${locale}' choice texts`)
  const byIndex = new Map(texts.map((t) => [t.index, t.text]))
  return structural.map(({ index, value }) => {
    const text = byIndex.get(index)
    if (text === undefined) throw new RenderError(`option ${option.id ?? '<inline>'}: no '${locale}' text for choice index ${index}`)
    return { index, value, text }
  })
}

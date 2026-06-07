import type { RenderModel, ItemBlock as ItemT, OptionChoice } from '../definition/renderModel'
import { Badge } from '../components/Badge'
import { Markdown } from '../components/Markdown'
import { languageLabel } from '../lib/labels'

// Flags a piece of content that is shown in a different language than the one selected,
// because no translation exists in the selected language (a graceful fallback, not an error).
function FallbackTag({ lang }: { lang?: string }) {
  if (!lang) return null
  return (
    <span
      title={`Shown in ${languageLabel(lang)} — no translation in the selected language`}
      className="ml-1.5 inline-block rounded bg-amber-100/70 px-1 py-px align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-700"
    >
      {lang}
    </span>
  )
}

function Options({ options, fallbackLang }: { options: OptionChoice[]; fallbackLang?: string }) {
  if (options.length === 0) return null
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      <ol className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <li
            key={o.index}
            className="rounded-md border border-rule bg-paper-sunken px-2.5 py-1 text-xs text-ink-soft"
          >
            {o.text || `(${o.index})`}
          </li>
        ))}
      </ol>
      <FallbackTag lang={fallbackLang} />
    </div>
  )
}

function Item({ item, hideOptions = false }: { item: ItemT; hideOptions?: boolean }) {
  if (item.unresolved) {
    return (
      <div className="flex items-baseline gap-3 py-3 text-sm text-ink-faint">
        <span className="font-mono text-xs tabular-nums">{item.number}.</span>
        <span className="italic">content unavailable</span>
      </div>
    )
  }
  // Order within an item: context (framing) -> instruction (how to respond) -> prompt (the question).
  return (
    <div className="flex gap-3 py-3.5">
      <span className="pt-0.5 font-mono text-xs tabular-nums text-ink-faint">{item.number}.</span>
      <div className="min-w-0 flex-1 space-y-1">
        {item.context && (
          <div className="text-sm italic text-ink-faint">
            <Markdown>{item.context}</Markdown>
            <FallbackTag lang={item.contextFallbackLang} />
          </div>
        )}
        {item.instruction && (
          <div className="text-sm text-ink-soft">
            <Markdown>{item.instruction}</Markdown>
            <FallbackTag lang={item.instructionFallbackLang} />
          </div>
        )}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[15px] leading-relaxed text-ink">
            <Markdown>{item.stem}</Markdown>
          </span>
          <FallbackTag lang={item.stemFallbackLang} />
          {item.required && <Badge tone="warn">required</Badge>}
          {item.reversed && <Badge>reversed</Badge>}
        </div>
        {!hideOptions && <Options options={item.options} fallbackLang={item.optionsFallbackLang} />}
      </div>
    </div>
  )
}

export function ItemsBlock({ model }: { model: RenderModel }) {
  return (
    <div className="space-y-9">
      {model.pages.map((page, pi) => (
        <section key={page.id ?? pi}>
          {page.title && (
            <h3 className="mb-2 border-b border-rule pb-2 font-serif text-[17px] font-semibold text-ink">
              {page.title}
            </h3>
          )}
          <div className="divide-y divide-rule-soft">
            {page.blocks.map((block, bi) => {
              if (block.kind === 'message') {
                return block.unresolved
                  ? <p key={bi} className="py-3 text-sm italic text-ink-faint">content unavailable</p>
                  : (
                    <div key={bi} className="py-3 text-sm leading-relaxed text-ink-soft">
                      <Markdown>{block.text}</Markdown>
                      <FallbackTag lang={block.fallbackLang} />
                    </div>
                  )
              }
              if (block.kind === 'item') return <Item key={bi} item={block} />
              // section (matrix): shared scale shown once
              return (
                <div key={bi} className="py-3">
                  {block.sharedOptions.length > 0 && (
                    <div className="mb-1 ml-7">
                      <Options options={block.sharedOptions} fallbackLang={block.sharedOptionsFallbackLang} />
                    </div>
                  )}
                  <div className="divide-y divide-rule-soft">
                    {block.items.map((it, ii) => <Item key={ii} item={it} hideOptions />)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

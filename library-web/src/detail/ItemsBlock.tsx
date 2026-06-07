import type { RenderModel, ItemBlock as ItemT, OptionChoice } from '../definition/renderModel'
import { Badge } from '../components/Badge'

function Options({ options }: { options: OptionChoice[] }) {
  if (options.length === 0) return null
  return (
    <ol className="mt-2.5 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <li
          key={o.index}
          className="rounded-md border border-rule bg-paper-sunken px-2.5 py-1 text-xs text-ink-soft"
        >
          {o.text || `(${o.index})`}
        </li>
      ))}
    </ol>
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
  return (
    <div className="py-3.5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs tabular-nums text-ink-faint">{item.number}.</span>
        <p className="text-[15px] leading-relaxed text-ink">{item.stem}</p>
        {item.required && <Badge tone="warn">required</Badge>}
        {item.reversed && <Badge>reversed</Badge>}
      </div>
      {item.context && <p className="ml-7 mt-1 text-sm italic text-ink-faint">{item.context}</p>}
      {item.instruction && <p className="ml-7 mt-1 text-sm text-ink-soft">{item.instruction}</p>}
      {!hideOptions && <div className="ml-7"><Options options={item.options} /></div>}
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
                  : <p key={bi} className="py-3 text-sm leading-relaxed text-ink-soft">{block.text}</p>
              }
              if (block.kind === 'item') return <Item key={bi} item={block} />
              // section (matrix): shared scale shown once
              return (
                <div key={bi} className="py-3">
                  {block.sharedOptions.length > 0 && (
                    <div className="mb-1 ml-7"><Options options={block.sharedOptions} /></div>
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

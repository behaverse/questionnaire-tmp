import type { RenderModel, ItemBlock as ItemT, OptionChoice } from '../definition/renderModel'
import { Badge } from '../components/Badge'

function Options({ options }: { options: OptionChoice[] }) {
  if (options.length === 0) return null
  return (
    <ol className="mt-2 flex flex-wrap gap-2">
      {options.map((o) => (
        <li key={o.index} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-600">
          {o.text || `(${o.index})`}
        </li>
      ))}
    </ol>
  )
}

function Item({ item, hideOptions = false }: { item: ItemT; hideOptions?: boolean }) {
  if (item.unresolved) {
    return (
      <div className="py-3 text-sm text-slate-400">
        <span className="mr-2 font-mono">{item.number}.</span>content unavailable
      </div>
    )
  }
  return (
    <div className="py-3">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-sm text-slate-400">{item.number}.</span>
        <p className="text-slate-800">{item.stem}</p>
        {item.required && <Badge tone="warn">required</Badge>}
        {item.reversed && <Badge>reversed</Badge>}
      </div>
      {item.context && <p className="ml-6 mt-1 text-sm italic text-slate-500">{item.context}</p>}
      {!hideOptions && <div className="ml-6"><Options options={item.options} /></div>}
    </div>
  )
}

export function ItemsBlock({ model }: { model: RenderModel }) {
  return (
    <div className="space-y-8">
      {model.pages.map((page, pi) => (
        <section key={page.id ?? pi}>
          {page.title && <h3 className="mb-2 border-b border-slate-200 pb-1 text-base font-semibold text-slate-700">{page.title}</h3>}
          <div className="divide-y divide-slate-100">
            {page.blocks.map((block, bi) => {
              if (block.kind === 'message') {
                return block.unresolved
                  ? <p key={bi} className="py-3 text-sm text-slate-400">content unavailable</p>
                  : <p key={bi} className="py-3 text-sm text-slate-600">{block.text}</p>
              }
              if (block.kind === 'item') return <Item key={bi} item={block} />
              // section (matrix): shared scale shown once
              return (
                <div key={bi} className="py-3">
                  {block.sharedOptions.length > 0 && (
                    <div className="mb-1 ml-6"><Options options={block.sharedOptions} /></div>
                  )}
                  <div className="divide-y divide-slate-100">
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

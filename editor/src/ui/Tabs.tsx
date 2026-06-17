import { useState, type ReactNode } from 'react'

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  return (
    <div>
      <div role="tablist" className="flex gap-1 border-b border-ed-border">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => setActive(t.id)}
            className={`-mb-px border-b-2 px-3 py-1.5 text-sm transition-colors ${
              active === t.id ? 'border-ed-accent font-medium text-ed-text' : 'border-transparent text-ed-muted hover:text-ed-text'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-3">{tabs.find((t) => t.id === active)?.content}</div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './Button'

type Item = { label: string; icon?: LucideIcon; title?: string; onClick: () => void }
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Menu({ label, icon, variant = 'secondary', items }:
  { label: string; icon?: LucideIcon; variant?: Variant; items: Item[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <Button variant={variant} icon={icon} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} ▾
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 min-w-[13rem] rounded-md border border-ed-border bg-ed-panel py-1 shadow-lg">
          {items.map((it) => (
            <button key={it.label} role="menuitem" title={it.title}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-ed-text hover:bg-ed-subtle"
              onClick={() => { setOpen(false); it.onClick() }}>
              {it.icon && <it.icon size={15} aria-hidden="true" className="text-ed-muted" />}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

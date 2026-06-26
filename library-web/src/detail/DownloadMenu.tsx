import { useEffect, useRef, useState } from 'react'

export interface DownloadMenuItem {
  /** Item label, e.g. 'JSON' / 'Markdown' / 'SurveyJS'. */
  label: string
  onSelect: () => void
}

/**
 * A small accessible "Download ▾" dropdown: a trigger button that reveals a menu of export
 * options. Closes on item select, Escape (returning focus to the trigger), and outside click.
 * Built locally because library-web has no shared menu component.
 */
export function DownloadMenu({ items }: { items: DownloadMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus() }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-sm font-medium text-paper shadow-card transition-colors hover:bg-accent"
      >
        <svg aria-hidden viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
          <path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Download
        <svg aria-hidden viewBox="0 0 16 16" fill="none" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1.5 min-w-[11rem] overflow-hidden rounded-lg border border-rule bg-paper-raised py-1 shadow-card"
        >
          {items.map((it) => (
            <button
              key={it.label}
              role="menuitem"
              type="button"
              onClick={() => { setOpen(false); it.onSelect() }}
              className="block w-full px-3.5 py-2 text-left text-sm text-ink transition-colors hover:bg-paper-sunken hover:text-accent focus:bg-paper-sunken focus:text-accent focus:outline-none"
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

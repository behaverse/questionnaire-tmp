import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Accessible modal shell shared by the editor's dialogs. Provides `role="dialog"` +
 * `aria-modal`, Escape-to-close, a Tab focus-trap, focus restore on close, and
 * backdrop-click-to-close. Wrap a dialog's panel content as `children`; `label` becomes the
 * dialog's accessible name. Respects a child's `autoFocus` (won't steal focus if a child
 * already has it).
 */
export function Modal({ label, onClose, children, panelClassName = 'w-[480px]', closeOnBackdrop = true }: {
  label: string
  onClose: () => void
  children: ReactNode
  panelClassName?: string
  closeOnBackdrop?: boolean
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  // keep the latest onClose without re-running the effect (which would re-grab focus)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const focusables = (): HTMLElement[] =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.getAttribute('aria-hidden') !== 'true' && !el.hidden)
        : []
    // Focus the first focusable (or the panel) on open — unless a child already self-focused
    // (e.g. an autoFocus search input).
    if (!panel?.contains(document.activeElement)) (focusables()[0] ?? panel)?.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
      } else if (e.key === 'Tab') {
        const f = focusables()
        if (f.length === 0) {
          e.preventDefault()
          panel?.focus()
          return
        }
        const first = f[0]
        const last = f[f.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || active === panel)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      prevFocus?.focus?.()
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`rounded-lg bg-ed-panel shadow-xl outline-none ${panelClassName}`}
      >
        {children}
      </div>
    </div>
  )
}

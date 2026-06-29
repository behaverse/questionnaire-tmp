import { useEffect, useRef, useState } from 'react'
import { t } from './strings'

export type CommentDraft = { comment: string; stars: number | null }

/**
 * Per-question QA comment widget (owner request #5/#6). A fixed icon button that opens a
 * modal capturing a free-text comment + an optional 1–5 star rating. Presentational: the
 * caller supplies the page/item context and the `onSubmit` transport.
 */
export function CommentWidget({ locale, onSubmit }: { locale: string; onSubmit: (draft: CommentDraft) => Promise<boolean> }) {
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [stars, setStars] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canSubmit = comment.trim() !== '' || stars !== null

  function reset() {
    setComment(''); setStars(null); setSending(false); setSent(false)
  }
  function close() {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    setOpen(false); reset()
  }
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])
  useEffect(() => { if (open) dialogRef.current?.focus() }, [open])

  async function submit() {
    if (!canSubmit || sending) return
    setSending(true)
    await onSubmit({ comment: comment.trim(), stars })
    // Show a brief thank-you regardless (best-effort capture), then auto-close.
    setSent(true)
    closeTimer.current = setTimeout(close, 1400)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(locale, 'comment_button')}
        title={t(locale, 'comment_button')}
        className="qv-focusable fixed bottom-4 right-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-slate-300 bg-surface text-slate-500 shadow-md hover:text-slate-800"
      >
        <svg aria-hidden viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/50 px-4" onClick={close}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t(locale, 'comment_title')}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => { if (e.key === 'Escape') close() }}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-surface p-6 text-left text-slate-800 shadow-2xl"
      >
        {sent ? (
          <p role="status" className="py-2 text-center text-lg font-semibold">{t(locale, 'comment_thanks')}</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold">{t(locale, 'comment_title')}</h2>
            <p className="text-sm text-slate-500">{t(locale, 'comment_help')}</p>
            <textarea
              aria-label={t(locale, 'comment_placeholder')}
              placeholder={t(locale, 'comment_placeholder')}
              value={comment}
              maxLength={2000}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="qv-focusable w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800"
            />
            <fieldset>
              <legend className="mb-1 text-sm text-slate-500">{t(locale, 'comment_stars_label')}</legend>
              <div role="radiogroup" aria-label={t(locale, 'comment_stars_label')} className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={stars === n}
                    aria-label={`${n}`}
                    onClick={() => setStars((s) => (s === n ? null : n))}
                    className="qv-focusable text-2xl leading-none text-amber-400"
                  >
                    <span aria-hidden>{stars !== null && n <= stars ? '★' : '☆'}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button type="button" onClick={close} className="qv-focusable rounded-lg px-4 py-2 text-slate-500 hover:text-slate-800">
                {t(locale, 'comment_cancel')}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit || sending}
                className="qv-button qv-focusable px-5 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t(locale, 'comment_submit')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

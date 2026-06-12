import { t } from './strings'

export function ProgressBar({ locale, current, total, indeterminate = false }: { locale: string; current: number; total: number; indeterminate?: boolean }) {
  // F4: under branching/skip logic the remaining total is unknown — show a bare counter, no misleading bar/percentage.
  if (indeterminate) {
    const label = t(locale, 'progress_counter', { i: current })
    return (
      <div className="fixed inset-x-0 top-0">
        <div role="progressbar" aria-valuemin={0} aria-valuenow={current} aria-label={label} className="h-1 bg-slate-200" />
        <p aria-live="polite" className="px-4 pt-2 text-right text-xs text-slate-400">{label}</p>
      </div>
    )
  }
  const label = t(locale, 'progress', { i: current, n: total })
  return (
    <div className="fixed inset-x-0 top-0">
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} aria-label={label} className="h-1 bg-slate-200">
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${(current / total) * 100}%` }} />
      </div>
      <p aria-live="polite" className="px-4 pt-2 text-right text-xs text-slate-400">{label}</p>
    </div>
  )
}

import { t } from './strings'
export function LocaleSwitcher({ locale, available, onSwitch }: { locale: string; available: string[]; onSwitch: (l: string) => void }) {
  if (available.length <= 1) return null
  return (
    <label className="fixed right-4 top-3 z-10 text-sm">
      <span className="sr-only">{t(locale, 'language')}</span>
      <select aria-label={t(locale, 'language')} value={locale} onChange={(e) => onSwitch(e.target.value)}
        className="qv-focusable rounded border border-slate-300 bg-surface px-2 py-1">
        {available.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
      </select>
    </label>
  )
}

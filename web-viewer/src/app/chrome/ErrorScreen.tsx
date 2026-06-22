import { t } from './strings'
import type { MintErr } from '../bootstrap'

// auth_required is intercepted by App.tsx (→ LoginView) and never reaches ErrorScreen
type ErrorKind = Exclude<MintErr['kind'], 'auth_required'>

const TITLE_KEY = { invalid_link: 'error_invalid_link_title', not_open: 'error_not_open_title', closed: 'error_closed_title', failed: 'error_failed_title' } as const
const BODY_KEY = { invalid_link: 'error_invalid_link_body', not_open: 'error_not_open_body', closed: 'error_closed_body', failed: 'error_failed_body' } as const

export function ErrorScreen({ locale, kind, code, onRetry }: { locale: string; kind: ErrorKind; code: string; onRetry: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">{t(locale, TITLE_KEY[kind])}</h1>
        <p className="text-slate-600">{t(locale, BODY_KEY[kind])}</p>
        {kind === 'failed' && (
          <button onClick={onRetry} className="qv-button qv-focusable px-5 py-2.5">
            {t(locale, 'retry')}
          </button>
        )}
        <p className="text-xs text-slate-400">{code}</p>
      </div>
    </main>
  )
}

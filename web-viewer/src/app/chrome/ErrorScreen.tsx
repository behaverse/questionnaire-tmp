import { t } from './strings'
import type { MintErr } from '../bootstrap'

// auth_required is intercepted by App.tsx (→ LoginView) and never reaches ErrorScreen
type ErrorKind = Exclude<MintErr['kind'], 'auth_required'>

const TITLE_KEY = { invalid_link: 'error_invalid_link_title', not_open: 'error_not_open_title', closed: 'error_closed_title', failed: 'error_failed_title', invite_invalid: 'error_invite_invalid_title' } as const
const BODY_KEY = { invalid_link: 'error_invalid_link_body', not_open: 'error_not_open_body', closed: 'error_closed_body', failed: 'error_failed_body', invite_invalid: 'error_invite_invalid_body' } as const

export function ErrorScreen({ locale, kind, code, onRetry, onStartFresh }: { locale: string; kind: ErrorKind; code: string; onRetry: () => void; onStartFresh?: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">{t(locale, TITLE_KEY[kind])}</h1>
        <p className="text-slate-600">{t(locale, BODY_KEY[kind])}</p>
        {kind === 'failed' && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onRetry} className="qv-button qv-focusable px-5 py-2.5">
              {t(locale, 'retry')}
            </button>
            {/* a failed resume loops on retry; offer an escape that clears the saved session + starts over */}
            {code === 'resume_unreachable' && onStartFresh && (
              <button onClick={onStartFresh} className="qv-focusable rounded-lg border border-slate-300 px-5 py-2.5 font-medium text-slate-700">
                {t(locale, 'start_fresh')}
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-slate-400">{code}</p>
      </div>
    </main>
  )
}

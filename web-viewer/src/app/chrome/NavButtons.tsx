import { t } from './strings'

export function NavButtons({ locale, canBack, onBack, onNext }: { locale: string; canBack: boolean; onBack: () => void; onNext: () => void }) {
  return (
    <div className="mt-10 flex items-center gap-4">
      {canBack && (
        <button onClick={onBack} className="qv-focusable rounded-lg px-4 py-2.5 text-slate-500 hover:text-slate-800">
          {t(locale, 'back')}
        </button>
      )}
      <button onClick={onNext} className="qv-button qv-focusable px-6 py-2.5 text-lg hover:opacity-90">
        {t(locale, 'next')}
      </button>
      <span className="hidden sm:inline text-xs text-slate-400">{t(locale, 'enter_hint')}</span>
    </div>
  )
}

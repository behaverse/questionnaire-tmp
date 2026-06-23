import { RichText } from '../../renderer/RichText'
import { t } from './strings'

type Props = { text: string; onAccept: () => void; onDecline: () => void; locale: string }

export function ConsentScreen({ text, onAccept, onDecline, locale }: Props) {
  return (
    <main className="min-h-screen grid place-items-center px-6 font-theme">
      <div className="qv-step-enter w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t(locale, 'consent_title')}</h1>
        <div className="prose prose-sm max-w-none text-zinc-700"><RichText>{text}</RichText></div>
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button onClick={onAccept} className="qv-button qv-focusable px-5 py-2.5">{t(locale, 'consent_agree')}</button>
          <button onClick={onDecline} className="rounded-full px-5 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100">{t(locale, 'consent_decline')}</button>
        </div>
      </div>
    </main>
  )
}

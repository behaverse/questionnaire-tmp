import type { ReactNode } from 'react'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' }) {
  const tones = {
    neutral: 'bg-paper-sunken text-ink-soft ring-1 ring-inset ring-rule',
    accent: 'bg-accent/[0.07] text-accent-fg ring-1 ring-inset ring-accent/20',
    warn: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5 tracking-[0.01em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

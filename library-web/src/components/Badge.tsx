import type { ReactNode } from 'react'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' }) {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700',
    accent: 'bg-blue-50 text-accent-fg',
    warn: 'bg-amber-100 text-amber-800',
  }
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

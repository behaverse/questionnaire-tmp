import type { EvalValue } from '../../logic/types'
import type { DisplayScore } from '../../scoring/display'

type Props = {
  title: string
  scores: DisplayScore[]
  score: (id: string) => EvalValue
}

function format(v: EvalValue): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}

export function ScoreSummary({ title, scores, score }: Props) {
  if (scores.length === 0) return null
  return (
    <section className="qv-card mt-8 w-full max-w-md text-left" aria-label={title}>
      <h2 className="qv-prompt mb-4 text-xl">{title}</h2>
      <dl className="space-y-2">
        {scores.map((s) => (
          <div key={s.id} className="flex items-baseline justify-between gap-4">
            <dt className="qv-secondary">{s.name}</dt>
            <dd className="font-semibold" style={{ color: 'var(--qv-prompt-color)' }}>{format(score(s.id))}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

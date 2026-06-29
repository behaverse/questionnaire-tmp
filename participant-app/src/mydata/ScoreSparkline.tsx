import type { ScoreSeries } from './progression'

const W = 280, H = 64, PAD = 10

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** A dependency-free SVG line chart of one named score over time, with a visually-hidden table. */
export function ScoreSparkline({ series }: { series: ScoreSeries }) {
  const pts = series.points
  if (pts.length < 2) return null
  const values = pts.map((p) => p.value)
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const xy = pts.map((p, i) => {
    const x = PAD + (i * (W - 2 * PAD)) / (pts.length - 1)
    const y = H - PAD - ((p.value - min) / span) * (H - 2 * PAD)   // higher value sits higher
    return [x, y] as const
  })
  const latest = pts[pts.length - 1].value

  return (
    <figure className="m-0 rounded-xl border border-zinc-200/80 bg-white p-4">
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-zinc-800">{series.name}</span>
        <span className="text-sm text-zinc-500">latest <span className="font-semibold tabular-nums text-zinc-900">{latest}</span></span>
      </figcaption>
      <svg role="img" aria-label={`${series.name} over time`} viewBox={`0 0 ${W} ${H}`} className="h-16 w-full">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          className="text-zinc-900" points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} />
        {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" className="fill-zinc-900" />)}
      </svg>
      <table className="sr-only">
        <caption>{series.name} over time</caption>
        <thead><tr><th>Date</th><th>Score</th></tr></thead>
        <tbody>
          {pts.map((p, i) => <tr key={i}><td>{fmtDate(p.date)}</td><td>{p.value}</td></tr>)}
        </tbody>
      </table>
    </figure>
  )
}

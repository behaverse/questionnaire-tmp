import { useEffect, useRef, useState } from 'react'
import type { IdCatalogue } from './ids'
import { unknownRefs } from './refcheck'
import type { LogicEvaluator } from './types'

const OPS = ['==', '!=', '<', '<=', '>', '>=', 'in'] as const

export function ExpressionInput({
  value, onChange, catalogue, evaluator,
}: {
  value: string
  onChange: (v: string) => void
  catalogue: IdCatalogue
  evaluator: LogicEvaluator | null
}) {
  const [open, setOpen] = useState(false)
  const [qid, setQid] = useState(catalogue.questionIds[0] ?? '')
  const [op, setOp] = useState<(typeof OPS)[number]>('==')
  const [val, setVal] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Sync value via DOM property (not inner text) so the textarea has no text child nodes.
  // This ensures getByText queries don't inadvertently match the expression being typed.
  useEffect(() => {
    if (taRef.current && taRef.current.value !== value) taRef.current.value = value
  }, [value])

  const error = evaluator && value.trim() ? evaluator.check(value) : null
  const unknown = value.trim() ? unknownRefs(value, catalogue) : []

  const append = () => {
    const snippet = `${qid} ${op} ${val}`.trim()
    onChange(value ? `${value} && ${snippet}` : snippet)
    setOpen(false); setVal('')
  }

  return (
    <div className="space-y-1">
      <textarea
        ref={taRef}
        aria-label="Expression"
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded border border-slate-300 px-2 py-1 font-mono text-sm"
        placeholder="e.g. q_age >= 18 && q_consent == 'yes'"
      />
      <div className="flex items-center gap-2 text-xs">
        {error ? <span className="text-red-600">✗ {error}</span>
          : value.trim() ? <span className="text-green-700">✓ valid</span>
          : <span className="text-slate-400">empty</span>}
        <button type="button" onClick={() => setOpen((o) => !o)}
          className="ml-auto rounded border border-slate-300 px-1.5 py-0.5 text-slate-600 hover:bg-slate-50">
          + insert condition
        </button>
      </div>
      {unknown.length > 0 && (
        <p className="text-xs text-amber-600">⚠ unknown id{unknown.length > 1 ? 's' : ''}: {unknown.join(', ')}</p>
      )}
      {open && (
        <div className="flex flex-wrap items-center gap-1 rounded border border-slate-200 bg-slate-50 p-2 text-xs">
          <select aria-label="Insert question" value={qid} onChange={(e) => setQid(e.target.value)}
            className="rounded border border-slate-300 px-1 py-0.5">
            {catalogue.questionIds.map((id) => <option key={id} value={id}>{id}</option>)}
          </select>
          <select aria-label="Insert operator" value={op} onChange={(e) => setOp(e.target.value as (typeof OPS)[number])}
            className="rounded border border-slate-300 px-1 py-0.5">
            {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input aria-label="Insert value" value={val} onChange={(e) => setVal(e.target.value)}
            className="w-20 rounded border border-slate-300 px-1 py-0.5" placeholder="value" />
          <button type="button" onClick={append}
            className="rounded bg-slate-700 px-2 py-0.5 text-white hover:bg-slate-800">Append</button>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useEditorStore } from '../state/store'
import { updateScores } from '../model/tree'
import type { Score } from '../model/types'
import { newScore, summarizeScore, validateScore } from './scoreOps'
import { ScoreEditor } from './ScoreEditor'

export function ScoringPanel() {
  const { model, applyEdit } = useEditorStore()
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  if (!model) return null
  const scores = (model.scores ?? []) as Score[]
  const attention = scores.filter((s) => validateScore(s, scores).errors.some((e) => e.level === 'error')).length

  const write = (next: Score[]) => applyEdit((m) => updateScores(m, next))
  const add = () => { const next = [...scores, newScore(scores)]; write(next); setOpenIdx(next.length - 1) }
  const edit = (i: number, score: Score) => write(scores.map((s, j) => (j === i ? score : s)))
  const del = (i: number) => { write(scores.filter((_, j) => j !== i)); setOpenIdx(null) }

  return (
    <div className="space-y-2 border-t border-ed-border pt-3">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold text-ed-muted">Scores</h4>
        {attention > 0 && <span className="text-[11px] text-red-600">{attention} need{attention === 1 ? 's' : ''} attention</span>}
        <button type="button" aria-label="Add score" onClick={add}
          className="ml-auto rounded border border-ed-border px-2 py-0.5 text-xs text-ed-muted hover:bg-ed-subtle">+ Add</button>
      </div>
      {scores.length === 0 && <p className="text-[11px] text-ed-muted">No scores yet.</p>}
      <ul className="space-y-1">
        {scores.map((s, i) => (
          <li key={i}>
            <button type="button" aria-label={`Edit score ${i + 1}`} onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="block w-full truncate rounded px-1 py-0.5 text-left font-mono text-xs hover:bg-ed-subtle">
              {summarizeScore(s)}
            </button>
            {openIdx === i && (
              <div className="mt-1">
                <ScoreEditor score={s} allScores={scores} onChange={(score) => edit(i, score)} onDelete={() => del(i)} />
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-ed-muted">Scores are computed by the deployed viewer — not shown live in this preview.</p>
    </div>
  )
}

import { useEditorStore } from '../state/store'
import type { Score } from '../model/types'
import { validateScore } from './scoreOps'

export function ScoreEditor({ score, allScores, onChange, onDelete }: {
  score: Score
  allScores: Score[]
  onChange: (score: Score) => void
  onDelete: () => void
}) {
  const openPicker = useEditorStore((s) => s.openPicker)
  const issues = validateScore(score, allScores).errors

  return (
    <div className="space-y-2 rounded border border-ed-border p-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-ed-muted">Id
          <input aria-label="Score id" value={score.id} onChange={(e) => onChange({ ...score, id: e.target.value })}
            className="ml-1 rounded border border-ed-border px-1 py-0.5 font-mono text-xs" />
        </label>
        <button type="button" aria-label="Delete score" onClick={onDelete}
          className="ml-auto rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50">Delete</button>
      </div>

      <label className="block text-xs font-medium text-ed-muted">Scorer
        <div className="mt-0.5 flex gap-2">
          <input aria-label="Scorer ref" value={score.scorer} onChange={(e) => onChange({ ...score, scorer: e.target.value })}
            placeholder="scr_phq9@v26.0602"
            className="flex-1 rounded border border-ed-border px-2 py-1 font-mono text-xs" />
          <button type="button" onClick={() => openPicker('scorer', (ref) => onChange({ ...score, scorer: ref }))}
            className="rounded border border-ed-border px-2 py-1 text-xs text-ed-muted hover:bg-ed-subtle">Pick from Library</button>
        </div>
      </label>

      <label className="block text-xs font-medium text-ed-muted">Path (JSON Pointer)
        <input aria-label="Score path" value={score.path} onChange={(e) => onChange({ ...score, path: e.target.value })}
          placeholder="/total"
          className="mt-0.5 w-full rounded border border-ed-border px-2 py-1 font-mono text-xs" />
      </label>

      <label className="block text-xs font-medium text-ed-muted">Name (optional)
        <input aria-label="Score name" value={score.name ?? ''} onChange={(e) => onChange({ ...score, name: e.target.value || undefined })}
          className="mt-0.5 w-full rounded border border-ed-border px-2 py-1 text-sm" />
      </label>
      <label className="block text-xs font-medium text-ed-muted">Description (optional)
        <input aria-label="Score description" value={score.description ?? ''} onChange={(e) => onChange({ ...score, description: e.target.value || undefined })}
          className="mt-0.5 w-full rounded border border-ed-border px-2 py-1 text-sm" />
      </label>

      {issues.length > 0 && (
        <ul className="space-y-0.5 text-xs">
          {issues.map((it, i) => (
            <li key={i} className={it.level === 'error' ? 'text-red-600' : 'text-amber-600'}>
              {it.level === 'error' ? '✗' : '⚠'} {it.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
             className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
    </label>
  )
}

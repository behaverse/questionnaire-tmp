export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ed-muted">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
             className="w-full rounded-md border border-ed-border bg-ed-panel px-2.5 py-1.5 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent" />
    </label>
  )
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-ed-text">
      <input type="checkbox" aria-label={label} checked={checked} onChange={(e) => onChange(e.target.checked)}
             className="accent-ed-accent" />
      {label}
    </label>
  )
}

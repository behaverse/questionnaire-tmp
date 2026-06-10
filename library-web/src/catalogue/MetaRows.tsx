export function MetaRows({ rows }: { rows: { label: string; value: string }[] }) {
  if (rows.length === 0) return null
  return (
    <dl className="mt-3 space-y-1 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-3">
          <dt className="w-[5.5rem] shrink-0 pt-px font-sans text-xs font-normal text-ink-faint/80">{row.label}</dt>
          <dd className="text-ink-soft">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

type Props = { label: string; placeholder?: string; value: unknown; onChange: (value: string) => void }

export function TextInput({ label, placeholder, value, onChange }: Props) {
  return (
    <input
      type="text"
      aria-label={label}
      placeholder={placeholder}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-md rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-primary focus:outline-none"
    />
  )
}

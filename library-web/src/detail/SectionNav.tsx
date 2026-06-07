export interface NavItem { id: string; label: string }

export function SectionNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="sticky top-6 hidden w-44 shrink-0 lg:block">
      <ul className="space-y-1 text-sm">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className="text-slate-500 hover:text-accent">{i.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

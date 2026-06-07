export interface NavItem { id: string; label: string }

export function SectionNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="sticky top-24 hidden h-fit w-44 shrink-0 lg:block">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-faint">On this page</p>
      <ul className="space-y-0.5 border-l border-rule">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-ink-faint transition-colors hover:border-accent hover:text-accent"
            >
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

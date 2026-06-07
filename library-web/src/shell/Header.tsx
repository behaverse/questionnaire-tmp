import { Link } from 'react-router-dom'
import { BASE_URL } from '../api/client'

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          to="/"
          className="group flex items-baseline gap-2.5 rounded-sm text-ink transition-colors hover:text-accent"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 -translate-y-px place-items-center rounded-[7px] bg-ink font-serif text-[15px] font-semibold leading-none text-paper transition-colors group-hover:bg-accent"
          >
            Q
          </span>
          <span className="font-serif text-[19px] font-semibold tracking-tightish">
            Questionnaire Library
          </span>
        </Link>
        <a
          className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-accent hover:underline"
          href={`${BASE_URL}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          API docs
        </a>
      </div>
    </header>
  )
}

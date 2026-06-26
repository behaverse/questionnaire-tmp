import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-2xl px-6 py-24 text-center focus:outline-none">
      <p className="font-mono text-[13px] uppercase tracking-[0.18em] text-ink-faint">404</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-ink">Not found</h1>
      <p className="mt-3 leading-relaxed text-ink-soft">That page or questionnaire does not exist.</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        <span aria-hidden>←</span> Back to the catalogue
      </Link>
    </main>
  )
}

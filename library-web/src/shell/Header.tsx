import { Link } from 'react-router-dom'
import { BASE_URL } from '../api/client'

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
          Questionnaire Library
        </Link>
        <a className="text-sm text-accent hover:underline" href={`${BASE_URL}/docs`} target="_blank" rel="noreferrer">
          API docs
        </a>
      </div>
    </header>
  )
}

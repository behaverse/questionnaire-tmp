import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl p-10 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Not found</h1>
      <p className="mt-2 text-slate-600">That page or questionnaire does not exist.</p>
      <Link to="/" className="mt-4 inline-block text-accent hover:underline">Back to the catalogue</Link>
    </main>
  )
}

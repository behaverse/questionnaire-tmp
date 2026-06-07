import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl p-10 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-slate-600">{this.state.error.message}</p>
          <button className="mt-4 rounded bg-accent px-4 py-2 text-white" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

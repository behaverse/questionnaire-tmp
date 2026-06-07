import { Component, type ReactNode } from 'react'

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1 className="font-serif text-2xl font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2.5 text-ink-soft">{this.state.error.message}</p>
          <button
            className="mt-5 inline-flex items-center rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper shadow-card transition-colors hover:bg-accent"
            onClick={() => location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

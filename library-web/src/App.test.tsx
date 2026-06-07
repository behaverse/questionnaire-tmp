import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

function renderAt(path: string) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App shell', () => {
  it('renders the header wordmark on the catalogue route', () => {
    renderAt('/')
    expect(screen.getByRole('banner')).toHaveTextContent(/Questionnaire Library/i)
  })

  it('renders a not-found page for unknown routes', () => {
    renderAt('/totally/unknown')
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })
})

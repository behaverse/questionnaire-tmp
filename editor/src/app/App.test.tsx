import { render, screen } from '@testing-library/react'
import { App } from './App'

test('renders the editor heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /questionnaire editor/i })).toBeInTheDocument()
})

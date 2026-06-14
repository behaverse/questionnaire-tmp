import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StartScreen } from './StartScreen'

test('New creates an empty questionnaire', async () => {
  const onNew = vi.fn()
  render(<StartScreen onNew={onNew} onOpenFile={vi.fn()} onOpenLibrary={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: /new questionnaire/i }))
  expect(onNew).toHaveBeenCalled()
})

test('shows the three entry points', () => {
  render(<StartScreen onNew={vi.fn()} onOpenFile={vi.fn()} onOpenLibrary={vi.fn()} />)
  expect(screen.getByRole('button', { name: /new questionnaire/i })).toBeInTheDocument()
  expect(screen.getByText(/open file/i)).toBeInTheDocument()
  expect(screen.getByText(/open from library/i)).toBeInTheDocument()
})

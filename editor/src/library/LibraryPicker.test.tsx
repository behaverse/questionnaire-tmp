import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryPicker } from './LibraryPicker'

const client = {
  searchEntities: async () => ({ items: [{ id: 'pr_mood', version: 'v26.0609', title: null, entity_type: 'prompt' }], total: 1 }),
  fetchEntityBody: async () => ({ id: 'pr_mood', content: { en: { status: 'validated', text: 'How is your mood?' } } }),
}

test('search → select shows snippet → insert pins the ref', async () => {
  const onPick = vi.fn()
  render(<LibraryPicker etype="prompt" locale="en" onPick={onPick} onClose={() => {}} client={client} />)
  await userEvent.type(screen.getByLabelText(/search/i), 'mood')
  await waitFor(() => expect(screen.getByText('pr_mood')).toBeInTheDocument())
  await userEvent.click(screen.getByText('pr_mood'))
  await waitFor(() => expect(screen.getByText('How is your mood?')).toBeInTheDocument())
  await userEvent.click(screen.getByRole('button', { name: /insert/i }))
  expect(onPick).toHaveBeenCalledWith('pr_mood@v26.0609')
})

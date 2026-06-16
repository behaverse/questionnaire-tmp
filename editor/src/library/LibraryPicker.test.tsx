import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryPicker } from './LibraryPicker'

const client = {
  listEntities: async () => [
    { id: 'pr_mood', version: 'v26.0609', title: null, entity_type: 'prompt' },
    { id: 'pr_agreement_7', version: 'v26.0609', title: null, entity_type: 'prompt' },
  ],
  fetchEntityBody: async () => ({ id: 'pr_mood', content: { en: { status: 'validated', text: 'How is your mood?' } } }),
}

test('lists all entities on open (browse), then select → snippet → insert pins the ref', async () => {
  const onPick = vi.fn()
  render(<LibraryPicker etype="prompt" locale="en" onPick={onPick} onClose={() => {}} client={client} />)
  // browse list shows everything without typing
  await waitFor(() => expect(screen.getByText('pr_mood')).toBeInTheDocument())
  expect(screen.getByText('pr_agreement_7')).toBeInTheDocument()
  await userEvent.click(screen.getByText('pr_mood'))
  await waitFor(() => expect(screen.getByText('How is your mood?')).toBeInTheDocument())
  await userEvent.click(screen.getByRole('button', { name: /insert/i }))
  expect(onPick).toHaveBeenCalledWith('pr_mood@v26.0609')
})

test('the search field filters the loaded list by id substring (matches "agree")', async () => {
  render(<LibraryPicker etype="prompt" locale="en" onPick={() => {}} onClose={() => {}} client={client} />)
  await waitFor(() => expect(screen.getByText('pr_mood')).toBeInTheDocument())
  await userEvent.type(screen.getByLabelText(/search/i), 'agree')
  await waitFor(() => expect(screen.queryByText('pr_mood')).toBeNull())
  expect(screen.getByText('pr_agreement_7')).toBeInTheDocument()
})

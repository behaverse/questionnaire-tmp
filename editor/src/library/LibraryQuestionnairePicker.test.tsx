import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LibraryQuestionnairePicker } from './LibraryQuestionnairePicker'

describe('LibraryQuestionnairePicker', () => {
  it('searches and picks a questionnaire at its latest version', async () => {
    const search = vi.fn().mockResolvedValue([
      { id: 'qst_x_bisbas', version: 'v26.0606', title: 'BIS/BAS', instrument_id: 'inst_bisbas' },
    ])
    const onPick = vi.fn()
    render(<LibraryQuestionnairePicker onPick={onPick} onClose={() => {}} search={search} />)
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'bis' } })
    await waitFor(() => expect(search).toHaveBeenCalledWith('bis'))
    fireEvent.click(await screen.findByRole('button', { name: /qst_x_bisbas/i }))
    expect(onPick).toHaveBeenCalledWith('qst_x_bisbas', 'v26.0606')
  })

  it('shows the search-scope hint', () => {
    render(<LibraryQuestionnairePicker onPick={() => {}} onClose={() => {}} search={async () => []} />)
    expect(screen.getByText(/searches title & description/i)).toBeInTheDocument()
  })
})

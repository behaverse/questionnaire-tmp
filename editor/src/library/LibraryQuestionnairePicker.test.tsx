import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LibraryQuestionnairePicker } from './LibraryQuestionnairePicker'

const list = () => Promise.resolve([
  { id: 'qst_x_bisbas', version: 'v26.0606', title: 'Behavioral Approach/Inhibition Systems (BIS/BAS)', instrument_id: 'inst_bisbas' },
  { id: 'qst_phq9', version: 'v26.0609', title: 'Patient Health Questionnaire-9', instrument_id: 'inst_phq' },
])

describe('LibraryQuestionnairePicker', () => {
  it('browses the full catalogue on open and picks at the listed version', async () => {
    const onPick = vi.fn()
    render(<LibraryQuestionnairePicker onPick={onPick} onClose={() => {}} list={list} />)
    await waitFor(() => expect(screen.getByText(/Patient Health Questionnaire/)).toBeInTheDocument())
    fireEvent.click(await screen.findByRole('button', { name: /qst_x_bisbas/i }))
    expect(onPick).toHaveBeenCalledWith('qst_x_bisbas', 'v26.0606')
  })

  it('filters by a title substring like "BAS" (which server search misses)', async () => {
    render(<LibraryQuestionnairePicker onPick={() => {}} onClose={() => {}} list={list} />)
    await waitFor(() => expect(screen.getByText(/Patient Health Questionnaire/)).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'BAS' } })
    await waitFor(() => expect(screen.queryByText(/Patient Health Questionnaire/)).toBeNull())
    expect(screen.getByRole('button', { name: /qst_x_bisbas/i })).toBeInTheDocument()
  })
})

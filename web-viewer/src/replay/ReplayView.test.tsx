import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReplayView } from './ReplayView'
import { reconstruct } from './reconstruct'
import type { Runtime } from '../renderer/types'
import mini from '../fixtures/mini.json'
import type { BdmEvent } from '../app/events'

const runtime = mini as unknown as Runtime
const ev = (secs: number, verb: string, id?: string, ext?: Record<string, unknown>): BdmEvent => ({
  timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, secs)).toISOString(),
  actor: { objectType: 'bdm:Engine', id: 'e' }, verb,
  object: id ? { objectType: 'bdm:Trial', id } : { objectType: 'x', id: 's' },
  ...(ext ? { result: { extensions: ext } } : {}),
})

// mini it_1 is a choice; option index 2 → text "Several days"
const stream: BdmEvent[] = [
  ev(1, 'bdm:trial_started', 'trial_it_1'),
  ev(3, 'bdm:trial_ended', 'trial_it_1', { 'bdm:response_option_index': 2, 'bdm:response_numeric': 1, 'bdm:response_description': 'Several days' }),
  ev(5, 'bdm:submitted'),
]

describe('ReplayView', () => {
  it('renders the current step and shows the reconstructed answer after scrubbing past it', () => {
    render(<ReplayView runtime={runtime} timeline={reconstruct(stream)} cursorAt={() => null} />)
    // scrub to the end so it_1's answer is committed
    const scrubber = screen.getByRole('slider', { name: /timeline/i })
    fireEvent.change(scrubber, { target: { value: String(reconstruct(stream).durationMs) } })
    // the chosen option is rendered as checked (radiogroup for the mini item)
    const chosen = screen.getByRole('radio', { name: /Several days/i }) as HTMLInputElement
    expect(chosen.checked).toBe(true)
  })
  it('has play/pause + speed controls', () => {
    render(<ReplayView runtime={runtime} timeline={reconstruct(stream)} cursorAt={() => null} />)
    expect(screen.getByRole('button', { name: /play|pause/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /speed/i })).toBeInTheDocument()
  })
  it('renders a cursor dot when cursorAt returns a point', () => {
    render(<ReplayView runtime={runtime} timeline={reconstruct(stream)} cursorAt={() => ({ x: 10, y: 20 })} />)
    expect(document.getElementById('replay-cursor')).not.toBeNull()
  })
})

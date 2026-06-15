import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RuleEditor } from './RuleEditor'
import { makeFakeEvaluator } from './evaluator'
import type { LogicRule } from '../model/types'

const targets = { pageIds: ['p1', 'p2'], elementKeys: ['it_a', 'it_b'] }
const cat = { questionIds: ['q_x'], scoreIds: [] }
const ev = makeFakeEvaluator({})

function setup(rule: LogicRule, onChange = vi.fn()) {
  render(<RuleEditor rule={rule} targets={targets} catalogue={cat} evaluator={ev} pipingTargets={[]} onChange={onChange} onDelete={vi.fn()} />)
  return onChange
}

const pipingTargets = [{ fieldPath: 'pages.p1.elements.0.prompt', label: 'Page 1 › it_a' }]

describe('RuleEditor', () => {
  it('shows skip target dropdown for a skip rule', () => {
    setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p1' } })
    expect((screen.getByLabelText('Target page') as HTMLSelectElement).value).toBe('p1')
  })
  it('shows visibility target + show toggle for a visibility rule', () => {
    setup({ type: 'visibility', condition: 'q_x == 1', action: { target_id: 'it_a', show: false } })
    expect((screen.getByLabelText('Target element') as HTMLSelectElement).value).toBe('it_a')
    expect((screen.getByLabelText('Show when condition is true') as HTMLInputElement).checked).toBe(false)
  })
  it('changing type resets the action but keeps the condition', () => {
    const onChange = setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p1' } })
    fireEvent.change(screen.getByLabelText('Rule type'), { target: { value: 'visibility' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'visibility', condition: 'q_x == 1', action: { target_id: '', show: false } })
  })
  it('editing the skip target emits the updated rule', () => {
    const onChange = setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p1' } })
    fireEvent.change(screen.getByLabelText('Target page'), { target: { value: 'p2' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p2' } })
  })
  it('shows an error for a missing target', () => {
    setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: '' } })
    expect(screen.getByText(/choose a target page/i)).toBeInTheDocument()
  })
  it('keeps an out-of-catalogue target value selectable', () => {
    setup({ type: 'skip', condition: 'q_x == 1', action: { skip_to: 'p_missing' } })
    expect((screen.getByLabelText('Target page') as HTMLSelectElement).value).toBe('p_missing')
    expect(screen.getByText(/unknown page id/i)).toBeInTheDocument()
  })
})

describe('RuleEditor — piping (D2b)', () => {
  function setupPiping(rule: LogicRule, onChange = vi.fn()) {
    render(<RuleEditor rule={rule} targets={targets} catalogue={cat} evaluator={ev}
      pipingTargets={pipingTargets} onChange={onChange} onDelete={vi.fn()} />)
    return onChange
  }
  it('renders a source dropdown and a field_path picker for a piping rule', () => {
    setupPiping({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: 'pages.p1.elements.0.prompt' } })
    expect((screen.getByLabelText('Source question') as HTMLSelectElement).value).toBe('q_x')
    expect((screen.getByLabelText('Target prompt') as HTMLSelectElement).value).toBe('pages.p1.elements.0.prompt')
  })
  it('the field_path picker shows the human label', () => {
    setupPiping({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: 'pages.p1.elements.0.prompt' } })
    expect(screen.getByText('Page 1 › it_a')).toBeInTheDocument()
  })
  it('editing the source emits the updated rule', () => {
    const onChange = setupPiping({ type: 'piping', condition: 'true', action: { source: '', field_path: '' } })
    fireEvent.change(screen.getByLabelText('Source question'), { target: { value: 'q_x' } })
    expect(onChange).toHaveBeenCalledWith({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: '' } })
  })
  it('flags a missing target', () => {
    setupPiping({ type: 'piping', condition: 'true', action: { source: 'q_x', field_path: '' } })
    expect(screen.getByText(/choose a target prompt/i)).toBeInTheDocument()
  })
})

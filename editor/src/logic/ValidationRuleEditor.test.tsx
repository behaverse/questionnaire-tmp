import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ValidationRuleEditor } from './ValidationRuleEditor'
import { makeFakeEvaluator } from './evaluator'
import type { CrossQuestionValidationRule } from '../model/types'

const targets = { pageIds: ['p1'], elementKeys: ['it_a', 'it_b'] }
const cat = { questionIds: ['it_a', 'it_b'], scoreIds: [] }
const ev = makeFakeEvaluator({})

function setup(rule: CrossQuestionValidationRule, onChange = vi.fn()) {
  render(<ValidationRuleEditor rule={rule} targets={targets} catalogue={cat} evaluator={ev} allRules={[rule]} onChange={onChange} onDelete={vi.fn()} />)
  return onChange
}
const base: CrossQuestionValidationRule = { id: 'val_1', condition: 'a>b', message: 'oops', targets: ['it_a'] }

describe('ValidationRuleEditor', () => {
  it('renders id, condition, message inputs + a checkbox per element key', () => {
    setup(base)
    expect((screen.getByLabelText('Rule id') as HTMLInputElement).value).toBe('val_1')
    expect((screen.getByLabelText('Error message') as HTMLInputElement).value).toBe('oops')
    expect(screen.getByLabelText('Target it_a')).toBeChecked()
    expect(screen.getByLabelText('Target it_b')).not.toBeChecked()
  })
  it('toggling a target updates rule.targets', () => {
    const onChange = setup(base)
    fireEvent.click(screen.getByLabelText('Target it_b'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ targets: ['it_a', 'it_b'] }))
  })
  it('unchecking removes a target', () => {
    const onChange = setup(base)
    fireEvent.click(screen.getByLabelText('Target it_a'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ targets: [] }))
  })
  it('keeps an out-of-catalogue current target checked', () => {
    setup({ ...base, targets: ['it_gone'] })
    expect(screen.getByLabelText('Target it_gone')).toBeChecked()
  })
  it('editing the message emits the updated rule', () => {
    const onChange = setup(base)
    fireEvent.change(screen.getByLabelText('Error message'), { target: { value: 'new msg' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ message: 'new msg' }))
  })
  it('shows an error for an empty message and a warning for empty targets', () => {
    setup({ ...base, message: '', targets: [] })
    expect(screen.getByText(/message required/i)).toBeInTheDocument()
    expect(screen.getByText(/no targets/i)).toBeInTheDocument()
  })
})

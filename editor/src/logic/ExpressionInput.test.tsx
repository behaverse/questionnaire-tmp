import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExpressionInput } from './ExpressionInput'
import { makeFakeEvaluator } from './evaluator'

const cat = { questionIds: ['q_age'], scoreIds: [] }
const okEv = makeFakeEvaluator({})
const badEv = { ...okEv, check: (e: string) => (e === 'bad' ? '5: unexpected token' : null) }

describe('ExpressionInput', () => {
  it('shows valid for a parseable expression with known refs', () => {
    render(<ExpressionInput value="q_age >= 18" onChange={() => {}} catalogue={cat} evaluator={okEv} />)
    expect(screen.getByText(/valid/i)).toBeInTheDocument()
  })
  it('shows the parse error message', () => {
    render(<ExpressionInput value="bad" onChange={() => {}} catalogue={cat} evaluator={badEv} />)
    expect(screen.getByText(/5: unexpected token/)).toBeInTheDocument()
  })
  it('warns about unknown references', () => {
    render(<ExpressionInput value="q_typo == 1" onChange={() => {}} catalogue={cat} evaluator={okEv} />)
    expect(screen.getByText(/unknown/i)).toBeInTheDocument()
    expect(screen.getByText(/q_typo/, { selector: 'p' })).toBeInTheDocument()
  })
  it('insert-condition appends a well-formed snippet', () => {
    const onChange = vi.fn()
    render(<ExpressionInput value="" onChange={onChange} catalogue={cat} evaluator={okEv} />)
    fireEvent.click(screen.getByRole('button', { name: /insert condition/i }))
    fireEvent.change(screen.getByLabelText('Insert value'), { target: { value: '18' } })
    fireEvent.click(screen.getByRole('button', { name: /^append$/i }))
    expect(onChange).toHaveBeenCalledWith('q_age == 18')
  })
  it('calls onChange when typing', () => {
    const onChange = vi.fn()
    render(<ExpressionInput value="" onChange={onChange} catalogue={cat} evaluator={okEv} />)
    fireEvent.change(screen.getByLabelText('Expression'), { target: { value: 'q_age > 1' } })
    expect(onChange).toHaveBeenCalledWith('q_age > 1')
  })
})

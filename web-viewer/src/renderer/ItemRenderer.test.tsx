import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { ItemRenderer } from './ItemRenderer'
import type { ItemElement } from './types'

const radioItem: ItemElement = {
  id: 'it_1',
  question: {
    prompt: { content: { en: { text: 'Little interest or pleasure in doing things' } } },
    context: { content: { en: { text: 'Over the last 2 weeks' } } },
    instruction: { content: { en: { text: 'Pick one' } } },
  },
  option: {
    input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }],
    content: { en: { options: [{ index: 1, text: 'Not at all' }] } },
  },
}

test('renders prompt as heading, context + instruction beneath, then the widget', () => {
  render(<ItemRenderer answerKey="it_1" element={radioItem} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('heading', { name: /Little interest/ })).toBeInTheDocument()
  expect(screen.getByText('Over the last 2 weeks')).toBeInTheDocument()
  expect(screen.getByText('Pick one')).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: /Not at all/ })).toBeInTheDocument()
})
test('reports answers under the answer key', () => {
  const onAnswer = vi.fn()
  render(<ItemRenderer answerKey="k9" element={radioItem} locale="en" value={null} onAnswer={onAnswer} />)
  fireEvent.click(screen.getByRole('radio', { name: /Not at all/ }))
  expect(onAnswer).toHaveBeenCalledWith('k9', 0)
})
test('unknown widget triple renders UnsupportedElement naming the triple', () => {
  const weird = { ...radioItem, option: { ...radioItem.option, input_data_type: 'date' } }
  render(<ItemRenderer answerKey="it_1" element={weird} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByText(/date\/ordinal\/single/)).toBeInTheDocument()
})
test('missing locale text renders UnsupportedElement, not a crash or blank', () => {
  render(<ItemRenderer answerKey="it_1" element={radioItem} locale="pt" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByText(/no 'pt'/)).toBeInTheDocument()
})
test('required item shows error text when flagged', () => {
  render(<ItemRenderer answerKey="it_1" element={{ ...radioItem, required: true }} locale="en" value={null} onAnswer={vi.fn()} showRequiredError requiredErrorText="Please answer this question to continue." />)
  expect(screen.getByText('Please answer this question to continue.')).toBeInTheDocument()
})

const numberItem = (option: Partial<ItemElement['option']>, style?: ItemElement['style']): ItemElement => ({
  id: 'it_n',
  question: { prompt: { content: { en: { text: 'Rate it' } } } },
  option: { input_data_type: 'number', measurement_type: 'interval', min: 1, max: 7, step: 1, ...option },
  style,
})

test('number 1–7 scale renders rating buttons (radiogroup)', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({})} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('radiogroup', { name: 'Rate it' })).toBeInTheDocument()
  expect(screen.getAllByRole('radio')).toHaveLength(7)
})
test('number 0–100 scale renders a slider', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({ min: 0, max: 100, step: 1 })} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('slider', { name: 'Rate it' })).toBeInTheDocument()
})
test('style.layout=slider hint overrides on a short scale', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({}, { layout: 'slider' })} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('slider', { name: 'Rate it' })).toBeInTheDocument()
})
test('unbounded number renders a plain number input (spinbutton)', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({ min: undefined, max: undefined })} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('spinbutton', { name: 'Rate it' })).toBeInTheDocument()
})

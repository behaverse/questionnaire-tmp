import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StartScreen } from './StartScreen'

const noop = () => {}

test('New creates an empty questionnaire', async () => {
  const onNew = vi.fn()
  render(<StartScreen onNew={onNew} onOpenFile={vi.fn()} onOpenLibrary={vi.fn()} onLoadSample={noop} onBrowseLibrary={noop} onTranslate={noop} onTranslateWorkbench={noop} onLoadPhq9={noop} onBrowseEntities={noop} />)
  await userEvent.click(screen.getByRole('button', { name: /new questionnaire/i }))
  expect(onNew).toHaveBeenCalled()
})

test('shows the three entry points', () => {
  render(<StartScreen onNew={vi.fn()} onOpenFile={vi.fn()} onOpenLibrary={vi.fn()} onLoadSample={noop} onBrowseLibrary={noop} onTranslate={noop} onTranslateWorkbench={noop} onLoadPhq9={noop} onBrowseEntities={noop} />)
  expect(screen.getByRole('button', { name: /new questionnaire/i })).toBeInTheDocument()
  expect(screen.getByText(/open file/i)).toBeInTheDocument()
  expect(screen.getByText(/open from library/i)).toBeInTheDocument()
})

describe('StartScreen Load a sample', () => {
  it('renders a Load a sample action and calls onLoadSample', () => {
    const onLoadSample = vi.fn()
    render(<StartScreen onNew={noop} onOpenFile={noop} onOpenLibrary={noop} onLoadSample={onLoadSample} onBrowseLibrary={noop} onTranslate={noop} onTranslateWorkbench={noop} onLoadPhq9={noop} onBrowseEntities={noop} />)
    fireEvent.click(screen.getByRole('button', { name: /load a sample/i }))
    expect(onLoadSample).toHaveBeenCalledTimes(1)
  })
})

describe('StartScreen', () => {
  it('the "Translate Library entities" card calls onTranslateWorkbench', () => {
    const onTranslateWorkbench = vi.fn()
    render(
      <StartScreen onNew={noop} onOpenFile={noop} onOpenLibrary={noop} onLoadSample={noop}
                   onBrowseLibrary={noop} onTranslate={noop} onTranslateWorkbench={onTranslateWorkbench} onLoadPhq9={noop}
                   onBrowseEntities={noop} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /translate library entities/i }))
    expect(onTranslateWorkbench).toHaveBeenCalled()
  })
})

describe('StartScreen PHQ-9 sample', () => {
  it('the "Load PHQ-9 sample" card calls onLoadPhq9', () => {
    const onLoadPhq9 = vi.fn()
    render(
      <StartScreen onNew={noop} onOpenFile={noop} onOpenLibrary={noop} onLoadSample={noop}
                   onBrowseLibrary={noop} onTranslate={noop} onTranslateWorkbench={noop} onLoadPhq9={onLoadPhq9}
                   onBrowseEntities={noop} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /phq-9 sample/i }))
    expect(onLoadPhq9).toHaveBeenCalled()
  })
})

describe('StartScreen Library entities', () => {
  it('the "Library entities" card calls onBrowseEntities', () => {
    const onBrowseEntities = vi.fn()
    render(<StartScreen onNew={noop} onOpenFile={noop} onOpenLibrary={noop} onLoadSample={noop}
                        onBrowseLibrary={noop} onTranslate={noop} onTranslateWorkbench={noop} onLoadPhq9={noop}
                        onBrowseEntities={onBrowseEntities} />)
    fireEvent.click(screen.getByRole('button', { name: 'Library entities' }))
    expect(onBrowseEntities).toHaveBeenCalled()
  })
})

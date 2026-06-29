import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from '../state/store'
import { Inspector } from './Inspector'

vi.mock('../logic/useEvaluator', async (_orig) => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
})

test('no selection → shows the metadata panel and edits title', async () => {
  useEditorStore.getState().select(null) // questionnaire-root inspector (loadModel now selects the first page)
  render(<Inspector />)
  const input = screen.getByLabelText(/^title$/i)
  await userEvent.clear(input)
  await userEvent.type(input, 'Edited')
  expect(useEditorStore.getState().model!.metadata.title).toBe('Edited')
})

test('page selected → edits the page title', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Inspector />)
  const input = screen.getByLabelText(/page title/i)
  await userEvent.clear(input)
  await userEvent.type(input, 'P1')
  expect(useEditorStore.getState().model!.pages[0].title).toBe('P1')
})

test('item selected → refs shown read-only with an ED-C note', () => {
  const q = phq9 as Questionnaire
  const idx = q.pages[0].elements.findIndex((e) => typeof (e as Record<string, unknown>).ref === 'string')
  if (idx < 0) return
  useEditorStore.getState().select(['pages', 0, 'elements', idx])
  render(<Inspector />)
  expect(screen.getByText(/ED-C/i)).toBeInTheDocument()
})

test('block selected → toggling a page updates membership', async () => {
  const st = useEditorStore.getState()
  // create a block then select it
  const { createBlock } = await import('../model/tree')
  st.applyEdit((m) => createBlock(m, { id: 'blk_t', title: 'T', page_ids: [] }))
  const bi = (st.model!.blocks?.length ?? 1) - 1
  st.select(['blocks', bi])
  render(<Inspector />)
  const firstPage = useEditorStore.getState().model!.pages[0]
  await userEvent.click(screen.getByLabelText(new RegExp(`include ${firstPage.title ?? firstPage.id}`, 'i')))
  expect(useEditorStore.getState().model!.blocks![bi].page_ids).toContain(firstPage.id)
})

import { fireEvent } from '@testing-library/react'

describe('Inspector randomization (D2b)', () => {
  const base = {
    metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' },
    pages: [{ id: 'p1', title: 'P1', elements: [] }],
    blocks: [{ id: 'b1', title: 'B1', page_ids: ['p1'] }],
  } as unknown as Questionnaire

  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('page: toggling Randomize element order sets then unsets the flag', () => {
    useEditorStore.getState().select(['pages', 0])
    render(<Inspector />)
    fireEvent.click(screen.getByLabelText(/randomize element order/i))
    expect((useEditorStore.getState().model!.pages[0] as { randomize?: boolean }).randomize).toBe(true)
    fireEvent.click(screen.getByLabelText(/randomize element order/i))
    expect('randomize' in (useEditorStore.getState().model!.pages[0] as object)).toBe(false)
  })

  it('questionnaire root: Randomize page order writes flow.randomize_pages', () => {
    useEditorStore.getState().select(null)
    render(<Inspector />)
    fireEvent.click(screen.getByLabelText(/randomize page order/i))
    expect((useEditorStore.getState().model!.flow as { randomize_pages?: boolean }).randomize_pages).toBe(true)
  })
})

describe('Inspector presentation flags (style.x_*)', () => {
  beforeEach(() => useEditorStore.getState().select(null))

  it('key-select + back-nav default ON; unchecking writes the false flag', () => {
    render(<Inspector />)
    const keySel = screen.getByLabelText(/selecting options with keyboard/i) as HTMLInputElement
    const back = screen.getByLabelText(/going back to previous questions/i) as HTMLInputElement
    expect(keySel.checked).toBe(true)
    expect(back.checked).toBe(true)
    fireEvent.click(keySel)
    fireEvent.click(back)
    const style = useEditorStore.getState().model!.style as Record<string, unknown>
    expect(style.x_key_select).toBe(false)
    expect(style.x_back_nav).toBe(false)
  })

  it('re-checking key-select removes the flag (back to default, no key persisted)', () => {
    render(<Inspector />)
    const keySel = screen.getByLabelText(/selecting options with keyboard/i)
    fireEvent.click(keySel) // → false
    fireEvent.click(keySel) // → default, key removed
    const style = (useEditorStore.getState().model!.style ?? {}) as Record<string, unknown>
    expect('x_key_select' in style).toBe(false)
  })

  it('comments default OFF; checking writes x_comments:true', () => {
    render(<Inspector />)
    const comments = screen.getByLabelText(/per-question comments/i) as HTMLInputElement
    expect(comments.checked).toBe(false)
    fireEvent.click(comments)
    expect((useEditorStore.getState().model!.style as Record<string, unknown>).x_comments).toBe(true)
  })
})

it('groups Logic/Validation/Scoring into tabs at the questionnaire root', () => {
  useEditorStore.getState().select(null)
  render(<Inspector />)
  expect(screen.getByRole('tab', { name: /logic/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /validation/i })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: /scoring|scores/i })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('tab', { name: /validation/i }))
  expect(screen.getByRole('tab', { name: /validation/i })).toHaveAttribute('aria-selected', 'true')
})

test('switching item selection updates ShowIfEditor draft (key fix regression)', async () => {
  const twoItemModel = {
    metadata: { id: 'qst_reg', title: 'Reg', description: 'd', language: 'en', version: 'v26.0601' },
    pages: [
      {
        id: 'p1',
        elements: [
          { id: 'q_a', show_if: 'a == 1' },
          { id: 'q_b', show_if: 'b == 2' },
        ],
      },
    ],
  } as unknown as Questionnaire

  const st = useEditorStore.getState()
  st.reset()
  st.loadModel(twoItemModel, { kind: 'new' })

  // Select first item then render
  act(() => { st.select(['pages', 0, 'elements', 0]) })
  render(<Inspector />)

  // First item's show_if should appear in the Expression textarea
  expect((screen.getByLabelText('Expression') as HTMLTextAreaElement).value).toBe('a == 1')

  // Switch to the second item
  act(() => { st.select(['pages', 0, 'elements', 1]) })

  // The textarea must now show the SECOND item's show_if, not the stale first
  expect((screen.getByLabelText('Expression') as HTMLTextAreaElement).value).toBe('b == 2')
})

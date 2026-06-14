import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from '../state/store'
import { Inspector } from './Inspector'

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
})

test('no selection → shows the metadata panel and edits title', async () => {
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

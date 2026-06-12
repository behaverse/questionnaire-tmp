import { StrictMode } from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import mini from '../fixtures/mini.json'

function setUrl(qs: string) { window.history.replaceState(null, '', `/${qs}`) }
const mintOk = { session_id: 's1', session_token: 't1', agent_id: 'agent_ab12', session_index: 1, runtime: mini, theme: { palette: { primary: '#112233' } } }

afterEach(() => vi.unstubAllGlobals())

test('boots a session, applies the theme, renders step 1 (message) then navigates', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
  expect(document.documentElement.style.getPropertyValue('--qv-primary')).toBe('#112233')
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Little interest/ })).toBeInTheDocument()
})
test('retry after a failed mint re-runs boot and recovers', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'boom' } }), { status: 500 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(mintOk), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /try again/i }))
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(2)
})
test('required gating blocks Next and announces the error', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await screen.findByRole('heading', { name: /Little interest/ })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/please answer/i)
})
test('single-choice answer auto-advances after the confirmation beat', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  expect(await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })).toBeInTheDocument()
})
test('finishing shows the thank-you screen', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Thank you/i })).toBeInTheDocument()
})
test.each([
  [410, /closed/i], [409, /not currently accepting/i], [404, /not valid/i],
])('mint HTTP %i shows its error screen', async (status, title) => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'c' } }), { status })))
  render(<App />)
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
})
test('missing deployment param → config error, no fetch', async () => {
  setUrl('')
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  expect(await screen.findByRole('heading', { name: /not valid/i })).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})
test('fixture mode renders without network (dev only)', async () => {
  setUrl('?fixture=mini')
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

// C1 — StrictMode does not hang boot
test('boots under StrictMode (dev double-effect) — fixture path', async () => {
  setUrl('?fixture=mini')
  vi.stubGlobal('fetch', vi.fn())
  render(<StrictMode><App /></StrictMode>)
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
})
test('boots under StrictMode — mint path, exactly one fetch', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  render(<StrictMode><App /></StrictMode>)
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

// C2 — Enter on a focused button does not double-advance
test('Enter on the focused Next button advances exactly one step', async () => {
  const msgs = {
    ...mini,
    pages: [{ id: 'p1', elements: [
      { id: 'm1', content: { en: { text: 'First message' } } },
      { id: 'm2', content: { en: { text: 'Second message' } } },
      { id: 'm3', content: { en: { text: 'Third message' } } },
    ] }],
  }
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...mintOk, runtime: msgs }), { status: 200 })))
  render(<App />)
  await screen.findByText('First message')
  const next = screen.getByRole('button', { name: /next/i })
  next.focus()
  // Simulate what the browser does: a focused button fires both a click and the keydown event
  fireEvent.click(next)
  fireEvent.keyDown(next, { key: 'Enter' })
  expect(await screen.findByText('Second message')).toBeInTheDocument()
  expect(screen.queryByText('Third message')).not.toBeInTheDocument()
})

// I1 — focus management
test('step change moves focus to the new step heading; gating failure focuses the widget', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  const heading = await screen.findByRole('heading', { name: /Little interest/ })
  await waitFor(() => expect(heading).toHaveFocus(), { timeout: 1000 })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))   // gating failure
  await waitFor(() => expect(screen.getAllByRole('radio')[0]).toHaveFocus())
})

// Minor 3 — classic mode
test('classic mode renders the whole page as one step', async () => {
  const classic = { ...mini, style: { x_presentation: 'classic' } }
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...mintOk, runtime: classic }), { status: 200 })))
  render(<App />)
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /Little interest/ })).toBeInTheDocument()   // same step
})

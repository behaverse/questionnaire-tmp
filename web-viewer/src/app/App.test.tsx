import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import mini from '../fixtures/mini.json'

function setUrl(qs: string) { window.history.replaceState(null, '', `/${qs}`) }
const mintOk = { session_id: 's1', session_token: 't1', runtime: mini, theme: { palette: { primary: '#112233' } } }

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

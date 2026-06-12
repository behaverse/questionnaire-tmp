import { StrictMode } from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import mini from '../fixtures/mini.json'

vi.mock('../logic/evaluator', async (orig) => {
  const actual = await orig<typeof import('../logic/evaluator')>()
  return { ...actual, loadEvaluator: async () => actual.makeFakeEvaluator((globalThis as Record<string, unknown>).__evalTable as never ?? {}) }
})

function setUrl(qs: string) { window.history.replaceState(null, '', `/${qs}`) }
const mintOk = { session_id: 's1', session_token: 't1', agent_id: 'agent_ab12', session_index: 1, runtime: mini, theme: { palette: { primary: '#112233' } }, ephemeral: false }

afterEach(() => { vi.unstubAllGlobals(); (globalThis as Record<string, unknown>).__evalTable = {} })

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

// WV-B — submission pipeline
function postCalls(fetchMock: ReturnType<typeof vi.fn>, suffix: string) {
  return fetchMock.mock.calls.filter(([u]) => String(u).endsWith(suffix)).map(([, i]) => JSON.parse((i as RequestInit).body as string))
}
const respond202 = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(mintOk), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })

test('walking the questionnaire submits message + item rows, events, then complete', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); respond202(fetchMock); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.type(screen.getByRole('spinbutton'), '8')
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Thank you/i }, { timeout: 3000 })).toBeInTheDocument()

  const responses = postCalls(fetchMock, '/sessions/s1/responses')
  expect(responses).toHaveLength(3)
  expect(responses[0].responses[0]).toMatchObject({ stimulus_type: 'instruction', response_description: 'acknowledged', agent_id: 'agent_ab12' })
  expect(responses[1].responses[0]).toMatchObject({ response_description: 'Not at all', response_numeric: 0 })
  expect(responses[2].responses[0]).toMatchObject({ response_numeric: 8 })
  expect(responses[1].responses[0].response_time).toBeGreaterThan(0)
  expect(responses[1].responses[0].response_time).toBeLessThan(60)

  const events = postCalls(fetchMock, '/sessions/s1/events').flatMap((b) => b.events)
  const verbs = events.map((e: { verb: string }) => e.verb)
  expect(verbs).toContain('bdm:initialized')
  expect(verbs).toContain('bdm:trial_started')
  expect(verbs).toContain('bdm:selected')
  expect(verbs).toContain('bdm:trial_ended')
  expect(verbs).toContain('bdm:completed')
  expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/sessions/s1/complete'))).toBe(true)
})
test('back-and-change emits an attempt row with x_response_revises', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); respond202(fetchMock); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /back/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Several days/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  const rows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0])
  const itemRows = rows.filter((r) => r.stimulus_type !== 'instruction')
  expect(itemRows).toHaveLength(2)
  expect(itemRows[1]).toMatchObject({ x_response_revision: 2, x_response_revises: itemRows[0].response_id, response_description: 'Several days' })
})
test('going back without changing the answer emits nothing new', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); respond202(fetchMock); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /back/i }))
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  const itemRows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0]).filter((r) => r.stimulus_type !== 'instruction')
  expect(itemRows).toHaveLength(1)
})
test('complete failure shows retry; retry completes', async () => {
  setUrl('?deployment=dpl_1')
  let failComplete = true
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(mintOk), { status: 200 })
    if (String(url).endsWith('/complete')) return failComplete ? new Response('{}', { status: 500 }) : new Response('{}', { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Submission problem/i }, { timeout: 3000 })).toBeInTheDocument()
  failComplete = false
  await userEvent.click(screen.getByRole('button', { name: /try again/i }))
  expect(await screen.findByRole('heading', { name: /Thank you/i }, { timeout: 3000 })).toBeInTheDocument()
})
test('x_summary_rt:false strips response_time from rows', async () => {
  const noRt = { ...mini, style: { x_summary_rt: false } }
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify({ ...mintOk, runtime: noRt }), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  const rows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0])
  expect(rows[0].response_time).toBeUndefined()
  expect(rows[0].response_datetime).toBeDefined()
})

// WV-D — logic engine integration ----------------------------------------------------------------
function radioItem(id: string, prompt: string, extra: Record<string, unknown> = {}) {
  return {
    id, ...extra,
    question: { prompt: { content: { en: { text: prompt } } } },
    option: {
      input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
      options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
      content: { en: { options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } },
    },
  }
}
function rtWith(pages: unknown[], extra: Record<string, unknown> = {}) {
  return { ...mini, pages, ...extra }
}
function mintRuntime(fetchMock: ReturnType<typeof vi.fn>, runtime: unknown) {
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify({ ...mintOk, runtime }), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
}

test('branch routing skips a page when the branch condition fires', async () => {
  const runtime = rtWith(
    [
      { id: 'p1', elements: [radioItem('it_1', 'Question one')] },
      { id: 'p2', elements: [radioItem('it_2', 'Question two')] },
      { id: 'p3', elements: [radioItem('it_3', 'Question three')] },
    ],
    { logic: [{ id: 'b', type: 'branch', condition: 'route_b', action: { skip_to: 'p3' } }] },
  )
  setUrl('?deployment=dpl_1')
  ;(globalThis as Record<string, unknown>).__evalTable = { route_b: true }
  const fetchMock = vi.fn(); mintRuntime(fetchMock, runtime); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('radio', { name: 'No' }))
  expect(await screen.findByRole('heading', { name: /Question three/, level: 2 }, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /Question two/ })).not.toBeInTheDocument()
})

test('without the branch condition, the next page renders normally', async () => {
  const runtime = rtWith(
    [
      { id: 'p1', elements: [radioItem('it_1', 'Question one')] },
      { id: 'p2', elements: [radioItem('it_2', 'Question two')] },
      { id: 'p3', elements: [radioItem('it_3', 'Question three')] },
    ],
    { logic: [{ id: 'b', type: 'branch', condition: 'route_b', action: { skip_to: 'p3' } }] },
  )
  setUrl('?deployment=dpl_1')
  ;(globalThis as Record<string, unknown>).__evalTable = { route_b: false }
  const fetchMock = vi.fn(); mintRuntime(fetchMock, runtime); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('radio', { name: 'No' }))
  expect(await screen.findByRole('heading', { name: /Question two/, level: 2 }, { timeout: 2000 })).toBeInTheDocument()
})

test('show_if:false on a step skips that step entirely', async () => {
  const runtime = rtWith([
    { id: 'p1', elements: [radioItem('it_1', 'Question one')] },
    { id: 'p2', elements: [radioItem('it_2', 'Question two', { show_if: 'show_it' })] },
    { id: 'p3', elements: [radioItem('it_3', 'Question three')] },
  ])
  setUrl('?deployment=dpl_1')
  ;(globalThis as Record<string, unknown>).__evalTable = { show_it: false }
  const fetchMock = vi.fn(); mintRuntime(fetchMock, runtime); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('radio', { name: 'No' }))
  expect(await screen.findByRole('heading', { name: /Question three/, level: 2 }, { timeout: 2000 })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: /Question two/ })).not.toBeInTheDocument()
})

test('cross-validation blocks Next, shows the message, and emits no row; clearing it advances', async () => {
  const runtime = rtWith(
    [
      { id: 'p1', elements: [radioItem('it_1', 'Question one')] },
      { id: 'p2', elements: [radioItem('it_2', 'Question two')] },
    ],
    { validation: [{ id: 'v', condition: 'bad', message: 'Please fix', targets: ['it_1'] }] },
  )
  setUrl('?deployment=dpl_1')
  ;(globalThis as Record<string, unknown>).__evalTable = { bad: true }
  const fetchMock = vi.fn(); mintRuntime(fetchMock, runtime); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('radio', { name: 'No' }))
  // auto-advance fires; with validation failing we stay on p1 with the message
  expect(await screen.findByText('Please fix')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /Question one/, level: 2 })).toBeInTheDocument()
  const itemRows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0]).filter((r) => r.stimulus_type !== 'instruction')
  expect(itemRows).toHaveLength(0)
  // clear the cross-validation in-place (the evaluator captured this table object at boot) and advance
  ;((globalThis as Record<string, unknown>).__evalTable as Record<string, boolean>).bad = false
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Question two/, level: 2 }, { timeout: 2000 })).toBeInTheDocument()
})

test('reversed item carries a post-reversal score in the posted row', async () => {
  const reversed = {
    id: 'it_r',
    question: { prompt: { reversed: true, content: { en: { text: 'Reversed question' } } } },
    option: {
      input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
      options: [{ index: 1, value: 0 }, { index: 2, value: 1 }, { index: 3, value: 2 }, { index: 4, value: 3 }, { index: 5, value: 4 }, { index: 6, value: 5 }, { index: 7, value: 6 }],
      content: { en: { options: [{ index: 1, text: 'V0' }, { index: 2, text: 'V1' }, { index: 3, text: 'V2' }, { index: 4, text: 'V3' }, { index: 5, text: 'V4' }, { index: 6, text: 'V5' }, { index: 7, text: 'V6' }] } },
    },
  }
  const runtime = rtWith([{ id: 'p1', elements: [reversed] }])
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); mintRuntime(fetchMock, runtime); vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('radio', { name: 'V1' }))   // raw value 1 → reversed 6+0-1 = 5
  await screen.findByRole('heading', { name: /Thank you/i }, { timeout: 3000 })
  const itemRows = postCalls(fetchMock, '/sessions/s1/responses').map((p) => p.responses[0]).filter((r) => r.stimulus_type !== 'instruction')
  expect(itemRows).toHaveLength(1)
  expect(itemRows[0].response_numeric).toBe(1)
  expect(itemRows[0].score).toBe(5)
})

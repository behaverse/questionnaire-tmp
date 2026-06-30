import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { drivePlayer } from '../../src/ui-driver'
import { buildTrace, checkWellFormed } from '../../src/trace'
import { resolveProfile } from '../../src/profile'

const mint = readFileSync(fileURLToPath(new URL('./fixtures/mint.json', import.meta.url)), 'utf8')
const VS = 'http://vs.mock'

/** Route-mock the capture-pipeline endpoints so a real ?deployment= run works fully offline. */
async function mockVs(page: import('@playwright/test').Page) {
  await page.route('**/v1/sessions/new', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: mint }))
  await page.route('**/v1/sessions/*/events', (r) => r.fulfill({ status: 202, contentType: 'application/json', body: '{}' }))
  await page.route('**/v1/sessions/*/responses', (r) => r.fulfill({ status: 202, contentType: 'application/json', body: '{}' }))
  await page.route('**/v1/sessions/*/complete', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.route('**/v1/sessions/*/scorer_outputs', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
}

test('bot drives a deployment run to finish and emits a well-formed bdm: trace', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: VS, locale: 'en',
    profile: resolveProfile('acquiescence'), seed: 42,
  })

  expect(res.finished).toBe(true)
  expect(res.sessionId).toBe('sess_bot_1')

  const trace = buildTrace('dep_demo', res.sessionId, res.eventBodies)
  const verdict = checkWellFormed(trace.statements)
  expect(verdict).toEqual({ ok: true })
  // the run produced a real interaction stream: at minimum started → selected → submitted
  const verbs = new Set(trace.statements.map((s) => s.verb))
  expect(verbs.has('bdm:started')).toBe(true)
  expect(verbs.has('bdm:submitted')).toBe(true)

  mkdirSync('tests/e2e/screenshots', { recursive: true })
  writeFileSync('tests/e2e/screenshots/trace.json', JSON.stringify(trace, null, 2))
  await page.screenshot({ path: 'tests/e2e/screenshots/respondent-bot-finished.png', fullPage: true })
})

test('direct-mode run also finishes and emits a trace', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: VS, locale: 'en',
    profile: resolveProfile('random'), seed: 7, direct: true,
  })
  expect(res.finished).toBe(true)
  expect(checkWellFormed(buildTrace('dep_demo', res.sessionId, res.eventBodies).statements).ok).toBe(true)
})

import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { drivePlayer } from '../../src/ui-driver'
import { buildTrace } from '../../src/trace'
import { resolveProfile } from '../../src/profile'

const mint = readFileSync(fileURLToPath(new URL('./fixtures/mint.json', import.meta.url)), 'utf8')

async function mockVs(page: import('@playwright/test').Page) {
  await page.route('**/v1/sessions/new', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: mint }))
  for (const ep of ['events', 'responses', 'complete', 'scorer_outputs']) {
    await page.route(`**/v1/sessions/*/${ep}`, (r) => r.fulfill({ status: 202, contentType: 'application/json', body: '{}' }))
  }
}

test('realistic lane moves a visible cursor and records a Schema-4b mouse path', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: 'http://vs.mock',
    locale: 'en', profile: resolveProfile('acquiescence'), seed: 42, showCursor: true,
  })
  expect(res.finished).toBe(true)

  // the bot recorded a mouse path
  expect(res.mouseSamples.length).toBeGreaterThan(5)
  expect(res.mouseSamples.some((s) => s.button_state === 'left_down')).toBe(true) // a click happened
  const xs = new Set(res.mouseSamples.map((s) => s.x))
  expect(xs.size).toBeGreaterThan(1) // the cursor actually moved
  for (const s of res.mouseSamples) {
    expect(Object.keys(s).sort()).toEqual(['button_state', 't', 'x', 'y'])
    expect(Number.isInteger(s.x) && Number.isInteger(s.y)).toBe(true)
  }

  // the path lands in the trace
  const trace = buildTrace('dep_demo', res.sessionId, res.eventBodies, res.mouseSamples)
  expect(trace.mouse && trace.mouse.length).toBeGreaterThan(5)

  // the visible cursor overlay was injected
  expect(await page.locator('#__bot_cursor').count()).toBe(1)

  mkdirSync('tests/e2e/screenshots', { recursive: true })
  await page.screenshot({ path: 'tests/e2e/screenshots/respondent-bot-cursor.png', fullPage: true })
})

test('direct lane records no mouse samples', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: 'http://vs.mock',
    locale: 'en', profile: resolveProfile('random'), seed: 7, direct: true,
  })
  expect(res.finished).toBe(true)
  expect(res.mouseSamples).toEqual([])
})

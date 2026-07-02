import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const bundle = readFileSync(fileURLToPath(new URL('./fixtures/replay-bundle.json', import.meta.url)), 'utf8')
const msBundle = readFileSync(fileURLToPath(new URL('./fixtures/replay-bundle-multiselect.json', import.meta.url)), 'utf8')

// The player fetches the VS bundle_url CROSS-ORIGIN, so the mocked response sends
// Access-Control-Allow-Origin, mirroring the real VS requirement (player origin in VS_CORS_ORIGINS).
// Note: Playwright auto-fills a permissive ACAO when the header is absent, so an ABSENT header does not
// reproduce a real CORS block here; only a wrong-origin ACAO value does (verified manually—see task report).
const CORS = { 'access-control-allow-origin': '*' }
const BUNDLE_URL = 'http://vs.mock/v1/replay?token=demo' // a cross-origin VS URL, as a real replay_url carries
const replayHref = (u: string) => `/?replay=${encodeURIComponent(u)}`

test('valid VS bundle plays back: question, recorded answer, and cursor overlay render', async ({ page }) => {
  let hit = false
  await page.route('**/v1/replay*', (r) =>
    (hit = true, r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: bundle })))

  await page.goto(replayHref(BUNDLE_URL))

  // the real browser fetch to the (cross-origin) VS bundle URL happened
  await expect.poll(() => hit).toBe(true)

  // NOT the error state
  await expect(page.getByRole('heading', { name: 'Replay unavailable' })).toHaveCount(0)

  // the question + the replay controls render
  await expect(page.getByRole('radiogroup', { name: 'Little interest or pleasure in doing things' })).toBeVisible()
  await expect(page.getByRole('button', { name: /play|pause/i })).toBeVisible()
  await expect(page.getByLabel('speed')).toBeVisible()
  const timeline = page.getByLabel('timeline')
  await expect(timeline).toBeVisible()

  // cursor overlay present (mouse track aligns with recording start at offset 0)
  await expect(page.locator('#replay-cursor')).toBeVisible()

  // seek to the end so the reconstructed answer (bdm:trial_ended) is applied
  await timeline.evaluate((el) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, input.max)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  // option index 2 (value 1) → "Several days" shows selected in read-only mode
  await expect(page.locator('label.qv-option[data-selected="true"]')).toHaveText(/Several days/)

  mkdirSync('tests/e2e/screenshots', { recursive: true })
  await page.screenshot({ path: 'tests/e2e/screenshots/replay.png', fullPage: true })
})

test('a non-OK VS bundle response shows "Replay unavailable"', async ({ page }) => {
  let hit = false
  await page.route('**/v1/replay*', (r) =>
    (hit = true, r.fulfill({ status: 401, contentType: 'application/json', headers: CORS,
      body: JSON.stringify({ error: { code: 'invalid_replay_token' } }) })))

  await page.goto(replayHref('http://vs.mock/v1/replay?token=bad'))
  await expect.poll(() => hit).toBe(true)
  await expect(page.getByRole('heading', { name: 'Replay unavailable' })).toBeVisible()
})

test('multi-select answers replay as the recorded checkboxes', async ({ page }) => {
  await page.route('**/v1/replay*', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: msBundle }))
  await page.goto(replayHref('http://vs.mock/v1/replay?token=ms'))
  // Every item is also wrapped in a <fieldset> (implicit role="group", named by its <legend>), so
  // getByRole('group', {name}) is ambiguous here—unlike role="radiogroup" for single-select, which
  // doesn't collide with the fieldset. Target the CheckboxGroup's own div directly instead.
  await expect(page.locator('div[role="group"][aria-label="Which apply to you?"]')).toBeVisible()
  const timeline = page.getByLabel('timeline')
  await timeline.evaluate((el) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, input.max)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(page.locator('label.qv-option[data-selected="true"]')).toHaveCount(2)
  await expect(page.locator('label.qv-option[data-selected="true"]').filter({ hasText: 'Alpha' })).toHaveCount(1)
  await expect(page.locator('label.qv-option[data-selected="true"]').filter({ hasText: 'Gamma' })).toHaveCount(1)
})

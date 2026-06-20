import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/show_if_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a score can be authored in the Scores panel', async ({ page }) => {
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })
  await page.goto('/')
  await page.setInputFiles('input[type=file]', {
    name: 'show_if_demo.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()
  await page.getByRole('button', { name: /questionnaire settings/i }).click() // select the questionnaire root → q-level Inspector (first page is auto-selected on load)

  // ED-H3: Logic/Validation/Scoring are now inspector tabs — open the Scoring tab.
  await page.getByRole('tab', { name: /scoring/i }).click()
  // The Scores panel is in the questionnaire-root Inspector (nothing selected on load).
  await expect(page.getByRole('heading', { name: /^scores$/i })).toBeVisible()
  await page.getByRole('button', { name: /add score/i }).click()
  await page.getByLabel('Scorer ref').fill('scr_phq9@v26.0602')
  await page.getByLabel('Score path').fill('/total')

  // The summary row (the toggle button) reflects the authored score.
  await expect(page.getByText('score_1: scr_phq9@v26.0602 → /total')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d4-scoring.png', fullPage: true })
})

test('ED-D4b: PHQ-9 scores compute live in the preview', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /load phq-9 sample/i }).click()
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // Preview pane is open by default. Show the whole questionnaire so every item renders.
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Scope').selectOption('all')

  // Answer the first two items "Nearly every day" (value 3 each) → total 6 → severity "mild".
  // Click the <label.qv-option> (the radio input is sr-only / off-viewport).
  await preview.locator('label.qv-option', { hasText: 'Nearly every day' }).nth(0).click()
  await preview.locator('label.qv-option', { hasText: 'Nearly every day' }).nth(1).click()

  // Open the Scoring tab in the questionnaire-root Inspector (preview stays mounted → live values publish).
  await page.getByRole('button', { name: /questionnaire settings/i }).click()
  await page.getByRole('tab', { name: /scoring/i }).click()

  // The bundled PHQ-9 wasm ran: a live band/severity string appears (proves real computation,
  // not a coincidental digit). Generous timeout for the async wasm compile.
  await expect(page.getByText(/mild/i).first()).toBeVisible({ timeout: 15000 })

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d4b-live-score.png', fullPage: true })
})

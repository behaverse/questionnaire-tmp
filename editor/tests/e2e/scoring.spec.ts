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

  // The Scores panel is in the questionnaire-root Inspector (nothing selected on load).
  await expect(page.getByRole('heading', { name: /^scores$/i })).toBeVisible()
  await page.getByRole('button', { name: /add score/i }).click()
  await page.getByLabel('Scorer ref').fill('scr_phq9@v26.0602')
  await page.getByLabel('Score path').fill('/total')

  // The summary row (the toggle button) reflects the authored score.
  await expect(page.getByText('score_1: scr_phq9@v26.0602 → /total')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d4-scoring.png', fullPage: true })
})

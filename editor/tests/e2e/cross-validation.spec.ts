import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/cross_validation_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a cross-question validation rule shows its message in the preview when tripped', async ({ page }) => {
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })
  await page.goto('/')
  await page.setInputFiles('input[type=file]', {
    name: 'cross_validation_demo.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()
  await page.getByRole('button', { name: /questionnaire settings/i }).click() // select the questionnaire root → q-level Inspector (first page is auto-selected on load)
  // ED-H3: Logic/Validation/Scoring are now inspector tabs — open the Validation tab.
  await page.getByRole('tab', { name: /validation/i }).click()
  // The Validation panel shows the authored rule at the questionnaire root.
  await expect(page.getByText(/validation rules/i)).toBeVisible()

  const preview = page.getByRole('region', { name: /preview/i })
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Do you want to continue?' })).toBeVisible()
  await preview.getByText('No').click()
  await expect(preview.getByText('Please reconsider your choice')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d3b-cross-validation.png', fullPage: true })
})

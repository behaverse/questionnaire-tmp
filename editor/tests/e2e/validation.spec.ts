import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/validation_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a per-question range shows an inline validation error in the preview', async ({ page }) => {
  // Stub the Library entity endpoint so pinned refs resolve to real text.
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })

  await page.goto('/')

  // Load the questionnaire portion of the bundle.
  await page.setInputFiles('input[type=file]', {
    name: 'validation_demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // Open the preview pane.
  await page.getByRole('button', { name: '▢ Preview' }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await expect(preview.locator('h2.qv-prompt', { hasText: 'How old are you?' })).toBeVisible()

  // Enter an out-of-range age → the inline validation message appears.
  await preview.getByRole('spinbutton').fill('999')
  await expect(preview.getByText('Enter an age between 0 and 120')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d3a-validation.png', fullPage: true })
})

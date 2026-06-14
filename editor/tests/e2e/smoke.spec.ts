import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const fixturePath = fileURLToPath(new URL('../../src/__fixtures__/kitchensink.json', import.meta.url))

test('open a file → reorder → export → screenshot', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /questionnaire editor/i })).toBeVisible()

  await page.setInputFiles('input[type=file]', fixturePath)

  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  await page.getByRole('navigation', { name: /structure/i }).getByText(/page|introduction/i).first().click()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-a-workspace.png', fullPage: true })

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export/i }).click(),
  ])
  const path = await download.path()
  const json = JSON.parse(readFileSync(path!, 'utf8'))
  expect(json.metadata.id).toBeTruthy()
})

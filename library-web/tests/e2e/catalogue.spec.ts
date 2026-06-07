import { test, expect } from '@playwright/test'

// Requires the seeded Library Core on :8000 (see scripts/seed-and-serve.md) and
// VITE_API_BASE_URL pointing at it at build time.
test('search → open a questionnaire → see items → download JSON', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner')).toContainText('Questionnaire Library')

  // there should be results without any filter
  const firstResult = page.locator('article a').first()
  await expect(firstResult).toBeVisible()
  await firstResult.click()

  // detail page shows a heading and a Content section
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Content' })).toBeVisible()

  // download triggers a file
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /download json/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/@v\d{2}\.\d{4}\.json$/)
})

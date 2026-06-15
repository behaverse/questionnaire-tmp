import { test, expect } from '@playwright/test'

test('translate a prompt into a second language', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // The questionnaire root is selected by default → Inspector shows LanguagesField.
  // Add 'fr' as an available language before navigating to a page.
  await page.getByLabel('Add language').fill('fr')
  await page.getByRole('button', { name: /^add$/i }).click()

  // Add an item + author the primary (en) prompt.
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()
  // Use exact label to avoid matching the "Prompt text status" select added in ED-E.
  await page.getByLabel('Prompt text', { exact: true }).fill('How are you?')

  // Switch the editing language to fr → the Topbar switcher now shows fr.
  await page.getByLabel('Editing language').selectOption('fr')
  // The source-text hint under the fr textarea shows the primary (en) text.
  await expect(page.getByText(/primary: How are you\?/)).toBeVisible()
  // Type the French translation.
  await page.getByLabel('Prompt text', { exact: true }).fill('Comment ça va ?')

  // Open preview + switch preview locale to fr → translated text renders.
  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Preview language').selectOption('fr')
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Comment ça va ?' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-e-translation.png', fullPage: true })
})

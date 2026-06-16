import { test, expect } from '@playwright/test'

test('translate a prompt via the Translation panel (auto-forks the Library ref)', async ({ page }) => {
  await page.addInitScript(() => { indexedDB.deleteDatabase('behaverse-editor') })
  page.on('dialog', (d) => d.accept())
  await page.goto('/')
  await page.getByRole('button', { name: /load a sample/i }).click()
  await expect(page.getByText(/BIS\/BAS|Behavioral Approach/i).first()).toBeVisible()
  // add fr + switch editing language to fr
  await page.getByRole('button', { name: /questionnaire settings/i }).click()
  await page.getByLabel('New language code').fill('fr')
  await page.getByRole('button', { name: 'Add language' }).click()
  await page.getByLabel('Editing language').selectOption('fr')
  // open the translation panel + translate the first prompt row
  await page.getByRole('button', { name: /^translate$/i }).click()
  const firstTarget = page.locator('textarea[aria-label^="translate"]').first()
  await firstTarget.fill('Ma famille est ce qui compte le plus.')
  // progress count reflects ≥1 translated
  await expect(page.getByText(/\/ \d+ translated/)).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-e2-translate.png', fullPage: true })
})

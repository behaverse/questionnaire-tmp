import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Buffer } from 'node:buffer'

const fixturePath = fileURLToPath(
  new URL('../../src/__fixtures__/show_if_demo.json', import.meta.url),
)

test('show_if hides then reveals an element in the preview', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /questionnaire editor/i })).toBeVisible()

  // Load the fixture that has two items: q_control (choice: Yes/No) + q_dependent (text)
  const fixture = readFileSync(fixturePath, 'utf8')
  await page.setInputFiles('input[type=file]', {
    name: 'show_if_demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(fixture),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // Select the second element (q_dependent) in the structure tree.
  // Both items have inline content so the tree labels them "inline item".
  // The first "inline item" is q_control (index 0 in page elements);
  // the second is q_dependent (index 1). Use .nth(1) to target it.
  const tree = page.getByRole('navigation', { name: /structure/i })
  await tree.getByText('inline item').nth(1).click()

  // The Inspector shows the "Visible when…" ShowIfEditor section.
  await expect(page.getByText(/visible when/i)).toBeVisible()

  // Type the show_if condition into the "Expression" textarea and click Set.
  await page.getByLabel('Expression').fill("q_control == 'yes'")
  await page.getByRole('button', { name: 'Set', exact: true }).click()

  // Switch the Scope to "Whole questionnaire" so both items appear in the preview.
  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Scope').selectOption('all')

  // Before answering: the controlling question is visible, dependent is hidden.
  await expect(
    preview.locator('h2.qv-prompt', { hasText: 'Do you want to see more?' }),
  ).toBeVisible()
  await expect(
    preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' }),
  ).toHaveCount(0)

  // Click the "Yes" radio — RadioGroup renders <label> containing the text.
  await preview.getByText('Yes').click()

  // After answering Yes: the dependent element should now be visible.
  await expect(
    preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' }),
  ).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d1-show-if.png', fullPage: true })
})

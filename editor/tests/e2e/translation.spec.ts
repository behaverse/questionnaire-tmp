import { test, expect } from '@playwright/test'

test('translate a prompt into a second language', async ({ page }) => {
  // ED-I·A: "+ Add item" opens the reuse-first picker; stub the item list empty so
  // "Create new item" is offered immediately.
  await page.route('**/v1/entities/item?*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[],"total":0}' }))
  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()
  await page.getByRole('button', { name: /questionnaire settings/i }).click() // select the questionnaire root → q-level Inspector (first page is auto-selected on load)

  // The questionnaire root is selected by default → Inspector shows LanguagesField.
  // Add 'fr' as an available language before navigating to a page.
  await page.getByLabel('New language code').fill('fr')
  await page.getByRole('button', { name: 'Add language' }).click()

  // Add an item + author the primary (en) prompt.
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()
  await page.getByRole('button', { name: /create new item/i }).click()
  // Use exact label to avoid matching the "Prompt text status" select added in ED-E.
  await page.getByLabel('Prompt text', { exact: true }).fill('How are you?')

  // Switch the editing language to fr → the Topbar switcher now shows fr.
  await page.getByLabel('Editing language').selectOption('fr')
  // The source-text hint under the fr textarea shows the primary (en) text.
  await expect(page.getByText(/primary: How are you\?/)).toBeVisible()
  // Type the French translation.
  await page.getByLabel('Prompt text', { exact: true }).fill('Comment ça va ?')

  // Open preview + switch preview locale to fr → translated text renders.
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Preview language').selectOption('fr')
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Comment ça va ?' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-e-translation.png', fullPage: true })
})

test('auto-translate fills a row target in the Translate panel (ED-J1)', async ({ page }) => {
  await page.route('**/v1/entities/item?*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[],"total":0}' }))
  // stub the serverless MT proxy
  await page.route('**/api/translate', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"translation":"Comment ça va ?"}' }))

  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await page.getByRole('button', { name: /questionnaire settings/i }).click()
  await page.getByLabel('New language code').fill('fr')
  await page.getByRole('button', { name: 'Add language' }).click()
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()
  await page.getByRole('button', { name: /create new item/i }).click()
  await page.getByLabel('Prompt text', { exact: true }).fill('How are you?')

  // Open the side-by-side Translate panel and choose fr as the target.
  await page.getByRole('button', { name: /^translate$/i }).click()
  await page.getByRole('button', { name: 'fr' }).click() // empty-state: pick the existing target language

  // The new item also has a default (empty) option → several rows; the prompt row's Auto is the
  // enabled one (it has a source). Click the first enabled Auto and assert the prompt target fills.
  await page.locator('button[aria-label="Auto"]:not([disabled])').first().click()
  await expect(page.getByRole('textbox', { name: /translate pr_/ }).first()).toHaveValue('Comment ça va ?')
})

test('Translation Workbench: load untranslated Library prompts + auto-translate (ED-J2)', async ({ page }) => {
  await page.route('**/v1/entities/prompt?*', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"items":[{"id":"pr_a","version":"v26.0606","title":"mood","entity_type":"prompt"}],"total":1}' }))
  await page.route('**/v1/entities/prompt/pr_a/versions/**/definition', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"id":"pr_a","content":{"en":{"status":"complete","text":"How are you?"}}}' }))
  await page.route('**/api/translate', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"translation":"Comment ça va ?"}' }))

  await page.goto('/')
  await page.getByRole('button', { name: /translate library entities/i }).click()
  await page.getByLabel('Target language').fill('fr')
  await page.getByRole('button', { name: /^load$/i }).click()
  await expect(page.getByText('How are you?')).toBeVisible()
  await page.getByRole('button', { name: /^auto$/i }).first().click()
  await expect(page.getByRole('textbox', { name: /target pr_a/ }).first()).toHaveValue('Comment ça va ?')
})

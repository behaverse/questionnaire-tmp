import { test, expect } from '@playwright/test'

test('Library browser: browse a type + inspect an entity (ED-K1)', async ({ page }) => {
  await page.route('**/v1/entities/prompt?*', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"items":[{"id":"pr_mood","version":"v26.0606","title":"Mood","entity_type":"prompt"}],"total":1}' }))
  await page.route('**/v1/entities/prompt/pr_mood/versions/**/definition', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"id":"pr_mood","construct":"mood","content":{"en":{"text":"How is your mood?"}}}' }))

  await page.goto('/')
  await page.getByRole('button', { name: 'Library entities', exact: true }).click()
  await expect(page.getByText('pr_mood')).toBeVisible()
  await page.getByText('pr_mood').click()
  await expect(page.getByText('How is your mood?')).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-k1-library-browser.png', fullPage: true })
})

test('Library browser: edit an entity → contribution available; complete locks (ED-K2)', async ({ page }) => {
  await page.route('**/v1/entities/prompt?*', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"items":[{"id":"pr_mood","version":"v26.0606","title":"Mood","entity_type":"prompt"}],"total":1}' }))
  await page.route('**/v1/entities/prompt/pr_mood/versions/**/definition', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"id":"pr_mood","content":{"en":{"status":"draft","text":"How is your mood?"}}}' }))

  await page.goto('/')
  await page.getByRole('button', { name: 'Library entities', exact: true }).click()
  await page.getByText('pr_mood').click()
  await page.getByRole('tab', { name: /edit/i }).click()
  await page.getByLabel('Prompt text', { exact: true }).fill('How is your mood today?')
  await expect(page.getByRole('button', { name: /download contribution/i })).toBeVisible()
  // mark complete → the editor input locks (read-only)
  await page.getByLabel('Entity status').selectOption('complete')
  await expect(page.getByLabel('Prompt text', { exact: true })).toBeDisabled()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-k2-library-edit.png', fullPage: true })
})

test('Library browser: Translate tab Auto fills a target locale (ED-K3)', async ({ page }) => {
  await page.route('**/v1/entities/prompt?*', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"items":[{"id":"pr_mood","version":"v26.0606","title":"Mood","entity_type":"prompt"}],"total":1}' }))
  await page.route('**/v1/entities/prompt/pr_mood/versions/**/definition', (r) => r.fulfill({ status: 200, contentType: 'application/json',
    body: '{"id":"pr_mood","content":{"en":{"status":"draft","text":"How is your mood?"}}}' }))
  await page.route('**/api/translate', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"translation":"Comment ça va ?"}' }))

  await page.goto('/')
  await page.getByRole('button', { name: 'Library entities', exact: true }).click()
  await page.getByText('pr_mood').click()
  await page.getByRole('tab', { name: /translate/i }).click()
  await page.getByLabel('Target locale', { exact: true }).fill('fr')
  await page.getByRole('button', { name: /^auto$/i }).first().click()
  await expect(page.getByRole('textbox', { name: /^target 0$/ }).first()).toHaveValue('Comment ça va ?')
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-k3-library-translate.png', fullPage: true })
})

test('start screen no longer offers the standalone Translate-Library-entities workbench (ED-K3)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Library entities', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /translate library entities/i })).toHaveCount(0)
})

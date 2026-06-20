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

import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/show_if_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('show_if hides then reveals an element in the preview', async ({ page }) => {
  // Stub the Library entity endpoint so pinned refs resolve to real text.
  // Key pattern mirrors smoke.spec.ts test 2: `{type}/{id}` from the URL path.
  await page.route('**/v1/entities/**', async (route) => {
    const url = new URL(route.request().url())
    const m = url.pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const key = m ? `${m[1]}/${m[2]}` : ''
    const body = bundle.entities[key]
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /questionnaire editor/i })).toBeVisible()

  // Load only the questionnaire portion (the editor accepts plain questionnaire JSON).
  await page.setInputFiles('input[type=file]', {
    name: 'show_if_demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // Select the second element (it_dependent) in the structure tree.
  // Items use pinned PromptRef so tree labels are "inline · pr_show_if_dependent@v26.0615".
  const tree = page.getByRole('navigation', { name: /structure/i })
  await tree.getByText(/pr_show_if_dependent/).click()

  // The Inspector shows the "Visible when…" ShowIfEditor section.
  await expect(page.getByText(/visible when/i)).toBeVisible()

  // Type the show_if condition and click Set.
  await page.getByLabel('Expression').fill("it_control == 'yes'")
  await page.getByRole('button', { name: 'Set', exact: true }).click()

  // Switch to Preview; set Scope to whole questionnaire so both items appear.
  await page.getByRole('button', { name: '▢ Preview' }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Scope').selectOption('all')

  // Control prompt must be visible throughout (proves stub resolved real text).
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Do you want to see more?' })).toBeVisible()

  // Before answering: dependent prompt is hidden.
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toHaveCount(0)

  // Click the "Yes" radio — RadioGroup renders <label> containing the text.
  await preview.getByText('Yes').click()

  // After answering Yes: the dependent element's prompt is now visible.
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d1-show-if.png', fullPage: true })
})

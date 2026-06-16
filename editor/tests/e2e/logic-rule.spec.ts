import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/show_if_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a visibility rule hides an element in the preview when its condition holds', async ({ page }) => {
  // Stub the Library entity endpoint so pinned refs resolve to real text.
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /questionnaire editor/i })).toBeVisible()

  // Load the questionnaire portion (the editor accepts plain questionnaire JSON).
  await page.setInputFiles('input[type=file]', {
    name: 'show_if_demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()
  await page.getByRole('button', { name: /questionnaire settings/i }).click() // select the questionnaire root → q-level Inspector (first page is auto-selected on load)

  // Logic panel is in the questionnaire-root Inspector (nothing selected on load).
  await expect(page.getByText(/logic rules/i)).toBeVisible()

  // Scope to the Logic rules panel header row to avoid strict-mode collision with
  // the Validation rules panel which also has a "+ Add rule" button. The heading
  // and its sibling button share the same parent flex row (<div class="flex…">).
  const logicRulesHeading = page.getByRole('heading', { name: 'Logic rules' })
  const logicAddRuleBtn = logicRulesHeading.locator('xpath=../button')

  // Add a new rule — LogicPanel sets openIdx to the new rule, so the editor auto-opens.
  await logicAddRuleBtn.click()

  // If the rule editor did not auto-open, click the summary row to open it.
  const ruleTypeSelect = page.getByLabel('Rule type')
  const ruleEditorVisible = await ruleTypeSelect.isVisible().catch(() => false)
  if (!ruleEditorVisible) {
    // "Edit rule 1" is only in the Logic rules panel (Validation uses "Edit validation rule N").
    await page.getByRole('button', { name: /edit rule 1/i }).click()
  }

  // Set type to visibility (default is skip).
  await page.getByLabel('Rule type').selectOption('visibility')

  // Choose the target element.
  await page.getByLabel('Target element').selectOption('it_dependent')

  // Show is unchecked by default → hide-when-true.
  // Verify it is unchecked (default) — no action needed.
  const showCheckbox = page.getByLabel('Show when condition is true')
  await expect(showCheckbox).not.toBeChecked()

  // Type the condition into the Expression textarea.
  await page.getByLabel('Expression').fill("it_control == 'yes'")

  // Open the preview pane.
  const preview = page.getByRole('region', { name: /preview/i })

  // Set scope to whole questionnaire so both items appear.
  await preview.getByLabel('Scope').selectOption('all')

  // Before answering: dependent prompt is VISIBLE (condition is false — no answer yet).
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toBeVisible()

  // Click "Yes" — triggers the hide-rule condition.
  await preview.getByText('Yes').click()

  // After answering Yes: the dependent element is now HIDDEN (hide-rule condition true).
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toHaveCount(0)

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d2a-logic-rule.png', fullPage: true })
})

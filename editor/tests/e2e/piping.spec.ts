import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { Buffer } from 'node:buffer'

const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/show_if_demo.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('a piping rule inserts the source answer into a target prompt in the preview', async ({ page }) => {
  // Stub the Library entity endpoint so pinned refs resolve to real text.
  await page.route('**/v1/entities/**', async (route) => {
    const m = new URL(route.request().url()).pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const body = m ? bundle.entities[`${m[1]}/${m[2]}`] : undefined
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: /questionnaire editor/i })).toBeVisible()

  // Load the questionnaire portion of the bundle.
  await page.setInputFiles('input[type=file]', {
    name: 'show_if_demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(bundle.questionnaire)),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

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

  // Set type to piping.
  await page.getByLabel('Rule type').selectOption('piping')

  // Choose the source question (the control item whose answer gets piped).
  await page.getByLabel('Source question').selectOption('it_control')

  // Choose the target prompt. The fixture has page id `page_1`, it_dependent at element index 1.
  // Confirmed: it_control (index 0) option "Yes" stores value "yes" (lowercase).
  await page.getByLabel('Target prompt').selectOption('pages.page_1.elements.1.prompt')

  // Set condition to always-true so piping fires unconditionally.
  await page.getByLabel('Expression').fill('true')

  // Open the preview pane.
  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })

  // Set scope to whole questionnaire so both items appear on the same view.
  await preview.getByLabel('Scope').selectOption('all')

  // Before answering: the dependent prompt shows its original text ("Bonus question revealed!").
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toBeVisible()

  // Click "Yes" on the control question — this stores answer value "yes".
  await preview.getByText('Yes').click()

  // After answering: the piped text replaces the dependent prompt.
  // The piped value is the stored option value: "yes" (lowercase — confirmed in fixture).
  await expect(preview.locator('h2.qv-prompt', { hasText: 'yes' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-d2b-piping.png', fullPage: true })
})

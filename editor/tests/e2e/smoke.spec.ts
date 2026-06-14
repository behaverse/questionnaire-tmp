import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Buffer } from 'node:buffer'

const fixturePath = fileURLToPath(new URL('../../src/__fixtures__/kitchensink.json', import.meta.url))
const bundle = JSON.parse(
  readFileSync(new URL('../../src/__fixtures__/preview_bundle.json', import.meta.url), 'utf8'),
) as { questionnaire: unknown; entities: Record<string, unknown> }

test('open a file → select → export → screenshot', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /questionnaire editor/i })).toBeVisible()

  await page.setInputFiles('input[type=file]', fixturePath)

  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // Select a structure row (drives the inspector). Programmatic reorder is covered
  // by the vitest unit/component tests (model/tree.test.ts reorder + StructureTree),
  // so this e2e stays a deterministic open → select → export → screenshot path
  // rather than depending on a flaky dnd-kit keyboard drag across the seeded
  // fixture's interleaved (block / page / element) rows.
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page|introduction|part/i).first().click()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-a-workspace.png', fullPage: true })

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    // exact name: an "Export bundle" button now also exists (ED-C2a), so a loose
    // /export/i regex matches two buttons (strict-mode violation).
    page.getByRole('button', { name: 'Export', exact: true }).click(),
  ])
  const path = await download.path()
  const json = JSON.parse(readFileSync(path!, 'utf8'))
  expect(json.metadata.id).toBeTruthy()
})

test('toggle preview → renders resolved content via the renderer', async ({ page }) => {
  // stub the Library entity endpoint from the bundle's entities map
  await page.route('**/v1/entities/**', async (route) => {
    const url = new URL(route.request().url())
    const m = url.pathname.match(/\/v1\/entities\/([^/]+)\/([^/]+)/)
    const key = m ? `${m[1]}/${m[2]}` : ''
    const body = bundle.entities[key]
    if (body) await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    else await route.fulfill({ status: 404, body: '{}' })
  })

  await page.goto('/')
  const qJson = JSON.stringify(bundle.questionnaire)
  await page.setInputFiles('input[type=file]', { name: 'preview_demo.json', mimeType: 'application/json', buffer: Buffer.from(qJson) })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  // The renderer emits both an sr-only <legend> and a visible <h2 class="qv-prompt">
  // with the prompt text; scope to the visible heading to avoid a strict-mode match.
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Do you enjoy building editors?' })).toBeVisible()
  await expect(preview.getByText('Yes')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-b-preview.png', fullPage: true })
})

test('select an inline item → Option editor → add a choice → screenshot', async ({ page }) => {
  const fixture = readFileSync(
    fileURLToPath(new URL('../../src/__fixtures__/option_demo.json', import.meta.url)),
    'utf8',
  )
  await page.goto('/')
  await page.setInputFiles('input[type=file]', {
    name: 'option_demo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(fixture),
  })
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // select the inline item row in the tree (label is `inline · pr_demo@v26.0609`)
  await page
    .getByRole('navigation', { name: /structure/i })
    .getByText(/pr_demo@v26\.0609/)
    .click()

  // the Option editor is shown in the canvas
  await expect(page.getByText(/renders as/i)).toBeVisible()
  // Playwright has no getByDisplayValue (Testing Library only); assert the choice
  // label <input> by its aria-label + value instead.
  await expect(page.getByLabel('Label for choice 1')).toHaveValue('Disagree')

  await page.getByRole('button', { name: /add choice/i }).click()
  // a third row appears
  await expect(page.getByLabel('Label for choice 3')).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c1-option-editor.png', fullPage: true })
})

test('add a new item, type a prompt, see it in the preview', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // select page 1 in the tree, then add an item
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()

  // PromptEditor appears; type a prompt. Playwright exposes getByLabel (not
  // getByLabelText, which is Testing Library only).
  const promptText = page.getByLabel(/prompt text/i)
  await expect(promptText).toBeVisible()
  await promptText.fill('How are you today?')

  // open preview → the new prompt renders (pool-resolved). The renderer emits a
  // visible <h2 class="qv-prompt"> with the prompt text; scope to it to avoid a
  // strict-mode match against the sr-only <legend>.
  await page.getByRole('button', { name: /preview/i }).click()
  await expect(
    page.getByRole('region', { name: /preview/i }).locator('h2.qv-prompt', { hasText: 'How are you today?' }),
  ).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c2a-new-item.png', fullPage: true })
})

test('add a message + a context to a new item, type both, preview them', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()

  // add a message, fill its text
  await page.getByRole('button', { name: /add message/i }).click()
  await page.getByLabel(/message text/i).fill('Welcome to the study')

  // add an item, add a context to it, fill prompt + context
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()
  await page.getByLabel(/prompt text/i).fill('How do you feel?')
  await page.getByRole('button', { name: /add context/i }).click()
  await page.getByLabel(/context text/i).fill('Think about the past week.')

  // preview shows the prompt + context
  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await expect(preview.locator('h2.qv-prompt', { hasText: 'How do you feel?' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c2b-context-message.png', fullPage: true })
})

test('pick a prompt from the Library into a new item', async ({ page }) => {
  // stub Library search (list) + entity body. Both the picker's body fetch and the
  // preview resolver hit the same `…/definition` route, so one stub serves both.
  await page.route('**/v1/entities/prompt?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 'pr_lib_mood', version: 'v26.0609', title: null, entity_type: 'prompt' }],
        total: 1,
      }),
    })
  })
  await page.route('**/v1/entities/prompt/pr_lib_mood/versions/v26.0609/definition', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'pr_lib_mood',
        content: { en: { status: 'validated', text: 'Library: how is your mood?' } },
      }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click() // a new item is selected
  await page.getByRole('button', { name: /pick prompt/i }).click() // open the picker
  await page.getByLabel(/search/i).fill('mood')
  await page.getByText('pr_lib_mood').click()
  await expect(page.getByText('Library: how is your mood?')).toBeVisible() // snippet
  await page.getByRole('button', { name: /insert/i }).click()

  // preview shows the picked Library prompt (same stubbed `…/definition` route resolves it)
  await page.getByRole('button', { name: /preview/i }).click()
  await expect(
    page.getByRole('region', { name: /preview/i }).locator('h2.qv-prompt', { hasText: 'Library: how is your mood?' }),
  ).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c3a-pick-library.png', fullPage: true })
})

import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const fixturePath = fileURLToPath(new URL('../../src/__fixtures__/kitchensink.json', import.meta.url))

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
    page.getByRole('button', { name: /export/i }).click(),
  ])
  const path = await download.path()
  const json = JSON.parse(readFileSync(path!, 'utf8'))
  expect(json.metadata.id).toBeTruthy()
})

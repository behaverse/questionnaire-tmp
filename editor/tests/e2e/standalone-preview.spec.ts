import { test, expect } from '@playwright/test'

const bundle = {
  questionnaire: {
    '@context': 'https://behaverse.org/schemas/questionnaire/context.jsonld',
    metadata: { id: 'qst_standalone_demo', title: 'Standalone Demo', language: 'en' },
    pages: [{ id: 'p1', elements: [
      { id: 'it_control', question: { prompt: { content: { en: { status: 'complete', text: 'Do you want to see more?' } } } },
        option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
          options: [{ index: 1, value: 'yes' }, { index: 2, value: 'no' }],
          content: { en: { options: [{ index: 1, text: 'Yes' }, { index: 2, text: 'No' }] } } } },
      { id: 'it_extra', show_if: "it_control == 'yes'",
        question: { prompt: { content: { en: { status: 'complete', text: 'Bonus question revealed!' } } } },
        option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
    ] }],
  },
  entities: {},
}

test('standalone preview renders a bundle + show_if works with no backend', async ({ page }) => {
  await page.addInitScript((b) => { sessionStorage.setItem('qv-preview-bundle', JSON.stringify(b)) }, bundle)
  await page.goto('/preview.html')
  await expect(page.getByText(/not a deployment/i)).toBeVisible()
  await expect(page.locator('h2.qv-prompt', { hasText: 'Do you want to see more?' })).toBeVisible()
  await expect(page.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toHaveCount(0)
  await page.getByText('Yes').click()
  await expect(page.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-f-standalone-preview.png', fullPage: true })
})

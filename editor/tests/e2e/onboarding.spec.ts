import { test, expect } from '@playwright/test'

test('load sample renders offline + back-to-home returns to start', async ({ page }) => {
  // start clean: delete the autosave DB before app scripts run.
  await page.addInitScript(() => { indexedDB.deleteDatabase('behaverse-editor') })
  // register the dirty-guard confirm handler early (loading a sample may mark the draft dirty).
  page.on('dialog', (d) => d.accept())
  await page.goto('/')
  await page.getByRole('button', { name: /load a sample/i }).click()
  await expect(page.getByText(/BIS\/BAS|Behavioral Approach/i).first()).toBeVisible()
  // open the in-app preview; assert NO placeholder banner (self-contained bundle resolves offline)
  await page.getByRole('button', { name: '▢ Preview' }).click()
  await expect(page.getByText(/referenced entities not loaded/i)).toHaveCount(0)
  await expect(page.locator('h2.qv-prompt').first()).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-g-sample.png', fullPage: true })
  // back to home (dirty-guard confirm auto-accepted by the handler above)
  await page.getByRole('button', { name: /home/i }).click()
  await expect(page.getByRole('button', { name: /load a sample/i })).toBeVisible()
})

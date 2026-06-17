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
  await expect(page.getByText(/referenced entities not loaded/i)).toHaveCount(0)
  await expect(page.locator('h2.qv-prompt').first()).toBeVisible()
  // layout: a long preview must scroll INSIDE its pane, not turn the whole window
  // into a scrollable page (the document root is overflow:hidden; panes scroll).
  const layout = await page.evaluate(() => {
    const de = document.documentElement
    const prevScroll = document.querySelector('section[aria-label="Preview"] .overflow-auto') as HTMLElement
    return {
      noWindowScrollbar: de.clientWidth >= window.innerWidth - 1,
      rootOverflowHidden: getComputedStyle(de).overflowY === 'hidden',
      previewScrollsInternally: prevScroll.scrollHeight > prevScroll.clientHeight + 2,
    }
  })
  expect(layout.noWindowScrollbar).toBe(true)
  expect(layout.rootOverflowHidden).toBe(true)
  expect(layout.previewScrollsInternally).toBe(true)
  // selecting a deep structure-tree item scrolls the preview to it.
  // (ED-H2: rows now show resolved prompt text + the bare id `pr_bisbas_q_20` — no @version;
  // scope to the structure nav since the canvas row button matches the same id too.)
  await page.getByRole('navigation', { name: /structure/i })
    .getByRole('button', { name: /pr_bisbas_q_20\b/ }).click()
  await expect.poll(() => page.evaluate(() =>
    Math.round((document.querySelector('section[aria-label="Preview"] .overflow-auto') as HTMLElement).scrollTop)
  )).toBeGreaterThan(100)
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-g-sample.png', fullPage: true })
  // back to home (dirty-guard confirm auto-accepted by the handler above)
  await page.getByRole('button', { name: /home/i }).click()
  await expect(page.getByRole('button', { name: /load a sample/i })).toBeVisible()
})

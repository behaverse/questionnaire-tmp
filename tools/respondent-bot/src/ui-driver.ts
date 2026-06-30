import type { Page } from '@playwright/test'
import type { Driver } from './driver'
import { runOnce } from './driver'
import type { Decision, ItemView } from './strategy'
import { makeRng, type Profile } from './profile'

const FINISH_TITLES: Record<string, string[]> = {
  en: ['Thank you!', 'Already completed', 'You declined to take part'],
  pt: ['Obrigado!', 'Já concluído', 'Recusou a participação'],
}
// Player nav/consent labels per locale (mirror web-viewer/src/app/chrome/strings.ts).
const NEXT_LABELS: Record<string, string> = { en: 'Next', pt: 'Seguinte' }
const CONSENT_AGREE: Record<string, string> = { en: 'I agree', pt: 'Concordo' }

function localeLabel(table: Record<string, string>, locale: string): string {
  return table[locale.split('-')[0] ?? 'en'] ?? table.en ?? ''
}

export function playerUrl(base: string, p: { deploymentId: string; vsBaseUrl: string; locale: string }): string {
  const u = new URL(base)
  u.searchParams.set('deployment', p.deploymentId)
  u.searchParams.set('viewer_url', p.vsBaseUrl)
  u.searchParams.set('locale', p.locale)
  return u.toString()
}

/**
 * The one Playwright driver. `direct: false` (default) is the realistic lane — real pointer
 * motion (scroll → click) and per-character typing for human-like traces; `direct: true` is the
 * fast lane for bulk fixture generation. A separate DirectDriver class is intentionally avoided —
 * the lanes differ only in how `apply()` actuates a control, not in what they read or decide.
 * Note: choice radios are sr-only, so both lanes click the wrapping <label>; the observable
 * difference is text entry (`fill` vs per-character `type`).
 */
export class UiDriver implements Driver {
  constructor(private page: Page, private opts: { locale: string; direct?: boolean }) {}

  async consentIfPresent(): Promise<boolean> {
    const agree = this.page.getByRole('button', { name: localeLabel(CONSENT_AGREE, this.opts.locale) })
    if (await agree.isVisible().catch(() => false)) { await agree.click(); return true }
    return false
  }

  async atFinish(): Promise<boolean> {
    const titles = FINISH_TITLES[this.opts.locale.split('-')[0] ?? 'en'] ?? FINISH_TITLES.en ?? []
    for (const name of titles) {
      if (await this.page.getByRole('heading', { name }).isVisible().catch(() => false)) return true
    }
    return false
  }

  async readItems(): Promise<ItemView[]> {
    const items: ItemView[] = []
    // choice + number-rating: any radiogroup → pick the index-th radio
    for (const rg of await this.page.getByRole('radiogroup').all()) {
      const n = await rg.getByRole('radio').count()
      if (n > 0) items.push({ kind: 'choice', id: (await rg.getAttribute('aria-label')) ?? `rg_${items.length}`, nOptions: n })
    }
    // continuous number
    for (const sl of await this.page.getByRole('slider').all()) {
      const min = Number((await sl.getAttribute('min')) ?? '0')
      const max = Number((await sl.getAttribute('max')) ?? '100')
      const step = Number((await sl.getAttribute('step')) ?? '1') || 1
      items.push({ kind: 'number', id: (await sl.getAttribute('aria-label')) ?? `sl_${items.length}`, min, max, step })
    }
    // unbounded number
    for (const sp of await this.page.getByRole('spinbutton').all()) {
      const min = Number((await sp.getAttribute('min')) ?? '0')
      const max = Number((await sp.getAttribute('max')) ?? '100')
      items.push({ kind: 'number', id: (await sp.getAttribute('aria-label')) ?? `sp_${items.length}`, min, max, step: 1 })
    }
    // free text
    for (const tb of await this.page.getByRole('textbox').all()) {
      items.push({ kind: 'text', id: (await tb.getAttribute('aria-label')) ?? `tb_${items.length}` })
    }
    // unsupported (fail loudly, never skip — a missed item corrupts the trace)
    // Use exact attribute selector: getByRole('group') also matches role="radiogroup" (ARIA subtype), which we DO support.
    const groups = await this.page.locator('[role="group"]').count()
    if (groups > 0) throw new Error(`respondent-bot: unsupported control (checkbox/matrix group) on step — v1 supports radio/slider/number/text only`)
    return items
  }

  async apply(item: ItemView, decision: Decision): Promise<void> {
    if (item.kind === 'choice' && decision.kind === 'choice') {
      // Radio inputs are visually hidden (sr-only); click the wrapping <label> to trigger React onChange.
      const rg = this.page.getByRole('radiogroup', { name: item.id })
      const label = rg.locator('label').nth(decision.index)
      await label.scrollIntoViewIfNeeded()
      await label.click()
      return
    }
    if (item.kind === 'number' && decision.kind === 'number') {
      const ctrl = this.page.getByRole('slider', { name: item.id }).or(this.page.getByRole('spinbutton', { name: item.id }))
      await ctrl.fill(String(decision.value))
      return
    }
    if (item.kind === 'text' && decision.kind === 'text') {
      const tb = this.page.getByRole('textbox', { name: item.id })
      if (this.opts.direct) await tb.fill(decision.text)
      else { await tb.click(); await tb.type(decision.text, { delay: 15 }) }
      return
    }
    throw new Error(`respondent-bot: decision/item kind mismatch (${item.kind} vs ${decision.kind})`)
  }

  async next(): Promise<boolean> {
    const btn = this.page.getByRole('button', { name: localeLabel(NEXT_LABELS, this.opts.locale) })
    if (await btn.isVisible().catch(() => false)) { await btn.click(); return true }
    return false // terminal / submitting screen — no Next to click
  }
}

/** Set up event-POST + mint capture, drive one run, return the captured bodies. */
export async function drivePlayer(
  page: Page,
  opts: { playerBase: string; deploymentId: string; vsBaseUrl: string; locale: string; profile: Profile; seed: number; direct?: boolean },
): Promise<{ sessionId: string; eventBodies: unknown[]; finished: boolean; steps: number }> {
  const eventBodies: unknown[] = []
  let sessionId = ''
  page.on('request', (req) => {
    const url = req.url()
    if (req.method() !== 'POST') return
    if (/\/v1\/sessions\/[^/]+\/events$/.test(url)) {
      try { eventBodies.push(req.postDataJSON()) } catch { /* ignore non-JSON */ }
    }
  })
  page.on('response', async (res) => {
    if (res.request().method() === 'POST' && /\/v1\/sessions\/new$/.test(res.url())) {
      try { sessionId = String((await res.json()).session_id ?? '') } catch { /* ignore */ }
    }
  })

  await page.goto(playerUrl(opts.playerBase, opts))
  const driver = new UiDriver(page, { locale: opts.locale, direct: opts.direct })
  const sleep = (ms: number) => page.waitForTimeout(ms)
  const result = await runOnce(driver, opts.profile, { rng: makeRng(opts.seed), sleep })
  // let the final completed/submitted batch flush + POST
  await page.waitForTimeout(300)
  await page.waitForLoadState('networkidle').catch(() => {})
  return { sessionId, eventBodies, finished: result.finished, steps: result.steps }
}

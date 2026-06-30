import type { Page } from '@playwright/test'
import type { Driver } from './driver'
import { runOnce } from './driver'
import type { Decision, ItemView } from './strategy'
import { makeRng, type Profile } from './profile'
import { interpolatePath, MouseRecorder, type MouseSample, type Point } from './mouse'

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

const MOVE_STEPS = 12 // pointer hops per move (visible, smooth-ish, cheap)

// Demo-only overlay: a cursor dot that follows real mouse events. pointer-events:none so it never
// intercepts clicks. Injected via addInitScript before navigation when --show-cursor is set.
const CURSOR_INIT_SCRIPT = `(() => {
  const make = () => {
    if (document.getElementById('__bot_cursor')) return
    const c = document.createElement('div')
    c.id = '__bot_cursor'
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border:3px solid #e11d48;border-radius:50%;background:rgba(225,29,72,0.25);pointer-events:none;z-index:2147483647'
    document.body.appendChild(c)
  }
  const move = (e) => { const c = document.getElementById('__bot_cursor'); if (c) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' } }
  if (document.body) make(); else document.addEventListener('DOMContentLoaded', make)
  document.addEventListener('mousemove', move, true)
})()`

export function playerUrl(base: string, p: { deploymentId: string; vsBaseUrl: string; locale: string }): string {
  const u = new URL(base)
  u.searchParams.set('deployment', p.deploymentId)
  u.searchParams.set('viewer_url', p.vsBaseUrl)
  u.searchParams.set('locale', p.locale)
  return u.toString()
}

/**
 * The one Playwright driver. `direct: false` (default) is the realistic lane—it moves a real
 * (optionally visible) cursor along a path to each control then clicks, types text per character,
 * and records the motion via the `recorder`; `direct: true` is the fast lane (instant click/fill,
 * no movement, no samples) for bulk fixture generation. A separate DirectDriver class is
 * intentionally avoided—the lanes differ only in how `apply()`/`next()` actuate a control, not in
 * what they read or decide. Choice radios are sr-only, so the click targets the wrapping <label>.
 */
export class UiDriver implements Driver {
  constructor(private page: Page, private opts: { locale: string; direct?: boolean; recorder?: MouseRecorder }) {}
  private pos: Point = { x: 0, y: 0 }

  /** Realistic actuation: move the cursor along a visible path to the target, then click it.
   *  Records the path + press/release as Schema-4b samples. Falls back to a plain click if the
   *  element has no layout box (no path recorded for that control). */
  private async moveAndClick(target: import('@playwright/test').Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded().catch(() => {})
    const box = await target.boundingBox()
    if (!box) { await target.click(); return }
    const to: Point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    for (const p of interpolatePath(this.pos, to, MOVE_STEPS)) {
      await this.page.mouse.move(p.x, p.y)
      this.opts.recorder?.moveThrough([p], 'up')
    }
    this.opts.recorder?.press(to)
    await target.click() // cursor is already at `to`; Playwright click adds actionability without a visible jump
    this.opts.recorder?.release(to)
    this.pos = to
  }

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
      const label = this.page.getByRole('radiogroup', { name: item.id }).locator('label').nth(decision.index)
      if (this.opts.direct) { await label.scrollIntoViewIfNeeded(); await label.click() }
      else await this.moveAndClick(label)
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
      else { await this.moveAndClick(tb); await tb.type(decision.text, { delay: 15 }) }
      return
    }
    throw new Error(`respondent-bot: decision/item kind mismatch (${item.kind} vs ${decision.kind})`)
  }

  async next(): Promise<boolean> {
    const btn = this.page.getByRole('button', { name: localeLabel(NEXT_LABELS, this.opts.locale) })
    if (!(await btn.isVisible().catch(() => false))) return false // terminal / submitting screen
    if (this.opts.direct) await btn.click()
    else await this.moveAndClick(btn)
    return true
  }
}

/** Set up event-POST + mint capture, drive one run, return the captured bodies. */
export async function drivePlayer(
  page: Page,
  opts: { playerBase: string; deploymentId: string; vsBaseUrl: string; locale: string; profile: Profile; seed: number; direct?: boolean; showCursor?: boolean },
): Promise<{ sessionId: string; eventBodies: unknown[]; finished: boolean; steps: number; mouseSamples: MouseSample[] }> {
  const eventBodies: unknown[] = []
  let sessionId = ''
  page.on('request', (req) => {
    if (req.method() !== 'POST') return
    if (/\/v1\/sessions\/[^/]+\/events$/.test(req.url())) {
      try { eventBodies.push(req.postDataJSON()) } catch { /* ignore non-JSON */ }
    }
  })
  page.on('response', async (res) => {
    if (res.request().method() === 'POST' && /\/v1\/sessions\/new$/.test(res.url())) {
      try { sessionId = String((await res.json()).session_id ?? '') } catch { /* ignore */ }
    }
  })

  const recorder = opts.direct ? undefined : new MouseRecorder(() => Date.now())
  if (opts.showCursor) await page.addInitScript(CURSOR_INIT_SCRIPT)

  await page.goto(playerUrl(opts.playerBase, { deploymentId: opts.deploymentId, vsBaseUrl: opts.vsBaseUrl, locale: opts.locale }))
  const driver = new UiDriver(page, { locale: opts.locale, direct: opts.direct, recorder })
  const sleep = (ms: number) => page.waitForTimeout(ms)
  const result = await runOnce(driver, opts.profile, { rng: makeRng(opts.seed), sleep })
  await page.waitForTimeout(300)
  await page.waitForLoadState('networkidle').catch(() => {})
  return { sessionId, eventBodies, finished: result.finished, steps: result.steps, mouseSamples: recorder?.samples() ?? [] }
}

import { chromium } from '@playwright/test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolveProfile, type Profile } from './profile'
import { drivePlayer } from './ui-driver'
import { buildTrace, checkWellFormed } from './trace'

export type CliOpts = {
  player: string; deployment: string; vsBaseUrl: string; profile: string
  seed: number; n: number; direct: boolean; locale: string; trace?: string; showCursor: boolean
}

export function parseArgs(argv: string[]): CliOpts {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined
  }
  const player = get('--player')
  const deployment = get('--deployment')
  if (!player) throw new Error('missing --player <url>')
  if (!deployment) throw new Error('missing --deployment <id>')
  return {
    player, deployment,
    vsBaseUrl: get('--viewer-url') ?? 'http://localhost:8001',
    profile: get('--profile') ?? 'random',
    seed: Number(get('--seed') ?? '1'),
    n: Number(get('--n') ?? '1'),
    direct: argv.includes('--direct'),
    showCursor: argv.includes('--show-cursor'),
    locale: get('--locale') ?? 'en',
    trace: get('--trace'),
  }
}

export function loadProfile(value: string): Profile {
  if (value.endsWith('.json') || existsSync(value)) return JSON.parse(readFileSync(value, 'utf8')) as Profile
  return resolveProfile(value)
}

export async function main(argv: string[]): Promise<number> {
  const opts = parseArgs(argv)
  const profile = loadProfile(opts.profile)
  const browser = await chromium.launch({ headless: true })
  let failures = 0
  try {
    for (let i = 0; i < opts.n; i++) {
      const page = await browser.newPage()
      try {
        const res = await drivePlayer(page, {
          playerBase: opts.player, deploymentId: opts.deployment, vsBaseUrl: opts.vsBaseUrl,
          locale: opts.locale, profile, seed: opts.seed + i, direct: opts.direct, showCursor: opts.showCursor,
        })
        const trace = buildTrace(opts.deployment, res.sessionId, res.eventBodies, res.mouseSamples)
        const verdict = checkWellFormed(trace.statements)
        const ok = res.finished && verdict.ok
        if (!ok) { failures++; console.error(`run ${i}: FAILED (finished=${res.finished}, trace=${verdict.reason ?? 'ok'})`) }
        else console.log(`run ${i}: ok — session=${res.sessionId} steps=${res.steps} statements=${trace.statements.length}`)
        if (opts.trace) {
          const path = opts.n > 1 ? opts.trace.replace(/\.json$/, `.${i}.json`) : opts.trace
          writeFileSync(path, JSON.stringify(trace, null, 2))
        }
      } catch (e) {
        failures++; console.error(`run ${i}: ERROR — ${(e as Error).message}`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
  return failures === 0 ? 0 : 1
}

// run main() only when executed directly (not when imported by the test)
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2)).then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1) })
}

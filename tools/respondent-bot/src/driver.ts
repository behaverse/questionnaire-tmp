import type { Decision, ItemView } from './strategy'
import type { Profile } from './profile'
import { decide, thinkTime } from './strategy'

export interface Driver {
  /** Click "I agree" if a consent gate is showing; returns whether it acted. */
  consentIfPresent(): Promise<boolean>
  /** True once a finished / declined screen is shown. */
  atFinish(): Promise<boolean>
  /** Answerable controls on the current step, in document order ([] for message-only steps). */
  readItems(): Promise<ItemView[]>
  apply(item: ItemView, decision: Decision): Promise<void>
  /** Advance to the next step; returns false on a terminal screen with no Next button. */
  next(): Promise<boolean>
}

/** One full run: consent → (answer every item on a step → think → Next) until finished. */
export async function runOnce(
  driver: Driver,
  profile: Profile,
  opts: { rng: () => number; sleep: (ms: number) => Promise<void>; maxSteps?: number },
): Promise<{ steps: number; finished: boolean }> {
  await driver.consentIfPresent()
  const max = opts.maxSteps ?? 300
  let steps = 0
  while (steps < max) {
    if (await driver.atFinish()) return { steps, finished: true }
    for (const item of await driver.readItems()) {
      await driver.apply(item, decide(item, profile, opts.rng))
    }
    await opts.sleep(thinkTime(profile, opts.rng))
    if (!(await driver.next())) break // terminal screen (submitting → finished) has no Next button
    steps += 1
  }
  // the submitting interstitial renders no Next and isn't yet the finished screen; wait for it to settle
  for (let i = 0; i < 40 && !(await driver.atFinish()); i++) await opts.sleep(300)
  return { steps, finished: await driver.atFinish() }
}

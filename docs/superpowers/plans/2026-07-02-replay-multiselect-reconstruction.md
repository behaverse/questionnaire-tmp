# Multi-select replay reconstruction — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replay reconstructs multi-select (checkbox) answers by emitting the option index on `bdm:selected`/`bdm:deselected` and replaying that ordered stream.

**Architecture:** Capture change (the player emits `result.extensions["bdm:option_index"]` on selection events) + replay change (`reconstruct` folds the selected/deselected stream into a per-element `selectedIndices` set; `ReplayView` maps those indices to the option-value array `CheckboxGroup` renders). Single-select's `trial_ended` path is untouched. Forward-only: only sessions recorded after this ships replay their checkboxes.

**Tech Stack:** React 19 + TypeScript (web-viewer), Vitest + @testing-library/react (unit), Playwright (e2e via the respondent-bot harness).

## Global Constraints

- **Em-dashes, no spaces** in prose/comments: `word—word`, never `word — word`.
- **`bdm:` namespace** for event verbs and the new extension key `bdm:option_index` (OD-19; additive to the open `result.extensions` map, no schema bump).
- **Forward-only** is intended, not a bug: old multi-select recordings lack the index and stay blank.
- **Do NOT change single-select replay** — it works and its e2e/unit tests must stay green.
- **Renderer ships as a shared lib** (the editor consumes it): after web-viewer changes run `npm run build` AND `npm run build:lib`; confine changes to replay + capture so the editor is unaffected.
- Verify commands: `cd web-viewer && npm test && npm run build && npm run build:lib`; `cd tools/respondent-bot && npm run e2e -- replay.spec.ts`.

## File Structure

- `web-viewer/src/app/events.ts` — **modify.** `selected`/`deselected` builders take an optional `optionIndex`.
- `web-viewer/src/app/App.tsx` — **modify** (`handleAnswer`, ~445-457). Resolve + pass the option index.
- `web-viewer/src/app/events.test.ts` — **modify.** Builder emits/omits the extension.
- `web-viewer/src/app/App.test.tsx` — **modify.** Existing emission test also asserts `bdm:option_index`.
- `web-viewer/src/replay/reconstruct.ts` — **modify.** `RecAnswer.selectedIndices` + fold the stream in `stateAt`.
- `web-viewer/src/replay/reconstruct.test.ts` — **modify.** New selected/deselected cases.
- `web-viewer/src/replay/ReplayView.tsx` — **modify** (`toAnswerValue`). Multi-select → value array.
- `web-viewer/src/replay/ReplayView.test.tsx` — **modify.** Multi-select render test (inline runtime).
- `tools/respondent-bot/tests/e2e/fixtures/replay-bundle-multiselect.json` — **create.** Dedicated multi-select bundle.
- `tools/respondent-bot/tests/e2e/replay.spec.ts` — **modify.** New multi-select playback test.
- `web-viewer/docs/replay.md` — **modify.** Limitation → reconstructed (forward-only).
- `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md` — **modify.** Mark done.

---

### Task 1: Capture — emit `bdm:option_index` on selected/deselected

**Files:**
- Modify: `web-viewer/src/app/events.ts:25-26`
- Modify: `web-viewer/src/app/App.tsx:445-457`
- Test: `web-viewer/src/app/events.test.ts`, `web-viewer/src/app/App.test.tsx:240-263`

**Interfaces:**
- Produces: `ev.selected(a, optionId, choiceText, c, ts, optionIndex?)` and `ev.deselected(...)` — when `optionIndex` is a number, the event carries `result.extensions["bdm:option_index"]`; when `undefined`, no `result` is added.

- [ ] **Step 1: Write the failing builder test**

In `web-viewer/src/app/events.test.ts`, add:

```ts
it('selected/deselected carry bdm:option_index when given, and omit it when not', () => {
  const a = agentActor('ag')
  const c = { sessionId: 's1' }
  const withIdx = ev.selected(a, 'opt', 'Alpha', c, 't', 2)
  expect(withIdx.result?.extensions['bdm:option_index']).toBe(2)
  const noIdx = ev.selected(a, 'opt', 'Alpha', c, 't')
  expect(noIdx.result).toBeUndefined()
  expect(ev.deselected(a, 'opt', 'Alpha', c, 't', 3).result?.extensions['bdm:option_index']).toBe(3)
})
```

(If `agentActor` is not already imported in this test file, add it to the existing `import { ev, ... } from './events'` line.)

- [ ] **Step 2: Run it to verify it fails**

Run: `cd web-viewer && npm test -- events.test.ts`
Expected: FAIL — the builders take no 6th argument, so `withIdx.result` is `undefined`.

- [ ] **Step 3: Implement the builder change**

In `web-viewer/src/app/events.ts`, replace lines 25-26 with:

```ts
  selected: (a: Actor, optionId: string, choiceText: string, c: EventContext, ts: string, optionIndex?: number): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:selected', object: { objectType: 'bdm:Option', id: optionId, name: choiceText }, ...(optionIndex !== undefined ? { result: { extensions: { 'bdm:option_index': optionIndex } } } : {}), ...ctxExt(c) }),
  deselected: (a: Actor, optionId: string, choiceText: string, c: EventContext, ts: string, optionIndex?: number): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:deselected', object: { objectType: 'bdm:Option', id: optionId, name: choiceText }, ...(optionIndex !== undefined ? { result: { extensions: { 'bdm:option_index': optionIndex } } } : {}), ...ctxExt(c) }),
```

- [ ] **Step 4: Pass the builder test**

Run: `cd web-viewer && npm test -- events.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the index through `handleAnswer`**

In `web-viewer/src/app/App.tsx`, in the `choice` branch of `handleAnswer` (~445-457), add an `indexFor`
helper next to `textFor` and pass it at all three call sites. Replace the block:

```ts
        const textFor = (v: unknown) => choices.find((ch) => ch.value === v)?.text ?? String(v)
        const prev = state.answers[key]
        if (Array.isArray(value)) {
          const prevArr = Array.isArray(prev) ? prev : []
          const added = value.find((v) => !prevArr.includes(v))
          const removed = prevArr.find((v) => !value.includes(v))
          if (added !== undefined) p.batcher.add(ev.selected(p.agent, opt.id ?? key, textFor(added), c, nowIso()))
          if (removed !== undefined) p.batcher.add(ev.deselected(p.agent, opt.id ?? key, textFor(removed), c, nowIso()))
        } else if (value !== null) {
          p.batcher.add(ev.selected(p.agent, opt.id ?? key, textFor(value), c, nowIso()))
        }
```

with:

```ts
        const textFor = (v: unknown) => choices.find((ch) => ch.value === v)?.text ?? String(v)
        const indexFor = (v: unknown) => choices.find((ch) => ch.value === v)?.index
        const prev = state.answers[key]
        if (Array.isArray(value)) {
          const prevArr = Array.isArray(prev) ? prev : []
          const added = value.find((v) => !prevArr.includes(v))
          const removed = prevArr.find((v) => !value.includes(v))
          if (added !== undefined) p.batcher.add(ev.selected(p.agent, opt.id ?? key, textFor(added), c, nowIso(), indexFor(added)))
          if (removed !== undefined) p.batcher.add(ev.deselected(p.agent, opt.id ?? key, textFor(removed), c, nowIso(), indexFor(removed)))
        } else if (value !== null) {
          p.batcher.add(ev.selected(p.agent, opt.id ?? key, textFor(value), c, nowIso(), indexFor(value)))
        }
```

- [ ] **Step 6: Assert the wired index in the App emission test**

In `web-viewer/src/app/App.test.tsx`, in the test that already collects `events` and checks
`verbs).toContain('bdm:selected')` (~256-262), add after the `verbs` assertions:

```ts
  const selectedEv = events.find((e: { verb: string }) => e.verb === 'bdm:selected') as
    { result?: { extensions: Record<string, unknown> } }
  // the test answers it_1 with "Not at all" (option index 1)
  expect(selectedEv?.result?.extensions['bdm:option_index']).toBe(1)
```

- [ ] **Step 7: Run capture tests + typecheck**

Run: `cd web-viewer && npm test -- events.test.ts App.test.tsx && npm run build`
Expected: PASS; build (tsc) clean.

- [ ] **Step 8: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/app/events.ts web-viewer/src/app/App.tsx web-viewer/src/app/events.test.ts web-viewer/src/app/App.test.tsx
git commit -m "feat(web-viewer): emit bdm:option_index on selected/deselected events

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Reconstruct — fold selected/deselected into `selectedIndices`

**Files:**
- Modify: `web-viewer/src/replay/reconstruct.ts`
- Test: `web-viewer/src/replay/reconstruct.test.ts`

**Interfaces:**
- Consumes: statements with `bdm:selected`/`bdm:deselected` verbs carrying `result.extensions["bdm:option_index"]` (Task 1).
- Produces: `RecAnswer` now includes `selectedIndices?: number[]` (insertion-ordered, de-duped); `stateAt` folds the selection stream into the current element's answer. `trial_ended` now MERGES into the element's answer (was replace) so it does not clobber `selectedIndices`.

- [ ] **Step 1: Write the failing reconstruct tests**

In `web-viewer/src/replay/reconstruct.test.ts`, add:

```ts
  it('reconstructs multi-select from the selected/deselected stream', () => {
    const t = reconstruct([
      ev(0, 'bdm:started'),
      ev(1, 'bdm:trial_started', 'trial_ms'),
      ev(2, 'bdm:selected', undefined, { 'bdm:option_index': 1 }),
      ev(3, 'bdm:selected', undefined, { 'bdm:option_index': 3 }),
      ev(4, 'bdm:deselected', undefined, { 'bdm:option_index': 1 }),
      ev(5, 'bdm:trial_ended', 'trial_ms', { 'bdm:response_description': 'Gamma' }),
      ev(6, 'bdm:submitted'),
    ])
    // after both selects, before the deselect
    expect(t.stateAt(t.startMs + 3500).answers.ms.selectedIndices).toEqual([1, 3])
    // after the deselect and trial_ended (which must not clobber the set)
    expect(t.stateAt(t.endMs).answers.ms.selectedIndices).toEqual([3])
  })
  it('ignores selected events with no option index', () => {
    const t = reconstruct([
      ev(1, 'bdm:trial_started', 'trial_ms'),
      ev(2, 'bdm:selected'),
      ev(3, 'bdm:submitted'),
    ])
    expect(t.stateAt(t.endMs).answers.ms?.selectedIndices).toBeUndefined()
  })
```

- [ ] **Step 2: Run to verify failure**

Run: `cd web-viewer && npm test -- reconstruct.test.ts`
Expected: FAIL — `selectedIndices` is not produced.

- [ ] **Step 3: Implement**

In `web-viewer/src/replay/reconstruct.ts`, change the `RecAnswer` type:

```ts
export type RecAnswer = { optionIndex?: number; numeric?: number; description?: string; selectedIndices?: number[] }
```

Replace the body of `stateAt` (the `for` loop + its two `if` blocks) with:

```ts
  function stateAt(absMs: number): ReplayState {
    let elementKey: string | null = null
    const answers: Record<string, RecAnswer> = {}
    for (const r of rows) {
      if (r.absMs > absMs) break
      if (r.verb === 'bdm:trial_started' && r.elementKey) elementKey = r.elementKey
      if ((r.verb === 'bdm:selected' || r.verb === 'bdm:deselected') && elementKey) {
        const oi = r.ext['bdm:option_index']
        if (typeof oi === 'number') {
          const cur = answers[elementKey] ?? {}
          const set = cur.selectedIndices ? [...cur.selectedIndices] : []
          const pos = set.indexOf(oi)
          if (r.verb === 'bdm:selected') { if (pos === -1) set.push(oi) }
          else if (pos !== -1) set.splice(pos, 1)
          answers[elementKey] = { ...cur, selectedIndices: set }
        }
      }
      if (r.verb === 'bdm:trial_ended' && r.elementKey) {
        const a: RecAnswer = {}
        const oi = r.ext['bdm:response_option_index']
        const n = r.ext['bdm:response_numeric']
        const d = r.ext['bdm:response_description']
        if (typeof oi === 'number') a.optionIndex = oi
        if (typeof n === 'number') a.numeric = n
        if (typeof d === 'string') a.description = d
        answers[r.elementKey] = { ...answers[r.elementKey], ...a }
      }
    }
    return { elementKey, answers }
  }
```

(The only changes vs. the original: the new `bdm:selected`/`bdm:deselected` block, and the final line now merges `{ ...answers[r.elementKey], ...a }` instead of assigning `a`.)

- [ ] **Step 4: Run reconstruct tests**

Run: `cd web-viewer && npm test -- reconstruct.test.ts`
Expected: PASS — new cases pass AND all existing cases (bounds, current element, `fills answers`, revision override, order-independence, empty) still pass.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/replay/reconstruct.ts web-viewer/src/replay/reconstruct.test.ts
git commit -m "feat(web-viewer): reconstruct selectedIndices from selection stream

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: ReplayView — render the multi-select array

**Files:**
- Modify: `web-viewer/src/replay/ReplayView.tsx` (`toAnswerValue`)
- Test: `web-viewer/src/replay/ReplayView.test.tsx`

**Interfaces:**
- Consumes: `RecAnswer.selectedIndices` (Task 2), the element `option` (`input_data_type`, `selection`, `options[]`).
- Produces: for a `choice` element with `selection === 'multiple'` and non-empty `selectedIndices`, `toAnswerValue` returns the array of the corresponding option values; `CheckboxGroup` marks each `data-selected`.

- [ ] **Step 1: Write the failing render test**

In `web-viewer/src/replay/ReplayView.test.tsx`, add (uses an inline multi-select runtime so `mini.json` is untouched):

```ts
const multiRuntime = {
  metadata: { id: 'qst_ms', title: 'MS', language: 'en' }, locale: 'en',
  pages: [{ id: 'p1', elements: [{
    id: 'it_ms', question: { prompt: { content: { en: { text: 'Which apply?' } } } },
    option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'multiple',
      options: [{ index: 1, value: 'a' }, { index: 2, value: 'b' }, { index: 3, value: 'c' }],
      content: { en: { options: [{ index: 1, text: 'Alpha' }, { index: 2, text: 'Beta' }, { index: 3, text: 'Gamma' }] } } },
  }] }],
} as unknown as Runtime

const msStream: BdmEvent[] = [
  ev(1, 'bdm:trial_started', 'trial_it_ms'),
  ev(2, 'bdm:selected', undefined, { 'bdm:option_index': 1 }),
  ev(3, 'bdm:selected', undefined, { 'bdm:option_index': 3 }),
  ev(5, 'bdm:submitted'),
]

it('renders reconstructed multi-select checkboxes as selected', () => {
  render(<ReplayView runtime={multiRuntime} timeline={reconstruct(msStream)} cursorAt={() => null} />)
  fireEvent.change(screen.getByRole('slider', { name: /timeline/i }), { target: { value: String(reconstruct(msStream).durationMs) } })
  expect((screen.getByRole('checkbox', { name: /Alpha/i }) as HTMLInputElement).checked).toBe(true)
  expect((screen.getByRole('checkbox', { name: /Beta/i }) as HTMLInputElement).checked).toBe(false)
  expect((screen.getByRole('checkbox', { name: /Gamma/i }) as HTMLInputElement).checked).toBe(true)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd web-viewer && npm test -- ReplayView.test.tsx`
Expected: FAIL — Alpha/Gamma are not checked (no multi-select mapping yet).

- [ ] **Step 3: Implement the `toAnswerValue` multi-select branch**

In `web-viewer/src/replay/ReplayView.tsx`, update the `opt` cast type and add the multi-select branch at
the top of the choice handling. Replace `toAnswerValue` with:

```ts
function toAnswerValue(el: Step['elements'][number]['element'], a: RecAnswer): AnswerValue | undefined {
  const opt = (el as { option?: { input_data_type?: string; selection?: string; options?: { index: number; value: unknown }[] } }).option
  if (!opt) return undefined
  if (opt.input_data_type === 'choice' && opt.selection === 'multiple' && a.selectedIndices && a.selectedIndices.length) {
    const vals = a.selectedIndices
      .map((idx) => (opt.options ?? []).find((o) => o.index === idx)?.value)
      .filter((v) => v !== undefined)
    return vals as AnswerValue
  }
  if (opt.input_data_type === 'choice' && a.optionIndex != null) {
    const found = (opt.options ?? []).find((o) => o.index === a.optionIndex)
    if (found) return found.value as AnswerValue
  }
  if (a.numeric != null) return a.numeric as AnswerValue
  if (a.description != null) return a.description as AnswerValue
  return undefined
}
```

- [ ] **Step 4: Run + build:lib**

Run: `cd web-viewer && npm test -- ReplayView.test.tsx && npm run build && npm run build:lib`
Expected: PASS; both builds clean (the renderer lib rebuilds with the change).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/replay/ReplayView.tsx web-viewer/src/replay/ReplayView.test.tsx
git commit -m "feat(web-viewer): render reconstructed multi-select answers in replay

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: e2e — multi-select playback

**Files:**
- Create: `tools/respondent-bot/tests/e2e/fixtures/replay-bundle-multiselect.json`
- Modify: `tools/respondent-bot/tests/e2e/replay.spec.ts`

**Interfaces:**
- Consumes: the built player (Tasks 2-3) + the existing Playwright harness (route-mock `**/v1/replay*`, boot player on :5173). The fixture hand-authors `bdm:option_index` on its selected statements, so this test does not depend on Task 1's capture wiring.

- [ ] **Step 1: Create the multi-select bundle fixture**

Create `tools/respondent-bot/tests/e2e/fixtures/replay-bundle-multiselect.json`:

```json
{
  "runtime": {
    "provenance": { "source_questionnaire_id": "qst_ms", "source_questionnaire_version": "v26.0609", "locale": "en", "viewer_conformance_hash": "0000000000000000000000000000000000000000000000000000000000000000", "deployment_runtime_policy_hash": "0000000000000000000000000000000000000000000000000000000000000000", "generated_at": "2026-06-11T00:00:00Z", "denormaliser_version": "v26.0610" },
    "metadata": { "id": "qst_ms", "title": "Multi", "language": "en" },
    "locale": "en",
    "pages": [ { "id": "page_1", "elements": [ {
      "id": "it_ms", "required": false,
      "question": { "prompt": { "content": { "en": { "text": "Which apply to you?" } } } },
      "option": { "input_data_type": "choice", "measurement_type": "nominal", "selection": "multiple",
        "options": [ { "index": 1, "value": "a" }, { "index": 2, "value": "b" }, { "index": 3, "value": "c" } ],
        "content": { "en": { "options": [ { "index": 1, "text": "Alpha" }, { "index": 2, "text": "Beta" }, { "index": 3, "text": "Gamma" } ] } } }
    } ] } ]
  },
  "statements": [
    { "actor": { "id": "anon" }, "verb": "bdm:started", "object": { "id": "session" }, "timestamp": "2026-07-02T10:00:00.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:trial_started", "object": { "id": "trial_it_ms" }, "timestamp": "2026-07-02T10:00:01.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:selected", "object": { "objectType": "bdm:Option", "id": "it_ms", "name": "Alpha" }, "result": { "extensions": { "bdm:option_index": 1 } }, "timestamp": "2026-07-02T10:00:02.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:selected", "object": { "objectType": "bdm:Option", "id": "it_ms", "name": "Gamma" }, "result": { "extensions": { "bdm:option_index": 3 } }, "timestamp": "2026-07-02T10:00:03.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:trial_ended", "object": { "id": "trial_it_ms" }, "result": { "extensions": { "bdm:response_description": "Alpha; Gamma" } }, "timestamp": "2026-07-02T10:00:04.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:submitted", "object": { "id": "session" }, "timestamp": "2026-07-02T10:00:05.000Z" }
  ]
}
```

- [ ] **Step 2: Add the multi-select e2e test**

In `tools/respondent-bot/tests/e2e/replay.spec.ts`, add after the existing tests. Read the multi-select
fixture alongside the existing `bundle`:

```ts
const msBundle = readFileSync(fileURLToPath(new URL('./fixtures/replay-bundle-multiselect.json', import.meta.url)), 'utf8')

test('multi-select answers replay as the recorded checkboxes', async ({ page }) => {
  await page.route('**/v1/replay*', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: msBundle }))
  await page.goto(replayHref('http://vs.mock/v1/replay?token=ms'))
  await expect(page.getByRole('group', { name: 'Which apply to you?' })).toBeVisible()
  const timeline = page.getByLabel('timeline')
  await timeline.evaluate((el) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, input.max)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(page.locator('label.qv-option[data-selected="true"]')).toHaveCount(2)
  await expect(page.locator('label.qv-option[data-selected="true"]').filter({ hasText: 'Alpha' })).toHaveCount(1)
  await expect(page.locator('label.qv-option[data-selected="true"]').filter({ hasText: 'Gamma' })).toHaveCount(1)
})
```

- [ ] **Step 3: Run the e2e**

Run: `cd tools/respondent-bot && npm run e2e -- replay.spec.ts`
Expected: `3 passed` (the 2 existing single-select/error tests plus the new multi-select test).

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add tools/respondent-bot/tests/e2e/fixtures/replay-bundle-multiselect.json tools/respondent-bot/tests/e2e/replay.spec.ts
git commit -m "test(replay): e2e for multi-select checkbox playback

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Docs + status

**Files:**
- Modify: `web-viewer/docs/replay.md`
- Modify: `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md`

**Interfaces:**
- Consumes: Tasks 1-4. No code.

- [ ] **Step 1: Update the doc limitation**

In `web-viewer/docs/replay.md`, replace the multi-select "Known limitation" bullet (the paragraph starting
`- **Multi-select (checkbox) answers are not reconstructed.**`) with:

```markdown
- **Multi-select (checkbox) answers reconstruct from the selection stream** (forward-only). Replay folds the
  ordered `bdm:selected`/`bdm:deselected` events (each carrying `bdm:option_index`) into the checkbox state.
  Sessions recorded before this shipped lack `bdm:option_index` and replay blank.
```

- [ ] **Step 2: Mark done in the FOLLOWUPS + HANDOFF**

In each file, mark the "checkbox/multi-select reconstruction" follow-on done, matching that file's existing
spaced-em-dash strike-through idiom, dated 2026-07-02, referencing this slice:
- `web-viewer/FOLLOWUPS.md` — the "Multi-select … not reconstructed" bullet in the replay RP1/RP3 block.
- `viewer-service/FOLLOWUPS.md` — if it lists a mirror line (grep `multi-select`/`checkbox`); skip if absent.
- `HANDOFF.md` — remove "checkbox/multi-select reconstruction" from the #7 "Remaining (RP3 follow-ons)" list.

Read enough of each file to copy its exact idiom; keep edits surgical.

- [ ] **Step 3: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/docs/replay.md web-viewer/FOLLOWUPS.md viewer-service/FOLLOWUPS.md HANDOFF.md
git commit -m "docs: multi-select replay reconstruction done; refresh follow-ups + HANDOFF

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Finish the branch

- [ ] **Step 1: Full green**

Run: `cd web-viewer && npm test && npm run build && npm run build:lib` then
`cd tools/respondent-bot && npm run e2e -- replay.spec.ts`
Expected: web-viewer suite green (incl. new capture/reconstruct/ReplayView tests); both builds clean; e2e `3 passed`.

- [ ] **Step 2: Merge to master + push (no PR)**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git fetch origin
git switch master && git merge --ff-only origin/master
git merge --no-ff work/replay-multiselect -m "merge: #7 multi-select replay reconstruction (bdm:option_index)"
git push origin master
```

(If the push is rejected: `git fetch origin && git rebase origin/master work/replay-multiselect`, re-merge, retry. Never force-push the shared checkout.)

---

## Self-Review

**1. Spec coverage:**
- Capture (`bdm:option_index` on selected/deselected; App resolves index) → Task 1. ✅
- Reconstruct (`selectedIndices` from the stream; single-select untouched) → Task 2. ✅
- ReplayView (multi-select → value array) → Task 3. ✅
- Tests: capture (Task 1), reconstruct (Task 2), ReplayView (Task 3), e2e fixture/assertion (Task 4). ✅
- Doc + FOLLOWUPS + HANDOFF → Task 5. ✅
- Forward-only documented (Task 5 Step 1); single-select left intact (Tasks 2-3 keep the `trial_ended` path). ✅

**2. Placeholder scan:** No TBD/"add error handling"/"similar to Task N". All code blocks are complete.

**3. Type/name consistency:** `optionIndex?` param (Task 1) → `bdm:option_index` extension → read in `reconstruct.stateAt` (Task 2) → `RecAnswer.selectedIndices` → consumed in `ReplayView.toAnswerValue` (Task 3). `trial_ended` merge (`{ ...answers[key], ...a }`) preserves `selectedIndices` — verified against the existing `revision` test (still yields `{ numeric: 3 }`) and the `fills answers` test (unchanged, no selection events). e2e assertion targets (`role="group"`, `label.qv-option[data-selected="true"]`) match `CheckboxGroup.tsx`.

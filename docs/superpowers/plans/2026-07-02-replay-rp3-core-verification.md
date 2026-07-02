# Replay RP3 (core) — verify + document the live round-trip — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove — in a real browser — that the player's `?replay=<VS bundle url>` mode fetches, reconstructs, and renders a recorded session, and document the round-trip + its CORS requirement.

**Architecture:** One automated Playwright e2e piggybacks on the existing respondent-bot harness (which already boots the player on :5173): it route-mocks a **cross-origin** `GET /v1/replay?token=` with `Access-Control-Allow-Origin` and drives the player to `/?replay=<mocked url>`, asserting the question, the reconstructed answer, and the cursor overlay render (plus an error-path test). A short `web-viewer/` doc + one real full-stack manual check (screenshot captured) complete the evidence. No production code changes.

**Tech Stack:** Playwright (`@playwright/test`, already a respondent-bot dev-dep), the web-viewer Vite dev server, the existing RP1 replay renderer (`web-viewer/src/replay/*`), and the RP2 VS endpoints (unchanged).

## Global Constraints

- **Em-dashes, no spaces** in all prose/UI copy: `word—word`, never `word — word`. Prefer concise copy.
- **No PRs:** finish by merging `work/replay-rp3` → `master` locally + pushing; `git fetch origin` + ff/rebase **before every push** (a harvester agent shares this checkout).
- **`bdm:` namespace** for all event verbs in fixtures (OD-19).
- **Scope is RP3-core only.** Do NOT build: copy-replay-link UI, researcher session-list surface, dedicated `REPLAY_SIGNING_SECRET`/revocation, or live-follow. Those stay listed as deferred in the FOLLOWUPS.
- **No production code changes** — this is a verification + docs slice. If the manual check reveals a missing CORS origin, that is an env/config change (`VS_CORS_ORIGINS`), not code.
- Run the e2e via the existing command: `cd tools/respondent-bot && npm run e2e` (Playwright chromium is installed; the webServer boots `../../web-viewer`).

## File Structure

- `tools/respondent-bot/tests/e2e/fixtures/replay-bundle.json` — **new.** A VS-shaped replay bundle `{runtime, statements, mouse}`; top-level shape mirrors `build_replay_bundle()` (drift guard — see `viewer-service/tests/test_replay_api.py`). Reuses the `qst_mini` runtime already in `fixtures/mint.json`, trimmed to one page/one item.
- `tools/respondent-bot/tests/e2e/replay.spec.ts` — **new.** Two tests: valid-bundle playback (renders question + recorded answer + cursor; screenshots) and error-path ("Replay unavailable").
- `web-viewer/docs/replay.md` — **new.** Round-trip doc: the two `?replay=` modes, minting a link, the CORS requirement, known limits, manual-check screenshot.
- `web-viewer/FOLLOWUPS.md` — **modify.** Mark RP3-core done; keep the deferred RP3 items.
- `viewer-service/FOLLOWUPS.md` — **modify.** Mark RP3-core done under "Replay follow-ups / RP3".
- `HANDOFF.md` — **modify.** Refresh #7 status (RP3-core done; deferred items remain).

---

### Task 1: Player e2e — valid bundle + error path

**Files:**
- Create: `tools/respondent-bot/tests/e2e/fixtures/replay-bundle.json`
- Create: `tools/respondent-bot/tests/e2e/replay.spec.ts`
- Reuse (read-only, do not edit): `tools/respondent-bot/playwright.config.ts` (boots the player on :5173),
  `web-viewer/src/replay/{ReplayApp,ReplayView,reconstruct,cursor,load}.ts(x)`,
  `web-viewer/src/renderer/widgets/RadioGroup.tsx`.

**Interfaces:**
- Consumes: the running player at `http://localhost:5173/` with `?replay=<src>` → mounts `ReplayApp` (see `web-viewer/src/main.tsx`), which `fetch`es `src`, `reconstruct()`s the statements, and renders `ReplayView`.
- Bundle contract (what `loadBundle` requires and `reconstruct`/`cursor` read):
  - `runtime` — Schema-3 runtime object (has `metadata.id`, `locale`, `pages[]`).
  - `statements[]` — `bdm:` events. `reconstruct` reads: `verb`; `object.id` (an item's element is keyed `trial_<elementKey>`); `result.extensions["bdm:response_option_index"]` / `"bdm:response_numeric"` / `"bdm:response_description"`; `timestamp` (ISO, parsed by `Date.parse`).
  - `mouse[]` — `{t, x, y, button_state}`; `t` is seconds from `bdm:recording_started`.
- DOM produced by the renderer (assertion targets, verified against current source):
  - question: `<div role="radiogroup" aria-label="<prompt>">` (`RadioGroup.tsx:33`).
  - selected choice: `<label class="qv-option" data-selected="true">` containing the option text (`RadioGroup.tsx:37`).
  - cursor overlay: element `#replay-cursor` (`ReplayView.tsx:49`).
  - controls: Play/Pause `<button>`, `<input aria-label="timeline" type="range" max={durationMs}>`, `<select aria-label="speed">` (`ReplayView.tsx:52-60`).
  - error state: `<h1>Replay unavailable</h1>` (`ReplayApp.tsx:21`).

- [ ] **Step 1: Create the bundle fixture**

Create `tools/respondent-bot/tests/e2e/fixtures/replay-bundle.json`. The `runtime` is the `qst_mini`
runtime from `fixtures/mint.json`, trimmed to page_1 / item `it_1` (a single-select choice with two
options: index 1→value 0 "Not at all", index 2→value 1 "Several days"). The `statements` record a run
that selects option **index 2** ("Several days"); timestamps span 4000 ms so `durationMs === 4000`.
`bdm:recording_started` shares the start timestamp so the cursor aligns at offset 0.

```json
{
  "_comment": "VS-shaped replay bundle. Top-level keys {runtime,statements,mouse} mirror build_replay_bundle() — keep in sync with viewer-service/tests/test_replay_api.py::test_mint_then_fetch_bundle (asserts set(bundle) == {runtime,statements,mouse}).",
  "runtime": {
    "provenance": {
      "source_questionnaire_id": "qst_mini",
      "source_questionnaire_version": "v26.0609",
      "locale": "en",
      "viewer_conformance_hash": "0000000000000000000000000000000000000000000000000000000000000000",
      "deployment_runtime_policy_hash": "0000000000000000000000000000000000000000000000000000000000000000",
      "generated_at": "2026-06-11T00:00:00Z",
      "denormaliser_version": "v26.0610"
    },
    "metadata": { "id": "qst_mini", "title": "Mini PHQ", "language": "en" },
    "locale": "en",
    "pages": [
      {
        "id": "page_1",
        "elements": [
          {
            "id": "it_1",
            "required": true,
            "question": { "prompt": { "content": { "en": { "text": "Little interest or pleasure in doing things" } } } },
            "option": {
              "input_data_type": "choice",
              "measurement_type": "ordinal",
              "selection": "single",
              "options": [ { "index": 1, "value": 0 }, { "index": 2, "value": 1 } ],
              "content": { "en": { "options": [ { "index": 1, "text": "Not at all" }, { "index": 2, "text": "Several days" } ] } }
            }
          }
        ]
      }
    ]
  },
  "statements": [
    { "actor": { "id": "anon" }, "verb": "bdm:started", "object": { "id": "session" }, "timestamp": "2026-07-02T10:00:00.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:recording_started", "object": { "id": "session" }, "timestamp": "2026-07-02T10:00:00.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:trial_started", "object": { "id": "trial_it_1" }, "timestamp": "2026-07-02T10:00:01.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:trial_ended", "object": { "id": "trial_it_1" }, "result": { "extensions": { "bdm:response_option_index": 2 } }, "timestamp": "2026-07-02T10:00:03.000Z" },
    { "actor": { "id": "anon" }, "verb": "bdm:submitted", "object": { "id": "session" }, "timestamp": "2026-07-02T10:00:04.000Z" }
  ],
  "mouse": [
    { "t": 0, "x": 120, "y": 120, "button_state": "move" },
    { "t": 1, "x": 180, "y": 160, "button_state": "move" },
    { "t": 2, "x": 240, "y": 200, "button_state": "move" },
    { "t": 3, "x": 300, "y": 240, "button_state": "move" },
    { "t": 4, "x": 320, "y": 260, "button_state": "left_down" }
  ]
}
```

- [ ] **Step 2: Write the e2e spec**

Create `tools/respondent-bot/tests/e2e/replay.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const bundle = readFileSync(fileURLToPath(new URL('./fixtures/replay-bundle.json', import.meta.url)), 'utf8')

// The player fetches the VS bundle_url CROSS-ORIGIN, so the mocked response MUST send
// Access-Control-Allow-Origin — this mirrors the real VS requirement (player origin in VS_CORS_ORIGINS).
// Drop this header and the browser blocks the read: that failure is exactly what we are guarding.
const CORS = { 'access-control-allow-origin': '*' }
const BUNDLE_URL = 'http://vs.mock/v1/replay?token=demo' // a cross-origin VS URL, as a real replay_url carries
const replayHref = (u: string) => `/?replay=${encodeURIComponent(u)}`

test('valid VS bundle plays back: question, recorded answer, and cursor overlay render', async ({ page }) => {
  let hit = false
  await page.route('**/v1/replay*', (r) =>
    (hit = true, r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: bundle })))

  await page.goto(replayHref(BUNDLE_URL))

  // the real browser fetch to the (cross-origin) VS bundle URL happened
  await expect.poll(() => hit).toBe(true)

  // NOT the error state
  await expect(page.getByRole('heading', { name: 'Replay unavailable' })).toHaveCount(0)

  // the question + the replay controls render
  await expect(page.getByRole('radiogroup', { name: 'Little interest or pleasure in doing things' })).toBeVisible()
  await expect(page.getByRole('button', { name: /play|pause/i })).toBeVisible()
  await expect(page.getByLabel('speed')).toBeVisible()
  const timeline = page.getByLabel('timeline')
  await expect(timeline).toBeVisible()

  // cursor overlay present (mouse track aligns with recording start at offset 0)
  await expect(page.locator('#replay-cursor')).toBeVisible()

  // seek to the end so the reconstructed answer (bdm:trial_ended) is applied
  await timeline.evaluate((el) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
    setter.call(input, input.max)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })

  // option index 2 (value 1) → "Several days" shows selected in read-only mode
  await expect(page.locator('label.qv-option[data-selected="true"]')).toHaveText(/Several days/)

  mkdirSync('tests/e2e/screenshots', { recursive: true })
  await page.screenshot({ path: 'tests/e2e/screenshots/replay.png', fullPage: true })
})

test('a non-OK VS bundle response shows "Replay unavailable"', async ({ page }) => {
  let hit = false
  await page.route('**/v1/replay*', (r) =>
    (hit = true, r.fulfill({ status: 401, contentType: 'application/json', headers: CORS,
      body: JSON.stringify({ error: { code: 'invalid_replay_token' } }) })))

  await page.goto(replayHref('http://vs.mock/v1/replay?token=bad'))
  await expect.poll(() => hit).toBe(true)
  await expect(page.getByRole('heading', { name: 'Replay unavailable' })).toBeVisible()
})
```

- [ ] **Step 3: Run the e2e and confirm it passes**

Run: `cd tools/respondent-bot && npm run e2e -- replay.spec.ts`
Expected: `2 passed`. A `tests/e2e/screenshots/replay.png` is written showing the `it_1` question with
"Several days" selected and the red cursor overlay.

(If Playwright reports the webServer failed to start, the web-viewer dev server may already be bound to
:5173 — `reuseExistingServer` handles a running one; otherwise free the port. If the radiogroup assertion
times out, open the screenshot: a blank/error surface means the fetch/CORS mock regressed.)

- [ ] **Step 4: Confirm the test actually catches failure (sanity)**

Temporarily remove the `headers: CORS` from the first test's `fulfill`, re-run
`npm run e2e -- replay.spec.ts`, and confirm the valid-bundle test now FAILS (the cross-origin read is
blocked → "Replay unavailable"). Then restore `headers: CORS` and re-run to green. This proves the CORS
invariant is real, not vacuous. Do not commit the broken state.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add tools/respondent-bot/tests/e2e/replay.spec.ts tools/respondent-bot/tests/e2e/fixtures/replay-bundle.json
git commit -m "test(replay): #7 RP3 core — browser e2e for ?replay= VS-bundle round-trip

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

(Do not commit `tools/respondent-bot/tests/e2e/screenshots/` — confirm it is gitignored; if not, add it to `tools/respondent-bot/.gitignore` in this commit.)

---

### Task 2: Round-trip doc

**Files:**
- Create: `web-viewer/docs/replay.md`

**Interfaces:**
- Consumes: nothing at runtime. References the RP2 endpoints (`viewer-service/src/viewer_service/api/replay.py`) and the `?replay=` param (`web-viewer/src/main.tsx`).

- [ ] **Step 1: Write the doc**

Create `web-viewer/docs/replay.md`:

```markdown
# Replay — playing back a recorded session

The player renders a read-only playback of a recorded run when launched with `?replay=<src>`. `<src>` is a
URL to a **replay bundle** `{ runtime, statements, mouse? }`. Two ways to get one:

- **File/offline (RP1).** Host a bundle yourself and point at it, e.g. a respondent-bot `trace.json`
  (`{ statements, mouse }`) paired with the questionnaire's runtime. Good for fixtures and demos.
- **VS link (RP2).** A researcher mints a short-lived, signed link to a real participant session; the
  Viewer Service assembles the bundle on demand.

## Minting a VS replay link (researcher)

```
POST /v1/deployments/{deployment_id}/sessions/{session_id}/replay-link      (researcher-gated)
  → { token, bundle_url, replay_url }
```

- `bundle_url` — `GET /v1/replay?token=…` on the Viewer Service (token-authorized, no login; the token IS
  the capability). Returns `{ runtime, statements, mouse }`.
- `replay_url` — `${WEB_VIEWER_BASE_URL}/?replay=<url-encoded bundle_url>`; present only when
  `WEB_VIEWER_BASE_URL` is set on the Viewer Service. Open it to watch the run.

## CORS — the first thing to check

The player fetches `bundle_url` **cross-origin** (player origin → Viewer Service origin). The Viewer
Service must return `Access-Control-Allow-Origin` for the player origin, i.e. the player origin must be in
`VS_CORS_ORIGINS`. If a replay shows **"Replay unavailable / could not fetch the replay source"** with a
CORS error in the console, this is almost always the cause — add the player origin to `VS_CORS_ORIGINS`
(locally and in the deployed Viewer Service env) and retry.

## Known limitations (out of RP3-core scope)

- **Multi-select (checkbox) answers are not reconstructed.** `bdm:trial_ended` emits
  `additional_measures.values` for multi-select, which `reconstruct` does not yet read, so a checkbox item
  replays blank. Single-select and numeric answers reconstruct correctly.
- **Some `RadioGroup` live renderings** differ from the driven fixtures (see the respondent-bot HANDOFF);
  does not affect controlled read-only display of a reconstructed answer.

## Verifying it (automated + manual)

- **Automated:** `cd tools/respondent-bot && npm run e2e -- replay.spec.ts` drives the player to
  `/?replay=<mocked VS bundle url>` and asserts the question, the reconstructed answer, and the cursor
  overlay render (and that a non-OK bundle response shows "Replay unavailable").
- **Manual full-stack:** see the screenshot below from a real `GET /v1/replay?token=` round-trip.

<!-- MANUAL-SCREENSHOT: replaced in Task 3 with docs/replay-manual.png + a one-line caption -->
```

- [ ] **Step 2: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/docs/replay.md
git commit -m "docs(web-viewer): #7 RP3 core — replay round-trip + CORS doc

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Real full-stack manual verification

**Files:**
- Create: `web-viewer/docs/replay-manual.png` (screenshot)
- Modify: `web-viewer/docs/replay.md` (replace the `MANUAL-SCREENSHOT` placeholder)

**Interfaces:**
- Consumes: a locally running stack (Identity + Viewer Service + Postgres + player). Follow
  [docs/testing-participant-flow.md](../../testing-participant-flow.md) and
  [viewer-service/HANDOFF.md](../../../viewer-service/HANDOFF.md) for the canonical boot commands
  (`DOCKER_CONFIG=/tmp/lib_docker` for the PG-backed services).

- [ ] **Step 1: Bring up the stack and produce a session with events**

Follow `docs/testing-participant-flow.md` to run Identity, the Viewer Service, and the player, then: sign
in as (or create) a **researcher**, create a deployment, run **one** participant session through the
player to the end (this writes `events` outbox rows). Note the `deployment_id` and `session_id`.

Expected: the participant run finishes; the session has events (the player flushes `bdm:` batches every 5s
and on completion).

- [ ] **Step 2: Mint a replay link and open it**

With a researcher bearer token (`$TOK`) against the local Viewer Service (`$VS`, e.g.
`http://localhost:8001`):

```bash
curl -sS -X POST "$VS/v1/deployments/$DEP/sessions/$SID/replay-link" \
  -H "authorization: Bearer $TOK" | tee /tmp/replay-link.json
```

Expected: `{ "token": "...", "bundle_url": "http://localhost:8001/v1/replay?token=...", "replay_url": "http://localhost:5173/?replay=..." }`
(`replay_url` requires `WEB_VIEWER_BASE_URL` set on the VS; if null, build it as
`http://localhost:5173/?replay=<url-encoded bundle_url>`). Open `replay_url` in the browser.

- [ ] **Step 3: Confirm playback + handle CORS if needed**

Expected: the player renders the recorded run and plays back (drag the timeline; answers appear as
recorded). If instead you see "Replay unavailable" with a CORS error in the console, add the player origin
(`http://localhost:5173`) to the Viewer Service `VS_CORS_ORIGINS`, restart the VS, and retry. Record the
outcome (and any origin you had to add) in the doc.

- [ ] **Step 4: Capture the screenshot into the doc**

Save the playback screenshot to `web-viewer/docs/replay-manual.png`. Replace the `MANUAL-SCREENSHOT`
comment in `web-viewer/docs/replay.md` with:

```markdown
![Live replay of a real session via GET /v1/replay?token=](replay-manual.png)

*Verified 2026-07-02: a real researcher-minted replay link plays back a recorded session end-to-end.*
```

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/docs/replay.md web-viewer/docs/replay-manual.png
git commit -m "docs(web-viewer): #7 RP3 core — real full-stack replay verification + screenshot

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Update FOLLOWUPS + root HANDOFF status

**Files:**
- Modify: `web-viewer/FOLLOWUPS.md`
- Modify: `viewer-service/FOLLOWUPS.md`
- Modify: `HANDOFF.md`

**Interfaces:**
- Consumes: the completed Tasks 1-3. No code.

- [ ] **Step 1: Mark RP3-core done in `web-viewer/FOLLOWUPS.md`**

In the RP2+RP3 follow-ups block (around line 49-72), mark the "RP3 — live `?replay=<deployment>/<session>`
loader" / "RP3 core" item as done, referencing the e2e (`tools/respondent-bot/tests/e2e/replay.spec.ts`)
and the doc (`web-viewer/docs/replay.md`). Leave the other RP3 follow-ups (checkbox reconstruction,
"copy replay link" UI, session-list surface, dedicated secret, live-follow) listed as still-open. Use
`~~…~~ **DONE (2026-07-02)**` in the established style.

- [ ] **Step 2: Mark RP3-core done in `viewer-service/FOLLOWUPS.md`**

In "## Replay follow-ups / RP3 (2026-07-01)", mark the "Web-viewer e2e + docs (RP3 core)" bullet as
`~~…~~ **DONE (2026-07-02)**` with the same two references. Leave the remaining RP3 bullets
("copy replay link" UI, session-list surface, dedicated `REPLAY_SIGNING_SECRET`, live-follow) open.

- [ ] **Step 3: Refresh #7 status in root `HANDOFF.md`**

In `## System-wide tasks` → the "QA / research tooling — replay (#7) + respondent-bot (#8)" block, update
the #7 line so it reads that RP1 (renderer), RP2 (VS link), and **RP3-core (verified round-trip + doc)**
are done, with the remaining RP3 follow-ons (copy-link UI, session-list surface, dedicated secret,
live-follow, checkbox reconstruction) listed as what's left. Do not touch unrelated sections. Keep
em-dashes spaceless.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/FOLLOWUPS.md viewer-service/FOLLOWUPS.md HANDOFF.md
git commit -m "docs: #7 RP3 core done — replay round-trip verified; refresh follow-ups + HANDOFF

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Finish the branch

- [ ] **Step 1: Re-run the e2e green**

Run: `cd tools/respondent-bot && npm run e2e -- replay.spec.ts`
Expected: `2 passed`.

- [ ] **Step 2: Merge to master + push (no PR)**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git fetch origin
git switch master
git merge --ff-only origin/master   # take any concurrent harvester pushes first
git rebase master work/replay-rp3 || true   # if master advanced; else no-op
git switch master
git merge --no-ff work/replay-rp3 -m "merge: #7 replay RP3 core — verified round-trip + docs"
git push origin master
```

(If `git push` is rejected, someone pushed concurrently: `git fetch origin && git rebase origin/master && git push`. Resolve on the shared checkout, never force-push.)

---

## Self-Review

**1. Spec coverage:**
- Spec Component 1 (player e2e, mocked cross-origin VS, ACAO header, screenshot) → Task 1. ✅
- Spec Component 2 (drift guard = reuse existing `test_replay_api` assertion) → encoded as the fixture's
  `_comment` cross-reference in Task 1 Step 1; no new code, matching the spec. ✅
- Spec Component 3 (doc: two modes, minting, CORS, known limits) → Task 2. ✅
- Spec Component 4 (real full-stack manual check + screenshot + CORS fix if needed) → Task 3. ✅
- Spec Deliverables checklist: e2e+fixture+screenshot (Task 1), doc (Task 2), manual+screenshot+CORS
  (Task 3), FOLLOWUPS + HANDOFF updates (Task 4). ✅
- Spec "explicitly deferred" items → left open in Task 4 wording; Global Constraints forbid building them. ✅

**2. Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N". The one intentional marker —
`MANUAL-SCREENSHOT` — is a real HTML comment created in Task 2 and explicitly replaced in Task 3 Step 4.

**3. Type/name consistency:** Assertion targets (`role="radiogroup"` + prompt, `label.qv-option[data-selected]`,
`#replay-cursor`, `aria-label="timeline"`/`"speed"`, "Replay unavailable") match the read source
(`RadioGroup.tsx`, `ReplayView.tsx`, `ReplayApp.tsx`). Statement fields (`object.id: "trial_it_1"`,
`result.extensions["bdm:response_option_index"]`, ISO `timestamp`) match `reconstruct.ts`. Bundle keys
`{runtime, statements, mouse}` match `load.ts` `ReplayBundle` and `build_replay_bundle()`.
```

# Web Viewer WV-E (Session Resume + Locale Switch) — Design Spec

**Date drafted:** 2026-06-12
**Author:** Web Viewer WV-E brainstorming session (2026-06-12)
**Component:** **Web Viewer**, sub-project **WV-E** — fifth stage (decomposition in the [WV-A spec §0](2026-06-11-web-viewer-wv-a-design.md)). Implements **OD-14 session resume** + locale switching: per-question state survives reload (IndexedDB), the participant returns to where they left off in their last-active locale, and demo/ephemeral deployments correctly refuse resume. Resolves WV-A's deliberate "token in memory only — refresh restarts" caveat.
**Target:** `web-viewer/` + one **additive** Viewer Service change (mint returns `ephemeral`, §6/F2). No new schema.
**Authoritative source documents:**

- [design/08_viewer.md](../../../design/08_viewer.md) §"Session resume semantics" — the **OD-14 six-case table** (mid-page focus, per-question persistence, version-pin, ephemeral-refuse, active_until-asymmetry, locale persistence) + §"Resume and offline behaviour".
- `viewer-service/src/viewer_service/api/sessions.py` — the live endpoints WV-E drives: `GET /v1/sessions/{id}` (status + `last_active_locale` + outbox counts + agent identity; **ephemeral → 409**), `GET /v1/sessions/{id}/runtime` (Schema 3 in last-active locale; ephemeral → 409), `POST /v1/sessions/{id}/locale` (switch + re-mint; ephemeral → 409; bad locale → 422). All Bearer-token authenticated.
- WV-A/B/D under `web-viewer/src/` — boot/mint (`bootstrap.ts`, `App.tsx`), the answer map + `visited` stack (`session.ts`), the logic engine (`src/logic/`) whose graph-walk WV-E replays on resume.

---

## 1 — The core realisation (what resume actually restores)

The Viewer Service knows the **runtime** (version-pinned at mint, OD-14 case 3), the **last-active locale**, the **status**, and the **outbox** (Schema 5 rows already submitted) — but it has **no endpoint that returns the participant's answers as values**. Submitted rows are BDM trial rows, not an `{itemId → answer}` map, and there is no read-back-as-answers API. Therefore:

- **The viewer's IndexedDB is the source of truth for in-progress answers + position.** It holds the resumable state the participant needs to continue.
- **The Viewer Service is the source of truth for: which runtime/version, the locale, whether the session is still resumable (status, ephemeral), and the durable response record** (WV-B's per-advance submission). On any conflict about *the questionnaire itself*, the server wins (OD-14: pinned version); on *the participant's unsubmitted answers*, only IndexedDB has them.

This split drives the whole design: WV-E adds a **local persistence layer** (IndexedDB) + a **resume-on-boot flow** that re-authenticates with a persisted token and rehydrates from IndexedDB while re-fetching the runtime from the VS.

## 2 — Scope

### 2.1 In scope

- **Local resumable-state store** (§4): an IndexedDB-backed `ResumeStore` keyed by `deployment_id`, holding `{ session_id, token, last_active_locale, answers, stepIndex, visited, updated_at }`. Persist **per-question on change** (text debounced ~500 ms, OD-14 case 2); cleared on completion, on ephemeral-refusal, and on explicit reset.
- **Token persistence** (§4/F1): the opaque session Bearer token is stored in IndexedDB (origin-scoped) so the viewer can re-authenticate on reload — the mechanism that makes resume possible (WV-A held it in memory only by design, deferring this to WV-E).
- **Resume-on-boot flow** (§5): before minting, check the store for this deployment; if present, `GET /sessions/{id}` with the saved token and branch on the outcome (resume / completed / ephemeral-refused / invalid → fresh mint). On resume, `GET /runtime` (last-active locale), rehydrate answers + `visited`, and land on the **first unanswered visible question** (OD-14 case 1, via the WV-D graph walk).
- **Locale switch** (§7): a small chrome control listing `runtime.available_locales`; switching calls `POST /sessions/{id}/locale`, swaps the runtime, updates `last_active_locale` in the store, preserves answers, re-renders. Updates `<html lang>`; RTL out of scope (no RTL locales yet).
- **Ephemeral handling** (§6, OD-14 case 4): demo/preview sessions are **never persisted** locally; on a return that hits `409 ephemeral_no_resume`, the store is wiped, a fresh session is minted, and the "this is a demo — your prior session was cleared" notice shows.
- **active_until asymmetry** (OD-14 case 5): resuming an in-progress session works even past `active_until` (the VS `GET` doesn't gate on the active window — only new mints do); no viewer change needed beyond not treating a successful resume as "closed".
- **Additive VS change** (§6/F2): `POST /sessions/new` returns `ephemeral: boolean` so the viewer can skip local persistence for demo/preview from the first session (rather than persisting then wiping on the next load).

### 2.2 Non-goals (deferred)

- **Offline / PWA** (queue-and-sync while disconnected, service worker) — WV-F. WV-E persists locally but still assumes the VS is reachable at boot to validate the session.
- **Server-side answer read-back** — not built (no API; not needed given IndexedDB). If a future cross-device resume is wanted, that's a separate VS feature.
- **RTL locale rendering** — no RTL locales exist; the manifest's `rtl_supported` stays false.
- **Conflict UI for multi-tab** — last-writer-wins on the single-origin IndexedDB store; no cross-tab coordination (documented limitation).
- **Behavioural channels persistence** — out of scope (channels not built).

## 3 — Module layout (additions to `web-viewer/src/`)

```
src/resume/
├── store.ts          # ResumeStore: IndexedDB wrapper (get/put/clear by deployment_id); typed ResumeRecord
├── store.fake.ts     # in-memory ResumeStore impl for tests (same interface)
└── resume.ts         # resolveResume(params, store, vsClient) → 'fresh' | { record, status } | 'ephemeral_cleared'
src/app/
├── bootstrap.ts (modify)  # MintOk gains `ephemeral`; new getSession()/getRuntime() VS reads; persist token
├── App.tsx (modify)       # boot: try resume before mint; persist answers/position on change; locale switch; notices
├── session.ts (modify)    # rehydrate action (answers + stepIndex + visited from a record); reset-for-ephemeral
└── chrome/
    ├── LocaleSwitcher.tsx  # available-locales control
    └── strings.ts (modify) # demo-cleared notice + locale-switch label (en/pt)
```

`store.ts` and `resume.ts` are pure/injectable (the IndexedDB access is behind the `ResumeStore` interface; tests use `store.fake.ts`, so the engine tests need no real IndexedDB). `App.tsx` owns the wiring.

## 4 — Local persistence (`ResumeStore`)

```ts
export type ResumeRecord = {
  deploymentId: string
  sessionId: string
  token: string
  lastActiveLocale: string
  answers: Record<string, AnswerValue>
  stepIndex: number
  visited: number[]
  updatedAt: string            // ISO; for staleness/debug
}
export interface ResumeStore {
  get(deploymentId: string): Promise<ResumeRecord | null>
  put(record: ResumeRecord): Promise<void>
  clear(deploymentId: string): Promise<void>
}
```

IndexedDB DB `behaverse-web-viewer`, object store `resume` keyed by `deploymentId` (one in-progress session per deployment per browser — the common anonymous-link case). The real impl is a thin promisified wrapper (no `idb` dependency needed — a ~60-line hand-rolled wrapper, matching the project's zero-extra-dep ethos). **Persistence triggers** (non-ephemeral only): on every `answer` (debounced 500 ms for text via the App), on every navigation (`goto`/`back`), on locale switch. **Clear triggers**: completion (`submitted`), ephemeral-refusal, an explicit "start over". The token is part of the record (F1).

## 5 — Resume-on-boot flow

```
boot():
  if fixture mode → unchanged (no persistence)
  record = store.get(deploymentId)
  if !record → mint fresh (WV-A path), persist the new {session_id, token, locale}
  else:
    resp = GET /sessions/{record.sessionId}  (Bearer record.token)
    200 + status in_progress|in-progress  → RESUME:
        runtime = GET /sessions/{id}/runtime          (last_active_locale)
        rebuild pipeline (WV-D programs from this runtime); rehydrate answers+visited from record
        dispatch boot_success then a `rehydrate` → land on first-unanswered-visible step (§5.1)
    200 + status submitted|forwarded|completed → DONE: clear store, show "already completed" (F4)
    409 ephemeral_no_resume → clear store, mint fresh, show demo-cleared notice (case 4)
    401|404 (token/session invalid) → clear store, mint fresh
    network error → show the WV-A retry screen (don't wipe; the session may still be resumable)
```

### 5.1 Landing position (OD-14 case 1)
After rehydration, walk the steps with the WV-D engine (visibility-aware) and land on the **first step containing a required, visible, unanswered element**; if all required are answered, land on the participant's saved `stepIndex` (they may have been reviewing). Previously-answered values stay set (the renderer reads them from the rehydrated answer map). The existing WV-A focus effect focuses that step's heading / first offender.

## 6 — Viewer Service: additive `ephemeral` on mint (F2)

`POST /sessions/new` adds `ephemeral: boolean` to its response (the value already exists on the session row — `dimensions.persistence == 'ephemeral'`). Two-line change + ~1 test. Lets the viewer decide, at first mint, whether to persist at all — so demo/preview answers never touch IndexedDB (honouring "demo data never persists" precisely, rather than persist-then-wipe). Mirrors the WV-B/WV-A additive precedent. No other VS change (resume + locale endpoints already exist).

## 7 — Locale switch (OD-14 case 6)

A `LocaleSwitcher` in the chrome shows `runtime.available_locales` (hidden when ≤1). Selecting a locale → `POST /sessions/{id}/locale` → `{ runtime }` in the new locale → swap the runtime in state (rebuild WV-D programs, since runtime text changed but ids/structure didn't), keep `answers`/`visited`/`stepIndex`, update `last_active_locale` in the store + `<html lang>`. Choice answers are values (locale-independent); text answers persist verbatim. `initial_locale` never changes (the VS keeps it; per-item rows already record locale-at-answer). Bad locale → 422 → ignore + dev warn (the switcher only offers `available_locales`, so this shouldn't happen).

## 8 — Testing

1. **Pure units**: `ResumeStore` (fake) round-trips a record; real IndexedDB wrapper tested with `fake-indexeddb` (a dev-dep) or a thin jsdom shim — get/put/clear by deployment. `resolveResume` against a stubbed `getSession`: each branch (no record → fresh; in_progress → resume; submitted → done; 409 → ephemeral_cleared+fresh; 401/404 → fresh; network → retry).
2. **session.ts**: `rehydrate` restores answers/stepIndex/visited; ephemeral reset clears.
3. **App integration** (RTL, fake store + mocked fetch + mocked evaluator): a reload mid-questionnaire restores prior answers and lands on the first unanswered step; a completed session shows the already-completed screen; an ephemeral 409 wipes + mints fresh + shows the notice; locale switch swaps runtime text while preserving answers; per-question persistence writes to the fake store on change (debounced).
4. **Additive VS test**: `/sessions/new` returns `ephemeral` (true for a demo deployment, false for anonymous_link).
5. **Live resume smoke** (extends WV-D's): complete half a questionnaire in a real browser, reload, confirm answers restored + landing on the right step; switch locale and confirm the prompt text changes with answers intact; run a demo deployment, reload, confirm the demo-cleared notice + fresh start.

## 9 — Review flags for the owner (decide at spec review)

- **F1 — Persist the session Bearer token in IndexedDB.** This is the mechanism that makes reload-resume work (WV-A held it in memory only, by design, deferring to WV-E). Posture: anonymous, opaque, session-scoped token; IndexedDB is origin-scoped; the exposure surface is the same as any SPA session credential. Recommendation: **persist it** (no resume is possible otherwise). Confirm, or require a different re-auth mechanism.
- **F2 — Additive VS change: `POST /sessions/new` returns `ephemeral`.** Lets the viewer skip local persistence for demo/preview from the first session (cleaner than persist-then-wipe). Recommendation: **yes** (2-line change, mirrors prior additive precedents). Confirm.
- **F3 — Resume landing position** = first **required, visible, unanswered** element's step (OD-14 case 1), via the WV-D graph walk; if none, the saved `stepIndex`. Recommendation: as stated. Confirm.
- **F4 — Returning to a completed session** (status submitted/forwarded): show an "already completed — thank you" screen and clear the store (do **not** re-mint, which would let a participant submit twice). Recommendation: as stated. Confirm (alt: silent fresh mint).
- **F5 — Persistence granularity split**: IndexedDB persists **per-question on change** (debounced 500 ms text) for crash recovery; the **VS mirror stays WV-B's per-advance Schema 5 submission** (submitting per-keystroke as trial rows would be semantically wrong). Recommendation: this split (matches OD-14 case 2's "local store … and mirrors … through the per-item response endpoint" — the per-item endpoint is the advance-time submission). Confirm.

## 10 — Out of scope / follow-ups
- PWA / offline service worker + queue-and-sync (WV-F).
- Cross-device / server-side answer read-back (separate VS feature if ever wanted).
- Multi-tab coordination (last-writer-wins documented limitation).
- RTL locale rendering (no RTL locales; `rtl_supported` stays false).
- A "start over" affordance for participants who want to discard a resumable session (small chrome addition; defer unless wanted).

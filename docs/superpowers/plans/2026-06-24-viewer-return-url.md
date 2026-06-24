# Viewer return-URL on finish — Implementation Plan

> **For agentic workers:** TDD, frequent commits. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add a validated `?return_url=` launch param surfaced as a manual "Done" button on the runner's finished/declined/completed screens, so the player is never a dead-end.

**Architecture:** web-viewer only. A pure `safeReturnUrl` validator + a new `Params.returnUrl` in `bootstrap.ts`; a `done` string; an `<a href>` Done button in the three terminal branches of `App.tsx`. No service/state/events/schema changes.

**Tech Stack:** React 19 + TS + Vite + vitest. `tsc -b` has `noUnusedLocals`/`noUnusedParameters` (unused imports break the build).

## Global Constraints

- `return_url` accepted ONLY if `new URL(raw)` succeeds and protocol is `http:`/`https:`; else treated as absent.
- Manual only — NO auto-redirect for `return_url`. Deployment `redirect_url` behavior is UNCHANGED.
- Use a real `<a href={returnUrl}>` (not a JS handler); style with the existing primary-button classes + `qv-focusable`.
- Strings added to BOTH `en` and `pt`.

---

### Task 1: `safeReturnUrl` + `Params.returnUrl` (bootstrap.ts)

**Files:** Modify `src/app/bootstrap.ts`; Test `src/app/bootstrap.test.ts`.

- [ ] **Step 1 — failing tests** in `bootstrap.test.ts`:
```ts
import { safeReturnUrl, parseParams } from './bootstrap'
test('safeReturnUrl accepts http(s), rejects the rest', () => {
  expect(safeReturnUrl('https://app.example/done')).toBe('https://app.example/done')
  expect(safeReturnUrl('http://x/y')).toBe('http://x/y')
  for (const bad of [null, '', 'javascript:alert(1)', '/relative', 'ftp://x', 'not a url'])
    expect(safeReturnUrl(bad as string | null)).toBeNull()
})
test('parseParams reads + validates return_url', () => {
  expect(parseParams('?return_url=https://app.example/x').returnUrl).toBe('https://app.example/x')
  expect(parseParams('?return_url=javascript:alert(1)').returnUrl).toBeNull()
  expect(parseParams('').returnUrl).toBeNull()
})
```
- [ ] **Step 2 — run, expect FAIL** (`safeReturnUrl` not exported / `returnUrl` missing): `npm test -- app/bootstrap`
- [ ] **Step 3 — implement** in `bootstrap.ts`: add the export
```ts
export function safeReturnUrl(raw: string | null): string | null {
  if (!raw) return null
  try { const u = new URL(raw); return (u.protocol === 'http:' || u.protocol === 'https:') ? raw : null }
  catch { return null }
}
```
add `returnUrl: string | null` to the `Params` type, and in `parseParams` set `returnUrl: safeReturnUrl(qs.get('return_url'))` (use the existing `URLSearchParams` instance — match the local name already used in the function).
- [ ] **Step 4 — run, expect PASS**: `npm test -- app/bootstrap`
- [ ] **Step 5 — commit**: `feat(web-viewer): parse + validate a return_url launch param`

### Task 2: "Done" button on the terminal screens (App.tsx + strings)

**Files:** Modify `src/app/chrome/strings.ts`, `src/app/App.tsx`; Test `src/app/App.test.tsx`.
**Interfaces:** consumes `Params.returnUrl` from Task 1.

- [ ] **Step 1 — failing tests** in `App.test.tsx` (mirror the existing finished/declined/completed tests; add `?return_url=https://app.example/done` to the test URL/params). Assert: after completing a run, the finished screen has a link with name "Done" and `href="https://app.example/done"`; the completed screen (revisit completed session) shows it; the declined screen (decline a consent deployment) shows it. Add one negative: without `return_url`, the finished screen has no "Done" link.
- [ ] **Step 2 — run, expect FAIL**: `npm test -- app/App`
- [ ] **Step 3 — implement**:
  - `strings.ts`: add `done: 'Done'` (en) and `done: 'Concluído'` (pt).
  - `App.tsx`: after `const params = …`, derive `const returnUrl = params.returnUrl`. Define a small inline element reused in the three branches, e.g.
    `const doneLink = returnUrl ? <a href={returnUrl} className="qv-focusable inline-block rounded-lg bg-primary px-5 py-2.5 text-white font-medium">{t(locale, 'done')}</a> : null`
    placed inside each branch's content `<div>` (finished — after the redirect line/score; declined — after `declined_body`; completed — after `completed_body`). (Compute `doneLink` per-branch or hoist above the returns; ensure `locale` is in scope where used — it is, in each branch.)
- [ ] **Step 4 — run, expect PASS**: `npm test -- app/App`
- [ ] **Step 5 — full gate**: `npm test` (all green) + `npm run build` (clean — watch `noUnusedLocals`).
- [ ] **Step 6 — commit**: `feat(web-viewer): a Done button returns to return_url on finished/declined/completed`

## Self-Review

- Spec coverage: param+validate (T1), the three screens + strings (T2), tests (both). ✓
- No placeholders. ✓
- Type consistency: `safeReturnUrl`/`Params.returnUrl`/`done` string used consistently across tasks. ✓

# PA-4 — Consent gate + completion polish (design)

**Date:** 2026-06-23
**Status:** approved (brainstorm complete) — ready for implementation planning
**Components:** `viewer-service/` (modify) + `web-viewer/` (modify, the runner). Identity untouched.
**Decision basis:** owner review 2026-06-23 — PA-4 = **consent gate + completion polish** (the run's
bookends); record consent as an **event**. Final Participant App slice; follows the email slice
([[project_participant_email_slice]]). See [[project_participant_app_plan]].

---

## 0. Context

The runner ignores three deployment fields that are **stored but never returned/used**:
`consent_text_ref`, `confirmation_message` (`dict | None`), `redirect_url` (`str | None`). After a
successful mint the runner goes **straight into the first question** (no start/consent screen — `App.tsx`
boot_success → `ready`), fires `initialized`/`started` immediately, and ends on a **hardcoded
"Thank you!"** (`App.tsx` `phase==='finished'`, using `strings.ts` `finished_title`/`finished_body`) with
no `confirmation_message` and no `redirect_url`. The VS mint return is
`{session_id, session_token, runtime, theme, agent_id, session_index, ephemeral, participant_sub}`
(`sessions.py:48`); the runner captures it as `MintOk` (`bootstrap.ts`). Events post through a batcher
(`ev.initialized`/`ev.started`) to `/v1/sessions/{id}/events` → outbox.

**Design boundary:** the full consent *lifecycle* (versioned forms, re-consent on change, withdrawal,
recording against a version) belongs to the Phase-5 **Participant Platform** (`design/09_platform.md` §8).
PA-4 is a **lightweight per-deployment viewer consent gate** — a standalone deployment can require consent
before its questionnaire. The existing `consent_text_ref` is the Platform's external-ref concept and is
left untouched.

---

## 1. Scope (locked)

**In scope:** a deployment `consent` locale-map; the mint returns `consent` + `confirmation_message` +
`redirect_url`; a runner consent gate (ConsentScreen before Q1 when consent present, Accept/Decline,
consent deferred-start + a recorded `consented`/`consent_declined` event); completion polish (the finished
screen renders `confirmation_message[locale]` + honours `redirect_url`).

**Out of scope:** versioned consent / re-consent / withdrawal / recording against a consent version (all
Phase 5); the `consent_text_ref` external-ref field; behavioural-channel per-session consent (OD-07,
separate); changing anonymous/invite mint auth.

---

## 2. Decisions

- **Consent stored inline as a locale-map** `consent: {locale: text}` on the deployment (mirrors
  `confirmation_message`), so it's localized. **Presence ⇒ the gate is shown** (no separate "required"
  flag — YAGNI).
- **The session starts at consent.** When `consent` is present, the runner defers `initialized`/`started`
  until **Accept**, then also posts a **`consented`** event. **Decline** → an exit screen, no `started`,
  no responses, + a **`consent_declined`** event (both via the existing batcher → outbox; auditable).
  Deployments with **no consent** behave exactly as today (immediate start).
- **Consent + confirmation text rendered with the existing markdown/RichText renderer** (researchers can
  format the form). Localized via the runner's current locale; fall back to the deployment default / first
  available locale if the active locale is missing from the map.
- **Completion:** `confirmation_message[locale]` replaces the hardcoded thank-you **when present** (else
  the existing `strings.ts` strings); the optional score summary stays. If `redirect_url` is set, after a
  short delay (~3 s) navigate there, showing "Redirecting you… — if nothing happens, click **here**" with
  the manual link available immediately.

---

## 3. Architecture & units

### Viewer Service
- **`store/schema.sql`** + migration — `deployment` gains `consent jsonb` (idempotent `ALTER … ADD COLUMN
  IF NOT EXISTS`).
- **`store/deployments.py`** — add `consent` to `_COLS` and `_JSONB`.
- **`models.py`** — `DeploymentCreate` gains `consent: dict | None = None`.
- **`api/deployments.py` `create`** — persist `consent=body.consent`.
- **`sessions.py` `new_session`** — add to the return dict:
  `"consent": deployment.get("consent"), "confirmation_message": deployment.get("confirmation_message"),
  "redirect_url": deployment.get("redirect_url")`.

### Web Viewer (runner)
- **`bootstrap.ts`** — `MintOk` gains `consent: Record<string,string> | null`, `confirmation_message:
  Record<string,string> | null`, `redirect_url: string | null`; `mintSession` parses them from the
  response.
- **`session.ts` state machine** — add a `consent` phase + carry `consent`/`confirmation_message`/
  `redirect_url` in the state; a `consent_accepted` action → `ready`; a `consent_declined` action →
  `declined`.
- **`App.tsx` boot** — after a successful mint: if `res.consent` present → `dispatch boot_consent`
  (phase `consent`, pipeline built but `initialized`/`started` NOT yet fired); else the existing
  `boot_success` path (unchanged). Render branch for `phase==='consent'` → `<ConsentScreen>`; for
  `phase==='declined'` → a small "You declined…" exit screen.
- **`chrome/ConsentScreen.tsx`** (new) — renders the localized consent text (markdown/RichText) + an
  **I agree** and **I do not agree** button. `onAccept` → fire `initialized`/`started` + a `consented`
  event, then `dispatch consent_accepted`. `onDecline` → fire a `consent_declined` event + `dispatch
  consent_declined`.
- **`events`** — add `ev.consented(...)` + `ev.consentDeclined(...)` builders (same shape as the existing
  event builders; a `bdm:`-namespaced verb per OD-19).
- **`App.tsx` finished branch** — render `confirmation_message[locale]` (RichText) when present, else the
  `strings.ts` fallback; a `redirect_url` effect that schedules the navigation + always shows the manual
  link.

Each unit is small + independently testable: VS mint-return (api test), the consent phase/screen, the
events, the completion render.

---

## 4. Data flow

mint → **consent present?** → ConsentScreen → **Accept**: `initialized` + `started` + `consented`
events, phase `ready`, Q1 renders → answer → submit → finished screen (`confirmation_message` +
`redirect_url`). **Decline**: `consent_declined` event, phase `declined`, exit screen (no `started`, no
responses). **No consent** → straight to Q1 + immediate `started` (unchanged) → finished.

---

## 5. Error handling

- Empty/missing `consent` map → no gate (never block on a misconfig). Active locale missing from the map →
  fall back to the deployment default locale, then the first key.
- Decline is terminal in the runner; the minted session remains `in_progress` with no responses.
- `redirect_url` navigation is best-effort; the manual link is always present so a blocked auto-redirect
  isn't a dead-end.
- `confirmation_message` absent or empty → the existing thank-you strings render (no regression).

---

## 6. Testing

- **VS** (conftest `client`): a deployment created with `consent`/`confirmation_message`/`redirect_url`
  → `POST /v1/sessions/new` returns all three; a deployment without them → the three are `null`. Full VS
  suite stays green (additive deployment column + mint keys).
- **Runner** (vitest + fetch stub, the App.test full-run pattern): consent in the mint → ConsentScreen
  renders the consent text **before** any question; **Accept** posts a `consented` event then Q1 renders;
  **Decline** shows the exit screen, posts `consent_declined`, and posts **no** `/responses`; a mint with
  **no** consent goes straight to Q1 (existing tests unchanged); the finished screen shows
  `confirmation_message` when present (else the default thank-you); `redirect_url` schedules the redirect +
  shows the manual link.
- web-viewer full suite + clean build; VS full suite green.

---

## 7. Deliverable gate

- A deployment with consent text shows a consent screen before the questionnaire; **I agree** starts it
  (and a `consented` event lands in the outbox), **I do not agree** exits without starting. On finish, the
  deployment's confirmation message shows and, if set, the participant is redirected. Deployments without
  these fields are unchanged. Both suites + build green; no Identity change.

---

## 8. References

- `viewer-service/src/viewer_service/{store/schema.sql,store/deployments.py,models.py,api/deployments.py,sessions.py}`.
- `web-viewer/src/app/{App.tsx,session.ts,bootstrap.ts,chrome/strings.ts,chrome/ (ConsentScreen new), events module}`, `src/renderer/` (the markdown/RichText component), `src/app/App.test.tsx` (full-run test pattern).
- [[project_participant_email_slice]], [[project_participant_app_plan]]; `design/09_platform.md` §8 (full consent lifecycle = Phase 5), `design/08_viewer.md` (OD-14 resume; OD-07 channel consent).

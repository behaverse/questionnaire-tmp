# Participant app: pick → run → return (cohesive journey) — design

**Date:** 2026-06-24
**Status:** approved (brainstorm complete) — ready for implementation planning
**Component:** `web-viewer/` only (the portal side: catalogue + nav shell). Builds on the return-URL
keystone ([[project_viewer_return_url]]).
**Roadmap items:** #2 (journey redesign — the cohesive loop + a clearer signed-in state) + #4
(participant app: pick a questionnaire and run it). Owner: "go".

---

## 0. Context

Today the catalogue's **Start** (`home/CatalogueView.tsx` `Card`) is a full-page
`<a href={carry('index.html', { deployment })}>` that launches the runner and **does not come back** —
the participant lands on the runner's terminal screen and (since the keystone) only returns if a
`return_url` was supplied, which the catalogue does not yet supply. The portal lives at path `/`
(`main.tsx`: no `deployment`/`invite`/`fixture` → `ParticipantApp` → `/` → `CatalogueView`). The owner
also flagged that after login the home screen feels unchanged — the only signed-in cue is a small
email + "Log out" in `NavShell`, with the email `hidden` on small screens.

This slice closes the loop: **Start launches the player with a `return_url` back to the catalogue**, the
player's **Done** button returns there, and the catalogue shows an **"all done — pick another"** state.
It also makes the **signed-in state unmistakable**. Still same-origin (the two-origins split is #1,
later) — so `return_url` is simply this app's `/` with a marker.

---

## 1. Scope (locked)

**In scope:**
1. **Start supplies `return_url`** = an absolute URL to the catalogue with a completion marker
   (`${origin}/?done=<deployment_id>`), carrying `viewer_url`/`identity_url` when present.
2. **A "you're back" banner** on the catalogue when `?done=<id>` is present: a friendly, dismissable
   "✓ All done — thanks for taking part. Pick another below." naming the completed questionnaire's
   title when it's in the catalogue. Dismiss clears the marker from the URL (`replaceState`).
3. **A clearer signed-in state** in `NavShell`: an initial-avatar chip + the email always visible (drop
   the `hidden sm:inline`) alongside Log out; anon state unchanged (Log in).

**Out of scope:** running the runner *inside* the shell (that's the #1 two-origins/embed work);
changing the runner itself (the keystone already added Done); the `done` marker affecting My data;
auth/token handoff; library-web (#5); any service/schema change.

---

## 2. Decisions

- **Marker is neutral (`?done=<id>`), not "completed".** The player's Done button appears on finished
  **and** declined/already-completed screens, so the return is not always a completion — the banner
  copy stays neutral-but-warm ("All done — thanks for taking part") and works for every terminal state.
- **`return_url` is built absolute** (`new URL('/', origin)` + `searchParams`) so it satisfies the
  keystone's `safeReturnUrl` (http(s), absolute). `viewer_url`/`identity_url` are copied onto it (as
  `carry`/`preservedSearch` already do) so the returned portal keeps talking to the same services.
- **Banner names the questionnaire when known.** `CatalogueView` already has the items; look up the
  title by `done` id; if not found (e.g. an unlisted/closed deployment), show the generic copy.
- **Dismiss is local + tidies the URL.** Dismiss hides the banner and `replaceState`s the URL without
  `done` (so a refresh doesn't re-show it). No persistence needed (YAGNI).
- **Signed-in clarity is minimal, not a redesign.** An avatar chip (first letter of email/display
  name) + always-visible email; no new routes or settings. Directly answers "the home looks the same
  after login" without scope creep.

---

## 3. Architecture & units (web-viewer, portal side)

### `home/CatalogueView.tsx`
- A pure helper **`returnUrlFor(deploymentId: string): string`** — builds
  `${origin}/?done=<id>` carrying `viewer_url`/`identity_url` from the current search; returns an
  absolute string.
- `Card` gains the `return_url` param in its Start href:
  `carry('index.html', { deployment: item.deployment_id, return_url: returnUrlFor(item.deployment_id) })`.
- A **`DoneBanner`** (small local component): reads `?done` from `window.location.search`; if present,
  renders the dismissable banner (title looked up from `items`); dismiss → `setDismissed(true)` +
  `history.replaceState` to strip `done`. Rendered above the list in `CatalogueView`.

### `shell/NavShell.tsx`
- The authed block becomes an **avatar chip** (a rounded `span` with the uppercased first character of
  `user.display_name || user.email`) + the email (no longer `hidden`) + the existing Log out button.

No router, params, or service changes. `done` is read locally in `CatalogueView` (not a runner param).

---

## 4. Data flow

catalogue → click **Start** → `index.html?deployment=X&return_url=${origin}/?done=X&viewer_url=…`
→ run → terminal screen → click **Done** → browser navigates to `${origin}/?done=X&viewer_url=…`
→ `main.tsx` (no `deployment` ⇒ portal) → `/` → `CatalogueView` → **DoneBanner** ("All done — thanks
for taking part. Pick another.") → pick another or dismiss.

---

## 5. Error handling

- `?done=<id>` for a deployment no longer in the catalogue → generic banner copy (no title), still
  dismissable.
- Empty/absent `done` → no banner (unchanged catalogue).
- `returnUrlFor` always yields an absolute http(s) URL (built from `window.location.origin`), so the
  keystone validator never rejects it.
- Anon vs authed in `NavShell` is unchanged logic; only the authed presentation changes.

---

## 6. Testing

- **`CatalogueView.test.tsx`** — `returnUrlFor('dep_1')` returns an absolute URL whose path is `/` and
  whose `done` param is `dep_1` (and carries `viewer_url` when the current search has it). A rendered
  `Card`'s Start link `href` contains a `return_url` param that decodes to `…/?done=dep_1`. With
  `window.location.search = '?done=dep_1'` and a matching item, the banner renders and names the item's
  title; clicking Dismiss removes the banner. With no `done`, no banner.
- **`NavShell.test.tsx`** — authed (a stubbed session user) renders the email **and** an avatar chip
  with the initial; anon renders "Log in". (Extend the existing NavShell tests.)
- web-viewer full suite + clean build.

---

## 7. Deliverable gate

From the catalogue, **Start** opens the questionnaire and, on **Done**, returns to the catalogue with a
friendly "all done — pick another" banner; the signed-in state shows an avatar + email so login is
obvious. Same-origin; web-viewer suite + build green; no runner/service change.

---

## 8. References

- `web-viewer/src/home/CatalogueView.tsx` (`carry`, `Card`, `CatalogueView`), `src/shell/NavShell.tsx`,
  `src/shell/router.tsx` (`preservedSearch` pattern), `src/main.tsx` (portal vs runner routing),
  `src/home/CatalogueView.test.tsx`, `src/shell/NavShell.test.tsx`.
- Keystone: `docs/superpowers/specs/2026-06-24-viewer-return-url-design.md`, [[project_viewer_return_url]];
  roadmap `docs/participant-app-roadmap.md` (#2/#4).

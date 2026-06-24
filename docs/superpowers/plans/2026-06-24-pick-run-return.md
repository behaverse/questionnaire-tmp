# Pick → run → return — Implementation Plan

> **For agentic workers:** TDD, frequent commits. Checkbox steps.

**Goal:** Close the participant loop — the catalogue's Start launches the player with a `return_url` back to the catalogue, the player's Done returns there, and the catalogue shows an "all done — pick another" banner; plus a clearer signed-in state in the nav.

**Architecture:** web-viewer portal side only. `CatalogueView` gains `returnUrlFor` + a `DoneBanner`; `NavShell` gets an avatar chip + always-visible email. Same-origin (`return_url = ${origin}/?done=<id>`). No runner/router/service change.

**Tech Stack:** React 19 + TS + Vite + vitest + Testing Library. `tsc -b` has `noUnusedLocals`/`noUnusedParameters`.

## Global Constraints

- `return_url` MUST be an absolute http(s) URL (built from `window.location.origin`) so the keystone's `safeReturnUrl` accepts it.
- Marker is `?done=<deployment_id>` (neutral — covers finished/declined/already-completed). Banner copy is warm-but-neutral ("All done — thanks for taking part. Pick another below.").
- Carry `viewer_url`/`identity_url` onto the return URL when present (mirror the existing `carry`/`preservedSearch`).
- Banner is dismissable; dismiss strips `done` via `history.replaceState`.

---

### Task 1: Start supplies `return_url` + the DoneBanner (CatalogueView)

**Files:** Modify `src/home/CatalogueView.tsx`; Test `src/home/CatalogueView.test.tsx`.

- [ ] **Step 1 — failing tests** in `CatalogueView.test.tsx`:
  - `returnUrlFor('dep_1')` → an absolute URL; `new URL(returnUrlFor('dep_1'))` has `.pathname === '/'` and `.searchParams.get('done') === 'dep_1'`.
  - A rendered catalogue (stub `fetchCatalogue` to one item `dep_1`) — the "Start" link's `href` contains `return_url=` and the decoded value's `done` param is `dep_1`.
  - With `window.history.replaceState(null,'','/?done=dep_1')` before render + an item titled "PHQ-9", the banner text includes "All done" and "PHQ-9"; clicking the dismiss control removes the banner (`queryByText(/all done/i)` → null).
  - Without `done`, no banner.
- [ ] **Step 2 — run, expect FAIL:** `npm test -- home/CatalogueView`
- [ ] **Step 3 — implement** in `CatalogueView.tsx`:
  - `export function returnUrlFor(deploymentId: string): string` — `const u = new URL('/', window.location.origin); u.searchParams.set('done', deploymentId); for (const k of ['viewer_url','identity_url']) { const v = new URLSearchParams(window.location.search).get(k); if (v) u.searchParams.set(k, v) } return u.toString()`.
  - In `Card`: `href={carry('index.html', { deployment: item.deployment_id, return_url: returnUrlFor(item.deployment_id) })}`.
  - A `DoneBanner({ items }: { items: CatalogueItem[] })`: `const [dismissed, setDismissed] = useState(false); const done = new URLSearchParams(window.location.search).get('done'); if (!done || dismissed) return null; const title = items.find(i => i.deployment_id === done)?.title` → render a dismissable banner (rounded, subtle green/zinc) with copy "✓ All done — thanks for taking part." + (title ? ` You finished “${title}”.` : '') + " Pick another below." and a Dismiss button → `setDismissed(true); history.replaceState(null,'', window.location.pathname + window.location.search.replace(/([?&])done=[^&]*(&|$)/, (_,a,b)=> b? a : ''))` (or rebuild via URLSearchParams: delete `done`, rebuild search). Render `<DoneBanner items={items} />` above the `<ul>` in `CatalogueView`.
- [ ] **Step 4 — run, expect PASS:** `npm test -- home/CatalogueView`
- [ ] **Step 5 — commit:** `feat(web-viewer): catalogue Start passes a return_url + an all-done banner on return`

### Task 2: Clearer signed-in state (NavShell)

**Files:** Modify `src/shell/NavShell.tsx`; Test `src/shell/NavShell.test.tsx`.

- [ ] **Step 1 — failing test** in `NavShell.test.tsx`: authed (stub `useSession` to `{ status:'authed', user:{ email:'a@b.com', display_name:null, ... }, logout }`) → the rendered shell shows `a@b.com` AND an element with text `A` (the avatar initial). (Mirror the existing authed/anon NavShell tests for the stub shape.)
- [ ] **Step 2 — run, expect FAIL:** `npm test -- shell/NavShell`
- [ ] **Step 3 — implement:** replace the authed `<span>` block with an avatar chip — a rounded `span` (`h-7 w-7 rounded-full bg-zinc-900 text-white grid place-items-center text-xs font-semibold`) containing `(user.display_name || user.email).charAt(0).toUpperCase()` — followed by the email `<span>` (remove `hidden sm:inline`) + the existing Log out button.
- [ ] **Step 4 — run, expect PASS:** `npm test -- shell/NavShell`
- [ ] **Step 5 — full gate:** `npm test` (all green) + `npm run build` (clean — watch unused locals).
- [ ] **Step 6 — commit:** `feat(web-viewer): clearer signed-in state (avatar + email) in the nav`

## Self-Review
- Spec coverage: return_url+banner (T1), nav clarity (T2), tests both. ✓
- No placeholders; types `returnUrlFor`/`DoneBanner`/`CatalogueItem` consistent. ✓

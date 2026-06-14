# Editor ED-C3b (OD-06 Newer-Version Notification + Upgrade) — Design Spec

**Date drafted:** 2026-06-14
**Author:** Editor ED-C3 brainstorming session (2026-06-14)
**Component:** **Editor**, sub-project **ED-C**; ED-C3 sub-sliced **C3a** (pick-from-Library — done) + **C3b** (this spec). C3b adds OD-06's "never silently upgrade" freshness layer: detect when a Library-pinned reference has a newer published version and offer an explicit, per-reference upgrade.
**Builds on:** ED-C3a (Library entity-body endpoint + pick + hard-pinned refs + the editor Library client). Memories `project_editor_ed_c3a`, `project_editor_ed_c2b`.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand · vitest+RTL · Playwright (editor only — no library changes).
**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §3 ("**Hard-pinning** (per OD-06): … When a referenced entity has a newer version, the Editor surfaces a notification with a diff and an explicit upgrade action — never silently upgrades.") OD-06 (hard-pin + CalVer; updates never silently propagate).
- Library API: `GET /v1/entities/{etype}/{eid}` → `EntitySummary` whose `version` is the **latest published** version (`entities.py` `get_entity` returns `max(published, key=version)`; `404` if none published). This is the staleness signal.
- ED-C3a editor code: `editor/src/persistence/library.ts` (`parseRef`, `searchEntities`, `fetchEntityBody`, `FetchOpts`, `DEFAULT_BASE`), `editor/src/library/picker.ts`, the read-only Library-ref chips in `editor/src/canvas/ItemEditor.tsx` + `editor/src/canvas/MessagePane.tsx`, the store (`pool`, `applyEdit`), `editor/src/model/tree.ts`, `editor/src/preview/resolve.ts` (`collectRefs`).

---

## 1 — Scope (ED-C3b)

### 1.1 In scope

- **Pure staleness helpers** (`editor/src/library/staleness.ts`):
  - `collectLibraryRefs(model, pool) → string[]` — every `{ref}` in the model that is **not** a pool key (pool holds `.devN` drafts; everything else is a Library pin), de-duplicated. Reuses `collectRefs` (from `preview/resolve.ts`) + filters out pool keys.
  - `isNewer(latest, pinned) → boolean` — CalVer compare: `true` iff `latest` and `pinned` parse as `vYY.MMDD(.devN)?` and `latest` is strictly newer (compare `YY.MMDD` numerically/lexicographically; a `.devN` pinned ref is never considered stale here — drafts aren't Library pins). Robust to malformed input (returns false).
  - `staleSet(refs, latestByKey) → Record<ref, string>` — given the refs + a `ref → latestVersion|null` map, return only the **stale** entries (`{ "<id>@<pinnedVer>": "<latestVer>" }`).
- **Library client** (`editor/src/persistence/library.ts`): `latestVersion(etype, id, opts) → Promise<string | null>` — `GET {base}/v1/entities/{etype}/{id}` → `EntitySummary.version`; `null` on `404`/error. Injectable `fetchImpl`/`baseUrl`.
- **`upgradeRef`** (`editor/src/model/tree.ts`): `upgradeRef(model, oldRef, newRef) → Questionnaire` — a pure Immer walk replacing **every** occurrence of the exact ref string `oldRef` with `newRef` (a ref may appear more than once). Returns a new model.
- **Store staleness slice** (`editor/src/state/store.ts`): `staleness: Record<string, string>` (stale ref → latest version) + `refreshStaleness(opts?)` (async: `collectLibraryRefs` → `latestVersion` per distinct entity, cached, parallel → `staleSet` → `set({ staleness })`) + `upgradeRefAction(oldRef, newRef)` (`applyEdit(m => upgradeRef(m, oldRef, newRef))` then drop the entry from `staleness`). Cleared in `reset()`.
- **When it runs** (choice a): `refreshStaleness` is called **on model load** (debounced, in the App boot/load effect) and via a **manual "Check for updates"** action; **not** on every edit. A freshly-picked ref is the latest (C3a pins latest), so it is not stale.
- **Surface (choice b):**
  - **Per-ref on the read-only Library chip** (ItemEditor prompt/context/instruction/option + saved-item-ref + MessagePane): when `staleness[ref]` exists, show "newer: `<latest>` [Upgrade]". **Upgrade** → `upgradeRefAction(ref, "<id>@<latest>")`; explicit, one-click, never automatic.
  - **Topbar badge** — "⬆ N updates" (N = `Object.keys(staleness).length`) with a **Check for updates** affordance that calls `refreshStaleness`.
- **Notification scope (choice c):** notification + explicit upgrade only (which version + one-click re-point). **No content diff view** (deferred — OD-06 mentions a diff, but it's a nicety, not gating). After upgrade the preview re-resolves to the new body live (the resolver already fetches the new ref's body).
- **Tests:** pure `staleness.ts` (`collectLibraryRefs` excludes pool keys; `isNewer` CalVer cases incl. `.devN`/malformed; `staleSet`); `upgradeRef` (replace-all, immutable); `latestVersion` client (injected fetch, 404→null); store `refreshStaleness`/`upgradeRefAction` (injected client); RTL chip-upgrade (stale chip shows Upgrade → repoints + clears badge); a Playwright "stale ref → Upgrade → repointed" smoke (stubbed latest) + screenshot.

### 1.2 Non-goals (deferred)

- **No content diff view** between pinned and latest (a future nicety).
- **No auto-upgrade** — forbidden by OD-06; upgrade is always an explicit user action.
- **No fork/edit of Library content** (→ ED-C4).
- **No per-edit staleness polling** (load + manual only).
- **No upgrade of pool `.devN` drafts** — those aren't Library pins and have no "latest".
- **No translation** (→ ED-E).
- **No transitive-staleness** of refs *inside* a Library entity's body (e.g. a saved Item's nested prompt) — C3b checks the top-level refs present in the questionnaire; the Library owns the internal pinning of its own entities.

---

## 2 — Architecture

- **`editor/src/library/staleness.ts`** (pure): `collectLibraryRefs`, `isNewer`, `staleSet`. No React/store/I-O.
- **`editor/src/persistence/library.ts`**: `latestVersion(etype, id, opts)` (one more read method beside `searchEntities`/`fetchEntityBody`).
- **`editor/src/model/tree.ts`**: `upgradeRef(model, oldRef, newRef)` (pure, replace-all).
- **Store**: `staleness` slice + `refreshStaleness` (async; uses `parseRef` to map a ref → `{etype:type, id}` for `latestVersion`, caches per entity-id so repeated refs to the same entity fetch once) + `upgradeRefAction`. `reset()` clears `staleness`.
- **App**: call `refreshStaleness()` after a model is loaded/restored (debounced ~500 ms); pass it the default client.
- **Topbar**: badge + "Check for updates" button.
- **Chips**: ItemEditor + MessagePane read `staleness[ref]` and render the inline Upgrade affordance.

Dependency direction: `library/` (pure staleness) + `persistence` + `model/tree` → store; UI reads the store. The resolver/preview need no change (upgrading repoints the ref; the pool-first resolver fetches the new body, cached per `ref@version`).

## 3 — Version comparison (`isNewer`)

`vYY.MMDD(.devN)?` — parse the `YY` and `MMDD` integer parts. `isNewer(latest, pinned)`:
- both must match `^v\d{2}\.\d{4}(\.dev\d+)?$`; else `false`.
- a `.devN` on **pinned** → `false` (draft, not a Library pin we'd upgrade).
- compare `(YY, MMDD)` tuples; `latest` newer iff `YY` greater, or equal `YY` and greater `MMDD`. (Same-date `.devN` on latest is impossible for published Library versions.)
Examples: `isNewer('v26.0610','v26.0609') → true`; `isNewer('v26.0609','v26.0609') → false`; `isNewer('v27.0101','v26.1231') → true`; `isNewer('v26.0609','v26.0609.dev1') → false` (pinned is a draft).

## 4 — Data flow (upgrade)

1. Model loads → App `refreshStaleness()` → `collectLibraryRefs(model, pool)` → for each distinct entity `latestVersion(etype, id)` (cached) → `staleSet` → `store.staleness = { "pr_x@v26.0609": "v26.0610", … }`.
2. ItemEditor renders the read-only `pr_x@v26.0609` chip; `staleness[ref]` is `"v26.0610"` → shows "newer: v26.0610 [Upgrade]". Topbar shows "⬆ 1 update".
3. Author clicks **Upgrade** → `upgradeRefAction("pr_x@v26.0609", "pr_x@v26.0610")` → `applyEdit(upgradeRef(...))` repoints all occurrences + removes the staleness entry → validation re-runs + the preview re-resolves to the new body. Badge drops to 0.
4. **Check for updates** (topbar) re-runs `refreshStaleness` on demand.

## 5 — Decisions / to verify during build

- **Library-ref vs pool-ref discrimination:** "not a pool key" is the rule. A ref with a `.devN` version that is somehow absent from the pool is ignored by `isNewer` (pinned `.devN` → not stale), so it won't generate spurious upgrades.
- **`latestVersion` etype:** derive from `parseRef(ref).type` (prefix map already in `library.ts`). The endpoint is `/v1/entities/{etype}/{eid}` (no version) → latest published.
- **Caching in `refreshStaleness`:** fetch `latestVersion` once per distinct `etype/id` (multiple pinned versions of the same entity share one latest lookup). Build the `ref → latest` map, then `staleSet`.
- **`upgradeRef` replace semantics:** exact-string match on the `ref` field value (`oldRef`), replaced with `newRef`; walk dicts + arrays (like `collectRefs`). Saved-item / message / prompt / option / context / instruction refs all live in a `{ ref: "..." }` shape, so a single rule covers them.
- **Live API dependency:** `latestVersion` needs the live Library; offline → `null` → nothing flagged stale (no false positives). The same redeploy note as C3a applies (FOLLOWUPS).
- **Topbar "Check for updates" placement:** beside Validate/Preview/Export; the badge shows only when N>0.

## 6 — Success criteria

ED-C3b is done when: on loading a questionnaire with Library-pinned refs, the editor checks each entity's latest published version and flags stale refs (a per-chip "newer: vX [Upgrade]" affordance + a topbar "⬆ N updates" badge); clicking **Upgrade** re-points that ref to the latest version (all occurrences), drops the badge, and the preview re-resolves live; nothing is ever upgraded silently (OD-06); a manual "Check for updates" re-runs the scan; all suites green + a screenshot delivered.

# Web Viewer WV-F (Conformance + Distribution Polish) — Design Spec

**Date drafted:** 2026-06-12
**Author:** Web Viewer WV-F brainstorming session (2026-06-12)
**Component:** **Web Viewer**, sub-project **WV-F** — the **final** stage (decomposition in the [WV-A spec §0](2026-06-11-web-viewer-wv-a-design.md)). Distribution + conformance polish: package the renderer as a consumable library for the Editor preview (**OD-03**), serve the Schema 7 manifest from a stable URL, support iframe embedding with host lifecycle events, ship a PWA shell (installable + asset cache), and hit the **PERF-01** load budget. After WV-F the Web Viewer (WV-A..F) is complete.
**Target:** `web-viewer/` only (no Viewer Service change).
**Authoritative source documents:**

- **OD-03** (resolved 2026-05-15): the Editor preview *is* the Web Viewer's renderer, consumed as a shared library — no separate preview engine (drift would violate the strict-presentation rule). [design/07_editor.md](../../../design/07_editor.md) §"Inline preview" + §"Resolved decisions"; [design/08_viewer.md](../../../design/08_viewer.md) §"Interactions" (Editor row).
- [design/08_viewer.md](../../../design/08_viewer.md) §"Web Viewer" — PWA-capable/installable/offline-cache, iframe embedding, deep-linking; §"Performance" (PERF-01: initial load < 3 s on 3G); §"Event emission" (offline batches accumulate + flush on connectivity — already built in WV-B/E).
- [design/03_use_cases.md](../../../design/03_use_cases.md) PERF-01.
- WV-A..E under `web-viewer/src/` — the renderer boundary (`src/renderer/index.ts`, the OD-03 library), the App boot (WV-D/E: currently `await loadEvaluator()` *then* mint, serialized), the WV-B retry queue + WV-E IndexedDB (the offline-submit substrate).

---

## 1 — Scope assessment (five concerns, one spec)

WV-F bundles five distribution concerns. Each is small-to-medium; together they're one spec. Two are bounded by deferred dependencies (called out as flags, not gaps):

| # | Concern | Buildable now? |
|---|---|---|
| A | **Renderer-as-library** (OD-03) | **Yes** — the renderer is already a clean boundary (`src/renderer/`, no `app/` imports). Build the lib artifact (ESM + types + CSS) + a published `exports`; verify by importing the *built* lib. The consumer (Editor) is future, so verification is a build/import smoke, not e2e. |
| B | **PERF-01** (< 3 s on 3G) | **Yes** — the 1 MB evaluator WASM (~390 KB gzip) is currently **awaited before mint** (serial). Overlap it with the mint round-trip; ship a documented bundle budget. |
| C | **iframe embedding** | **Yes** — the viewer already runs framed; add `postMessage` lifecycle events to the parent (loaded / completed / resize) + a host snippet. |
| D | **PWA shell** | **Partly** — installable (`manifest.webmanifest`) + a service worker precaching the app shell + the WASM (helps PERF-01 on repeat loads, enables reload-offline-mid-session). **Full offline-first *mint* is impossible** (minting needs the VS); "submit when back online" already works via the WV-B queue + WV-E IndexedDB. |
| E | **Manifest publication** | **Yes for the viewer origin** — ship `manifest.json` in the build so it's served at `https://<viewer>/manifest.json` (the stable URL = the deploy origin). **Public hosting at behaverse.org stays deferred** (project decision). |

## 2 — A: Renderer as a library (OD-03)

The renderer (`src/renderer/index.ts` — `StepRenderer`, `ItemRenderer`, the widgets, `mergeOptions`/`deriveWidget`/types) is published as **`@behaverse/questionnaire-renderer`**, a separate build artifact the Editor preview imports. It is already self-contained (the WV-A OD-03 boundary: no imports from `app/`). WV-F adds:

- **A Vite library build** (`vite.config.lib.ts`, `npm run build:lib`) producing **ESM** (`dist-lib/renderer.js`) + **type declarations** (`dist-lib/renderer.d.ts`, via `vite-plugin-dts` or `tsc --emitDeclarationOnly`), with **`react`/`react-dom`/`react/jsx-runtime` externalized** (peer deps, never bundled).
- **A precompiled CSS** (`dist-lib/renderer.css`) — Tailwind compiled for exactly the renderer's utility classes + the `--qv-*` theme-variable defaults, so a consumer gets correct styling without configuring Tailwind to scan the lib. The Editor imports both `renderer.js` and `renderer.css`.
- **A `package.json` `exports` map** declaring the lib entry + the CSS + the types, and `peerDependencies: { react, react-dom }`. (Local-path consumption now; proper npm publish at the deferred repo split.)
- **Verification**: a build smoke that imports `StepRenderer` from the *built* `dist-lib/renderer.js` and renders a fixture in a node/jsdom test — proving the artifact is consumable standalone (the Editor doesn't exist to e2e against). The renderer's existing unit tests already cover behaviour.

The web-viewer app keeps importing the renderer from source (same repo); the lib build is an *additional* artifact for external consumers. No renderer code changes — only packaging.

## 3 — B: PERF-01 (load budget)

**The win**: boot currently runs `const evaluator = await loadEvaluator()` *then* `resolveResume`/`mintSession` — the 1 MB WASM fetch is serialized *before* the network mint. WV-F **overlaps** them: start the evaluator load and the resume/mint concurrently (`Promise.all`), so total boot ≈ `max(wasm, network)` not `sum`. The evaluator is still awaited before the first render (correct — the first step may carry `show_if`), but its fetch now hides behind the mint round-trip (near-free on a warm CDN; on 3G the two large costs overlap).

- **Restructure boot**: kick off `loadEvaluator()` immediately (not awaited), run resume/mint, then `await` the evaluator promise just before building the pipeline. Preserves all WV-D/E correctness + the StrictMode single-boot guard.
- **SW asset cache** (§5/D) makes repeat loads instant (the WASM + shell come from cache) — the dominant real-world PERF-01 path.
- **Documented budget**: a short `PERF.md` (or README section) recording the measured gzipped sizes (app ~75 KB, evaluator WASM ~390 KB) + the 3G load-path math + that the WASM is lazy/cached, so the *interactive shell* meets < 3 s and logic-readiness overlaps the mint. No hard CI perf gate (flaky); a measurement + the optimization.
- **Deferred (flag F3)**: fully *lazy* evaluator (load only when the first logic rule fires, so a no-logic questionnaire never pays) — more complex (must handle "evaluator pending" in the render/visibility path without mis-evaluating a first-step `show_if`); the overlap win captures most of the benefit safely.

## 4 — C: iframe embedding + host events

The viewer already runs in an iframe (URL-param driven, no top-level assumptions). WV-F adds a **host-messaging layer** (`src/app/embed.ts`): when framed (`window.parent !== window`), `postMessage` lifecycle events to the parent:

- `{ type: 'behaverse:loaded', sessionId }` on `ready`,
- `{ type: 'behaverse:completed', sessionId }` on `submitted`,
- `{ type: 'behaverse:resize', height }` on content-height change (via `ResizeObserver`) so a host can auto-size the iframe.

Target origin is `'*'` by default with an optional `?embed_origin=` param to restrict it (the host's origin) — recommended for production embeds. A documented host snippet (listen for the events, size the frame). No inbound messages (the host can't drive the viewer — keeps the participant in control). Pure + unit-testable (`postMessage` spy).

## 5 — D: PWA shell

- **`public/manifest.webmanifest`** — name, icons (a generated simple mark), `display: standalone`, theme colour, `start_url`. Makes the viewer installable; linked from `index.html`.
- **A service worker** via **`vite-plugin-pwa`** (Workbox under the hood) precaching the app shell (`index.html`, the app JS/CSS) + the evaluator WASM, with a network-first strategy for the VS API (never cache `/v1/sessions/*` responses — always live) and cache-first for static assets. This gives: instant repeat loads, the WASM served from cache (PERF-01), and a reload mid-session working offline (the shell loads; WV-E IndexedDB restores state; the WV-B queue holds submissions until reconnect — flush is already built).
- **Offline reality (flag F2)**: a *first* visit while offline can't mint (needs the VS) — the SW serves the shell, the viewer shows the existing network-retry/error screen. True offline-first mint is out of scope (impossible). "Submit-when-back-online" is already delivered by WV-B's backoff queue + WV-E persistence; the SW just makes the shell survive a reload.
- Dev/test: `vite-plugin-pwa` runs in `injectManifest`/`generateSW` mode only on `build`; vitest is unaffected (the SW isn't registered in tests). A small `registerSW` call in `main.tsx` (guarded to production).

## 6 — E: Manifest publication

`web-viewer/manifest.json` (the Schema 7 conformance manifest, now truthful post-WV-D) is copied into the build output (via `public/` or a build step) so it's served at the viewer's own origin (`https://<viewer-deploy>/manifest.json`) — the stable URL operators register with the VS (`POST /v1/viewers -d @<that URL>` or the existing local `curl`). The README documents the registration. **Public hosting at `behaverse.org` stays deferred** (project decision — unchanged here). Tiny: a `public/` copy + a doc line; the manifest content is unchanged.

## 7 — Module layout (additions to `web-viewer/`)

```
web-viewer/
├── vite.config.lib.ts          # renderer library build (ESM + dts + css; react externalized)
├── public/
│   ├── manifest.webmanifest    # PWA install manifest (NOT the Schema 7 one)
│   ├── manifest.json           # the Schema 7 conformance manifest, served at /manifest.json (copy)
│   └── icon-*.png              # PWA icons (simple generated mark)
├── src/app/
│   ├── embed.ts                # postMessage host-event layer (loaded/completed/resize)
│   ├── App.tsx (modify)        # boot: parallelize evaluator load + mint; wire embed events
│   └── main.tsx (modify)       # production registerSW()
├── tests/lib-smoke.test.ts(x)  # imports StepRenderer from the BUILT dist-lib + renders a fixture
├── PERF.md                     # the documented PERF-01 budget + load-path math
├── package.json (modify)       # build:lib, exports map, peerDeps, vite-plugin-pwa + dts devdeps
└── README.md / FOLLOWUPS.md    # WV-F docs
```

## 8 — Testing

1. **Renderer-lib smoke**: `npm run build:lib`, then a test importing `StepRenderer` (+ types) from `dist-lib/renderer.js`, rendering a fixture and asserting output — proves the standalone artifact works (the lib build externalizes React; the test provides it).
2. **embed.ts units**: framed-detection, the three event shapes + payloads, origin restriction (`embed_origin`), no-op when not framed (spied `postMessage`).
3. **Boot-parallelization**: an App test asserting `loadEvaluator` and the mint fetch are both in flight before either resolves (the evaluator promise is created before the mint awaits) — and that all WV-D/E behaviour (branching, resume, validation) stays green.
4. **PWA build**: `npm run build` emits `manifest.webmanifest` + a service worker + the Schema 7 `manifest.json` at the output root; a build-output assertion (the files exist; the SW references the wasm). No SW registration in vitest.
5. **PERF measurement** (manual, recorded in PERF.md): the gzipped sizes from the build + the 3G math; a Lighthouse/throttled-load note from the live smoke if feasible.
6. **Live smoke** (extends WV-E's): build, serve `dist/` statically, load in chromium — confirm the PWA manifest is detected (installable), the SW registers + caches the wasm (second load serves it from cache), an iframe-embedded load emits `behaverse:loaded`/`completed` to a host listener, and `/manifest.json` is served. Record honestly.

## 9 — Review flags for the owner (decide at spec review)

- **F1 — Renderer-as-library now, verified by build/import smoke (Editor consumer is future).** Ship `@behaverse/questionnaire-renderer` (ESM + dts + precompiled CSS + `exports` + React peer-deps); the Editor will consume it when built. Recommendation: **build it** (it's the OD-03 deliverable; the artifact is real even without the consumer). Confirm.
- **F2 — PWA scope = installable + SW asset/shell cache; NOT offline-first mint.** Full offline mint is impossible (needs the VS); "submit-when-back-online" is already built (WV-B/E). Recommendation: ship installability + Workbox precache (via `vite-plugin-pwa`); document the offline reality. Confirm (or hand-roll the SW to avoid the dep — I'd keep `vite-plugin-pwa`).
- **F3 — PERF-01 = overlap the evaluator WASM load with the mint round-trip + SW cache + a documented budget; do NOT fully lazy-load the evaluator in v1.** Recommendation: the overlap (safe, correct) + cache captures most of the win; fully-lazy (load on first logic) is deferred (first-step `show_if` correctness risk). Confirm.
- **F4 — iframe: outbound `postMessage` lifecycle events only (loaded/completed/resize), default target `'*'` with optional `?embed_origin=` to restrict; no inbound control.** Recommendation: as stated. Confirm.
- **F5 — Manifest served at the viewer origin (`/manifest.json`); behaverse.org public hosting stays deferred.** Recommendation: as stated (unchanged project decision). Confirm.

## 10 — Out of scope / follow-ups
- Public manifest/schema hosting at behaverse.org (project-deferred; revisited post-MVP).
- Fully-lazy evaluator load (F3 follow-up if PERF profiling demands it).
- Offline-first *mint* / full PWA offline session start (impossible without a local-mint design; not planned for the Web Viewer — that's the Native/Godot viewer's domain).
- npm publication of `@behaverse/questionnaire-renderer` (happens at the deferred repo split; local-path consumption until then).
- RTL, behavioural channels, webcam/mic consent (post-Phase-2 / future milestones).
- **After WV-F the Web Viewer (WV-A..F) is COMPLETE** — the remaining Phase-2+ work is the **Scorer conformance runner** (OD-16, unblocks `score(id)`), the **Editor**, the **Native (Godot) Viewer**, and the **Participant Platform**.

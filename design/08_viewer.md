# 08 — Questionnaire Viewers

Viewers are the family of components that render a questionnaire to a participant and capture responses and interaction telemetry. The ecosystem includes two viewer implementations — Web and Native (Godot) — bound by a shared cross-viewer contract. PDF is an *export format* produced by the Library or the Editor; it is not a viewer in the data-collection sense (see [02_terminology.md](02_terminology.md) "PDF export").

## Purpose

- **Render** a questionnaire definition consistently across every supported context (browser, desktop, mobile, kiosk, embedded in games/VR).
- **Capture responses** in the canonical Behaverse trial format.
- **Capture interaction telemetry**: xAPI 2.0 statements for semantic events (Schema 4a), and — when configured — per-session behavioural-channel attachments for continuous data (Schema 4b — mouse, keyboard, future webcam/microphone).
- **Submit data** to the Viewer Service ([08a_viewer_service.md](08a_viewer_service.md)), which forwards to Behaverse — or queue locally and sync when connectivity returns.

## What the viewers are not

- **Not authoring tools.** Viewers consume canonical JSON. They do not edit it.
- **Not response stores.** Viewers may buffer locally for offline mode, but the canonical store for response and event data is Behaverse.
- **Not analytics.** Researcher-facing dashboards live in the Viewer Service or the Participant Platform, not in the viewer client.

## The viewer family

| Viewer | Platforms | Online? | Embeddable? | Behavioural channels |
|---|---|---|---|---|
| **Web Viewer** | Any modern browser | Yes (PWA-capable) | Yes (iframe / direct mount) | Mouse, keyboard, RT, future webcam/mic |
| **Native Viewer (Godot)** | Windows, macOS, Linux, iOS, Android | Optional (offline-first) | Yes (Godot plugin in games/VR) | Mouse, keyboard, RT, future webcam/mic |

PDF is an export format, not a viewer member. It is produced by the Library or the Editor on demand.

## Cross-viewer contract

The contract has three tiers:

| Tier | Meaning | Required? |
|---|---|---|
| **Semantic equivalence** | Same canonical JSON → same captured response, same scoring, same xAPI semantic-event stream (event ordering may differ; statement *content* does not). | Required for every viewer-question pairing the viewer claims to support. |
| **Visual fidelity** | The viewer reproduces authored presentation exactly, with one permitted class of adaptation: **physical-envelope adaptations** that do not change visual structure (device-pixel-ratio scaling, browser zoom, OS accessibility font-size, scroll on overflow). A 1200px-wide matrix on a 360px phone scrolls horizontally; it does *not* collapse to a stacked list. | Required, with documented physical-envelope adaptations. |
| **Feature parity** | A viewer either supports a feature or declares it unsupported in its conformance manifest. The Editor warns at authoring time about features not supported by intended deployment targets. | Declared per viewer. |

Divergence in **semantic equivalence** is a defect. Divergence in **visual presentation** beyond the physical envelope is **not permitted** — viewers do not get discretion to substitute one rendering for another (e.g. matrix → list on mobile is forbidden unless the author declares an alternative presentation for that breakpoint; see the forward path in §"Author-defined fallbacks" below).

### Conformance manifest

Each viewer publishes a machine-readable manifest declaring:

- Supported core question types and supported extension types (`behaverse.org/types/...`).
- Supported deployment-mode dimensions ([08a_viewer_service.md](08a_viewer_service.md)).
- Supported logic rule types.
- Supported validation types.
- Supported behavioural channels.
- Supported export formats.
- Supported locales (RTL flag: `rtl_supported`).
- Viewport range across which authored layouts render faithfully (e.g. *"viewport ≥ 360 × 640 px"*).

The Editor reads this manifest at authoring time; the Viewer Service validates the manifest against the deployment configuration before issuing session tokens.

### Author-defined fallbacks (forward path)

Authors may optionally declare *alternative presentations* for named breakpoints (`mobile`, `tablet`, `paper`) via an optional `presentation.breakpoints` map. If declared, the viewer uses the breakpoint-specific presentation; if not declared, the strict rule applies. The viewer never chooses a fallback — the author does. The schema namespace is reserved in v1; the Editor surface for authoring breakpoints is a future Editor capability.

### Reference evaluator

Logic, validation, and scoring expressions evaluate identically across viewers by virtue of a **single WASM module** that ships alongside the schemas (per OD-11, resolved 2026-05-21). The same binary is embedded by the Web Viewer (via wasm-bindgen), the Native Viewer (via Godot's WASM integration / a thin C-ABI wrapper), and the Editor preview (via CFFI / wasmer-python). Determinism — float arithmetic, date arithmetic, locale-aware comparisons — is guaranteed by construction; the cross-viewer contract is "passes the WASM evaluator's outputs," not "matches a test suite." A normative test suite ships alongside the module as a regression harness for the module itself.

## Deployment modes

Deployment modes are **named presets** that resolve to specific combinations of orthogonal dimensions in the Viewer Service (see [08a_viewer_service.md](08a_viewer_service.md) §"Deployment modes"). Viewers honour the resolved dimensions (`auth`, `persistence`, `lifecycle`, `rendering_context`), not the preset name.

| Preset | Description |
|---|---|
| **Anonymous link** | URL-driven; pseudonymous session; no login. |
| **Access code** | Code-protected URL. |
| **Platform study** | Assignment via the Participant Platform; participant is logged in. |
| **Embedded** | Rendered inside a host application; session inherits context from host. |
| **Kiosk** | Locked-down device; clears participant data between sessions. |
| **Demo** | No data persistence; visible "demo" indicator. |
| **Preview** | Author preview (from the Editor); short-lived; no data persistence. |

## Web Viewer

### Responsibilities

- Render the questionnaire in any modern browser (Chromium, Firefox, Safari) on desktop and mobile.
- Be progressive-web-app capable: installable, with offline cache.
- Support deep-linking to a specific deployment via URL parameters.
- Support iframe embedding for inclusion in third-party web pages.
- Emit xAPI events and submit responses to Behaverse.

### Required features

- Responsive layout — mobile-first, scales to desktop and large displays.
- WCAG 2.1 AA conformance: keyboard navigation, screen-reader support, contrast control, font sizing.
- Session resume: when a participant returns to an interrupted session, prior state is restored from local storage and (where possible) from the server.
- Theming hooks: respect the deployment theme (logo, colours, fonts, optional custom CSS).
- Localised UI chrome (navigation buttons, progress bar) in the active language.

### Presentation modes

The Web Viewer supports two declared presentation modes, selected by `style.x_presentation` (settable on the questionnaire's `style` or overridden per deployment):

- **`focus`** (default) — one question per view, in the typeform.com mould (owner directive, 2026-06-11): a single centred column, large prompt typography, choice cards with letter-key hints, step transitions, and **auto-advance** after answering a single-choice question (disable with `style.x_auto_advance: false`; suppressed under `prefers-reduced-motion` for the transition, with screen-reader announcement before the advance). Pacing only: focus mode never reorders elements, splits a Section/matrix (a Section is one view), or substitutes widgets.
- **`classic`** — authored page-at-a-time rendering: all of a page's elements together, as in the original page structure.

Because the mode is declared, deterministic data (an `^x_` extension — no schema change), it sits within the cross-viewer visual-fidelity contract: every conforming viewer renders the same mode the same way, or declares non-support in its conformance manifest. The Native Viewer must implement the same semantics or declare non-support.

### Behavioural channels

Per OD-07 (resolved 2026-05-21), the deployment-level default-state matrix is:

| Channel | Default | Researcher action | Participant action |
|---|---|---|---|
| Summary RT (on `answered` xAPI statement) | **On** | Disable per deployment if not wanted | None |
| `mouse` trajectory | **Opt-in** | Enable per deployment | None (deployment-time consent covers) |
| `keyboard` timing (intervals only; no key contents except for designated paradigms) | **Opt-in** | Enable per deployment | None (deployment-time consent covers) |
| `webcam` *(future)* | **Opt-in** | Enable per deployment | **Explicit per-session consent** before media access |
| `microphone` *(future)* | **Opt-in** | Enable per deployment | **Explicit per-session consent** before media access |

The Web Viewer captures only what's enabled; disabled channels produce no attachment and no `recorded` xAPI statement. Continuous-signal channels go in Schema 4b attachments uploaded to the Viewer Service; only the summary RT extension travels in xAPI statements. The webcam/microphone two-layer consent (researcher enables on deployment AND participant explicitly grants at session start) is the privacy floor; no silent recording is possible under any combination of settings.

## Native Viewer (Godot)

### Responsibilities

- Render the questionnaire on Windows, macOS, Linux, iOS, Android.
- Operate fully offline. Connectivity is optional; sync is opportunistic.
- Provide a kiosk mode for unattended devices.
- Be available as a Godot library / plugin so games and VR experiences can embed questionnaires at specific events.

### Required features

- Local storage of responses and events (a local database, e.g. SQLite-equivalent) until sync.
- A reliable sync queue with retry / back-off semantics.
- Conflict resolution when a definition is updated while a local session is in flight: surface a clear notice; do not silently replace the running definition.
- Kiosk mode: prevent the participant from exiting the application; clear local participant data after submission.
- Plugin API for embedding in host games: show/hide, configure, fetch responses, hook completion / abandonment events.
- Local file export of session data for backup (JSON, CSV).

### Behavioural channels

Same as the Web Viewer: response-time as a summary extension on `answered`; mouse, keyboard, and future webcam/mic as Schema 4b per-session attachments.

(PDF rendering is documented as an export format in [07_editor.md](07_editor.md) §10 and [06_library.md](06_library.md). It is not a viewer.)

## Session lifecycle

```
   ┌──────────────┐
   │ not_started  │  (deployment exists; participant has not opened the link)
   └──────┬───────┘
          │  participant opens the viewer
          ▼
   ┌──────────────┐
   │ in_progress  │ ◄── save / resume; persisted locally and on Behaverse
   └──────┬───┬───┘
          │   │
          │   └─── timeout / inactivity ───► ┌────────────┐
          │                                  │ abandoned  │
          │                                  └────────────┘
          │  all required questions answered
          ▼
   ┌──────────────┐
   │  completed   │
   └──────┬───────┘
          │  data confirmed sent to Behaverse
          ▼
   ┌──────────────┐
   │  submitted   │
   └──────┬───────┘
          │  server-side validation passes
          ▼
   ┌──────────────┐
   │  validated   │
   └──────────────┘
```

A session ID (UUID v4) is allocated when the participant first opens the viewer. It is the join key for every downstream record (responses, events, attachments).

## Event emission

xAPI verbs and the namespaced extension set are defined in [05_data_model.md](05_data_model.md) §"Schema 4a — Event Data (xAPI semantic events)".

Viewers batch semantic events client-side (default: every 5 seconds or 20 statements) and POST to the Viewer Service's events endpoint. Behavioural-channel attachments (Schema 4b) are uploaded in chunks to the Viewer Service's `POST /sessions/{session_id}/channels/{channel_name}` endpoint; the final chunk closes the channel and triggers the linker `recorded` xAPI statement.

Network failures retry with exponential back-off. In offline mode, batches and channel chunks accumulate locally and flush on connectivity.

## Submission targets

By default, the viewer submits to the Viewer Service ([08a_viewer_service.md](08a_viewer_service.md)), which forwards to Behaverse. Additional submission targets are configurable per deployment:

- **Behaverse** (the Viewer Service's default downstream sink).
- **Pluggable third-party sink** — for labs that adopt this software without Behaverse. Documented as a `ResponseSink` / `EventSink` / `AttachmentStore` interface in [08a_viewer_service.md](08a_viewer_service.md).
- **Local file export** — JSON, CSV, or both, downloaded at session completion.
- **Email delivery** — a configured address receives a copy of the responses (used in some kiosk and field-study contexts).

## Validation and submission rules

- Client-side validation runs as the participant fills the form (per-question and cross-question).
- Server-side validation runs after submission and may move a session from `submitted` to `validated` or flag it for researcher review.
- A failed-validation session is not silently discarded; researchers see it in the dashboard.

## Theming

A theme is configured per deployment. It includes:

- Logo and institutional branding.
- Colour palette (primary, secondary, success, warning, error).
- Typography (font family, base size).
- Spacing tokens.
- Optional custom CSS (Web Viewer only).

All theming respects the accessibility constraints; the system surfaces accessibility violations (e.g. low contrast) at theming time.

## Resume and offline behaviour

- **Web Viewer.** Persists state in IndexedDB or equivalent. On reload, restores the questionnaire and prior answers. Server-side state (when authenticated) is the source of truth on conflict.
- **Native Viewer.** Persists state in a local database. Designed for extended offline operation. Syncs opportunistically.
- **Demo mode.** State is per-session and not persisted across reloads; demo data never leaves the device.

### Session resume semantics

Per OD-14 (resolved 2026-05-21), the six corner cases of resume are settled as follows:

| # | Case | Behaviour |
|---|---|---|
| 1 | **Mid-page interruption.** Participant abandons mid-page and returns. | Viewer scrolls to and focuses the first **unanswered** question on the resumed page. Previously-answered questions on the page are preserved (their values stay set; the participant doesn't re-enter them). |
| 2 | **Dirty-state granularity.** When does the viewer persist resumable state? | Per-question, on change. Text inputs are debounced ~500 ms. Persistence goes to the viewer's local store (IndexedDB / local SQLite) and, for `persistence=persisted` deployments, mirrors to the Viewer Service through the per-item response endpoint. |
| 3 | **Conflict on resume.** Definition was edited between session-start and resume. | Pin at session-mint time. The session record captures the exact `questionnaire_ref` (`qst_id@version`) at session creation; the viewer continues against that pinned version regardless of any newer versions published in the Library. Newer content never silently enters an in-flight session. Composes with OD-06 hard-pinning. |
| 4 | **`persistence=ephemeral` deployments** (Demo, Preview). Participant returns to a closed session. | Resume is refused. The viewer mints a *new* session from scratch and surfaces "This is a demo / preview — your prior session has been cleared." Honours the ephemeral contract from [08a_viewer_service.md](08a_viewer_service.md). |
| 5 | **`active_until` past, in-progress session returning.** | Existing `in_progress` sessions continue to resume even after `active_until` has passed. Minting a *new* session against a closed deployment fails. Researchers needing hard cutoffs are advised to set `active_until` with a buffer for expected completion times. |
| 6 | **Language-switch persistence.** Participant switched locale mid-session, then resumes. | Last-active locale persists. The session's `last_active_locale` (Schema 6 field) is part of the resumable state; the participant resumes in whatever locale they were last using. The `initial_locale` never changes; per-item responses already record locale-at-answer for analytic reconstruction. |

The resumable state shape (what the local store + Viewer Service persist) is documented in [05_data_model.md](05_data_model.md) §"Schema 6 — Session Metadata".

## Performance

- Initial load on a 3G connection: under 3 seconds (per [03_use_cases.md](03_use_cases.md) PERF-01).
- Interaction latency (option select, navigation): under 100 ms.
- Submit-confirmation latency on a healthy network: under 1 second.

## Permissions

Viewers themselves do not perform authorisation — they consume deployments that already encode access control. The Viewer Service brokers token-based access for authenticated deployments and pseudonymous sessions for anonymous ones.

## Interactions with other components

| With | How |
|---|---|
| **Library** | Indirectly — the Viewer Service fetches definitions from the Library. The viewer itself reads canonical JSON. |
| **Editor** | The Editor's preview reuses the Web Viewer's renderer as a shared library (OD-03 resolved — see [07_editor.md](07_editor.md) §8). |
| **Viewer Service** | Receives all submissions (responses, events, attachments) via session tokens minted at session start. Forwards to Behaverse. |
| **Participant Platform** | For `platform_study` deployments, the platform creates an assignment that resolves to a viewer URL with an authenticated session. |
| **Behaverse** | Downstream recipient of responses, events, and attachment manifests via the Viewer Service. |

## Resolved decisions referenced from this component

- **OD-01** (resolved 2026-05-23) — **S1 (Pure custom).** Canonical questionnaire format is custom JSON; Web Viewer is custom React + TypeScript (published as a library for the Editor preview to consume per OD-03); Native Viewer is custom Godot / GDScript. No SurveyJS dependency.
- **OD-03** (resolved 2026-05-15) — Editor preview shares the Web Viewer's renderer as a library.
- **OD-07** (resolved 2026-05-21) — Behavioural-channel default-state matrix; documented in §"Behavioural channels" above.
- **OD-11** (resolved 2026-05-21) — Single WASM expression evaluator; documented in §"Reference evaluator" above.
- **OD-14** (resolved 2026-05-21) — Session resume semantics; six sub-questions documented in §"Session resume semantics" above.

## Open decisions referenced from this component

Webcam / microphone integration is gated on a future consent infrastructure milestone; per-phase scheduling is tracked in [plan/04_feature_priority.md](../plan/04_feature_priority.md).

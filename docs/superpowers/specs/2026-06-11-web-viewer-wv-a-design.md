# Web Viewer WV-A (App Shell + Session Bootstrap + Schema 3 Renderer) — Design Spec

**Date drafted:** 2026-06-11
**Author:** Web Viewer WV-A brainstorming session (2026-06-11)
**Component:** **Web Viewer**, sub-project **WV-A** — the first of six stages (see §0 decomposition). The participant-facing custom React + TypeScript client that renders Schema 3 runtimes minted by the now-complete Viewer Service (VS-A..E).
**Target repo:** `questionnaire-web-viewer` (built in the current folder under `web-viewer/` for now; mirrors `library-web/`; migrates at the deferred repo split per [design/14_repository_topology.md](../../../design/14_repository_topology.md)).
**Stack (locked by OD-01 — no SurveyJS):** Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS 3.4 · vitest + React Testing Library (mirrors `library-web/`). No react-router, no TanStack Query (see §2 rationale).
**Authoritative source documents:**

- [design/08_viewer.md](../../../design/08_viewer.md) — the viewer component spec: cross-viewer contract (semantic equivalence / visual fidelity / feature parity), Web Viewer responsibilities, session lifecycle, OD-14 resume table, theming, behavioural channels (OD-07).
- [design/05d_runtime.md](../../../design/05d_runtime.md) + [schemas/runtime/schema.json](../../../schemas/runtime/schema.json) — Schema 3, the input WV-A renders. **Faithful projection**: the runtime keeps Schema 2 vocabulary; the viewer does the option merge (§4.1).
- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) §13 — the UI-input-widget derivation table (Option `(input_data_type, measurement_type, selection)` triple); §14 — page-element shapes.
- [schemas/viewer_conformance/schema.json](../../../schemas/viewer_conformance/schema.json) — Schema 7, the manifest this viewer publishes (minimal form in WV-A, §9).
- [design/08a_viewer_service.md](../../../design/08a_viewer_service.md) + `viewer-service/README.md` — the live service WV-A calls (`POST /v1/sessions/new` etc.).
- `questionnaire-runtime-denormaliser/tests/fixtures/mini_phq.py` — the ground-truth Schema 3 element shape the denormaliser actually emits (the canonical `schemas/runtime/examples/` predate faithful projection and show a pre-merged `choices` shape that does NOT exist in real runtimes — see §4.1 note).

---

## 0 — Decomposition of the Web Viewer (WV-A → WV-F)

The Web Viewer is too big for one spec/plan cycle. Mirroring the Viewer Service's VS-A..E decomposition, it is sliced so that **every stage ends with a participant-visible, end-to-end-testable increment**, and the WASM evaluator (a separate Rust deliverable) blocks only the stages that genuinely need it:

| Stage | Contents | Depends on | Phase-2-gate role |
|---|---|---|---|
| **WV-A** (this spec) | App shell, URL contract, session bootstrap (`POST /sessions/new` + theme), the **Schema 3 renderer** (option merge, widget derivation, items / messages / sections incl. `shared_option` matrix), linear page navigation with required-gating, local answer state, WCAG 2.1 AA, localised chrome, minimal Schema 7 manifest. | VS (built) | Participant can open a deployment link and fill in a linear questionnaire. |
| **WV-B** | Response capture + submission: Schema 5 `Response` rows (incl. summary RT per OD-07), debounced `POST /sessions/{id}/responses`, `bdm:` event batching (Schema 4a, ~5 s / 20 statements) to `/events`, `/complete`, retry/back-off, completion + demo-indicator screens. | WV-A | **Closes the gate for linear questionnaires**: respond → outbox → forward → export.csv. |
| **WV-C** | **WASM expression evaluator** (OD-11): separate Rust → WASM sub-project (own dir, own spec; consumed via wasm-bindgen here, later by Godot + Editor). `score()`, LogicRule conditions, validation expressions, piping. | — (parallel) | Unblocks logic + scoring everywhere. |
| **WV-D** | Navigation + logic: `show_if` (pages/sections/elements), `branch`/`skip`/`visibility`/`piping` actions, per/cross-question validation rules, in-session scoring (`scores[]` impl `kind: wasm`), `style.layout` refinements, blocks. | WV-A + WV-C | Branching questionnaires render correctly. |
| **WV-E** | Session resume (OD-14) + locale switch: per-question IndexedDB persistence (~500 ms debounce on text), mirror to VS per-item endpoint, `GET /sessions/{id}` + `/runtime` on reload, `POST /sessions/{id}/locale`, ephemeral `409 ephemeral_no_resume` → fresh mint + notice. | WV-B | Interrupted participants finish later. |
| **WV-F** | Conformance + distribution polish: Schema 7 manifest published at a stable URL (widgets/logic/locales now true), renderer packaged as a consumable library for the Editor preview (OD-03), iframe embedding, PWA shell, PERF-01 budget check. | WV-A..E | Manifest honesty; Editor reuse. |

Build order: **WV-A → WV-B → WV-C → WV-D → WV-E → WV-F** (WV-C can start any time; it has no dependency on A/B). Each stage gets its own spec → plan → subagent-driven TDD build → merge to master (no PRs).

---

## 1 — Scope (WV-A)

### 1.1 In scope

- A new `web-viewer/` Vite + React 19 + TS + Tailwind SPA (package `questionnaire-web-viewer`), mirroring `library-web/` conventions (tsconfig layout, vitest + RTL, npm scripts).
- **URL contract** (§3): `/?deployment={deployment_id}[&locale={tag}][&viewer_url={vs_base}]` — deep-linking per design/08.
- **Session bootstrap** (§3): `POST {VS}/v1/sessions/new` with `{deployment_id, viewer_id, viewer_version, locale?}` → hold `{session_id, session_token, runtime, theme}` in memory; friendly localised error screens for 404 / 409 (not-yet-open, quota) / 410 (closed) / network failure.
- **Schema 3 renderer** (§4) — the heart of WV-A, structured as an exportable library boundary (`src/renderer/`, OD-03):
  - the **option merge** (structural `options[]` × `content.<locale>.options[]`, joined on `index`),
  - **widget derivation** from the Option triple (§13 table) via a pure `deriveWidget()` + a widget registry,
  - widgets: **RadioGroup** (`choice.*.single`), **CheckboxGroup** (`choice.nominal.multiple`), **NumberInput** (`number.*`, honouring `min`/`max`/`step`), **TextInput** (`text.*`, honouring Placeholder),
  - **Section** rendering: title + grouped elements; `shared_option` → **matrix layout** (one option header row, one radio row per item),
  - **Message** elements (locale text, markdown not required in WV-A — plain text + line breaks),
  - **UnsupportedElement** card for any unknown widget triple / element shape (explicit, never a silent skip — feature-parity honesty).
- **Linear navigation + local answer state** (§5): Next/Back across `pages[]` in document order, progress indicator, `required` gating on Next, answers held in a reducer keyed by element id. No persistence, no submission (WV-B/E).
- **Theming** (§6): apply the `theme` bundle from session-mint as CSS custom properties; sensible defaults when `theme` is null.
- **WCAG 2.1 AA + visual fidelity** (§7): keyboard-completable, `fieldset`/`legend` semantics, focus management on page change, physical-envelope-only responsiveness (matrix scrolls horizontally on small viewports; never collapses).
- **Localised chrome** (§8): viewer strings (Next, Back, Required, error screens) keyed by the runtime locale; `en` + `pt` shipped, `en` fallback.
- **Minimal Schema 7 manifest** (§9): checked in at `web-viewer/manifest.json`, registered against a local VS via documented `curl` (one-liner in README). No `logic_actions` declared → the VS/denormaliser strips logic from runtimes minted for this viewer, which is exactly WV-A's (linear-only) truth.
- **Dev fixture mode** (§3.3): `?fixture={name}` (dev builds only) renders a bundled Schema 3 JSON without a running VS.

### 1.2 Non-goals (deferred to WV-B..F)

- **No response/event submission**, no Schema 5/4a construction, no `/complete`, no RT capture (→ WV-B).
- **No expression evaluation** — `show_if`, `logic[]`, `validation[]`, piping placeholders are not evaluated (the manifest omission means minted runtimes arrive logic-stripped; `show_if` on elements of real content may still appear and is **ignored with a console warning** in WV-A) (→ WV-C/D).
- **No in-session scoring**, no `scores[]` execution, `lock_show_score_timing` unused (→ WV-D).
- **No resume, no IndexedDB, no locale switch UI** — refresh restarts (and re-mints) the session (→ WV-E).
- **No behavioural channels** (mouse/keyboard trajectories) (→ post-Phase-2; OD-07 defaults documented only).
- **No `style.layout` refinements** (dropdown / slider-like), no author breakpoints, no `randomize`, no `max_time_seconds` (→ WV-D, logged in FOLLOWUPS).
- **No PWA / offline / iframe-embedding hardening, no published npm package** (→ WV-F).
- **No auth beyond the anonymous flow** — Bearer token is held but unused until WV-B submits.

---

## 2 — Stack rationale + module layout

No **react-router**: the viewer is a single linear flow driven by query params and internal state — a router adds nothing. No **TanStack Query**: there is exactly one bootstrap request in WV-A; caching/refetch semantics would be wrong for session mint (a retry must be deliberate, not automatic).

```
web-viewer/
├── package.json                 # questionnaire-web-viewer; scripts mirror library-web
├── index.html · vite.config.ts · tailwind.config.ts · tsconfig*.json
├── manifest.json                # the WV-A Schema 7 manifest (§9)
├── README.md · FOLLOWUPS.md
├── src/
│   ├── main.tsx                 # mount; reads URL params
│   ├── app/
│   │   ├── App.tsx              # state machine: boot → error | ready(page i) → end-of-pages screen
│   │   ├── bootstrap.ts         # parseParams() + mintSession() (fetch wrapper, typed errors)
│   │   ├── session.ts           # SessionState reducer: {session, runtime, theme, answers, pageIndex}
│   │   ├── theme.ts             # themeToCssVars(theme | null) → CSS custom properties
│   │   └── chrome/              # ErrorScreen, ProgressBar, NavButtons, strings.ts (en/pt)
│   ├── renderer/                # ← the OD-03 library boundary (no app/ imports allowed)
│   │   ├── index.ts             # public API: <PageRenderer>, types, deriveWidget, mergeOptions
│   │   ├── types.ts             # TS types for the faithful-projection Schema 3 shapes
│   │   ├── merge.ts             # mergeOptions(option, locale) → MergedChoice[] | scalar spec
│   │   ├── derive.ts            # deriveWidget(option) → WidgetKind ("choice.ordinal.single", …)
│   │   ├── PageRenderer.tsx     # page → elements (Section | Message | Item dispatch)
│   │   ├── SectionRenderer.tsx  # title + children; shared_option → MatrixGroup
│   │   └── widgets/             # RadioGroup, CheckboxGroup, NumberInput, TextInput,
│   │                            #   MatrixGroup, MessageBlock, UnsupportedElement
│   └── fixtures/                # dev-mode Schema 3 JSONs (mini linear, matrix, kitchen-sink)
└── tests/                       # vitest + RTL (see §10)
```

The renderer takes **controlled props** — `<PageRenderer page locale answers onAnswer />` — and owns no fetch, no session, no navigation. That is what makes it reusable by the Editor preview (OD-03) and trivially testable.

## 3 — URL contract + bootstrap flow

### 3.1 Parameters

| Param | Required | Meaning |
|---|---|---|
| `deployment` | yes | The deployment id to mint a session against. |
| `locale` | no | Requested locale (BCP-47); VS resolves against the deployment's `available_locales` / default. |
| `viewer_url` | no | VS base URL override; default from `VITE_VS_BASE_URL` (dev: `http://localhost:8001`). |
| `fixture` | dev only | Render a bundled fixture runtime; no network (§3.3). |

### 3.2 Boot sequence

1. Parse params; missing `deployment` → config-error screen (not a VS error).
2. `POST {vs}/v1/sessions/new` body `{deployment_id, viewer_id: "behaverse-web-viewer", viewer_version: <build-stamped CalVer>, locale?}`.
3. On 200/201: store `{session_id, session_token, runtime, theme}` in the reducer (token in memory only — never localStorage in WV-A), apply theme vars, render page 0. Document title ← `runtime.metadata.title`.
4. On error, map to localised screens: `404` unknown deployment → "link invalid"; `409` (`not_yet_active` / quota) → "not currently accepting responses"; `410` → "closed"; `422` (mint preflight) + `5xx`/network → "something went wrong" + retry button. Raw `error.code` shown in small print for researcher debugging.

### 3.3 Dev fixture mode

`?fixture=mini` (guarded by `import.meta.env.DEV`) loads `src/fixtures/mini.json` and skips the network entirely — the development loop for renderer work needs no Postgres/VS. Fixtures use the **denormaliser-true** shape (§4.1), one per renderer milestone: `mini` (2 pages of radios), `matrix` (Section + shared_option), `widgets` (every supported triple + a Message + an unsupported combo).

## 4 — The renderer

### 4.1 Faithful projection: the option merge

**The runtime Option keeps Schema 2 vocabulary** (per the denormaliser's locked "faithful projection" decision). After locale-trimming, an element looks like:

```jsonc
{
  "id": "it_1",
  "question": { "prompt": { "id": "pr_mini_1", "name": "interest",
                            "content": { "en": { "status": "validated", "text": "Little interest …" } } } },
  "option": {
    "id": "opt_freq_4",
    "input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
    "options": [ { "index": 1, "value": 0 }, { "index": 2, "value": 1 }, … ],
    "content": { "en": { "status": "validated", "label": "Frequency",
                         "options": [ { "index": 1, "text": "Not at all" }, … ] } }
  }
}
```

`mergeOptions(option, locale)` joins structural `options[]` with `content[locale].options[]` **on `index`** → `[{ index, value, text }]`. Missing text for an index is a render error (UnsupportedElement with reason), not a silent blank. **Note:** the canonical `schemas/runtime/examples/*.json` show a pre-merged `option.choices` shape — those examples predate faithful projection and were never regenerated (known follow-up logged in the denormaliser's FOLLOWUPS); the denormaliser fixture (`mini_phq.py`) is ground truth. The renderer targets the faithful shape only.

### 4.2 Widget derivation

`deriveWidget(option)` implements [design/05a §13](../../../design/05a_reusable_entities.md) and returns a `WidgetKind` string — the same strings the Schema 7 manifest declares:

| Triple | WidgetKind | Component |
|---|---|---|
| `choice` / `nominal·ordinal·interval·ratio` / `single` | `choice.<m>.single` | RadioGroup |
| `choice` / `nominal` / `multiple` | `choice.nominal.multiple` | CheckboxGroup |
| `number` / `ratio·interval` / — | `number.<m>` | NumberInput (`min`/`max`/`step`) |
| `text` / `nominal·interval·ratio` / — | `text.<m>` | TextInput |

Anything else (including `choice.ordinal.multiple` etc. that the table doesn't define) → `UnsupportedElement`, rendered as a visible card naming the element id + triple. The VS already trims to the manifest, so participants should never see one — its real audience is fixture-mode development and conformance debugging.

### 4.3 Element dispatch

`PageRenderer` walks `page.elements[]` and dispatches on shape: `{question, option}` → Item; `{message}` or a Message-shaped object → MessageBlock; `{elements}` (a Section) → SectionRenderer; unknown → UnsupportedElement. Item rendering shows, in order: Prompt text (required), Context text, Instruction text (both optional, visually distinct), then the widget. A Section with `shared_option` renders **MatrixGroup**: one `<table>` (with full ARIA grid semantics) — header row = merged choice texts, one row per item = prompt + radio cells sharing the row's `name`. A Section without `shared_option` is a titled group of normally-rendered elements.

### 4.4 Answer values

The renderer reports answers through `onAnswer(elementId, value)`: RadioGroup → the choice's `value`; CheckboxGroup → `value[]`; NumberInput → `number | null`; TextInput → `string`. These are the same values that become Schema 5 `Response.value` in WV-B — the renderer is deliberately ignorant of Schema 5.

## 5 — Navigation + state

A single `useReducer` in `App.tsx`:

```ts
type State = {
  phase: "booting" | "error" | "ready" | "finished";
  session?: { id: string; token: string };
  runtime?: Runtime; theme?: Theme | null;
  pageIndex: number;
  answers: Record<string, AnswerValue>;
  pageErrors: string[];          // element ids failing required-gating
};
```

- **Next**: collect required-but-unanswered element ids on the current page (matrix rows count individually); if any, set `pageErrors`, focus the first offender, announce via `aria-live` — do not advance. Else `pageIndex++`.
- **Back**: `pageIndex--`, answers preserved (OD-14 case-1 spirit, locally).
- **Progress**: `page i of N` + a bar; `aria-live="polite"` announcement on page change; focus moves to the new page's heading.
- Past the last page → `finished` screen ("answers recorded locally — submission arrives in WV-B" phrasing lives only in dev; the real copy is a neutral thank-you, since WV-B replaces this screen with submit-then-thank-you).

## 6 — Theming

`/sessions/new` returns the deployment's resolved `theme` bundle (or `null`). `themeToCssVars` maps palette (primary/secondary/success/warning/error), typography (family, `base_size`), and spacing tokens onto `--qv-*` custom properties set on the document root; Tailwind config aliases its colour/font tokens to those vars, so every component themes for free. `theme: null` → the built-in `default` values baked into `:root`. Custom-CSS injection (design/08 §Theming) is **deferred to WV-F** (needs a sanitisation decision). Contrast safety is the VS's job (WCAG-AA-at-save); the viewer trusts stored themes.

## 7 — Accessibility + visual fidelity

- Every widget keyboard-operable with native semantics: real `<input type=radio|checkbox|number|text>`, `fieldset`+`legend` per item (legend = prompt), matrix as an ARIA table with row/column headers.
- Focus management: on page change focus the page heading (`tabIndex={-1}`); on required-failure focus the first failing widget.
- Visible focus rings, error text linked via `aria-describedby`, `lang` attribute set from the runtime locale on `<html>`.
- **Physical envelope only** (cross-viewer contract): layout scales via rem-based sizing (respects OS font-size + zoom); overflow scrolls (`overflow-x: auto` on the matrix container); **no structural substitution** — a matrix is never collapsed to stacked lists, per design/08 §"Visual fidelity".
- An axe-core check runs in tests (vitest + `vitest-axe`) over each widget + the matrix fixture.

## 8 — Localised chrome

`src/app/chrome/strings.ts`: a `Record<locale, Record<key, string>>` for the ~15 viewer strings (next, back, required-error, progress template, the four error screens, finished copy). Ship `en` + `pt` (matching the fixture/imported-content locales); unknown locale falls back to `en` with a console warning. Full i18n infrastructure (ICU, plurals) is deliberately **not** introduced for 15 strings.

## 9 — Schema 7 manifest (minimal, honest)

`web-viewer/manifest.json`, validated in CI against `schemas/viewer_conformance/schema.json`:

```jsonc
{
  "viewer_id": "behaverse-web-viewer",
  "viewer_version": "v26.0611",                       // bumped per release (CalVer)
  "schema_support": { "questionnaire": ["v26.0609"], "instrument": ["v26.0609"],
                       "runtime": ["v26.0603"], "response": ["v26.0603"], "session": ["v26.0603"] },
  "evaluator": { "language_version": "none", "functions": [] },   // OD-11 not yet embedded
  "widgets": ["choice.nominal.single", "choice.ordinal.single", "choice.interval.single",
               "choice.ratio.single", "choice.nominal.multiple",
               "number.ratio", "number.interval", "text.nominal", "text.interval", "text.ratio"],
  "scorer_impl_kinds": ["wasm"],                      // pinning target; nothing executes until WV-D
  "behavioural_channels": [],                         // response_time arrives in WV-B
  "locale_switching": false, "resume": false          // true in WV-E
}
```

No `logic_actions` → the denormaliser strips `logic[]` from runtimes minted for this viewer — the manifest makes WV-A's linear-only support machine-true rather than aspirational. Registration: `curl -X POST {vs}/v1/viewers -d @manifest.json` (documented in README; stable-URL publication is WV-F).

## 10 — Testing

Mirrors `library-web/` (vitest + RTL, jsdom; hand-rolled `fetch` stubs, no msw):

1. **Pure units**: `mergeOptions` (join, missing-text error, locale miss), `deriveWidget` (full §13 table + rejection cases), `themeToCssVars`, `parseParams`.
2. **Widget RTL tests**: each widget renders, captures the right `AnswerValue`, is keyboard-operable, passes axe.
3. **Renderer integration**: fixture runtimes (denormaliser-true shape) → correct dispatch (item/message/section/matrix/unsupported), prompt+context+instruction ordering.
4. **App flow**: mocked `POST /sessions/new` → boot happy path; each error status → its screen; required-gating blocks Next + focuses offender; progress + answer preservation across Back/Next.
5. **Manifest validation**: `manifest.json` validates against Schema 7 (small node script reusing the JSON in `schemas/`; wired into `npm test`).
6. **Live smoke (manual, documented in README)**: local Library + VS, register manifest, create an `anonymous_link` deployment for an imported questionnaire, open the viewer, fill it in. (Playwright e2e exists in library-web but Chrome isn't installed in this env — same caveat applies; an e2e spec is written but not CI-gated.)

## 11 — Error handling summary

| Failure | Behaviour |
|---|---|
| Missing/invalid URL params | Config-error screen (no VS call). |
| VS 404 / 409 / 410 / 422 / 5xx / network on mint | Mapped localised screens (§3.2), `error.code` in fine print, retry only where retry is meaningful (network/5xx). |
| Unknown widget triple / element shape | `UnsupportedElement` card; page still renders the rest. |
| Choice with no text for the locale | `UnsupportedElement` (data defect surfaced, never blank). |
| `show_if` / piping syntax encountered | Rendered ignored/literal + one console warning (logic arrives in WV-C/D; VS-side stripping makes this rare). |

## 12 — Risks + follow-ups (seed of `web-viewer/FOLLOWUPS.md`)

- **Renderer types are hand-written** against the faithful projection (the loose Schema 3 + the denormaliser fixture). When the canonical runtime examples get regenerated (denormaliser follow-up), add a type-conformance test against them.
- **`style.layout` hints** (dropdown / slider-like) unrendered until WV-D — base widgets shown meanwhile (permitted: hints are refinements, not structure).
- **Matrix on very narrow viewports** relies on horizontal scroll (contract-compliant); author-defined breakpoints (design/08 §fallbacks) remain a schema-reserved future.
- **Token in memory only** means refresh loses the session until WV-E resume lands — acceptable for WV-A demos, called out in README.
- **`viewer_version` stamping**: manifest version must be bumped when widget support changes; CI check (manifest diff ⇒ version bump) deferred to WV-F.

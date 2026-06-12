# questionnaire-web-viewer (WV-A: shell + renderer)

Participant-facing **custom React/TS viewer** (OD-01 S1) that renders **Schema 3
runtimes** minted by the Viewer Service. The default presentation is a
Typeform-like **focus mode** — one question per view, auto-advance on single
choice. Stages WV-A (shell + Schema 3 renderer), WV-B (submission), and WV-C/D
(embedded expression evaluator + logic/branching/validation/scoring) are built;
resume (WV-E) comes later. Spec: `docs/superpowers/specs/2026-06-11-web-viewer-wv-a-design.md`.

## Dev quickstart (no backend)

```bash
cd web-viewer
npm install
npm run dev
```

Then open a bundled fixture — renderer work needs no Postgres/VS:

- `http://localhost:5173/?fixture=mini` — 2 pages of radios
- `http://localhost:5173/?fixture=matrix` — Section + shared_option matrix
- `http://localhost:5173/?fixture=widgets` — every supported widget triple + Message + an unsupported combo
- `http://localhost:5173/?fixture=branch` — a 3-page branch rule (`it_route == 1` skips to p3); proves in-browser logic

## URL contract

| Param | Required | Meaning |
|---|---|---|
| `deployment` | yes | Deployment id to mint a session against. |
| `locale` | no | Requested locale (BCP-47); VS resolves it against the deployment's locales. |
| `viewer_url` | no | VS base URL override; default `VITE_VS_BASE_URL`, else `http://localhost:8001`. |
| `fixture` | dev only | Render a bundled fixture runtime; no network. |

## Presentation modes

- **focus** (default): one step per view, keyboard shortcuts, auto-advance after a
  single-choice answer.
- **classic**: all questions of a page at once — set `style.x_presentation: "classic"`
  on the questionnaire or via deployment style.
- `style.x_auto_advance: false` disables single-choice auto-advance in focus mode.

## Data emitted (WV-B)

- **One Schema 5 `Response` row per attempt per item**, submitted when the
  participant advances past the step (Next / auto-advance), not on every
  keystroke.
- **ALL attempts are kept.** Going Back and changing an answer produces a *new*
  row carrying `x_response_revises` (the revised response id) and
  `x_response_revision` (the attempt counter). Dedup is **analysis-side, never
  storage-side** — the data is an exact reproduction of what happened.
- **Messages/instructions are full trials**: a row with
  `response_description: "acknowledged"`, `block_type: "instruction"`, and an
  RT equal to the seconds until the participant pressed Next.
- **ALL durations are in SECONDS** (Schema 5 / BDM convention) — `response_time`
  values are single-digit-ish floats, not milliseconds.
- **`bdm:` events** are batched every **5 s or 20 events** (whichever first)
  using the trial_started / presented / selected / clicked / trial_ended /
  completed / submitted grammar, plus a **keepalive flush on `pagehide`** so a
  closing tab still delivers its tail.
- **Finishing flow**: final queue flush → `POST .../complete` → thank-you
  screen. A failure surfaces a **visible retry** — the participant is never
  silently dropped.
- `style.x_summary_rt: false` strips RTs from emitted rows.

## Logic (WV-D)

Conditional logic runs entirely **in-browser** via the embedded
`questionnaire-expression-evaluator` (the WV-C WASM evaluator). It is built
`--target web` by `npm run build:evaluator` and runs **automatically** on
`dev`/`build` (the `predev`/`prebuild` hooks) — this **requires `cargo` +
`wasm-pack` on PATH** (`. "$HOME/.cargo/env"` first). The four logic actions:

- **skip** — a fired rule jumps navigation forward to its `skip_to` page.
- **branch** — same graph-walk jump, used for conditional routing.
- **visibility** — `show_if`: a rule whose `condition` is false hides its
  `target_id` element; hidden steps are skipped during navigation.
- **piping** — answer/score values are spliced into prompt text (v1: prompt-text
  only, matched by `field_path` prefix).

**Graph-walk navigation**: Next applies the first forward-firing skip/branch
rule, then scans to the next *visible* step (hidden steps are skipped). **Back
retraces the actually-visited path** (a visited stack), not the linear order, so
branches reverse correctly.

**Validation** runs before advancing: per-question (range / length / format) and
cross-question (condition) rules. A failing rule **blocks Next** and shows
per-item messages.

**Scoring at answer-commit**: `reversed_value` items emit the post-reversal
`score` into the Schema 5 `Response`, and Solution-bearing items emit `correct`.
The `score(id)` expression function resolves to an **unavailable sentinel** until
the Scorer host lands — so **score-gated branches do not fire** (by design, not a
bug).

**Progress**: when the runtime carries branch/skip rules, the bar shows a **step
counter** (current step, no fixed total — the total is path-dependent).

The Schema 7 **manifest** now declares `logic_actions: [skip, visibility, piping,
branch]` and an `evaluator` block (`v26.0612`), so the Viewer Service **no longer
strips logic** from minted runtimes for this viewer.

## Running against a live Viewer Service

1. Start Postgres and the **Library** (see `library/README.md` / `HANDOFF.md`:
   `python -m library.cli migrate`, ingest content, then
   `uvicorn library.api.app:create_app --factory --port 8000`).
2. Migrate + run the **Viewer Service** on :8001:

   ```bash
   export DATABASE_URL=postgresql://postgres:pg@localhost:55432/viewer_service
   viewer-service migrate
   export LIBRARY_BASE_URL=http://localhost:8000
   export VS_CORS_ORIGINS=http://localhost:5173
   uvicorn viewer_service.api.app:create_app --factory --port 8001
   ```

3. Register this viewer's Schema 7 manifest:

   ```bash
   curl -X POST http://localhost:8001/v1/viewers \
     -H 'content-type: application/json' -d @manifest.json
   ```

4. Create an `anonymous_link` deployment for a questionnaire in the Library:

   ```bash
   curl -X POST http://localhost:8001/v1/deployments \
     -H 'content-type: application/json' -d '{
       "questionnaire_ref": "qst_example@v26.0606",
       "runtime_policy": {"scorer_impl_preference": ["wasm"]},
       "default_locale": "en",
       "available_locales": ["en"]
     }'   # → {"deployment_id": "dep_..."}
   ```

5. Open `http://localhost:5173/?deployment=<dep_id>`.

## Caveats

- The session token is held **in memory only** — a refresh restarts the session
  (resume is WV-E).
- Submission exists as of WV-B, but the submission queue is **in-memory** — a
  refresh loses any not-yet-sent rows/events until WV-E resume + durability
  land.
- Logic/branching is live (WV-D, see above); `score(id)` is still null (external
  Scorer deferred), so score-gated branches do not fire yet.

## Tests

```bash
npm test            # vitest (~145 tests) + Schema 7 manifest validation
npm run typecheck   # tests mock loadEvaluator — no prior wasm build needed
npm run build       # tsc + builds evaluator --target web + bundles the wasm
```

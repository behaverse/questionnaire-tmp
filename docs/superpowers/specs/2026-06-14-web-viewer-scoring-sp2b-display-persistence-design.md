# Web Viewer Scoring — Display + Persistence (OD-16 SP2b) — Design Spec

**Date drafted:** 2026-06-14
**Author:** OD-16 SP2b brainstorming session (2026-06-14)
**Component:** **Web Viewer** score display + persistence (OD-16 sub-project **2b**), with additions to the **denormaliser** and **Viewer Service**.
**Target:** `questionnaire-runtime-denormaliser/` (emit display policy), `web-viewer/` (display UI + assemble/POST scorer_outputs), `viewer-service/` (new endpoint + JSONB column). **No schema CalVer bump.**
**Stage:** SP2b of OD-16 (SP1 engine done; SP2a live branching done; SP2b = display + persistence; SP3 = server-side executors + Behaverse forwarding + Library artifact storage).

**Authoritative source documents:**

- **OD-16** `design/05b_scoring.md` §4.4 — the **two-trigger** model: display is **terminal by default, live opt-in** via `show_score_live`, gated by `show_score`; **`lock_show_score_timing`** is the canonical lock; sentinel-null → **em-dash**; "error toast only if `null` propagates to a *required* display element" (deferred — em-dash only here).
- **OD-17g** — Schema 6 `scorer_outputs`: per-Scorer structured output keyed by CalVer-pinned scorer ref (`schemas/session/schema.json`).
- SP2a: `web-viewer/src/scoring/executor.ts` (the `ScoreCache` — `refresh(answers, ev)` + `resolver.score(id)` + the internal `outputs` map of scorerRef→structured output), wired on the `Pipeline` as `cache`; `App.tsx` finishing flow (`completeSession` in the `finishing` effect).
- The denormaliser `RuntimePolicy` (`show_score`, `show_score_live`, `lock_show_score_timing`) and `provenance.py` (already emits `lock_show_score_timing`; provenance is an open object in the runtime schema → additive fields need no schema change).
- VS submission/session store (`viewer-service/src/viewer_service/{api/submission.py,store/sessions.py}`), the Bearer-auth `require_session` dep, the ephemeral-skip pattern (VS-C), and the migration style.

---

## 0 — Decisions locked in brainstorming (2026-06-14)

1. **Display scope:** build **both** terminal and live (the same themed panel; live shown when `show_score_live`).
2. **Persistence:** **store on the session** (new `POST /v1/sessions/{id}/scorer_outputs` → JSONB column); **forwarding to Behaverse is SP3**.
3. **Defaults (accepted):** policy flags emitted into **`provenance`** (co-located with `lock_show_score_timing`, no top-level schema change); **display scores = surviving `PinnedScore`s that carry a `name`**; **em-dash for null, no error toast** yet.

---

## 1 — Denormaliser: emit the display policy

Today the runtime can't tell the viewer whether/when to display scores, and `show_score=false` still leaves branching scores in `runtime.scores`. Fix: `provenance.py` emits two more fields into the runtime `provenance` block (it already emits `lock_show_score_timing`):

```python
"show_score": ctx.runtime_policy.show_score,
"show_score_live": ctx.runtime_policy.show_score_live,
```

Provenance is an open object in the runtime schema, so this is **additive, no CalVer bump**. The viewer reads `runtime.provenance.show_score` / `show_score_live`. A denormaliser unit test asserts both land in provenance from the policy.

(`show_score=false` still strips display-only scores in `strip_scores` as before; the new flag tells the viewer not to *display* even the branching scores that remain.)

---

## 2 — Web Viewer: the score display

### `ScoreSummary` component (`web-viewer/src/app/chrome/ScoreSummary.tsx`)
Pure, themed (uses `qv-*` theme classes / tokens). Props: the list of **display scores** (`{ id, name }[]`) + a `score: (id) => EvalValue` resolver + locale strings. Renders a panel: a heading (e.g. "Your results") + one row per display score `name → formatted value`; a **null value renders an em-dash `—`**. Number/string/boolean values render as-is. No interactivity beyond presentation. WCAG-AA via the theme; `vitest-axe` clean.

**Display-score selection** (a small helper, e.g. `displayScores(runtime)`): the `PinnedScore`s in `runtime.scores` that carry a non-empty `name` (branching-only scores omit `name`). De-duplicated by `id`.

### Terminal display (`App.tsx` `finished` phase)
When `runtime.provenance.show_score` is true and there are display scores: after the existing thank-you copy on the `finished` screen, render `<ScoreSummary>`. Before transitioning to `finished`, the finishing flow does a **final `cache.refresh(answers, evaluator)`** so the displayed values reflect all answers. Reads values via `pipeline.cache.resolver.score`.

### Live display (`App.tsx` ready view)
When `runtime.provenance.show_score_live` is true: render the same `<ScoreSummary>` persistently in the ready view (a compact panel — placement themed, non-intrusive, e.g. a corner/footer panel). It reflects the cache, which is already refreshed at each page-submit (SP2a). (Live implies show_score; if a deployment sets `show_score_live` without `show_score`, treat as display-off — guard on `show_score`.)

No change to navigation/submission/branching semantics; display is read-only over the existing cache.

---

## 3 — scorer_outputs assembly + persistence

### Assembly (`web-viewer/src/scoring/executor.ts` — expose the cache outputs)
Add `ScoreCache.scorerOutputs(): Record<string, unknown>` returning a copy of the internal `outputs` map (scorerRef → structured output) — Schema 6 `scorer_outputs` shape `{ "scr_x@v26.0602": { … } }`. Only scorers that ran successfully appear (failed/absent omitted).

### Submission (`App.tsx` finishing flow + transport)
In the `finishing` effect, **before `completeSession`** (and after the final `cache.refresh`), if not ephemeral/fixture and there are scorer outputs, POST them to `POST /v1/sessions/{id}/scorer_outputs` (Bearer token) via a new `submitScorerOutputs(vsBaseUrl, sessionId, token, outputs)` in `bootstrap.ts`/transport. Failure is non-fatal (logged; doesn't block completion — scores are best-effort persistence, the responses are the gate-critical data). Ephemeral/demo: skip (consistent with SP2a/VS-C).

### Viewer Service endpoint
`POST /v1/sessions/{id}/scorer_outputs` (`api/submission.py` or a new `api/scoring.py`), `require_session` Bearer auth:
- Validate the body against the **Schema 6 `scorer_outputs` subschema** (the `patternProperties` map keyed by `^scr_[a-z0-9_]+@v\d{2}\.\d{4}$` with object values) → 422 on invalid.
- **Ephemeral** session → validate + `202` but **skip store** (VS-C pattern).
- Else store into a new **JSONB `scorer_outputs` column** on the `sessions` table (idempotent `ADD COLUMN IF NOT EXISTS` in the migrate path) → `200/202`.
- Retrievable: the existing `GET /sessions/{id}` (session metadata) includes `scorer_outputs` (or a dedicated read in metrics/export — minimal: surface it on the session GET).

---

## 4 — Testing & verification

- **denormaliser (pytest):** `show_score` + `show_score_live` from the policy land in `runtime.provenance`.
- **web-viewer (vitest):** `displayScores` selects only named scores; `ScoreSummary` renders rows + em-dash for null (+ `vitest-axe`); terminal renders the panel under `show_score`; live renders under `show_score_live` (and not when `show_score` is false); `scorerOutputs()` returns the cache map; the finishing flow POSTs scorer_outputs before `/complete` (mock transport) and skips when ephemeral. Existing suite stays green.
- **viewer-service (pytest):** the endpoint validates (422 on a non-Schema-6 body), stores JSONB for a normal session, skips for ephemeral, and the stored value round-trips via `GET /sessions/{id}`.
- **Live smoke:** a PHQ-9 deployment with `runtime_policy.show_score=true` → complete it → the terminal screen shows the score panel (total / severity / band label); confirm the session's `scorer_outputs` JSONB is persisted (DB query or session GET). Screenshot the panel for the owner.

---

## 5 — Constraints

- **No schema CalVer bump** — additive provenance fields (open object) + a new endpoint + an additive JSONB column; Schema 6 `scorer_outputs` already exists.
- **Pure-additive behaviour** — display is read-only over the SP2a cache; persistence is best-effort and never blocks completion or alters response/event data.
- **Graceful** — null scores render em-dash; a scorer that never ran simply isn't displayed/persisted; a failed scorer_outputs POST is logged, not fatal.
- **Theme-driven display** — `ScoreSummary` uses the theme tokens; keep the web-viewer suite + `vitest-axe` green; `npm run build`/`build:lib` clean.

---

## 6 — Out of scope → SP3

Forwarding `scorer_outputs` to Behaverse (the outbox sink learning Schema 6); `http`/`python`/`r` executors; Library scorer-artifact storage (replacing the VS-local store); the "error toast when a null hits a *required* display element" (em-dash only here); surfacing scorer_outputs in the `export.csv` (session-level vs the per-response CSV — a separate shape decision).

# Web Viewer Scoring — Display + Persistence (OD-16 SP2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show computed scores to the participant (terminal + live) and persist the session's `scorer_outputs`: the denormaliser emits the display policy, the viewer renders a themed `ScoreSummary` (named scores, em-dash for null) and POSTs `scorer_outputs` to a new VS endpoint that stores them in a JSONB column.

**Architecture:** Display is read-only over SP2a's `ScoreCache` (refreshed at each page-submit + once at finish); `runtime.provenance.show_score`/`show_score_live` gate it; display scores = `PinnedScore`s with a `name`. Persistence is best-effort (non-fatal): `cache.scorerOutputs()` → `POST /v1/sessions/{id}/scorer_outputs` → Schema-6-validated → JSONB on the `session` table. No schema CalVer bump.

**Tech Stack:** Python/denormaliser + pytest; TypeScript/React/Vite + vitest + vitest-axe (web-viewer); Python/FastAPI + pytest (viewer-service).

**Spec:** [docs/superpowers/specs/2026-06-14-web-viewer-scoring-sp2b-display-persistence-design.md](../specs/2026-06-14-web-viewer-scoring-sp2b-display-persistence-design.md)

**Branch:** `web-viewer-scoring-sp2b` (already checked out; spec committed there).

---

## File structure

**denormaliser (Task 1):** modify `src/denormaliser/provenance.py`; test `tests/test_provenance.py`.
**viewer-service (Task 2):** modify `store/schema.sql` (ALTER), `store/sessions.py` (store fn + select col), new `api/scoring.py` (endpoint) + register in `api/app.py`; tests `tests/test_scorer_outputs_api.py`.
**web-viewer (Tasks 3–5):** modify `src/scoring/executor.ts` (`scorerOutputs()`); new `src/scoring/display.ts` (`displayScores`); new `src/app/chrome/ScoreSummary.tsx`; modify `src/app/bootstrap.ts` (`submitScorerOutputs`), `src/app/App.tsx` (finish POST + terminal/live render), `src/app/chrome/strings.ts` (locale strings); tests alongside.
**Docs/smoke (Task 6):** `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`; live smoke; final verify.

---

## Task 1: Denormaliser — emit display policy into provenance

**Files:** Modify `questionnaire-runtime-denormaliser/src/denormaliser/provenance.py`; Test: `questionnaire-runtime-denormaliser/tests/test_provenance.py`.

- [ ] **Step 1: Write the failing test** — add to `questionnaire-runtime-denormaliser/tests/test_provenance.py` (create if absent; otherwise append):
```python
from denormaliser.provenance import build_provenance  # adjust import to the actual builder name
from denormaliser.policy import RuntimePolicy
from denormaliser.context import Ctx


def _ctx(policy):
    c = Ctx.__new__(Ctx)
    c.runtime_policy = policy
    return c


def test_provenance_carries_show_score_flags():
    ctx = _ctx(RuntimePolicy(show_score=True, show_score_live=True, lock_show_score_timing=False))
    # Build provenance the same way assemble does (use the real builder + its required args).
    prov = build_provenance(ctx, generated_at="2026-06-14T00:00:00Z", denormaliser_version="vX")
    assert prov["show_score"] is True
    assert prov["show_score_live"] is True
    assert prov["lock_show_score_timing"] is False
```
> First READ `provenance.py` to find the actual provenance-building function name + signature (the test above guesses `build_provenance(ctx, generated_at, denormaliser_version)`). Adjust the test's import + call to match. If provenance is built inline in `assemble_runtime` rather than a standalone function, instead write the test against `denormalise(...)` end-to-end (assert `runtime["provenance"]["show_score"]`), using an existing denormaliser test as the harness template.

- [ ] **Step 2: Run it, verify FAIL**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && pytest questionnaire-runtime-denormaliser/tests/test_provenance.py -q`
Expected: FAIL — `KeyError: 'show_score'`.

- [ ] **Step 3: Implement** — in `provenance.py`, where the provenance dict is built (it already includes `"lock_show_score_timing": ctx.runtime_policy.lock_show_score_timing`), add two sibling entries:
```python
        "show_score": ctx.runtime_policy.show_score,
        "show_score_live": ctx.runtime_policy.show_score_live,
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && pytest questionnaire-runtime-denormaliser/tests/test_provenance.py -q`
Expected: PASS.

- [ ] **Step 5: Full denormaliser suite + a strict-schema check**

Run: `pytest questionnaire-runtime-denormaliser/ -q`
Expected: all pass (56+). If the denormaliser validates its output against `strict_runtime_schema.json` and that schema is closed on `provenance`, add the two fields to that internal schema's provenance properties (additive). If it's open, no change needed.

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add questionnaire-runtime-denormaliser/src/denormaliser/provenance.py questionnaire-runtime-denormaliser/tests/test_provenance.py
git commit -m "feat(denormaliser): emit show_score + show_score_live into runtime provenance"
```

---

## Task 2: Viewer Service — scorer_outputs column + endpoint

**Files:** Modify `viewer-service/src/viewer_service/store/schema.sql`, `store/sessions.py`, `api/app.py`; create `api/scoring.py`; Test: `viewer-service/tests/test_scorer_outputs_api.py`.

- [ ] **Step 1: Migration** — in `store/schema.sql`, near the existing `ALTER TABLE session ADD COLUMN IF NOT EXISTS ephemeral …` line, add:
```sql
ALTER TABLE session ADD COLUMN IF NOT EXISTS scorer_outputs jsonb;
```

- [ ] **Step 2: Store fn + select col** — in `store/sessions.py`:
- Add `"scorer_outputs"` to `_SELECT_COLS` (so `get_session` returns it).
- Add:
```python
from psycopg.types.json import Json  # add near the top imports if not present


def set_scorer_outputs(conn: psycopg.Connection, session_id: str, outputs: dict) -> None:
    conn.execute("UPDATE session SET scorer_outputs=%s WHERE session_id=%s", (Json(outputs), session_id))
```
(Match the existing jsonb-write idiom in this file if it differs from `Json(...)`.)

- [ ] **Step 3: Write the failing test** `viewer-service/tests/test_scorer_outputs_api.py` — mirror an existing session-submission test for the fixtures (a real session via the testcontainers Postgres + a Bearer token). Use the project's existing session-test helper/fixture (READ `tests/test_submission.py` or similar for the `client` + `auth` + `make_session` pattern and copy it). The assertions:
```python
def test_stores_valid_scorer_outputs(client, session_auth):
    sid, headers = session_auth  # a normal (non-ephemeral) session + its Bearer header
    body = {"scr_phq9@v26.0602": {"total": 12, "severity": "moderate"}}
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json=body, headers=headers)
    assert r.status_code in (200, 202)
    g = client.get(f"/v1/sessions/{sid}", headers=headers)
    assert g.json().get("scorer_outputs") == body


def test_rejects_non_schema6_body(client, session_auth):
    sid, headers = session_auth
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json={"bad key": {"x": 1}}, headers=headers)
    assert r.status_code == 422


def test_ephemeral_validates_but_skips_store(client, ephemeral_session_auth):
    sid, headers = ephemeral_session_auth
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json={"scr_x@v26.0101": {"a": 1}}, headers=headers)
    assert r.status_code in (200, 202)
    # ephemeral → not persisted (get returns null/empty scorer_outputs)
    g = client.get(f"/v1/sessions/{sid}", headers=headers)
    assert not g.json().get("scorer_outputs")
```
> READ an existing VS test for the exact fixture names (`client`, how a session + token is created, how an ephemeral session is created). Adapt the fixture names to what exists; do NOT invent fixtures — reuse the established harness. If `GET /sessions/{id}` doesn't currently return `scorer_outputs`, Step 5 adds it.

- [ ] **Step 4: Run it, verify FAIL**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_scorer_outputs_api.py -q`
Expected: FAIL (no route → 404/405).

- [ ] **Step 5: Implement the endpoint** `viewer-service/src/viewer_service/api/scoring.py`:
```python
import json
from pathlib import Path
from functools import lru_cache
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from jsonschema import Draft202012Validator
from jsonschema.exceptions import ValidationError
from .deps import get_conn, require_session
from ..config import get_settings
from ..store import sessions as session_store

router = APIRouter()


@lru_cache(maxsize=1)
def _scorer_outputs_validator() -> Draft202012Validator:
    schema = json.loads((get_settings().schemas_dir / "session" / "schema.json").read_text())
    subschema = schema["properties"]["scorer_outputs"]
    return Draft202012Validator(subschema)


@router.post("/sessions/{session_id}/scorer_outputs")
def post_scorer_outputs(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    try:
        _scorer_outputs_validator().validate(payload)
    except ValidationError as e:
        return JSONResponse(status_code=422, content={"error": {"code": "invalid_submission", "message": e.message}})
    if session["ephemeral"]:
        return JSONResponse(status_code=202, content={"ephemeral": True})
    session_store.set_scorer_outputs(conn, session_id, payload)
    conn.commit()
    return JSONResponse(status_code=202, content={"stored": True})
```
Register in `api/app.py`: add `scoring` to the `from . import …` line and `app.include_router(scoring.router, prefix="/v1")` after the others.
If `GET /sessions/{id}` (in `api/sessions.py`) does not include `scorer_outputs` in its response, add it (it now comes from `get_session` via `_SELECT_COLS`; surface that key in the GET response model/dict).

- [ ] **Step 6: Run, verify PASS**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_scorer_outputs_api.py -q`
Expected: 3 PASS. Then the full VS suite: `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` (all pass; was 131, now 134).

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add viewer-service/src/viewer_service/store/schema.sql viewer-service/src/viewer_service/store/sessions.py viewer-service/src/viewer_service/api/scoring.py viewer-service/src/viewer_service/api/app.py viewer-service/src/viewer_service/api/sessions.py viewer-service/tests/test_scorer_outputs_api.py
git commit -m "feat(viewer-service): POST /sessions/{id}/scorer_outputs → Schema-6-validated JSONB column"
```

---

## Task 3: Web Viewer — cache.scorerOutputs() + displayScores()

**Files:** Modify `web-viewer/src/scoring/executor.ts`; create `web-viewer/src/scoring/display.ts`; Tests: extend `web-viewer/src/scoring/executor.test.ts`, create `web-viewer/src/scoring/display.test.ts`.

- [ ] **Step 1: `displayScores` failing test** `web-viewer/src/scoring/display.test.ts`:
```ts
import { displayScores } from './display'
import type { Runtime } from '../renderer/types'

const rt = (scores: unknown[]) => ({ pages: [], scores } as unknown as Runtime)

test('selects only scores with a non-empty name, deduped by id', () => {
  const out = displayScores(rt([
    { id: 'phq9_total', scorer: 's', path: '/total', impl: {}, name: 'PHQ-9 Total' },
    { id: 'crisis_flag', scorer: 's', path: '/c', impl: {} },            // no name → internal
    { id: 'phq9_total', scorer: 's', path: '/total', impl: {}, name: 'dup' }, // dup id
    { id: 'sev', scorer: 's', path: '/s', impl: {}, name: '' },           // empty name → excluded
  ]))
  expect(out.map((s) => s.id)).toEqual(['phq9_total'])
  expect(out[0].name).toBe('PHQ-9 Total')
})
test('empty / missing scores → empty list', () => {
  expect(displayScores(rt([]))).toEqual([])
  expect(displayScores({ pages: [] } as unknown as Runtime)).toEqual([])
})
```

- [ ] **Step 2: Implement** `web-viewer/src/scoring/display.ts`:
```ts
import type { Runtime } from '../renderer/types'
import type { PinnedScore } from './types'

export interface DisplayScore { id: string; name: string }

/** The runtime scores meant to be SHOWN to the participant: those carrying a non-empty `name`.
 *  (Branching-only scores omit `name`.) Soft convention — see web-viewer/FOLLOWUPS.md. Deduped by id. */
export function displayScores(runtime: Runtime): DisplayScore[] {
  const seen = new Set<string>()
  const out: DisplayScore[] = []
  for (const s of (runtime.scores ?? []) as PinnedScore[]) {
    if (s.name && s.name.trim() && !seen.has(s.id)) {
      seen.add(s.id)
      out.push({ id: s.id, name: s.name })
    }
  }
  return out
}
```

- [ ] **Step 3: `scorerOutputs()` failing test** — append to `web-viewer/src/scoring/executor.test.ts` (reuse the `phq9Runtime()`/`fetchWasm` helpers already in that file):
```ts
test('scorerOutputs() returns the cached structured outputs keyed by scorer ref', async () => {
  const rt = phq9Runtime()
  const ev = await loadEvaluator()
  const set = await compileScorers(rt, fetchWasm as never)
  const cache = makeScoreCache(set, rt)
  const answers: Record<string, number> = {}
  rt.pages[0].elements.forEach((el: any, i: number) => { answers[elementKey(el, pageElementFallback('p1', i))] = 1 })
  cache.refresh(answers, ev)
  const outputs = cache.scorerOutputs()
  expect(Object.keys(outputs)).toEqual(['scr_phq9@v26.0602'])
  expect((outputs['scr_phq9@v26.0602'] as any).total).toBe(9)
})
```
(Add `import { elementKey, pageElementFallback } from '../renderer/keys'` to the test file if not already imported.)

- [ ] **Step 4: Implement** — in `web-viewer/src/scoring/executor.ts`, extend the `ScoreCache` interface and `makeScoreCache` return:
```ts
export interface ScoreCache {
  refresh(answers: Record<string, AnswerValue>, ev: LogicEvaluator): void
  resolver: ScoreResolver
  scorerOutputs(): Record<string, unknown>
}
```
In `makeScoreCache`'s returned object, add (alongside `refresh`/`resolver`):
```ts
    scorerOutputs() {
      return Object.fromEntries(outputs)
    },
```

- [ ] **Step 5: Run tests, verify PASS**

Run: `cd web-viewer && npx vitest run src/scoring/display.test.ts src/scoring/executor.test.ts` (display 2 + executor 3 pass) and `npx tsc --noEmit` (clean).

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/scoring/display.ts web-viewer/src/scoring/display.test.ts web-viewer/src/scoring/executor.ts web-viewer/src/scoring/executor.test.ts
git commit -m "feat(web-viewer): displayScores() + cache.scorerOutputs()"
```

---

## Task 4: Web Viewer — ScoreSummary component

**Files:** Create `web-viewer/src/app/chrome/ScoreSummary.tsx`; modify `web-viewer/src/app/chrome/strings.ts`; Test: `web-viewer/src/app/chrome/ScoreSummary.test.tsx`.

- [ ] **Step 1: Locale strings** — in `src/app/chrome/strings.ts`, add a `results_title` key to each locale map (en + pt) — e.g. en `"Your results"`, pt `"Os seus resultados"`. (READ the file to match its structure; add the key wherever the other titles live.)

- [ ] **Step 2: Write the failing test** `web-viewer/src/app/chrome/ScoreSummary.test.tsx`:
```ts
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ScoreSummary } from './ScoreSummary'

const scores = [{ id: 'phq9_total', name: 'PHQ-9 Total' }, { id: 'phq9_severity', name: 'Severity' }]

test('renders each named score with its value; null → em-dash; axe-clean', async () => {
  const score = (id: string) => (id === 'phq9_total' ? 12 : null)
  const { container } = render(<ScoreSummary title="Your results" scores={scores} score={score} />)
  expect(screen.getByText('PHQ-9 Total')).toBeInTheDocument()
  expect(screen.getByText('12')).toBeInTheDocument()
  expect(screen.getByText('Severity')).toBeInTheDocument()
  expect(screen.getByText('—')).toBeInTheDocument()
  expect(await axe(container)).toHaveNoViolations()
})
```

- [ ] **Step 3: Run it, verify FAIL**

Run: `cd web-viewer && npx vitest run src/app/chrome/ScoreSummary.test.tsx`
Expected: FAIL — cannot resolve `./ScoreSummary`.

- [ ] **Step 4: Implement** `web-viewer/src/app/chrome/ScoreSummary.tsx`:
```tsx
import type { EvalValue } from '../../logic/types'
import type { DisplayScore } from '../../scoring/display'

type Props = {
  title: string
  scores: DisplayScore[]
  score: (id: string) => EvalValue
}

function format(v: EvalValue): string {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return v.join(', ')
  return String(v)
}

export function ScoreSummary({ title, scores, score }: Props) {
  if (scores.length === 0) return null
  return (
    <section className="qv-card mt-8 w-full max-w-md text-left" aria-label={title}>
      <h2 className="qv-prompt mb-4 text-xl">{title}</h2>
      <dl className="space-y-2">
        {scores.map((s) => (
          <div key={s.id} className="flex items-baseline justify-between gap-4">
            <dt className="qv-secondary">{s.name}</dt>
            <dd className="font-semibold" style={{ color: 'var(--qv-prompt-color)' }}>{format(score(s.id))}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
```

- [ ] **Step 5: Run, verify PASS**

Run: `cd web-viewer && npx vitest run src/app/chrome/ScoreSummary.test.tsx`
Expected: PASS (axe clean).

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/app/chrome/ScoreSummary.tsx web-viewer/src/app/chrome/ScoreSummary.test.tsx web-viewer/src/app/chrome/strings.ts
git commit -m "feat(web-viewer): ScoreSummary panel (named scores, em-dash for null, themed)"
```

---

## Task 5: Web Viewer — wire terminal + live display + persistence

**Files:** Modify `web-viewer/src/app/bootstrap.ts`, `web-viewer/src/app/App.tsx`.

- [ ] **Step 1: Transport helper** — in `src/app/bootstrap.ts`, add (mirror `completeSession`'s fetch/headers style):
```ts
export async function submitScorerOutputs(vsBaseUrl: string, sessionId: string, token: string, outputs: Record<string, unknown>): Promise<boolean> {
  try {
    const r = await fetch(`${vsBaseUrl}/v1/sessions/${sessionId}/scorer_outputs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(outputs),
    })
    return r.ok
  } catch {
    return false
  }
}
```

- [ ] **Step 2: Finishing flow — final refresh + POST scorer_outputs (best-effort, before complete)** — in `App.tsx`'s finishing effect, inside `finish(pl)`, AFTER the `outcome === 'timeout'` guard and BEFORE the `completeSession` line, add:
```ts
      pl.cache.refresh(stateRef.current.answers, pl.evaluator)
      const outputs = pl.cache.scorerOutputs()
      if (!ephemeralRef.current && pl.identity.sessionId !== 'fixture' && Object.keys(outputs).length > 0) {
        await submitScorerOutputs(params.vsBaseUrl, pl.identity.sessionId, token, outputs) // best-effort; non-fatal
      }
```
Add `submitScorerOutputs` to the `./bootstrap` import. (Failure returns false and is ignored — completion proceeds; scores are best-effort.)

- [ ] **Step 3: Terminal display** — in `App.tsx`'s `finished` phase render (the `if (state.phase === 'finished')` block), add the score summary below the thank-you copy. Compute the display data:
```tsx
  if (state.phase === 'finished') {
    const showScore = (state.runtime?.provenance as { show_score?: boolean } | undefined)?.show_score === true
    const dscores = showScore && state.runtime ? displayScores(state.runtime) : []
    const scoreFn = (id: string) => pipeline.current?.cache.resolver.score(id) ?? null
    return (
      <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
        <div className="qv-step-enter max-w-md space-y-3">
          <h1 className="text-3xl font-semibold">{t(locale, 'finished_title')}</h1>
          <p className="text-lg text-slate-600">{t(locale, 'finished_body')}</p>
          {dscores.length > 0 && <ScoreSummary title={t(locale, 'results_title')} scores={dscores} score={scoreFn} />}
        </div>
      </main>
    )
  }
```
Add imports: `import { ScoreSummary } from './chrome/ScoreSummary'` and `import { displayScores } from '../scoring/display'`.

- [ ] **Step 4: Live display** — in the ready-view `return` (the `<main className="min-h-screen font-theme">` block), render the panel when `show_score_live` (and `show_score`). After the `<ProgressBar .../>` (or near the content wrapper), add:
```tsx
      {(() => {
        const prov = state.runtime?.provenance as { show_score?: boolean; show_score_live?: boolean } | undefined
        if (!prov?.show_score || !prov?.show_score_live || !p) return null
        const dscores = displayScores(state.runtime!)
        if (dscores.length === 0) return null
        return (
          <div className="fixed bottom-4 right-4 z-10 w-64">
            <ScoreSummary title={t(locale, 'results_title')} scores={dscores} score={(id) => p.cache.resolver.score(id) ?? null} />
          </div>
        )
      })()}
```
(`p` is the `pipeline.current` already in scope in the ready render; the cache was refreshed in `advance()` so the panel reflects post-submit scores. Re-renders happen on the `state.stepIndex`/`answers` changes that `advance` dispatches.)

- [ ] **Step 5: Keep the suite green + build**

Run: `cd web-viewer && npm test && npm run build && npm run build:lib`
Expected: all pass (was 208 + new display/executor tests; now higher), both builds clean. Existing fixtures have no `provenance.show_score` → no panel rendered → existing assertions unaffected. If a `finished`/ready test now needs `pipeline.current.cache`, it already exists from SP2a (`makeScoreCache` always set). Fix any genuine breakage without weakening assertions.

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/app/bootstrap.ts web-viewer/src/app/App.tsx
git commit -m "feat(web-viewer): terminal + live ScoreSummary display; POST scorer_outputs at finish"
```

---

## Task 6: Live smoke + docs + final verification

**Files:** `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`.

- [ ] **Step 1: Dev/browser smoke of the display** — add a fixture with `provenance.show_score: true` (+ `show_score_live: true`) so the dev route shows the panel. Either extend `web-viewer/src/fixtures/branch_score.json` with `"provenance": { "show_score": true, "show_score_live": true }` or add a `phq9_display.json` fixture (9 named-score PHQ-9 with `provenance.show_score:true`) + register it in `FIXTURES`. Then drive it in chromium (reuse the SP2a smoke harness): answer the items, finish, and confirm the **terminal score panel** shows "PHQ-9 Total / Severity / Band" with the computed values (and the live panel if `show_score_live`). Screenshot to `/tmp/score-display.png`. Confirm no console errors. Report what you observed.

- [ ] **Step 2: FOLLOWUPS** — append to `web-viewer/FOLLOWUPS.md`:
```markdown
- **Score display convention (SP2b):** display scores = `PinnedScore`s with a non-empty `name` (`src/scoring/display.ts`). This is a SOFT convention — a questionnaire that mixes display + branching-only scores under `show_score=true` could mis-show a named branching score or omit an unnamed display score (cosmetic, fixable via the `name`). If it becomes a real authoring problem, add an explicit `display?: boolean` to the Schema 2 `Score` (additive CalVer bump + denormaliser passthrough); `displayScores()` centralises the rule so the switch is one function.
- **In-session scoring (SP2b, done):** scores display at terminal + live (`runtime.provenance.show_score`/`show_score_live`); `scorer_outputs` persisted to the session (JSONB) via `POST /sessions/{id}/scorer_outputs`. SP3: forward `scorer_outputs` to Behaverse; server-side http/python/r executors; Library scorer-artifact storage.
```
Append to `viewer-service/FOLLOWUPS.md`:
```markdown
- **scorer_outputs forwarding (SP3):** SP2b stores `scorer_outputs` on the session (JSONB column) via `POST /sessions/{id}/scorer_outputs`. Forwarding it to Behaverse (the outbox sink learning the Schema 6 session-metadata payload) is deferred to SP3.
```

- [ ] **Step 3: Full verification (paste all results)**

Run:
```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
pytest questionnaire-runtime-denormaliser/ -q
bash -c '. "$HOME/.cargo/env" && cd questionnaire-scorer && cargo test' && ( cd questionnaire-scorer/host && npm test )
( cd web-viewer && npm test && npm run build && npm run build:lib )
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q
source .venv/bin/activate && python tools/validate_schemas.py 2>&1 | tail -2
```
Expected: denormaliser green; scorer cargo+host green; web-viewer + builds green; VS 134; 44 examples valid.

- [ ] **Step 4: Commit + finish the branch**

```bash
git add web-viewer/FOLLOWUPS.md viewer-service/FOLLOWUPS.md
git commit -m "docs(scorer): SP2b follow-ups (display convention; scorer_outputs forwarding → SP3)"
```
Then use `superpowers:finishing-a-development-branch` to merge `web-viewer-scoring-sp2b` → `master` locally + push.

---

## Self-review checklist (completed by the plan author)

- **Spec coverage:** denormaliser emits show_score/show_score_live (T1) ✓; ScoreSummary terminal+live (T4, T5) ✓; displayScores named-score convention + documented limitation (T3, T6 FOLLOWUPS) ✓; cache.scorerOutputs() assembly (T3) ✓; POST endpoint + Schema-6 validation + JSONB column + ephemeral-skip (T2) ✓; viewer POST best-effort before /complete (T5) ✓; no schema CalVer bump (provenance additive, new endpoint, additive column) ✓; em-dash for null, no toast (T4 format) ✓.
- **Placeholder scan:** every step has concrete code; the two READ-first notes (provenance builder name in T1, VS test-fixture names in T2) are explicit "match the existing pattern" instructions, not vague placeholders — they exist because those exact local names must be read, and the surrounding code is fully specified.
- **Type/name consistency:** `displayScores`/`DisplayScore` (T3) consumed by `ScoreSummary` (T4) + App wiring (T5); `cache.scorerOutputs()` (T3) consumed in T5 + matches the `ScoreCache` interface; `submitScorerOutputs(vsBaseUrl, sessionId, token, outputs)` (T5) hits `POST /sessions/{id}/scorer_outputs` (T2); `set_scorer_outputs` (T2 store) called by the T2 endpoint; `runtime.provenance.show_score`/`show_score_live` emitted in T1 + read in T5.
```

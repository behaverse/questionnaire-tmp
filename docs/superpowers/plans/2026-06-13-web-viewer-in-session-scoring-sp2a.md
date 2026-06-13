# Web Viewer In-Session Scoring — Branching Gate (OD-16 SP2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `score(id)` execute live in the Web Viewer so LogicRule **branching at page-submit** fires on real scores: a browser ScorerExecutor fetches the pinned wasm (sha256-verified), runs it, and resolves scores by JSON Pointer — replacing `nullResolver`. The Viewer Service serves the wasm and rewrites `impl.url` at mint; the PHQ-9 reference scorer becomes lenient.

**Architecture:** Scorers are compiled at boot (async, with the evaluator) into a `ScorerSet`; at each page-submit the executor re-runs them synchronously and caches outputs, so the evaluator's synchronous `score(id)` is a cached JSON-Pointer lookup. Multiple scores sharing one scorer run it once. Every failure resolves to `null` (sentinel → branch doesn't fire). No schema CalVer bump.

**Tech Stack:** TypeScript/React/Vite + vitest (web-viewer); Python/FastAPI + pytest (viewer-service); Rust→wasm (questionnaire-scorer).

**Spec:** [docs/superpowers/specs/2026-06-13-web-viewer-in-session-scoring-sp2a-design.md](../specs/2026-06-13-web-viewer-in-session-scoring-sp2a-design.md)

**Branch:** `web-viewer-scoring-sp2a` (already checked out; spec committed there). Rust via `. "$HOME/.cargo/env"` first.

---

## File structure

**questionnaire-scorer (Task 1):** modify `scorers/phq9/src/lib.rs`; rebuild `dist-wasm/phq9.wasm` + re-sync `scr_phq9.json`; note in `ABI.md`.

**viewer-service (Tasks 2–3):** new `src/viewer_service/api/scorers.py` (serve endpoint) + register in `api/app.py`; `config.py` (+ `scorer_dir`, `public_base_url`); `runtime.py` (mint rewrite, new `rewrite_scorer_urls`); tests under `tests/`.

**web-viewer (Tasks 4–6):** new `src/scoring/{vendor/scorerHost.ts (generated),fetch.ts,executor.ts,types.ts}`; `scripts/build-scorer-host.mjs`; modify `src/renderer/types.ts` (type `scores`), `src/app/App.tsx` (boot + advance + Pipeline), `package.json` (predev/prebuild hook), `public/` (dev wasm); fixtures `src/fixtures/{phq9.json,branch_score.json}`; regenerate `schemas/runtime/examples/phq9_runtime.json`; tests under `src/scoring/`.

**Docs/smoke (Task 7):** `viewer-service/FOLLOWUPS.md`, `web-viewer/FOLLOWUPS.md`; live smoke; final verification.

---

## Task 1: Lenient PHQ-9 scorer

**Files:** Modify `questionnaire-scorer/scorers/phq9/src/lib.rs`; rebuild via `questionnaire-scorer/scripts/build-phq9.mjs`; note in `questionnaire-scorer/ABI.md`.

- [ ] **Step 1: Flip the unit test** — in `questionnaire-scorer/scorers/phq9/src/lib.rs`, replace the `rejects_unexpected_key` test with:
```rust
    #[test]
    fn ignores_unexpected_key() {
        // A scorer MUST ignore scored_responses keys it does not recognise (host passes all answered prompts).
        let out = score_phq9(&json!({ "scored_responses": { "pr_phq9_1": 2, "bogus": 99 } })).unwrap();
        assert_eq!(out["total"], json!(2));
        assert_eq!(out["missing_count"], json!(8));
    }
```

- [ ] **Step 2: Run it, verify FAIL**

Run: `cd questionnaire-scorer && bash -c '. "$HOME/.cargo/env" && cargo test -p phq9 ignores_unexpected_key'`
Expected: FAIL (current code returns `Err` on the `bogus` key → `.unwrap()` panics).

- [ ] **Step 3: Make `score_phq9` lenient** — in `score_phq9`, DELETE the unexpected-key rejection loop:
```rust
    for k in sr.keys() {
        if !KEYS.contains(&k.as_str()) {
            return Err(format!("unexpected key: {k}"));
        }
    }
```
(The function now only reads its own `KEYS`; any other keys in `scored_responses` are simply never looked at. The out-of-range/non-integer checks on the PHQ-9 keys remain.)

- [ ] **Step 4: Run the phq9 suite, verify PASS**

Run: `cd questionnaire-scorer && bash -c '. "$HOME/.cargo/env" && cargo test -p phq9'`
Expected: 7 tests PASS (the renamed `ignores_unexpected_key` + the other 6).

- [ ] **Step 5: Rebuild the wasm + re-sync sha256 + re-verify conformance**

Run:
```bash
cd questionnaire-scorer && node scripts/build-phq9.mjs
( cd host && npx vitest run )   # 6 pass; conformance still green; sha256 re-synced
```
Expected: new sha256 printed; `scr_phq9.json` updated; host tests pass.

- [ ] **Step 6: Document the convention** — append to `questionnaire-scorer/ABI.md` after the "Result envelope" section:
```markdown
## Input handling (convention)

The host passes `scored_responses` for **all** answered prompts in the session. A conformant
scorer MUST **ignore keys it does not recognise** (select only the prompt ids it scores) and
treat its own absent keys as missing. A scorer must not error on unexpected `scored_responses` keys.
```

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add questionnaire-scorer/scorers/phq9/src/lib.rs questionnaire-scorer/dist-wasm/phq9.wasm questionnaire-scorer/ABI.md schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json
git commit -m "feat(scorer): PHQ-9 ignores unknown scored_responses keys (host passes all)"
```

---

## Task 2: Viewer Service — serve scorer wasm

**Files:** Create `viewer-service/src/viewer_service/api/scorers.py`; modify `viewer-service/src/viewer_service/config.py`, `viewer-service/src/viewer_service/api/app.py`; Test: `viewer-service/tests/test_scorers_api.py`.

- [ ] **Step 1: Add settings** — in `config.py`, add two fields to the `Settings` dataclass (after `cors_origins`):
```python
    scorer_dir: Path = REPO_ROOT / "questionnaire-scorer" / "dist-wasm"
    public_base_url: str = ""
```
and in `get_settings()` return, add:
```python
        scorer_dir=Path(os.environ.get("VS_SCORER_DIR") or REPO_ROOT / "questionnaire-scorer" / "dist-wasm"),
        public_base_url=os.environ.get("VS_PUBLIC_BASE", ""),
```

- [ ] **Step 2: Write the failing test** `viewer-service/tests/test_scorers_api.py`:
```python
import hashlib
from pathlib import Path
from fastapi.testclient import TestClient
from viewer_service.api.app import create_app


def test_serves_known_scorer_wasm(tmp_path, monkeypatch):
    wasm = b"\x00asm\x01\x00\x00\x00rest"
    (tmp_path / "scr_phq9@v26.0602.wasm").write_bytes(wasm)
    monkeypatch.setenv("VS_SCORER_DIR", str(tmp_path))
    import viewer_service.config as cfg
    cfg.get_settings.cache_clear() if hasattr(cfg.get_settings, "cache_clear") else None
    client = TestClient(create_app())
    r = client.get("/v1/scorers/scr_phq9@v26.0602/impl.wasm")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/wasm"
    assert r.content == wasm


def test_unknown_scorer_is_404(tmp_path, monkeypatch):
    monkeypatch.setenv("VS_SCORER_DIR", str(tmp_path))
    client = TestClient(create_app())
    r = client.get("/v1/scorers/scr_nope@v26.0101/impl.wasm")
    assert r.status_code == 404


def test_bad_ref_is_404(tmp_path, monkeypatch):
    monkeypatch.setenv("VS_SCORER_DIR", str(tmp_path))
    client = TestClient(create_app())
    r = client.get("/v1/scorers/..%2f..%2fetc/impl.wasm")
    assert r.status_code in (404, 400)
```

- [ ] **Step 3: Run it, verify FAIL**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_scorers_api.py -q`
Expected: FAIL (no `/v1/scorers/...` route → 404 for the *known* case too, so the first assert fails).

- [ ] **Step 4: Implement the endpoint** `viewer-service/src/viewer_service/api/scorers.py`:
```python
import re
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from ..config import get_settings

router = APIRouter()

_REF = re.compile(r"^scr_[a-z0-9_]+@v\d{2}\.\d{4}$")


@router.get("/scorers/{ref}/impl.wasm")
def get_scorer_wasm(ref: str):
    if not _REF.match(ref):
        raise HTTPException(status_code=404, detail="unknown scorer")
    path = get_settings().scorer_dir / f"{ref}.wasm"
    if not path.is_file():
        raise HTTPException(status_code=404, detail="unknown scorer")
    return Response(content=path.read_bytes(), media_type="application/wasm")
```

- [ ] **Step 5: Register the router** — in `api/app.py`, add `scorers` to the import line and include it:
```python
    from . import viewers, deployments, runtime, admin, sessions, submission, export, themes, metrics, scorers
```
and after the `metrics` include:
```python
    app.include_router(scorers.router, prefix="/v1")
```

- [ ] **Step 6: Run, verify PASS**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_scorers_api.py -q`
Expected: 3 PASS. (The `_REF` regex rejects path-traversal refs → 404; the `..%2f` test decodes to a non-matching ref.)

- [ ] **Step 7: Commit**

```bash
git add viewer-service/src/viewer_service/api/scorers.py viewer-service/src/viewer_service/api/app.py viewer-service/src/viewer_service/config.py viewer-service/tests/test_scorers_api.py
git commit -m "feat(viewer-service): serve pinned scorer wasm at /v1/scorers/{ref}/impl.wasm"
```

---

## Task 3: Viewer Service — rewrite scorer impl.url at mint

**Files:** Modify `viewer-service/src/viewer_service/runtime.py`; Test: `viewer-service/tests/test_mint_rewrite.py`.

- [ ] **Step 1: Write the failing test** `viewer-service/tests/test_mint_rewrite.py`:
```python
from viewer_service.runtime import rewrite_scorer_urls


def test_rewrites_wasm_urls_to_public_base():
    runtime = {"scores": [
        {"id": "t", "scorer": "scr_phq9@v26.0602", "path": "/total",
         "impl": {"kind": "wasm", "url": "https://behaverse.org/x.wasm", "sha256": "ab"}},
    ]}
    rewrite_scorer_urls(runtime, "https://vs.example.com")
    impl = runtime["scores"][0]["impl"]
    assert impl["url"] == "https://vs.example.com/v1/scorers/scr_phq9@v26.0602/impl.wasm"
    assert impl["sha256"] == "ab"


def test_no_base_leaves_urls_untouched():
    runtime = {"scores": [{"id": "t", "scorer": "scr_x@v26.0101", "path": "/t",
                           "impl": {"kind": "wasm", "url": "https://orig/x.wasm", "sha256": "ab"}}]}
    rewrite_scorer_urls(runtime, "")
    assert runtime["scores"][0]["impl"]["url"] == "https://orig/x.wasm"


def test_non_wasm_kinds_untouched():
    runtime = {"scores": [{"id": "t", "scorer": "scr_x@v26.0101", "path": "/t",
                           "impl": {"kind": "http", "url": "https://api/x"}}]}
    rewrite_scorer_urls(runtime, "https://vs.example.com")
    assert runtime["scores"][0]["impl"]["url"] == "https://api/x"
```

- [ ] **Step 2: Run it, verify FAIL**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && pytest viewer-service/tests/test_mint_rewrite.py -q`
Expected: FAIL — `cannot import name 'rewrite_scorer_urls'`.

- [ ] **Step 3: Implement** — in `runtime.py`, add the function (top-level) and call it in `mint_runtime` **right before `cache.put`**:
```python
def rewrite_scorer_urls(runtime: dict, public_base: str) -> None:
    """Point each wasm scorer impl at the VS's own /v1/scorers/{ref}/impl.wasm endpoint
    so the viewer fetches the bytes from us (hosting at behaverse.org is deferred). No-op
    when public_base is empty; non-wasm impls are left untouched. sha256 is preserved."""
    if not public_base:
        return
    base = public_base.rstrip("/")
    for score in runtime.get("scores", []) or []:
        impl = score.get("impl")
        if isinstance(impl, dict) and impl.get("kind") == "wasm":
            impl["url"] = f"{base}/v1/scorers/{score['scorer']}/impl.wasm"
```
In `mint_runtime`, after the two `assert prov[...]` lines and **before** `cache.put(...)`, add:
```python
    rewrite_scorer_urls(runtime, settings.public_base_url)
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && pytest viewer-service/tests/test_mint_rewrite.py -q`
Expected: 3 PASS.

- [ ] **Step 5: Run the full VS suite (no regressions)**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q`
Expected: all pass (122 prior + the new scorer/rewrite tests).

- [ ] **Step 6: Commit**

```bash
git add viewer-service/src/viewer_service/runtime.py viewer-service/tests/test_mint_rewrite.py
git commit -m "feat(viewer-service): rewrite wasm scorer impl.url to the VS endpoint at mint"
```

---

## Task 4: Web Viewer — types + vendored host + fetch

**Files:** Create `web-viewer/src/scoring/types.ts`, `web-viewer/scripts/build-scorer-host.mjs`, `web-viewer/src/scoring/vendor/scorerHost.ts` (generated), `web-viewer/src/scoring/fetch.ts`; modify `web-viewer/src/renderer/types.ts`; Tests: `web-viewer/src/scoring/vendor.test.ts`, `web-viewer/src/scoring/fetch.test.ts`.

- [ ] **Step 1: Scoring types** `web-viewer/src/scoring/types.ts`:
```ts
export type PinnedScorerImpl =
  | { kind: 'wasm'; url: string; sha256: string }
  | { kind: 'http'; url: string }
  | { kind: 'python'; package: string }
  | { kind: 'r'; package: string }

export interface PinnedScore {
  id: string
  scorer: string
  path: string
  impl: PinnedScorerImpl
  name?: string
  description?: string
}

export class ScorerIntegrityError extends Error {}
export class UnsupportedScorerKind extends Error {}
```

- [ ] **Step 2: Type `Runtime.scores`** — in `web-viewer/src/renderer/types.ts`, change `scores?: unknown[]` to `scores?: import('../scoring/types').PinnedScore[]` and add `id?` + `reversed?` to the `ContentEntity` type (it currently is `{ id?: string; name?: string; content?: ContentMap }` → add `reversed?: boolean`; `id?` already present).

- [ ] **Step 3: Vendored-host build script** `web-viewer/scripts/build-scorer-host.mjs`:
```js
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const wv = join(here, '..')
const scorerPkg = join(wv, '..', 'questionnaire-scorer')

/** Deterministically transform the SP1 host source into a single self-contained vendored file. */
export function vendorSource() {
  const src = readFileSync(join(scorerPkg, 'host', 'src', 'runScorer.ts'), 'utf8')
  const inlined = src.replace(
    /import type \{ ScorerResult \} from '\.\/types\.js'/,
    `export type ScorerResult = { ok: true; output: unknown } | { ok: false; error: string; trapped?: boolean }`,
  )
  return '// GENERATED — do not edit. Source: questionnaire-scorer/host/src/runScorer.ts\n' + inlined
}

const destDir = join(wv, 'src', 'scoring', 'vendor')
mkdirSync(destDir, { recursive: true })
writeFileSync(join(destDir, 'scorerHost.ts'), vendorSource())
console.log('vendored scorer host → src/scoring/vendor/scorerHost.ts')

// Dev convenience: copy the reference wasm into public/ so ?fixture= can fetch it.
const wasm = join(scorerPkg, 'dist-wasm', 'phq9.wasm')
if (existsSync(wasm)) {
  const pub = join(wv, 'public', 'scorers')
  mkdirSync(pub, { recursive: true })
  copyFileSync(wasm, join(pub, 'phq9.wasm'))
  console.log('copied phq9.wasm → public/scorers/phq9.wasm')
}
```

- [ ] **Step 4: Generate the vendored host + wire build hooks**

Run: `cd web-viewer && node scripts/build-scorer-host.mjs`
Expected: creates `src/scoring/vendor/scorerHost.ts` + `public/scorers/phq9.wasm`.

Then in `web-viewer/package.json` `scripts`, ensure the host is vendored before dev/build/test. Add `node scripts/build-scorer-host.mjs && ` to the **front** of the existing `predev`, `prebuild`, and `pretest` commands (they already run `build-evaluator.mjs`; chain this before it). If a `pretest` does not exist, add `"pretest": "node scripts/build-scorer-host.mjs"`. (Gitignore note: add `src/scoring/vendor/` and `public/scorers/` to `web-viewer/.gitignore` — they are generated.)

- [ ] **Step 5: Drift test** `web-viewer/src/scoring/vendor.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { vendorSource } from '../../scripts/build-scorer-host.mjs'

test('vendored scorer host matches the SP1 source (run build-scorer-host.mjs if this fails)', () => {
  const vendored = readFileSync(fileURLToPath(new URL('./vendor/scorerHost.ts', import.meta.url)), 'utf8')
  expect(vendored).toBe(vendorSource())
})
```

- [ ] **Step 6: Write the failing fetch test** `web-viewer/src/scoring/fetch.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { fetchScorerWasm } from './fetch'
import { ScorerIntegrityError, UnsupportedScorerKind } from './types'

const wasm = readFileSync(fileURLToPath(new URL('../../../questionnaire-scorer/dist-wasm/phq9.wasm', import.meta.url)))
const sha = createHash('sha256').update(wasm).digest('hex')
const okFetch = async () => new Response(wasm) as unknown as Response

test('fetches and returns bytes when sha256 matches', async () => {
  const buf = await fetchScorerWasm({ kind: 'wasm', url: 'x', sha256: sha }, okFetch as never)
  expect(new Uint8Array(buf).length).toBe(wasm.length)
})
test('throws ScorerIntegrityError on sha256 mismatch', async () => {
  await expect(fetchScorerWasm({ kind: 'wasm', url: 'x', sha256: '0'.repeat(64) }, okFetch as never))
    .rejects.toBeInstanceOf(ScorerIntegrityError)
})
test('throws UnsupportedScorerKind for non-wasm', async () => {
  await expect(fetchScorerWasm({ kind: 'http', url: 'x' } as never, okFetch as never))
    .rejects.toBeInstanceOf(UnsupportedScorerKind)
})
```

- [ ] **Step 7: Run it, verify FAIL**

Run: `cd web-viewer && npx vitest run src/scoring/fetch.test.ts`
Expected: FAIL — cannot resolve `./fetch`.

- [ ] **Step 8: Implement** `web-viewer/src/scoring/fetch.ts`:
```ts
import type { PinnedScorerImpl } from './types'
import { ScorerIntegrityError, UnsupportedScorerKind } from './types'

const cache = new Map<string, ArrayBuffer>()

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Fetch a wasm scorer's bytes and verify its sha256. Deduped by sha256 across scores. */
export async function fetchScorerWasm(impl: PinnedScorerImpl, fetchImpl: typeof fetch = fetch): Promise<ArrayBuffer> {
  if (impl.kind !== 'wasm') throw new UnsupportedScorerKind(impl.kind)
  const hit = cache.get(impl.sha256)
  if (hit) return hit
  const resp = await fetchImpl(impl.url)
  if (!resp.ok) throw new ScorerIntegrityError(`fetch failed: ${resp.status}`)
  const buf = await resp.arrayBuffer()
  const hex = await sha256Hex(buf)
  if (hex !== impl.sha256) throw new ScorerIntegrityError(`sha256 mismatch for ${impl.url}`)
  cache.set(impl.sha256, buf)
  return buf
}
```

- [ ] **Step 9: Run tests, verify PASS**

Run: `cd web-viewer && npx vitest run src/scoring/fetch.test.ts src/scoring/vendor.test.ts`
Expected: fetch 3 PASS + vendor 1 PASS. (`crypto.subtle` is available in vitest's node environment.)

- [ ] **Step 10: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/scoring/types.ts web-viewer/src/scoring/fetch.ts web-viewer/src/scoring/fetch.test.ts web-viewer/src/scoring/vendor.test.ts web-viewer/scripts/build-scorer-host.mjs web-viewer/src/renderer/types.ts web-viewer/package.json web-viewer/.gitignore
git commit -m "feat(web-viewer): scorer types + vendored host + sha256-verified wasm fetch"
```

---

## Task 5: Web Viewer — the ScorerExecutor

**Files:** Create `web-viewer/src/scoring/executor.ts`; Test: `web-viewer/src/scoring/executor.test.ts`.

- [ ] **Step 1: Write the failing test** `web-viewer/src/scoring/executor.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { compileScorers, makeScoreCache } from './executor'
import type { Runtime } from '../renderer/types'
import { loadEvaluator } from '../logic/evaluator'

const wasm = readFileSync(fileURLToPath(new URL('../../../questionnaire-scorer/dist-wasm/phq9.wasm', import.meta.url)))
const sha = createHash('sha256').update(wasm).digest('hex')
const fetchWasm = async () => new Response(wasm) as unknown as Response

function phq9Runtime(): Runtime {
  const item = (n: number) => ({
    id: `item_${n}`,
    question: { prompt: { id: `pr_phq9_${n}`, content: { en: { text: `q${n}` } } } },
    option: { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
      options: [{ index: 1, value: 0 }, { index: 2, value: 1 }, { index: 3, value: 2 }, { index: 4, value: 3 }],
      content: { en: { options: [{ index: 1, text: 'a' }, { index: 2, text: 'b' }, { index: 3, text: 'c' }, { index: 4, text: 'd' }] } } },
  })
  const impl = { kind: 'wasm', url: 'x', sha256: sha }
  return {
    provenance: {}, metadata: { id: 'phq9', title: 'PHQ-9', language: 'en' }, locale: 'en',
    pages: [{ id: 'p1', elements: Array.from({ length: 9 }, (_, i) => item(i + 1)) }],
    scores: [
      { id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total', impl },
      { id: 'phq9_severity', scorer: 'scr_phq9@v26.0602', path: '/severity', impl },
      { id: 'phq9_band_label', scorer: 'scr_phq9@v26.0602', path: '/band/label', impl },
    ],
  } as unknown as Runtime
}

test('compiles, runs once per scorer, and resolves scores by JSON Pointer', async () => {
  const rt = phq9Runtime()
  const ev = await loadEvaluator()
  const set = await compileScorers(rt, fetchWasm as never)
  expect(set.failures.size).toBe(0)
  const cache = makeScoreCache(set, rt)
  // answers keyed by element key (page p1, element i → 'p1.0'..'p1.8' fallback keys via elementKey)
  const answers: Record<string, number> = {}
  rt.pages[0].elements.forEach((_, i) => { answers[`p1.${i}`] = i < 9 ? 1 : 0 }) // all 1 → total 9
  cache.refresh(answers, ev)
  expect(cache.resolver.score('phq9_total')).toBe(9)
  expect(cache.resolver.score('phq9_severity')).toBe('mild')
  expect(cache.resolver.score('phq9_band_label')).toBe('Mild Depression')
  expect(cache.resolver.score('unknown_id')).toBeNull()
})

test('a failed/absent scorer resolves scores to null (no throw)', async () => {
  const rt = phq9Runtime()
  const ev = await loadEvaluator()
  const badFetch = async () => new Response('not wasm') as unknown as Response
  const set = await compileScorers(rt, badFetch as never)
  expect(set.failures.size).toBe(1)
  const cache = makeScoreCache(set, rt)
  cache.refresh({}, ev)
  expect(cache.resolver.score('phq9_total')).toBeNull()
})
```

> Key derivation note: with no entity `id` on the elements, `elementKey` falls back to `pageElementFallback(pageId, i)` = `"p1.0"`…`"p1.8"`. The test's answer keys match that. (Confirm `pageElementFallback` format in `src/renderer/keys.ts` and adjust the answer keys if it differs.)

- [ ] **Step 2: Run it, verify FAIL**

Run: `cd web-viewer && npx vitest run src/scoring/executor.test.ts`
Expected: FAIL — cannot resolve `./executor`.

- [ ] **Step 3: Implement** `web-viewer/src/scoring/executor.ts`:
```ts
import { isItem, isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import { scoredValueFor } from '../logic/scoring'
import type { LogicEvaluator, EvalValue, ScoreResolver } from '../logic/types'
import type { AnswerValue, ItemElement, Runtime } from '../renderer/types'
import { compileScorer, type CompiledScorer } from './vendor/scorerHost'
import { fetchScorerWasm } from './fetch'
import type { PinnedScore } from './types'

export interface ScorerSet {
  compiled: Map<string, CompiledScorer>
  failures: Map<string, string>
}

/** Compile every distinct scorer referenced by the runtime. Never throws; failures recorded. */
export async function compileScorers(runtime: Runtime, fetchImpl: typeof fetch = fetch): Promise<ScorerSet> {
  const scores = (runtime.scores ?? []) as PinnedScore[]
  const refs = [...new Set(scores.map((s) => s.scorer))]
  const compiled = new Map<string, CompiledScorer>()
  const failures = new Map<string, string>()
  await Promise.all(refs.map(async (ref) => {
    const pinned = scores.find((s) => s.scorer === ref)!
    try {
      const bytes = await fetchScorerWasm(pinned.impl, fetchImpl)
      const inst = await compileScorer(bytes)
      if (inst.abiVersion() !== 1) throw new Error(`unsupported ABI ${inst.abiVersion()}`)
      compiled.set(ref, inst)
    } catch (e) {
      failures.set(ref, e instanceof Error ? e.message : String(e))
    }
  }))
  return { compiled, failures }
}

type InputEntry = { promptId: string; option: Record<string, unknown>; prompt: { reversed?: boolean } | undefined }

/** key (same keys as steps/responses) → its prompt id + option, for items that carry a prompt id. */
function buildScoreInputIndex(runtime: Runtime): Map<string, InputEntry> {
  const map = new Map<string, InputEntry>()
  const add = (key: string, el: ItemElement) => {
    const promptId = el.question.prompt?.id
    if (promptId) map.set(key, { promptId, option: el.option as Record<string, unknown>, prompt: el.question.prompt as { reversed?: boolean } })
  }
  runtime.pages.forEach((page) => {
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      if (isSection(el)) el.elements.forEach((c, j) => { if (isItem(c)) add(elementKey(c, sectionChildFallback(key, j)), c) })
      else if (isItem(el)) add(key, el)
    })
  })
  return map
}

function assembleInputs(answers: Record<string, AnswerValue>, index: Map<string, InputEntry>, ev: LogicEvaluator): { scored_responses: Record<string, AnswerValue> } {
  const scored_responses: Record<string, AnswerValue> = {}
  for (const [key, { promptId, option, prompt }] of index) {
    const v = answers[key]
    if (v === undefined || v === null) continue
    scored_responses[promptId] = scoredValueFor(option, prompt, v, ev)
  }
  return { scored_responses }
}

function jsonPointer(obj: unknown, pointer: string): unknown {
  if (pointer === '') return obj
  const parts = pointer.split('/').slice(1).map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
  let cur: unknown = obj
  for (const part of parts) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

export interface ScoreCache {
  refresh(answers: Record<string, AnswerValue>, ev: LogicEvaluator): void
  resolver: ScoreResolver
}

export function makeScoreCache(set: ScorerSet, runtime: Runtime): ScoreCache {
  const scores = (runtime.scores ?? []) as PinnedScore[]
  const index = buildScoreInputIndex(runtime)
  const outputs = new Map<string, unknown>() // scorerRef → structured output (absent = failed/not-run)
  return {
    refresh(answers, ev) {
      const input = assembleInputs(answers, index, ev)
      for (const [ref, inst] of set.compiled) {
        const r = inst.run(input)
        if (r.ok) outputs.set(ref, r.output)
        else outputs.delete(ref)
      }
    },
    resolver: {
      score(id: string): EvalValue {
        const pinned = scores.find((s) => s.id === id)
        if (!pinned) return null
        const output = outputs.get(pinned.scorer)
        if (output === undefined) return null
        const v = jsonPointer(output, pinned.path)
        if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v
        return null
      },
    },
  }
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd web-viewer && npx vitest run src/scoring/executor.test.ts`
Expected: 2 PASS. (If the first test's `score('phq9_total')` is not 9, print the assembled keys and fix the answer-key format per `pageElementFallback`.)

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/scoring/executor.ts web-viewer/src/scoring/executor.test.ts
git commit -m "feat(web-viewer): ScorerExecutor — compile, assemble inputs, cache, resolve score(id)"
```

---

## Task 6: Web Viewer — wire into App + fixtures + regenerate example

**Files:** Modify `web-viewer/src/app/App.tsx`; create `web-viewer/src/fixtures/phq9.json`, `web-viewer/src/fixtures/branch_score.json`; regenerate `schemas/runtime/examples/phq9_runtime.json`.

- [ ] **Step 1: Wire the executor into `App.tsx`**

(a) Imports — add near the other `../scoring`/logic imports:
```ts
import { compileScorers, makeScoreCache, type ScoreCache } from '../scoring/executor'
```
(b) `Pipeline` type — add a field:
```ts
  cache: ScoreCache
```
(c) `buildPipeline` signature — add `scorerSet: import('../scoring/executor').ScorerSet` as a parameter (after `evaluator`), build the cache, and use its resolver. Replace the `resolver: nullResolver` line with construction of the cache + `resolver: cache.resolver`. Concretely, inside `buildPipeline`, before assigning `pipeline.current`, add:
```ts
    const cache = makeScoreCache(scorerSet, runtime)
```
and in the `pipeline.current = { ... }` object literal, replace `resolver: nullResolver,` with:
```ts
      resolver: cache.resolver,
      cache,
```
(remove the now-unused `nullResolver` import if nothing else uses it — `validateStep` uses `p.resolver.score`, unaffected).

(d) Each boot branch must compile scorers and pass the set to `buildPipeline`:
- **Fixture branch:** change `const evaluator = await loadEvaluator()` to:
  ```ts
  const [evaluator, scorerSet] = await Promise.all([loadEvaluator(), compileScorers(runtime)])
  ```
  and update its `buildPipeline(evaluator, 'fixture', ...)` call to `buildPipeline(evaluator, scorerSet, 'fixture', ...)`.
- **Resume branch:** after `const evaluator = await evaluatorPromise`, add `const scorerSet = await compileScorers(runtime)` and change `buildPipeline(evaluator, record.sessionId, ...)` → `buildPipeline(evaluator, scorerSet, record.sessionId, ...)`.
- **Mint branch:** after `const [evaluator, res] = await Promise.all([...])` and inside `if (res.ok)`, add `const scorerSet = await compileScorers(res.runtime)` and change `buildPipeline(evaluator, res.session_id, ...)` → `buildPipeline(evaluator, scorerSet, res.session_id, ...)`.

(e) `advance()` — refresh scores before validation/branching. Immediately AFTER the early-return guard block:
```ts
    if (!p || !step || requiredUnanswered(step, s.answers).length > 0) {
      dispatch({ type: 'next' })
      return
    }
```
add:
```ts
    p.cache.refresh(s.answers, p.evaluator)
```
(This runs before `validateStep` and `nextStepIndex`, so both see fresh scores.)

- [ ] **Step 2: Run the full web-viewer suite (no regressions)**

Run: `cd web-viewer && npm test`
Expected: all existing tests pass. Fixtures without `scores[]` get an empty `ScorerSet` (no fetches) → behaviour unchanged. If a test that builds a pipeline now needs a `scorerSet`, pass `{ compiled: new Map(), failures: new Map() }`.

- [ ] **Step 3: Add the dev fixtures** — `web-viewer/src/fixtures/phq9.json` and `web-viewer/src/fixtures/branch_score.json`. The branch fixture is a runtime with 9 PHQ-9 items, the 3 `phq9_*` scores (impl `{kind:'wasm', url:'/scorers/phq9.wasm', sha256:'<REAL>'}` — use the current `questionnaire-scorer/dist-wasm/phq9.wasm` sha256, obtainable via `sha256sum`), and a `logic` rule that branches when `score('phq9_total') >= 10`. Register them in `App.tsx`'s `FIXTURES` map:
```ts
  phq9: () => import('../fixtures/phq9.json'),
  branch_score: () => import('../fixtures/branch_score.json'),
```
Build the fixtures to the **real current runtime shape** (mirror `src/fixtures/branch.json` for the logic-rule shape + `mini.json` for item/option shape; prompts carry `id: pr_phq9_N`). The `/scorers/phq9.wasm` URL is served from `public/scorers/phq9.wasm` (copied by `build-scorer-host.mjs`).

- [ ] **Step 4: Dev smoke the branch fixture (manual, with Playwright screenshot)**

Run (dev server already builds the vendored host + copies the wasm via `predev`):
```bash
cd web-viewer && (npm run dev > /tmp/wv-dev.log 2>&1 &) ; sleep 9
cat > /tmp/scoresmoke.mjs <<'EOF'
import pkg from '/home/pedro/Repos/Cursor/questionnaire_apps/library-web/node_modules/playwright/index.js'
const { chromium } = pkg
const b = await chromium.launch(); const p = await b.newPage()
const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()) })
await p.goto('http://localhost:5173/?fixture=branch_score', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
// answer all 9 with the max option + advance, to push total >= 10, then assert the branch page shows
console.log('console errors:', errs)
await b.close()
EOF
node /tmp/scoresmoke.mjs
```
Confirm no console errors about scorer fetch/instantiate (the fixture fetches `/scorers/phq9.wasm`, verifies sha256, runs). (Full click-through assertion is exercised more rigorously in the Task 7 live smoke; this step just confirms the fixture wires the executor without console errors.) `pkill -f vite` when done.

- [ ] **Step 5: Regenerate the stale runtime example** — replace `schemas/runtime/examples/phq9_runtime.json` with a valid current-shape runtime (prompts `id: pr_phq9_*`, `option.options[]` with `content.<locale>.options[]`, `content.<locale>.text`), the 3 `phq9_*` scores, and a branching `logic` rule. Then:
```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps && source .venv/bin/activate && python tools/validate_schemas.py 2>&1 | tail -3
```
Expected: the runtime example now validates against Schema 3 (it currently may pass loosely; ensure no new failure).

- [ ] **Step 6: Build check**

Run: `cd web-viewer && npm run build && npm run build:lib`
Expected: both clean (the vendored host + executor compile; `prebuild` regenerates the vendored host).

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/src/app/App.tsx web-viewer/src/fixtures/phq9.json web-viewer/src/fixtures/branch_score.json schemas/runtime/examples/phq9_runtime.json
git commit -m "feat(web-viewer): wire ScorerExecutor into boot+page-submit; PHQ-9 branch fixtures; regen runtime example"
```

---

## Task 7: Live smoke + docs + final verification

**Files:** `viewer-service/FOLLOWUPS.md`, `web-viewer/FOLLOWUPS.md`.

- [ ] **Step 1: Live end-to-end smoke** — stand up the real stack and verify a score-gated branch fires. Use the existing live-smoke setup the web-viewer README documents (Library + VS), with these scoring additions:
  - Place the scorer wasm where the VS serves it: `mkdir -p /tmp/scorers && cp questionnaire-scorer/dist-wasm/phq9.wasm "/tmp/scorers/scr_phq9@v26.0602.wasm"` and run the VS with `VS_SCORER_DIR=/tmp/scorers VS_PUBLIC_BASE=http://localhost:8001` (the VS's own base URL) + `VS_CORS_ORIGINS=http://localhost:5173`.
  - Deploy a PHQ-9 questionnaire whose Schema 2 declares the 3 `phq9_*` scores + a `LogicRule` branch on `score('phq9_total') >= 10`, with `runtime_policy.show_score=false` (branching score survives stripping).
  - Complete it in chromium answering high values; confirm via the browser that the viewer fetched `…/v1/scorers/scr_phq9@v26.0602/impl.wasm` (network tab / no console error), the branch page appeared, and a low-scoring run does NOT branch.
  - Capture a screenshot for the owner (show-don't-tell). If the real Schema 2 PHQ-9 + scorer entity aren't readily deployable, document the exact gap and fall back to demonstrating the path via the `?fixture=branch_score` dev route (which exercises the same executor end-to-end against the served wasm).

- [ ] **Step 2: FOLLOWUPS** — append to `viewer-service/FOLLOWUPS.md`:
```markdown
- **Scorer artifact storage:** SP2a serves scorer wasm from a VS-local dir (`VS_SCORER_DIR`) and rewrites `impl.url` at mint (`VS_PUBLIC_BASE`). Real storage belongs in the Library (`GET /v1/scorers/{id}/versions/{v}/impl.wasm`) — SP3.
```
and to `web-viewer/FOLLOWUPS.md`:
```markdown
- **In-session scoring (SP2a, done):** `score(id)` runs live for branching (boot-compile + page-submit refresh; sentinel-null on failure). SP2b adds score **display** (`show_score`/`show_score_live`) + Schema 6 `scorer_outputs` persistence (new VS endpoint). The vendored scorer host (`src/scoring/vendor/`) is generated from `questionnaire-scorer/host` — run `scripts/build-scorer-host.mjs` if the drift test fails.
```

- [ ] **Step 3: Full verification (paste all results)**

Run:
```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
bash -c '. "$HOME/.cargo/env" && cd questionnaire-scorer && cargo test'        # abi + phq9
( cd questionnaire-scorer/host && npm test )                                   # host + conformance
( cd web-viewer && npm test && npm run build && npm run build:lib )            # web-viewer + builds
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q                        # VS incl. scorers + rewrite
source .venv/bin/activate && python tools/validate_schemas.py 2>&1 | tail -2   # examples valid
```
Expected: all green.

- [ ] **Step 4: Commit + finish the branch**

```bash
git add viewer-service/FOLLOWUPS.md web-viewer/FOLLOWUPS.md
git commit -m "docs(scorer): SP2a follow-ups (scorer artifact storage; SP2b display/persistence)"
```
Then use the `superpowers:finishing-a-development-branch` skill to merge `web-viewer-scoring-sp2a` → `master` locally + push (no PRs).

---

## Self-review checklist (completed by the plan author)

- **Spec coverage:** sync resolver via boot-compile + page-submit refresh (T5 executor, T6 wiring §1) ✓; ScorerExecutor fetch+verify+compile+cache+JSON-Pointer (T4 fetch, T5 executor) ✓; VS serve endpoint (T2) + mint rewrite (T3) ✓; lenient PHQ-9 + convention (T1) ✓; runtime fidelity = type `scores`/`reversed` + regen example + fixtures (T4 §2, T6) ✓; graceful sentinel-null degradation (T5 + its test) ✓; vendored-host single-source + drift test (T4) ✓; live smoke (T7) ✓; no schema bump (only example regen + additive type) ✓.
- **Placeholder scan:** every step has concrete code/commands; the fixtures (T6 §3) and the regenerated example (T6 §5) are described with the exact shape to mirror (`branch.json`/`mini.json`) and the real sha256 source — built from existing files, not invented.
- **Type/name consistency:** `PinnedScore`/`PinnedScorerImpl`/`ScorerIntegrityError`/`UnsupportedScorerKind` (T4 types) consumed unchanged in `fetch.ts`/`executor.ts`; `compileScorers`/`makeScoreCache`/`ScorerSet`/`ScoreCache` defined in T5 and wired in T6; `compileScorer`/`CompiledScorer` come from the vendored host (T4) matching the SP1 host; `rewrite_scorer_urls(runtime, public_base)` defined + called in T3; `score(id): EvalValue` matches the existing `ScoreResolver` interface so `validateStep`/`nextStepIndex` consume it unchanged.
```

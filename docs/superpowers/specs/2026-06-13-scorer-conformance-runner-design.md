# Scorer Conformance Runner (OD-16, sub-project 1) — Design Spec

**Date drafted:** 2026-06-13
**Author:** Scorer/OD-16 brainstorming session (2026-06-13)
**Component:** **Scorer** family (OD-16) — a new standalone package `questionnaire-scorer/`. This is **sub-project 1 of 3** in the OD-16 build-out.
**Target:** new top-level `questionnaire-scorer/` only. **No** web-viewer, Viewer Service, denormaliser, Library, or schema changes (one *data correction* to a Scorer example file — see §9).
**Authoritative source documents:**

- **OD-16** (resolved 2026-06-02) — `design/05b_scoring.md`: the external **Scorer Library entity** (`scr_*`) owns the scoring procedure; it is a *contract* (`inputs` schema, `output_schema`, `test_cases`) with multiple conformant implementations (wasm/http/python/r); the questionnaire references results by `scores[]: {id, scorer, path}` (JSON Pointer into the scorer's structured output). `design/10_open_decisions.md` OD-16 row.
- **OD-18** (resolved 2026-06-03) — `design/05d_runtime.md`: the denormaliser pins one impl per score (deployment-preference ∩ `Scorer.implementations[]` ∩ viewer `scorer_impl_kinds`) into Schema 3 `PinnedScore.impl`. (Context only — not modified here.)
- The Scorer entity example `schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json` (the contract this sub-project makes executable).
- Schema touchpoints (read-only): `schemas/runtime/schema.json` `PinnedScorerImpl` (the `wasm` impl shape: `{kind, url, sha256}`), `schemas/session/schema.json` `scorer_outputs`, `schemas/viewer_conformance/schema.json` `scorer_impl_kinds`.
- Precedent: `questionnaire-expression-evaluator/` (the existing Rust→WASM package + its determinism-vector approach + `design/15_expression_language.md` normative grammar). The Scorer ABI doc mirrors that normative-doc pattern.

---

## 0 — Decomposition (the OD-16 build-out)

OD-16 spans an execution engine, a conformance harness, and viewer/server integration. Agreed decomposition (owner, 2026-06-13):

1. **Sub-project 1 (THIS spec) — Scorer execution core + conformance runner.** The normative WASM Scorer ABI, a real reference scorer (PHQ-9, Rust→WASM), a TS host that executes a wasm scorer, and a conformance runner (+ CLI) that validates a Scorer entity against its `output_schema` + `test_cases`. Standalone; no consumer wiring.
2. **Sub-project 2 (next) — Web Viewer in-session scoring.** Replace `nullResolver` with a real resolver that executes the pinned WASM scorer, assembles `scored_responses`, resolves `scores[]` by JSON Pointer, applies the two-trigger model, persists Schema 6 `scorer_outputs`, and displays scores. *This closes the Phase-2 scoring gate.*
3. **Sub-project 3 (later) — Server-side execution** in the Viewer Service for `http`/`python`/`r` impls + display scoring + (optionally) wiring the conformance runner into the Library publish gate.

This spec covers **only sub-project 1**.

---

## 1 — Scope & boundary

**In scope:** a self-contained `questionnaire-scorer/` package producing (a) the **normative WASM Scorer ABI** (a design doc), (b) a **`scorer-abi` Rust helper crate** that implements the ABI plumbing, (c) a **reference PHQ-9 scorer** built to `phq9.wasm`, (d) a **TS host** (`runScorer`) that loads + runs a wasm scorer, and (e) a **conformance runner** (`checkScorer` + a CLI) that validates a Scorer entity against its contract.

**Explicitly out of scope** (sub-projects 2/3): replacing `nullResolver`; live `score(id)` execution; the two-trigger (branching/display) model; the answer→`scored_responses` assembly; Schema 6 `scorer_outputs` persistence; in-session score display; `http`/`python`/`r` executors; wiring conformance into Library ingestion. Because the conformance runner drives scorers from each Scorer entity's own `test_cases` (which carry the `input`), **sub-project 1 needs none of the viewer's response-assembly logic.**

**Clean unit boundaries** (each independently testable):
- `scorer-abi` (Rust) — ABI plumbing; depends on nothing project-specific.
- `phq9` (Rust) — pure scoring; depends only on `scorer-abi` + `serde_json`.
- `runScorer` (TS) — wasm execution; depends only on the ABI (a wasm `BufferSource` + JSON).
- `checkScorer` / CLI (TS) — depends on `runScorer` + a JSON-Schema validator (Ajv).

---

## 2 — The WASM Scorer ABI (normative)

Written up as `questionnaire-scorer/ABI.md` (normative, versioned). A conformant scorer `.wasm` module exports:

| Export | Signature | Meaning |
|---|---|---|
| `memory` | (linear memory) | the shared address space |
| `scorer_abi_version` | `() -> i32` | the ABI version this module targets; **`1`** for this spec |
| `scorer_alloc` | `(len: i32) -> i32` | allocate `len` bytes, return a pointer the host writes the input JSON into |
| `scorer_dealloc` | `(ptr: i32, len: i32) -> ()` | free a buffer previously returned by `scorer_alloc` (host frees the input buffer) |
| `scorer_score` | `(in_ptr: i32, in_len: i32) -> i32` | run scoring on the UTF-8 JSON at `[in_ptr, in_ptr+in_len)`; return `out_ptr` |

**Return protocol.** `scorer_score` returns `out_ptr` pointing at a **length-prefixed** buffer in `memory`: 4 bytes little-endian `u32` length `N`, followed by `N` bytes of UTF-8 JSON. The host reads `N`, then the JSON, then **must call `scorer_dealloc(out_ptr, 4 + N)`** to free it.

**Result envelope.** The JSON is exactly one of:
- `{"ok": true, "output": <value>}` — `output` MUST conform to the Scorer entity's `output_schema`.
- `{"ok": false, "error": "<human-readable message>"}` — for malformed/invalid input. A conformant scorer **never traps** on bad input; it returns `ok:false`. (A trap is a conformance failure.)

**Determinism.** `scorer_score` is a pure function of its input bytes: no clocks, no randomness, no host imports beyond `memory` growth. Same input ⇒ identical output bytes. (Mirrors the expression-evaluator's determinism guarantee.)

**Statelessness.** Each `scorer_score` call is independent; a module instance may be reused across calls (the host instantiates once and reuses).

**Host import surface.** A conformant scorer imports **nothing** (no WASI, no env). It is instantiable with an empty import object. (This keeps browser + server hosts trivial and the determinism guarantee enforceable.)

---

## 3 — Package layout

```
questionnaire-scorer/
  ABI.md                      # the normative ABI (§2)
  README.md                   # build + usage + how to author a scorer
  Cargo.toml                  # Rust workspace (abi crate + phq9 crate)
  abi/                        # scorer-abi helper crate (Rust)
    Cargo.toml
    src/lib.rs                # alloc/dealloc + length-prefix + score!() macro
  scorers/
    phq9/
      Cargo.toml              # cdylib, depends on scorer-abi + serde_json
      src/lib.rs              # PHQ-9 scoring; exports the ABI via the macro
  host/                       # TS host + conformance runner (Node, vitest)
    package.json
    tsconfig.json
    src/
      runScorer.ts            # runScorer(wasm, input) -> ScorerResult
      conformance.ts          # checkScorer(entity, {wasm}) -> ConformanceReport
      cli.ts                  # `scorer-conformance <entity.json> <impl.wasm>`
      types.ts                # ScorerEntity / ScorerResult / ConformanceReport
    test/
      runScorer.test.ts
      conformance.test.ts
  scripts/
    build-phq9.mjs            # cargo build --target wasm32-unknown-unknown + copy wasm
  dist-wasm/
    phq9.wasm                 # built artifact (committed or built-on-demand — see §7)
```

---

## 4 — `scorer-abi` Rust helper crate

Provides the ABI plumbing so a scorer author writes only pure scoring logic. Public surface:

- `scorer_alloc`/`scorer_dealloc`/`scorer_abi_version` as `#[no_mangle] pub extern "C"` functions (allocation via a `Vec<u8>` leak/reclaim by ptr+len).
- A `score!` macro (or a generic `run<F>` entry) that the scorer's `lib.rs` uses to expose `scorer_score`: it reads the input bytes, calls the author's `fn(&serde_json::Value) -> Result<serde_json::Value, String>`, wraps the result in the `{ok,output}`/`{ok,error}` envelope, serialises, and returns the length-prefixed pointer. JSON parse failure of the *input* → `{"ok":false,"error":"invalid input json"}` (never a trap).

The crate is `no_std`-friendly is **not** required (we target `wasm32-unknown-unknown` with `std`; the module imports nothing because we don't call any host functions — allocation uses the wasm linear memory via Rust's allocator). Crate-type for scorers is `cdylib`.

---

## 5 — Reference PHQ-9 scorer

`scorers/phq9/src/lib.rs` implements the procedure declared by `scr_phq9.json`:

- **Input** (`inputs` schema): `{ "scored_responses": { "pr_phq9_1": int, … "pr_phq9_9": int } }` — values already post-reversal (the viewer applies reversal; the scorer trusts `scored_responses`).
- **Output** (`output_schema`, exactly): `{ total: int 0..27, severity: enum(minimal|mild|moderate|mod_severe|severe), band: {min:int, max:int, label:string}, missing_count: int 0..9 }`. **No `items` field** (the real entity's `output_schema` requires only these four).
- **Logic:** `missing_count` = count of the nine `pr_phq9_*` keys absent/null; `total` = sum of present values; `severity`/`band` from the five standard bands — `0–4 minimal "Minimal Depression"`, `5–9 mild "Mild Depression"`, `10–14 moderate "Moderate Depression"`, `15–19 mod_severe "Moderately Severe Depression"`, `20–27 severe "Severe Depression"` (the band labels are pinned by the entity's `test_cases`, e.g. `{min:10,max:14,label:"Moderate Depression"}`).
- **Errors:** out-of-range item value (outside 0–3), non-integer, or unexpected key → `{"ok":false,"error": …}` (not a trap). The exact band edges + labels are pinned by the entity's `test_cases`, which the build's conformance test runs against the **built wasm**.

Built to `dist-wasm/phq9.wasm` via `scripts/build-phq9.mjs` (`cargo build -p phq9 --target wasm32-unknown-unknown --release`, then copy + optional `wasm-opt`).

---

## 6 — TS host + conformance runner

### `runScorer(wasm: BufferSource, input: unknown): Promise<ScorerResult>`
Instantiates the module with an **empty import object**, checks `scorer_abi_version() === 1` (else a typed error), encodes `JSON.stringify(input)` to UTF-8, `scorer_alloc`s + writes it, calls `scorer_score`, reads the length-prefixed output, `scorer_dealloc`s both buffers, and parses the envelope. Returns `{ ok: true, output }` or `{ ok: false, error }` (a wasm trap is caught and surfaced as `{ ok:false, error:'trap: …', trapped:true }`). A `compileScorer(wasm)` helper returns a reusable instance so callers (and sub-project 2's viewer) instantiate once and call many times.

### `checkScorer(entity: ScorerEntity, opts: { wasm: BufferSource }): ConformanceReport`
The literal conformance runner. Steps:
1. **Impl integrity:** if the entity's `implementations[]` has a `wasm` impl with a `sha256`, assert `sha256(opts.wasm) === that hash` (records a `sha256_mismatch` finding otherwise).
2. **Compile** the wasm once (`compileScorer`); assert `scorer_abi_version() === 1`.
3. For each `test_case`: run `runScorer(input)`; assert envelope `ok:true`; **validate `output` against the entity's `output_schema`** with Ajv (record each schema violation); **deep-equal `output` vs the test case's `expected`**.
4. **Determinism:** run each test case's input **twice**; assert byte-identical outputs.
5. Produce `ConformanceReport { scorer: string, abiVersion, sha256Ok, cases: [{ index, ok, schemaErrors[], mismatch? , nondeterministic? }], passed: boolean }`.

The CLI `scorer-conformance <entity.json> <impl.wasm>` prints a human summary and exits non-zero if `passed === false`. (This is the future Library publish-gate; wiring it into ingestion is sub-project 3.)

### Executor interface (forward-compatible, only `wasm` implemented)
`checkScorer` runs through an internal `Executor` abstraction (`{ kind, run(input) }`). Only the `wasm` executor exists now; `http`/`python`/`r` executors are a documented extension point (sub-project 3). The conformance runner therefore checks **the wasm impl only**; if the entity declares other kinds, the report notes them as `not_checked` (not failures).

---

## 7 — Build & toolchain

- Rust (already installed for the expression evaluator: rustc/cargo 1.96.0, `wasm32-unknown-unknown` target). **No `wasm-bindgen`/`wasm-pack`** — the raw C-ABI is produced directly by a `cdylib` build. `source "$HOME/.cargo/env"` first (per the existing repo note).
- `scripts/build-phq9.mjs` builds the wasm and writes `dist-wasm/phq9.wasm`. The TS host tests depend on this artifact (a `pretest` step builds it, mirroring web-viewer's `predev` evaluator build).
- **`dist-wasm/phq9.wasm` is committed** (so the conformance test + the future viewer can consume it without a Rust toolchain), and a test asserts the committed wasm matches a fresh build's behaviour via the conformance vectors. *(If committing a binary is undesirable, the fallback is build-on-`pretest` only; default is commit, mirroring how the schemas/examples are committed artifacts.)*
- Node/TS host uses **vitest** (consistent with `web-viewer/`, `library-web/`) + **Ajv** for `output_schema` validation.

---

## 8 — Testing & verification

- **Rust unit tests** (`cargo test -p phq9`): band edges, summation, missing handling, the error paths (out-of-range → `ok:false`).
- **Host tests** (`host/`, vitest):
  - `runScorer.test.ts`: round-trips a known input through the **built** `phq9.wasm`; checks the envelope, an error input (`ok:false`), and an ABI-version guard with a fake module.
  - `conformance.test.ts`: `checkScorer(scr_phq9.json, {wasm: phq9.wasm})` → `passed: true`, every test_case green, determinism holds, sha256 matches; plus a negative test (a deliberately wrong `expected` or a mutated wasm → `passed:false` with the right finding).
- **CLI smoke**: `scorer-conformance scr_phq9.json phq9.wasm` exits 0; a tampered case exits non-zero.
- **Cross-checks:** the conformance vectors are exactly the entity's own `test_cases` (single source of truth), and the wasm's `sha256` is asserted equal to the value written into the example entity (§9).

Verification commands recorded in the package README:
```
( cd questionnaire-scorer && cargo test && node scripts/build-phq9.mjs && cd host && npm i && npm test )
node questionnaire-scorer/host/dist/cli.js \
  schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json \
  questionnaire-scorer/dist-wasm/phq9.wasm
```

---

## 9 — The one data correction (Scorer example)

The live example `schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json` currently carries a **dummy `sha256`** on its `wasm` impl. After building the real `phq9.wasm`, update that `sha256` to the real binary's hash so the example is honest and the conformance runner's integrity check passes. **Keep the `url` unchanged** (`https://behaverse.org/scorers/phq9/…` — the canonical identifier; public hosting deferred, same policy as the schema `$id`s). **Do not touch** the frozen versioned copy under `schemas/questionnaire/versions/…` (OD-06 immutability). No schema version bump (no schema shape changes).

---

## 10 — Decisions & defaults (resolved in brainstorming)

- **Decomposition:** sub-project 1 first (owner).
- **ABI:** raw core-wasm C-ABI, no JS glue, imports nothing, ABI version `1` (owner).
- **Executors now:** **wasm only**; http/python/r are a deferred extension point (default, accepted).
- **Reference scorer:** **PHQ-9 only** (default, accepted).
- **Example fix:** correct `scr_phq9.json`'s wasm `sha256` to the real binary (default, accepted).
- **Conformance wiring:** standalone CLI now; Library publish-gate wiring deferred to sub-project 3 (default, accepted).
- **Host language:** TypeScript/Node (so sub-project 2's Web Viewer reuses `runScorer`/`compileScorer` directly).

---

## 11 — Out of scope (restated) → sub-projects 2 & 3

`nullResolver` replacement, `score(id)` live resolution + JSON-Pointer `scores[]` lookup, two-trigger evaluation, `scored_responses` assembly from session answers, Schema 6 `scorer_outputs` persistence + submission, in-session score display UI (sub-project 2); `http`/`python`/`r` executors, server-side display scoring, Library publish-gate integration (sub-project 3).

# Scorer Conformance Runner (OD-16 sub-project 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `questionnaire-scorer/` package: a normative raw-wasm **Scorer ABI v1**, a reference **PHQ-9** scorer (Rust→WASM), a TypeScript **host** that runs a wasm scorer, and a **conformance runner** (+ CLI) that validates a Scorer entity against its `output_schema` + `test_cases` + determinism + sha256.

**Architecture:** A Cargo workspace with a `scorer-abi` helper crate (alloc/dealloc + length-prefixed JSON envelope + a `scorer!` macro emitting the four ABI exports) and a `phq9` cdylib crate (pure scoring + the macro). A Node build script compiles `phq9.wasm` and syncs the example entity's sha256. A TS host (`compileScorer`/`runScorer`) instantiates the wasm with **no imports** and round-trips JSON; the conformance runner (`checkScorer` + Ajv + CLI) drives the entity's own `test_cases`. No consumer (web-viewer/VS) changes.

**Tech Stack:** Rust (cargo 1.96, `wasm32-unknown-unknown`, no wasm-bindgen) + serde_json; TypeScript/Node + vitest + Ajv.

**Spec:** [docs/superpowers/specs/2026-06-13-scorer-conformance-runner-design.md](../specs/2026-06-13-scorer-conformance-runner-design.md)

**Working dir:** the new `questionnaire-scorer/` (under repo root `/home/pedro/Repos/Cursor/questionnaire_apps`). Branch `scorer-conformance-runner` is already checked out (the spec is committed there). Run Rust via bash with `. "$HOME/.cargo/env"` first.

---

## File structure

```
questionnaire-scorer/
  Cargo.toml                 # workspace (members: abi, scorers/phq9) + release profile
  .gitignore                 # target/, host/node_modules/, host/dist/  (NOT dist-wasm/)
  ABI.md                     # normative ABI v1
  README.md                  # build + usage + authoring
  FOLLOWUPS.md
  abi/
    Cargo.toml               # scorer-abi (rlib)
    src/lib.rs               # wrap_ok/wrap_err/encode + alloc/dealloc/run + scorer! macro
  scorers/phq9/
    Cargo.toml               # phq9 (cdylib + rlib), deps scorer-abi + serde_json
    src/lib.rs               # score_phq9() + scorer!(score_phq9)
  scripts/
    build-phq9.mjs           # cargo build wasm → dist-wasm/phq9.wasm + sync entity sha256
  dist-wasm/phq9.wasm        # committed build artifact
  host/
    package.json tsconfig.json vitest.config.ts
    src/{types,runScorer,conformance,cli}.ts
    test/{runScorer,conformance}.test.ts
```

Plus one data edit (Task 3): `schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json` wasm-impl `sha256`.

---

## Task 1: Workspace + `scorer-abi` crate

**Files:** Create `questionnaire-scorer/Cargo.toml`, `questionnaire-scorer/.gitignore`, `questionnaire-scorer/abi/Cargo.toml`, `questionnaire-scorer/abi/src/lib.rs`.

- [ ] **Step 1: Workspace + gitignore + abi crate manifest**

`questionnaire-scorer/Cargo.toml`:
```toml
[workspace]
resolver = "2"
members = ["abi", "scorers/phq9"]

[profile.release]
panic = "abort"
opt-level = "s"
lto = true
strip = true
```

`questionnaire-scorer/.gitignore`:
```
/target
host/node_modules
host/dist
```

`questionnaire-scorer/abi/Cargo.toml`:
```toml
[package]
name = "scorer-abi"
version = "0.1.0"
edition = "2021"

[dependencies]
serde_json = "1"
```

- [ ] **Step 2: Write the failing test** (host-native unit tests for the pure helpers)

`questionnaire-scorer/abi/src/lib.rs` (start with ONLY the tests + empty stubs so it fails):
```rust
use serde_json::{json, Value};

pub fn wrap_ok(_output: Value) -> Value { unimplemented!() }
pub fn wrap_err(_msg: &str) -> Value { unimplemented!() }
pub fn encode(_value: &Value) -> Vec<u8> { unimplemented!() }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn wraps_ok_and_err() {
        assert_eq!(wrap_ok(json!({"total": 3})), json!({"ok": true, "output": {"total": 3}}));
        assert_eq!(wrap_err("bad"), json!({"ok": false, "error": "bad"}));
    }
    #[test]
    fn encode_is_length_prefixed() {
        let bytes = encode(&json!({"ok": true}));
        let len = u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) as usize;
        assert_eq!(len, bytes.len() - 4);
        assert_eq!(&bytes[4..], br#"{"ok":true}"#);
    }
}
```

- [ ] **Step 3: Run it, verify FAIL**

Run: `cd questionnaire-scorer && bash -c '. "$HOME/.cargo/env" && cargo test -p scorer-abi'`
Expected: compiles, tests **panic** on `unimplemented!()` → FAIL.

- [ ] **Step 4: Implement `abi/src/lib.rs`** (replace the file's non-test section with the real implementation; keep the `#[cfg(test)] mod tests` block):

```rust
use serde_json::{json, Value};

pub fn wrap_ok(output: Value) -> Value {
    json!({ "ok": true, "output": output })
}
pub fn wrap_err(msg: &str) -> Value {
    json!({ "ok": false, "error": msg })
}
/// Length-prefixed: 4-byte little-endian u32 length, then the UTF-8 JSON bytes.
pub fn encode(value: &Value) -> Vec<u8> {
    let json = serde_json::to_vec(value)
        .unwrap_or_else(|_| br#"{"ok":false,"error":"encode failure"}"#.to_vec());
    let mut out = Vec::with_capacity(4 + json.len());
    out.extend_from_slice(&(json.len() as u32).to_le_bytes());
    out.extend_from_slice(&json);
    out
}

// ---- wasm-facing plumbing (referenced by the `scorer!` macro) ----

/// Allocate `len` bytes, return a pointer the host writes into. Exact-size boxed slice
/// so `dealloc(ptr, len)` frees precisely what was allocated.
pub fn alloc(len: i32) -> i32 {
    let buf = vec![0u8; len.max(0) as usize].into_boxed_slice();
    Box::into_raw(buf) as *mut u8 as i32
}
pub fn dealloc(ptr: i32, len: i32) {
    if ptr == 0 || len <= 0 { return; }
    unsafe {
        let slice = std::slice::from_raw_parts_mut(ptr as *mut u8, len as usize);
        drop(Box::from_raw(slice as *mut [u8]));
    }
}
/// Read input JSON at [in_ptr, in_ptr+in_len), run `f`, return a pointer to the
/// length-prefixed `{ok,...}` envelope. The host frees it via `scorer_dealloc(ptr, 4+jsonLen)`.
pub fn run<F: Fn(&Value) -> Result<Value, String>>(f: F, in_ptr: i32, in_len: i32) -> i32 {
    let input = unsafe { std::slice::from_raw_parts(in_ptr as *const u8, in_len.max(0) as usize) };
    let result = match serde_json::from_slice::<Value>(input) {
        Ok(v) => match f(&v) {
            Ok(out) => wrap_ok(out),
            Err(e) => wrap_err(&e),
        },
        Err(_) => wrap_err("invalid input json"),
    };
    let boxed = encode(&result).into_boxed_slice(); // exact-size allocation
    Box::into_raw(boxed) as *mut u8 as i32
}

/// Emit the four ABI exports for a scorer whose logic is `$f: fn(&Value) -> Result<Value, String>`.
#[macro_export]
macro_rules! scorer {
    ($f:path) => {
        #[no_mangle] pub extern "C" fn scorer_abi_version() -> i32 { 1 }
        #[no_mangle] pub extern "C" fn scorer_alloc(len: i32) -> i32 { $crate::alloc(len) }
        #[no_mangle] pub extern "C" fn scorer_dealloc(ptr: i32, len: i32) { $crate::dealloc(ptr, len) }
        #[no_mangle] pub extern "C" fn scorer_score(in_ptr: i32, in_len: i32) -> i32 { $crate::run($f, in_ptr, in_len) }
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn wraps_ok_and_err() {
        assert_eq!(wrap_ok(json!({"total": 3})), json!({"ok": true, "output": {"total": 3}}));
        assert_eq!(wrap_err("bad"), json!({"ok": false, "error": "bad"}));
    }
    #[test]
    fn encode_is_length_prefixed() {
        let bytes = encode(&json!({"ok": true}));
        let len = u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) as usize;
        assert_eq!(len, bytes.len() - 4);
        assert_eq!(&bytes[4..], br#"{"ok":true}"#);
    }
}
```

- [ ] **Step 5: Run, verify PASS**

Run: `cd questionnaire-scorer && bash -c '. "$HOME/.cargo/env" && cargo test -p scorer-abi'`
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-scorer/Cargo.toml questionnaire-scorer/.gitignore questionnaire-scorer/abi
git commit -m "feat(scorer): scorer-abi crate — wasm ABI plumbing + envelope + scorer! macro"
```

---

## Task 2: `phq9` reference scorer crate

**Files:** Create `questionnaire-scorer/scorers/phq9/Cargo.toml`, `questionnaire-scorer/scorers/phq9/src/lib.rs`.

- [ ] **Step 1: Crate manifest**

`questionnaire-scorer/scorers/phq9/Cargo.toml`:
```toml
[package]
name = "phq9"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
scorer-abi = { path = "../../abi" }
serde_json = "1"
```

- [ ] **Step 2: Write the failing test**

`questionnaire-scorer/scorers/phq9/src/lib.rs` (start with a stub that fails):
```rust
use serde_json::{json, Value};

pub fn score_phq9(_input: &Value) -> Result<Value, String> {
    Err("unimplemented".into())
}

scorer_abi::scorer!(score_phq9);

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn full(vals: [i64; 9]) -> Value {
        let mut o = serde_json::Map::new();
        for (i, v) in vals.iter().enumerate() {
            o.insert(format!("pr_phq9_{}", i + 1), json!(v));
        }
        json!({ "scored_responses": o })
    }

    #[test]
    fn moderate_no_missing() {
        let out = score_phq9(&full([1, 2, 1, 2, 1, 1, 2, 1, 1])).unwrap();
        assert_eq!(out, json!({
            "total": 12, "severity": "moderate",
            "band": { "min": 10, "max": 14, "label": "Moderate Depression" },
            "missing_count": 0
        }));
    }
    #[test]
    fn minimal_floor() {
        let out = score_phq9(&full([0,0,0,0,0,0,0,0,0])).unwrap();
        assert_eq!(out, json!({
            "total": 0, "severity": "minimal",
            "band": { "min": 0, "max": 4, "label": "Minimal Depression" },
            "missing_count": 0
        }));
    }
    #[test]
    fn severe_band() {
        let out = score_phq9(&full([3,3,3,3,3,3,3,3,3])).unwrap();
        assert_eq!(out["total"], json!(27));
        assert_eq!(out["severity"], json!("severe"));
        assert_eq!(out["band"]["label"], json!("Severe Depression"));
    }
    #[test]
    fn missing_items_counted() {
        let out = score_phq9(&json!({ "scored_responses": { "pr_phq9_1": 2, "pr_phq9_2": 3 } })).unwrap();
        assert_eq!(out["total"], json!(5));
        assert_eq!(out["missing_count"], json!(7));
        assert_eq!(out["severity"], json!("mild"));
    }
    #[test]
    fn rejects_out_of_range() {
        assert!(score_phq9(&full([4,0,0,0,0,0,0,0,0])).is_err());
    }
    #[test]
    fn rejects_unexpected_key() {
        let r = score_phq9(&json!({ "scored_responses": { "pr_phq9_1": 1, "bogus": 1 } }));
        assert!(r.is_err());
    }
    #[test]
    fn rejects_missing_scored_responses() {
        assert!(score_phq9(&json!({})).is_err());
    }
}
```

- [ ] **Step 3: Run it, verify FAIL**

Run: `cd questionnaire-scorer && bash -c '. "$HOME/.cargo/env" && cargo test -p phq9'`
Expected: tests FAIL (stub returns Err / unwraps panic).

- [ ] **Step 4: Implement `score_phq9`** (replace the stub `pub fn score_phq9` only; keep the macro line and the tests):

```rust
use serde_json::{json, Value};

const KEYS: [&str; 9] = [
    "pr_phq9_1", "pr_phq9_2", "pr_phq9_3", "pr_phq9_4", "pr_phq9_5",
    "pr_phq9_6", "pr_phq9_7", "pr_phq9_8", "pr_phq9_9",
];

fn band(total: i64) -> (&'static str, i64, i64, &'static str) {
    match total {
        0..=4   => ("minimal",    0,  4,  "Minimal Depression"),
        5..=9   => ("mild",       5,  9,  "Mild Depression"),
        10..=14 => ("moderate",  10, 14, "Moderate Depression"),
        15..=19 => ("mod_severe",15, 19, "Moderately Severe Depression"),
        _       => ("severe",    20, 27, "Severe Depression"),
    }
}

pub fn score_phq9(input: &Value) -> Result<Value, String> {
    let sr = input
        .get("scored_responses")
        .and_then(|v| v.as_object())
        .ok_or_else(|| "missing scored_responses object".to_string())?;
    for k in sr.keys() {
        if !KEYS.contains(&k.as_str()) {
            return Err(format!("unexpected key: {k}"));
        }
    }
    let mut total: i64 = 0;
    let mut missing: i64 = 0;
    for key in KEYS {
        match sr.get(key) {
            None | Some(Value::Null) => missing += 1,
            Some(v) => {
                let n = v.as_i64().ok_or_else(|| format!("{key}: not an integer"))?;
                if !(0..=3).contains(&n) {
                    return Err(format!("{key}: out of range 0..3"));
                }
                total += n;
            }
        }
    }
    let (severity, min, max, label) = band(total);
    Ok(json!({
        "total": total,
        "severity": severity,
        "band": { "min": min, "max": max, "label": label },
        "missing_count": missing
    }))
}
```

- [ ] **Step 5: Run, verify PASS**

Run: `cd questionnaire-scorer && bash -c '. "$HOME/.cargo/env" && cargo test -p phq9'`
Expected: 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-scorer/scorers/phq9
git commit -m "feat(scorer): PHQ-9 reference scorer (pure logic + ABI export)"
```

---

## Task 3: Build `phq9.wasm` + sync the example sha256

**Files:** Create `questionnaire-scorer/scripts/build-phq9.mjs`; produce `questionnaire-scorer/dist-wasm/phq9.wasm`; edit `schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json`.

- [ ] **Step 1: Write the build script** `questionnaire-scorer/scripts/build-phq9.mjs`:

```js
import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')          // questionnaire-scorer/
const repo = join(root, '..')          // repo root

execSync('. "$HOME/.cargo/env" && cargo build -p phq9 --target wasm32-unknown-unknown --release', {
  cwd: root, stdio: 'inherit', shell: '/bin/bash',
})

const built = join(root, 'target', 'wasm32-unknown-unknown', 'release', 'phq9.wasm')
const distDir = join(root, 'dist-wasm')
mkdirSync(distDir, { recursive: true })
const dist = join(distDir, 'phq9.wasm')
copyFileSync(built, dist)

const sha = createHash('sha256').update(readFileSync(dist)).digest('hex')
console.log('phq9.wasm sha256:', sha)

// Keep the live Scorer example's wasm-impl sha256 in sync (surgical replace; preserve formatting).
const entityPath = join(repo, 'schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json')
const txt = readFileSync(entityPath, 'utf8')
const updated = txt.replace(/("kind":\s*"wasm"[\s\S]*?"sha256":\s*")[a-f0-9]{64}(")/, `$1${sha}$2`)
if (updated !== txt) {
  writeFileSync(entityPath, updated)
  console.log('updated scr_phq9.json wasm sha256')
}
```

- [ ] **Step 2: Run the build**

Run: `cd questionnaire-scorer && node scripts/build-phq9.mjs`
Expected: cargo builds the wasm; prints a sha256; `dist-wasm/phq9.wasm` exists; `scr_phq9.json` updated.

**If the wasm build fails because `std` is unavailable on `wasm32-unknown-unknown`** (rare — pure compute usually builds), report it; the fallback (out of this step's scope) is to make `phq9` `#![no_std]` + `alloc` + `serde_json` with `default-features=false, features=["alloc"]`. Do NOT silently change the design — report first.

- [ ] **Step 3: Verify the wasm is a real module + sha256 consistency**

Run:
```bash
cd questionnaire-scorer
test -f dist-wasm/phq9.wasm && head -c4 dist-wasm/phq9.wasm | xxd | grep -q '0061 736d' && echo "valid wasm magic"
ACTUAL=$(sha256sum dist-wasm/phq9.wasm | cut -d' ' -f1)
grep -q "$ACTUAL" ../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json && echo "entity sha256 matches build"
```
Expected: "valid wasm magic" and "entity sha256 matches build".

- [ ] **Step 4: Confirm the schema validator still passes** (the sha256 is still 64-hex → valid)

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && source .venv/bin/activate && python tools/validate_schemas.py 2>&1 | tail -2`
Expected: all examples still pass (no regression from the sha256 edit).

- [ ] **Step 5: Commit** (the committed wasm + the synced entity + the script)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add questionnaire-scorer/scripts/build-phq9.mjs questionnaire-scorer/dist-wasm/phq9.wasm schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json
git commit -m "build(scorer): build phq9.wasm + sync scr_phq9.json sha256 to the real binary"
```

---

## Task 4: TypeScript host (`runScorer` / `compileScorer`)

**Files:** Create `questionnaire-scorer/host/package.json`, `tsconfig.json`, `vitest.config.ts`, `src/types.ts`, `src/runScorer.ts`, `test/runScorer.test.ts`.

- [ ] **Step 1: Host package config**

`questionnaire-scorer/host/package.json`:
```json
{
  "name": "@behaverse/questionnaire-scorer",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "bin": { "scorer-conformance": "dist/cli.js" },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "pretest": "node ../scripts/build-phq9.mjs",
    "test": "vitest run"
  },
  "dependencies": { "ajv": "^8.17.1" },
  "devDependencies": { "typescript": "^5.6.0", "vitest": "^2.1.8", "@types/node": "^22.0.0" }
}
```

`questionnaire-scorer/host/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src"]
}
```

`questionnaire-scorer/host/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', globals: true } })
```

- [ ] **Step 2: Types** `questionnaire-scorer/host/src/types.ts`:
```ts
export interface ScorerImpl { kind: string; url?: string; sha256?: string; package?: string }
export interface ScorerEntity {
  id: string
  inputs?: unknown
  output_schema: Record<string, unknown>
  implementations: ScorerImpl[]
  test_cases?: { name?: string; input: unknown; expected: unknown }[]
}
export type ScorerResult =
  | { ok: true; output: unknown }
  | { ok: false; error: string; trapped?: boolean }
export interface CaseReport {
  index: number
  name?: string
  ok: boolean
  schemaErrors: string[]
  envelopeError?: string
  mismatch?: { expected: unknown; actual: unknown }
  nondeterministic?: boolean
}
export interface ConformanceReport {
  scorer: string
  abiVersion: number | null
  sha256Ok: boolean | null
  checkedKind: string
  notChecked: string[]
  cases: CaseReport[]
  passed: boolean
}
```

- [ ] **Step 3: Write the failing test** `questionnaire-scorer/host/test/runScorer.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compileScorer, runScorer } from '../src/runScorer'

const wasm = new Uint8Array(readFileSync(fileURLToPath(new URL('../../dist-wasm/phq9.wasm', import.meta.url))))
const full = (vals: number[]) => ({ scored_responses: Object.fromEntries(vals.map((v, i) => [`pr_phq9_${i + 1}`, v])) })

test('runs a valid input and returns the ok envelope', async () => {
  const r = await runScorer(wasm, full([1, 2, 1, 2, 1, 1, 2, 1, 1]))
  expect(r).toEqual({ ok: true, output: { total: 12, severity: 'moderate', band: { min: 10, max: 14, label: 'Moderate Depression' }, missing_count: 0 } })
})
test('bad input returns ok:false, never throws', async () => {
  const r = await runScorer(wasm, { scored_responses: { pr_phq9_1: 9 } })
  expect(r.ok).toBe(false)
})
test('compileScorer instance is reusable and deterministic', async () => {
  const s = await compileScorer(wasm)
  expect(s.abiVersion()).toBe(1)
  const a = s.run(full([0, 0, 0, 0, 0, 0, 0, 0, 0]))
  const b = s.run(full([0, 0, 0, 0, 0, 0, 0, 0, 0]))
  expect(JSON.stringify(a)).toBe(JSON.stringify(b))
})
```

- [ ] **Step 4: Run, verify FAIL**

Run: `cd questionnaire-scorer/host && npm install && npx vitest run test/runScorer.test.ts`
Expected: FAIL — cannot resolve `../src/runScorer`. (npm install + the `pretest` won't run for `npx vitest`; the wasm already exists from Task 3.)

- [ ] **Step 5: Implement** `questionnaire-scorer/host/src/runScorer.ts`:
```ts
import type { ScorerResult } from './types'

interface ScorerExports {
  memory: WebAssembly.Memory
  scorer_abi_version(): number
  scorer_alloc(len: number): number
  scorer_dealloc(ptr: number, len: number): void
  scorer_score(inPtr: number, inLen: number): number
}

export interface CompiledScorer {
  abiVersion(): number
  run(input: unknown): ScorerResult
}

export async function compileScorer(wasm: BufferSource): Promise<CompiledScorer> {
  const { instance } = await WebAssembly.instantiate(wasm, {})
  const ex = instance.exports as unknown as ScorerExports
  const abi = ex.scorer_abi_version()
  const enc = new TextEncoder()
  const dec = new TextDecoder()

  function run(input: unknown): ScorerResult {
    let inPtr = 0
    let inLen = 0
    let outPtr = 0
    let outTotal = 0
    try {
      const bytes = enc.encode(JSON.stringify(input))
      inLen = bytes.length
      inPtr = ex.scorer_alloc(inLen)
      new Uint8Array(ex.memory.buffer, inPtr, inLen).set(bytes)
      outPtr = ex.scorer_score(inPtr, inLen)
      // memory may have grown during score(); re-read the buffer.
      const view = new DataView(ex.memory.buffer)
      const jsonLen = view.getUint32(outPtr, true)
      outTotal = 4 + jsonLen
      const jsonBytes = new Uint8Array(ex.memory.buffer, outPtr + 4, jsonLen)
      return JSON.parse(dec.decode(jsonBytes)) as ScorerResult
    } catch (e) {
      return { ok: false, error: `trap: ${e instanceof Error ? e.message : String(e)}`, trapped: true }
    } finally {
      if (inPtr) { try { ex.scorer_dealloc(inPtr, inLen) } catch { /* noop */ } }
      if (outPtr) { try { ex.scorer_dealloc(outPtr, outTotal) } catch { /* noop */ } }
    }
  }

  return { abiVersion: () => abi, run }
}

export async function runScorer(wasm: BufferSource, input: unknown): Promise<ScorerResult> {
  const s = await compileScorer(wasm)
  if (s.abiVersion() !== 1) return { ok: false, error: `unsupported scorer ABI version ${s.abiVersion()}` }
  return s.run(input)
}
```

- [ ] **Step 6: Run, verify PASS**

Run: `cd questionnaire-scorer/host && npx vitest run test/runScorer.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add questionnaire-scorer/host/package.json questionnaire-scorer/host/package-lock.json questionnaire-scorer/host/tsconfig.json questionnaire-scorer/host/vitest.config.ts questionnaire-scorer/host/src/types.ts questionnaire-scorer/host/src/runScorer.ts questionnaire-scorer/host/test/runScorer.test.ts
git commit -m "feat(scorer): TS host — compileScorer/runScorer over the wasm ABI"
```

---

## Task 5: Conformance runner + CLI

**Files:** Create `questionnaire-scorer/host/src/conformance.ts`, `src/cli.ts`, `test/conformance.test.ts`.

- [ ] **Step 1: Write the failing test** `questionnaire-scorer/host/test/conformance.test.ts`:
```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { checkScorer } from '../src/conformance'
import type { ScorerEntity } from '../src/types'

const wasm = new Uint8Array(readFileSync(fileURLToPath(new URL('../../dist-wasm/phq9.wasm', import.meta.url))))
const entity = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json', import.meta.url)), 'utf8'),
) as ScorerEntity

test('the PHQ-9 scorer is conformant against its entity test_cases', async () => {
  const report = await checkScorer(entity, { wasm })
  expect(report.passed).toBe(true)
  expect(report.abiVersion).toBe(1)
  expect(report.sha256Ok).toBe(true)
  expect(report.cases.length).toBe(entity.test_cases!.length)
  expect(report.cases.every((c) => c.ok)).toBe(true)
  expect(report.notChecked).toEqual(['http', 'python'])
})

test('a wrong expected value is reported as a mismatch (passed=false)', async () => {
  const tampered: ScorerEntity = { ...entity, test_cases: [{ name: 'x', input: entity.test_cases![0].input, expected: { total: 999, severity: 'minimal', band: { min: 0, max: 4, label: 'Minimal Depression' }, missing_count: 0 } }] }
  const report = await checkScorer(tampered, { wasm })
  expect(report.passed).toBe(false)
  expect(report.cases[0].mismatch).toBeDefined()
})

test('a sha256 that does not match the binary fails', async () => {
  const bad: ScorerEntity = { ...entity, implementations: entity.implementations.map((i) => (i.kind === 'wasm' ? { ...i, sha256: 'f'.repeat(64) } : i)) }
  const report = await checkScorer(bad, { wasm })
  expect(report.sha256Ok).toBe(false)
  expect(report.passed).toBe(false)
})
```

- [ ] **Step 2: Run, verify FAIL**

Run: `cd questionnaire-scorer/host && npx vitest run test/conformance.test.ts`
Expected: FAIL — cannot resolve `../src/conformance`.

- [ ] **Step 3: Implement** `questionnaire-scorer/host/src/conformance.ts`:
```ts
import Ajv from 'ajv'
import { createHash } from 'node:crypto'
import { compileScorer } from './runScorer'
import type { CaseReport, ConformanceReport, ScorerEntity, ScorerResult } from './types'

export async function checkScorer(entity: ScorerEntity, opts: { wasm: Uint8Array }): Promise<ConformanceReport> {
  const wasmImpl = entity.implementations.find((i) => i.kind === 'wasm')
  const notChecked = entity.implementations.filter((i) => i.kind !== 'wasm').map((i) => i.kind)

  let sha256Ok: boolean | null = null
  if (wasmImpl?.sha256) {
    const digest = createHash('sha256').update(opts.wasm).digest('hex')
    sha256Ok = digest === wasmImpl.sha256
  }

  const scorer = await compileScorer(opts.wasm)
  const abiVersion = scorer.abiVersion()

  const ajv = new Ajv({ allErrors: true, strict: false })
  const validate = ajv.compile(entity.output_schema)

  const testCases = entity.test_cases ?? []
  const cases: CaseReport[] = testCases.map((tc, index) => {
    const report: CaseReport = { index, name: tc.name, ok: false, schemaErrors: [] }
    const r1 = scorer.run(tc.input) as ScorerResult
    const r2 = scorer.run(tc.input) as ScorerResult
    if (!r1.ok) { report.envelopeError = r1.error; return report }
    if (JSON.stringify(r1) !== JSON.stringify(r2)) report.nondeterministic = true
    const valid = validate(r1.output) as boolean
    if (!valid) report.schemaErrors = (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message ?? ''}`.trim())
    if (JSON.stringify(r1.output) !== JSON.stringify(tc.expected)) report.mismatch = { expected: tc.expected, actual: r1.output }
    report.ok = !report.nondeterministic && valid && !report.mismatch
    return report
  })

  const passed = abiVersion === 1 && sha256Ok !== false && cases.length > 0 && cases.every((c) => c.ok)
  return { scorer: entity.id, abiVersion, sha256Ok, checkedKind: 'wasm', notChecked, cases, passed }
}
```

- [ ] **Step 4: Run, verify PASS**

Run: `cd questionnaire-scorer/host && npx vitest run test/conformance.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Implement the CLI** `questionnaire-scorer/host/src/cli.ts`:
```ts
import { readFileSync } from 'node:fs'
import { checkScorer } from './conformance'
import type { ScorerEntity } from './types'

async function main(): Promise<void> {
  const [entityPath, wasmPath] = process.argv.slice(2)
  if (!entityPath || !wasmPath) {
    console.error('usage: scorer-conformance <entity.json> <impl.wasm>')
    process.exit(2)
  }
  const entity = JSON.parse(readFileSync(entityPath, 'utf8')) as ScorerEntity
  const wasm = new Uint8Array(readFileSync(wasmPath))
  const report = await checkScorer(entity, { wasm })
  for (const c of report.cases) {
    console.log(`  [${c.ok ? 'PASS' : 'FAIL'}] case ${c.index}${c.name ? ` (${c.name})` : ''}`)
    if (c.envelopeError) console.log(`        envelope error: ${c.envelopeError}`)
    for (const e of c.schemaErrors) console.log(`        schema: ${e}`)
    if (c.mismatch) console.log(`        mismatch: expected ${JSON.stringify(c.mismatch.expected)} got ${JSON.stringify(c.mismatch.actual)}`)
    if (c.nondeterministic) console.log('        non-deterministic output')
  }
  console.log(`${report.scorer}: ABI v${report.abiVersion}, sha256 ${report.sha256Ok === null ? 'n/a' : report.sha256Ok}, ${report.passed ? 'CONFORMANT' : 'NON-CONFORMANT'}`)
  if (report.notChecked.length) console.log(`  (not checked: ${report.notChecked.join(', ')})`)
  process.exit(report.passed ? 0 : 1)
}

void main()
```

- [ ] **Step 6: Build + CLI smoke**

Run:
```bash
cd questionnaire-scorer/host && npm run build
node dist/cli.js ../../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json ../dist-wasm/phq9.wasm; echo "exit=$?"
```
Expected: prints two PASS lines + `scr_phq9: ABI v1, sha256 true, CONFORMANT` + `(not checked: http, python)`; `exit=0`.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add questionnaire-scorer/host/src/conformance.ts questionnaire-scorer/host/src/cli.ts questionnaire-scorer/host/test/conformance.test.ts
git commit -m "feat(scorer): conformance runner (checkScorer + Ajv) + scorer-conformance CLI"
```

---

## Task 6: ABI doc, README, FOLLOWUPS + final verification

**Files:** Create `questionnaire-scorer/ABI.md`, `questionnaire-scorer/README.md`, `questionnaire-scorer/FOLLOWUPS.md`.

- [ ] **Step 1: `questionnaire-scorer/ABI.md`** — the normative ABI (write exactly this):
```markdown
# Scorer WASM ABI — v1 (normative)

A Scorer implementation is a WebAssembly module that takes a JSON input and returns a
JSON output envelope. It imports **nothing** (instantiable with an empty import object)
and is **deterministic** (same input bytes → identical output bytes; no clocks/randomness).

## Exports

| Export | Signature | Meaning |
|---|---|---|
| `memory` | linear memory | shared address space |
| `scorer_abi_version` | `() -> i32` | the ABI version; **`1`** for this spec |
| `scorer_alloc` | `(len: i32) -> i32` | allocate `len` bytes; the host writes the input JSON there |
| `scorer_dealloc` | `(ptr: i32, len: i32) -> ()` | free a buffer of exactly `len` bytes returned by `scorer_alloc` |
| `scorer_score` | `(in_ptr: i32, in_len: i32) -> i32` | score the UTF-8 JSON at `[in_ptr, in_ptr+in_len)`; return `out_ptr` |

## Return protocol

`scorer_score` returns `out_ptr` to a **length-prefixed** buffer in `memory`:
`[u32 little-endian length N][N bytes of UTF-8 JSON]`. The host reads `N`, then the JSON,
then frees the buffer with `scorer_dealloc(out_ptr, 4 + N)`. The host also frees the input
buffer with `scorer_dealloc(in_ptr, in_len)`.

## Result envelope

The returned JSON is exactly one of:

- `{ "ok": true, "output": <value> }` — `output` MUST conform to the Scorer entity's `output_schema`.
- `{ "ok": false, "error": "<message>" }` — for malformed/invalid input.

A conformant scorer **never traps** on bad input; it returns `ok:false`. (A trap is a conformance failure.)

## Authoring (Rust)

Depend on `scorer-abi`, write `fn score(&serde_json::Value) -> Result<Value, String>`, and
emit the exports with `scorer_abi::scorer!(score);`. Build a `cdylib` for
`wasm32-unknown-unknown` (no `wasm-bindgen`). Any language that targets core wasm and
implements the five exports above is conformant.

## Conformance

`scorer-conformance <entity.json> <impl.wasm>` checks: ABI version `== 1`; the binary's
sha256 matches the entity's declared `wasm` impl sha256; every `test_case` returns
`ok:true`, validates against `output_schema`, and deep-equals `expected`; and outputs are
deterministic across repeated runs.
```

- [ ] **Step 2: `questionnaire-scorer/README.md`** — quickstart:
```markdown
# questionnaire-scorer (OD-16 sub-project 1)

The Scorer execution core + conformance runner. See `ABI.md` for the normative WASM Scorer ABI.

- `abi/` — `scorer-abi` Rust crate (ABI plumbing + `scorer!` macro).
- `scorers/phq9/` — the reference PHQ-9 scorer (Rust → `dist-wasm/phq9.wasm`).
- `host/` — TS host (`compileScorer`/`runScorer`) + the conformance runner + the `scorer-conformance` CLI.

## Build + test

    . "$HOME/.cargo/env"
    cargo test                                   # scorer-abi + phq9 unit tests
    node scripts/build-phq9.mjs                  # build dist-wasm/phq9.wasm + sync scr_phq9.json sha256
    cd host && npm install && npm test           # host + conformance (vitest)

## Run the conformance CLI

    cd host && npm run build
    node dist/cli.js \
      ../../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json \
      ../dist-wasm/phq9.wasm

## Scope

Sub-project 1 of OD-16: the engine + conformance runner only. Live `score(id)` in the Web
Viewer (replacing `nullResolver`), the two-trigger model, Schema 6 `scorer_outputs`
persistence, and server-side `http`/`python`/`r` execution are sub-projects 2 & 3.
```

- [ ] **Step 3: `questionnaire-scorer/FOLLOWUPS.md`**:
```markdown
# Follow-ups

- **Executors:** only the `wasm` executor exists. Add `http`/`python`/`r` executors (sub-project 3); the conformance runner reports other kinds as `not_checked`.
- **Reference scorers:** only PHQ-9. Add GAD-7 / PSS-10 / a Solution-bearing example as the Scorer library grows.
- **Cross-impl agreement:** when a Scorer ships >1 impl kind, the runner should assert all kinds agree on every test case (determinism across kinds).
- **Library publish gate:** wire `checkScorer` into Library ingestion so a Scorer entity cannot publish unless its declared impls are conformant (sub-project 3).
- **Reproducible builds:** `phq9.wasm`'s sha256 is kept in sync by the build script rather than via a reproducible toolchain; revisit if drift becomes a problem.
- **npm publish:** `@behaverse/questionnaire-scorer` is local-only; publish at the deferred repo split.
```

- [ ] **Step 4: Full verification**

Run:
```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
bash -c '. "$HOME/.cargo/env" && cd questionnaire-scorer && cargo test'      # abi + phq9 unit tests pass
( cd questionnaire-scorer/host && npm test )                                 # pretest builds wasm; host+conformance pass
source .venv/bin/activate && python tools/validate_schemas.py 2>&1 | tail -2 # examples still valid
```
Expected: cargo tests pass; host tests pass; schema examples still valid.

- [ ] **Step 5: Commit + finish branch**

```bash
git add questionnaire-scorer/ABI.md questionnaire-scorer/README.md questionnaire-scorer/FOLLOWUPS.md
git commit -m "docs(scorer): normative ABI.md + README + FOLLOWUPS"
```
Then use the `superpowers:finishing-a-development-branch` skill to merge `scorer-conformance-runner` → `master` locally + push (no PRs).

---

## Self-review checklist (completed by the plan author)

- **Spec coverage:** ABI doc (T6/§2) ✓; `scorer-abi` plumbing + macro (T1) ✓; PHQ-9 reference scorer matching the real `output_schema`/`test_cases` (T2) ✓; build + sha256 sync (T3/§9) ✓; TS host `compileScorer`/`runScorer` (T4) ✓; conformance runner + `output_schema`(Ajv) + `test_cases` + determinism + sha256 + executor `notChecked` (T5/§6) ✓; CLI (T5) ✓; README/FOLLOWUPS (T6) ✓; standalone, no viewer/VS changes ✓.
- **Placeholder scan:** every step has complete code/commands; the only conditional is the documented `std`→`no_std` fallback flag in T3 (report-first, not a silent placeholder).
- **Type/name consistency:** `scorer_abi_version/alloc/dealloc/score` identical across ABI.md, the macro (T1), and the host `ScorerExports` (T4); `ScorerEntity/ScorerResult/CaseReport/ConformanceReport` defined in T4 `types.ts` and consumed unchanged in T5; `checkScorer(entity, {wasm})` signature identical in T5 impl, its test, and the CLI; the length-prefixed return + `{ok,output}`/`{ok,error}` envelope identical in `abi` (T1), the host reader (T4), and ABI.md (T6).
```

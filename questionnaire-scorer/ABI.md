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

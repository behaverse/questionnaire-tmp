# questionnaire-expression-evaluator

The **OD-11 reference evaluator** for the questionnaire `Expression` language: a single, deterministic module that every viewer embeds so that logic, validation, and scoring expressions evaluate **identically** across the Web Viewer (via wasm-bindgen), the Native Viewer (Godot, via a thin C-ABI wrapper), and the Editor preview (via wasmer-python). There is no second implementation to drift against — the cross-viewer contract is *"produces this module's output,"* not *"matches a hand-written spec."*

The normative grammar this module implements is documented in [`design/15_expression_language.md`](../design/15_expression_language.md). The role it plays in the viewer family is described in [`design/08_viewer.md`](../design/08_viewer.md) §"Reference evaluator".

## Workspace layout

```
questionnaire-expression-evaluator/
├── core/              # pure Rust crate (no wasm deps) — lexer → parser → evaluator + helpers
│   ├── src/lib.rs     # public API: compile / evaluate / condition + reversed_value / compare_solution
│   ├── src/{lexer,parser,ast,eval,value,helpers}.rs
│   └── tests/vectors.rs        # runs test_vectors.json on the host
├── web/               # wasm-bindgen package
│   ├── src/lib.rs              # JS-facing surface (evaluate_condition / check_expression / reversed / compare)
│   └── tests/vectors.test.ts   # runs test_vectors.json through the compiled WASM (vitest)
└── test_vectors.json  # the normative cross-viewer regression harness
```

## Build & test

All commands assume the Cargo environment is on PATH:

```bash
. "$HOME/.cargo/env"

# Host crate (lexer/parser/evaluator + helpers, plus the host-side vector run)
cargo test -p questionnaire-expr-core

# Confirm the core crate compiles to WASM
cargo build -p questionnaire-expr-core --target wasm32-unknown-unknown

# Build the wasm-bindgen package and run the cross-viewer vectors through compiled WASM
cd web && wasm-pack build --target nodejs --out-dir pkg && npm install && npm test
```

## Public API

From the `core/` crate (`questionnaire_expr_core`):

| Symbol | Purpose |
|---|---|
| `compile(expr) -> Result<Program, ParseError>` | Parse + enforce the 1024-char cap. Parsing is total. |
| `evaluate(program, bindings) -> Value` | Evaluate to a value; never panics — failures funnel to `Value::Null`. |
| `condition(program, bindings) -> bool` | Hot path for rules: only `Bool(true)` → `true`; everything else → `false` (OD-16 null-is-false). |
| `reversed_value(value, min, max) -> f64` | `max + min − value` (05b §4.1). |
| `compare_solution(comparator, response, expected) -> bool` | Per-item correctness: `Equals` / `SetEquals` / `MatchesRegex` (unanchored) (05b §4.3). |
| `Bindings` trait | Host implements `var(id)` (bare lookup, may fall through answers→scores) and `score(id)` (explicit). |
| `Value`, `Comparator`, `ParseError` | Value lattice, comparator enum, parse-error type. |

The `web/` package re-exposes this for JS: `evaluate_condition(expr, bindings)`, `check_expression(expr)` (authoring-time validation), `reversed(value, min, max)`, and `compare(cmp, response, expected)`.

## Grammar

See [`design/15_expression_language.md`](../design/15_expression_language.md) — the normative grammar, value lattice, function set, determinism rules, error model, and scoring helpers. This README does not restate the grammar; the design doc is authoritative.

## Cross-viewer contract

[`test_vectors.json`](test_vectors.json) is the normative regression harness. It is run identically by the Rust host tests and by the WASM/vitest binding; the same vectors producing the same outputs across both is what OD-11's "single binary, identical evaluation" means operationally. A new viewer or host binding conforms by passing these vectors against the shipped WASM module.

## Deferred bindings

The Godot C-ABI wrapper and the Editor wasmer-python binding are built when those components exist; they bind the *same* `core/` crate so they inherit identical semantics by construction. See [`FOLLOWUPS.md`](FOLLOWUPS.md).

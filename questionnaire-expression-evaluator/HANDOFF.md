# Expression Evaluator — Handoff

**Path:** `questionnaire-expression-evaluator/` · **Stack:** Rust (`core/`) → WASM via wasm-bindgen (`web/`) · **Status:** ✅ built + merged (24 Rust + 31 WASM tests) · **Suggested branch:** `work/expression-evaluator`

> The OD-11 *reference* evaluator for the questionnaire `Expression` language: one deterministic module that every viewer + the Editor embed so logic / validation / scoring expressions evaluate **identically** everywhere. The cross-viewer contract is "produces this module's output," not "matches a hand-written spec" — so there is no second implementation to drift against.
> For deep detail see [README.md](README.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md).

## What it is
- **`core/` — pure Rust crate** (`questionnaire_expr_core`, no wasm deps): lexer → parser → deterministic evaluator + a `Value` lattice + scoring helpers. Public API: `compile(expr)→Program` (parse + 1024-char cap; parsing is total), `evaluate(program, bindings)→Value` (never panics — failures funnel to sentinel `Value::Null`), `condition(program, bindings)→bool` (rule hot path; only `Bool(true)`→true, else false — OD-16 null-is-false), `reversed_value(value,min,max)` and `compare_solution(cmp, response, expected)`. Host implements the `Bindings` trait (`var(id)` / `score(id)`).
- **`web/` — wasm-bindgen package** `@behaverse/expression-evaluator`: JS surface `evaluate_condition(expr, bindings)`, `check_expression(expr)` (authoring-time validation), `reversed(value,min,max)`, `compare(cmp, response, expected)`.
- **Function set:** `length` / `is_empty` / `not_empty` / `count` / `contains` / `score`; helpers `reversed_value` + `compare_solution` (`Equals` / `SetEquals` / `MatchesRegex` unanchored).
- **`test_vectors.json`** is the normative cross-viewer regression harness — run *identically* by the Rust host tests and through the compiled WASM (vitest). Same vectors → same outputs across both is what OD-11's "single binary, identical evaluation" means operationally.
- **Consumers:** the Web Viewer drives `show_if` / branching / validation / scoring through this crate; the Editor preview embeds the same WASM for live evaluation + inline expression linting.

## Run & test
Both require the Rust toolchain; building the WASM also needs `wasm-pack`. Always source the Cargo env first.

```bash
# Host crate (lexer/parser/evaluator + helpers + host-side vector run) — 24 tests
bash -c '. "$HOME/.cargo/env" && cd questionnaire-expression-evaluator && cargo test'

# (optional) confirm the core crate still compiles to wasm
bash -c '. "$HOME/.cargo/env" && cd questionnaire-expression-evaluator && cargo build -p questionnaire-expr-core --target wasm32-unknown-unknown'

# WASM/vitest cross-viewer vectors — 31 tests
( cd questionnaire-expression-evaluator/web && npm test )
```

If `web/pkg/` is stale or missing, rebuild it before `npm test`:
`bash -c '. "$HOME/.cargo/env" && cd questionnaire-expression-evaluator/web && wasm-pack build --target nodejs --out-dir pkg && npm install && npm test'`

## What's left to do
This component is **essentially done** (feature-complete + merged). Everything below is additive and unblocking the current viewer gate — pick up only when a concrete consumer or instrument needs it.

### Now
- _Nothing required._ The crate is the dependency; no open work blocks any consumer.

### Next (additive — no schema bump; `Expression` is an opaque string)
- **Aggregate functions** — `sum` / `min` / `max` / `round` over numeric lists. Add when a real instrument needs them. (FOLLOWUPS "Grammar / function-set extensions".)
- **WASM compile-once handle** — `web/` exposes only `evaluate_condition` (compile+evaluate per call); `core` already has `compile()→Program`. Add a thin wasm-bindgen `Program` wrapper *only if* WV-D profiling shows page-submit re-evaluation of many rules matters (expressions are ≤1024 chars, parser trivial — almost certainly negligible). (FOLLOWUPS "Integration".)
- **Build/size passes** — run `wasm-opt` on the release WASM, or revisit the `regex` crate footprint, only if the module measurably bites the Web Viewer load budget (PERF-01: <3 s on 3G). (FOLLOWUPS "Build / size".)

### Deferred / blocked
- **🔒 Godot C-ABI wrapper** — thin C-ABI over `core/` so the Native Viewer can call the same evaluator. Deferred: the Godot viewer isn't built yet (Phase 4). Binds the same crate → identical semantics by construction. (FOLLOWUPS "Bindings".)
- **🔒 Editor wasmer-python binding** — expose the WASM to the Editor via wasmer-python (CFFI). Deferred / effectively obsolete: the Editor already embeds the WASM directly (no Python consumer materialised). (FOLLOWUPS "Bindings".)
- **🔒 Publish `@behaverse/expression-evaluator`** — proper npm publish happens at the repo split (deferred; one local repo today). Consumed in-repo until then. (FOLLOWUPS "Release"; [design/14_repository_topology.md](../design/14_repository_topology.md).)
- **Date/time + locale-aware collation** — deliberately excluded from v1 for determinism (no wall-clock; Unicode code-point order only). Revisit with a fixed injectable clock / version-pinned collation table only if an instrument genuinely needs it. (FOLLOWUPS "Grammar extensions".)

## Conventions & gotchas
- **Determinism is the whole point.** Any change must keep `test_vectors.json` passing on *both* the Rust host and the compiled WASM — that pair *is* the cross-viewer contract. Add vectors for every new function/operator. Never introduce wall-clock time, locale-dependent collation, or any other non-deterministic source.
- **Never panic.** `evaluate` funnels all failures to sentinel `Value::Null`; `condition` treats anything that isn't `Bool(true)` as false (OD-16 null-is-false). Preserve this — viewers depend on it.
- **Grammar is normative in [design/15_expression_language.md](../design/15_expression_language.md)**, not in code comments or this README. Update the design doc when the language changes.
- **Rebuild `web/pkg/` after any `core/` change** before running the WASM tests / wiring a consumer — the JS side runs the *compiled* WASM, not the Rust source.
- `. "$HOME/.cargo/env"` is required for every `cargo` / `wasm-pack` invocation in this environment.
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference). `git fetch` + ff/rebase before pushing.

## References
- [README.md](README.md) · [FOLLOWUPS.md](FOLLOWUPS.md)
- [design/15_expression_language.md](../design/15_expression_language.md) — normative grammar / value lattice / function set / determinism / error model / scoring helpers
- [design/08_viewer.md](../design/08_viewer.md) §"Reference evaluator" — role in the viewer family
- [design/14_repository_topology.md](../design/14_repository_topology.md) — repo split (gates the npm publish)
- Root [HANDOFF.md](../HANDOFF.md) for system-wide context.

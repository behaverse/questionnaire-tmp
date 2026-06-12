# Follow-ups — questionnaire-expression-evaluator

Deferred work, in rough priority order. Nothing here blocks the current viewer gate; each item is additive and is picked up when a concrete consumer or instrument needs it.

## Bindings for the other viewers

- **Godot C-ABI wrapper.** A thin C-ABI surface over the `core/` crate so the Native Viewer (Godot) can call the same evaluator. Built when the Native Viewer exists. Binds the same crate → identical semantics by construction.
- **Editor wasmer-python binding.** Expose the WASM module to the Editor's preview / authoring-time validation via wasmer-python (CFFI). Built when the Editor exists. Reuses `check_expression` for inline expression linting.

## Grammar / function-set extensions (additive — no schema bump)

`Expression` is an opaque `string` in the schema, so new functions and operators are additive and require **no schema version bump**. Add only when a real instrument needs them:

- **Aggregate functions** — `sum`, `min`, `max`, `round` over numeric lists.
- **Date / time functions** — deliberately excluded from v1 for determinism. Revisit with a fixed, injectable clock (never wall-clock) if an instrument genuinely needs relative-date logic.
- **Locale-aware string collation** — v1 narrows string comparison to Unicode code-point order (the worst cross-platform determinism hazard is locale collation). Add a deterministic, version-pinned collation (e.g. a bundled ICU collation table) only when an instrument requires ordering of human-language strings.

## Build / size

- **`wasm-opt` size pass.** Run `wasm-opt` on the release WASM if the module grows large enough to affect Web Viewer load budget (PERF-01: <3 s on 3G).
- **`regex` crate WASM footprint.** The `regex` dependency (for `matches_regex`) adds to WASM size. Revisit (a smaller regex engine, or feature-gating regex) only if it measurably bites the load budget.

## Release

- **Publish `@behaverse/expression-evaluator`.** Proper npm publish of the wasm-bindgen package happens at the repo split (see [`design/14_repository_topology.md`](../design/14_repository_topology.md)). Until then it is consumed in-repo.

## Integration

- **Web Viewer wiring is WV-D.** Compiling runtime rules and driving `show_if` / branching / validation from this evaluator — plus applying `reversed_value` and `compare_solution` for `correct` — is the next Web Viewer task (WV-D). This crate is the dependency; WV-D is the consumer.
- **WASM compile-once handle (WV-D-facing):** the JS surface exposes only `evaluate_condition(expr, …)` (compile+evaluate each call); the Rust `core` has `compile()→Program` for reuse but `web/` does not yet expose a reusable compiled-`Program` handle. Expressions are ≤1024 chars and the parser is trivial, so per-call recompilation is almost certainly negligible — but if WV-D profiling shows page-submit re-evaluation of many rules matters, add a thin wasm-bindgen `Program` wrapper (additive).

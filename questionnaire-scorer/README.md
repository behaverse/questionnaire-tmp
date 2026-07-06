# questionnaire-scorer (OD-16)

The Scorer execution core + conformance runner. See `ABI.md` for the normative WASM Scorer ABI.

- `abi/` — `scorer-abi` Rust crate (ABI plumbing + `scorer!` macro).
- `scorers/phq9/` — the reference PHQ-9 scorer (Rust → `dist-wasm/phq9.wasm`).
- `host/` — TS host (`compileScorer`/`runScorer`) + the conformance runner + the `scorer-conformance` CLI.
- `engine/` — `scorer-engine`: reusable data-driven scoring logic.
- `specs/<id>.json` + `scripts/build-scorer.mjs` — declarative per-instrument specs compiled to `dist-wasm/<id>.wasm` + `dist-entities/scr_<id>.json` (158 scorers). See `SCORERS.md`.

## Build + test

    . "$HOME/.cargo/env"
    cargo test                                   # scorer-abi + phq9 unit tests
    node scripts/build-phq9.mjs                  # build dist-wasm/phq9.wasm + sync scr_phq9.json sha256
    node scripts/build-scorer.mjs <id>           # build any spec-driven scorer
    cd host && npm install && npm test           # host + conformance (vitest)

## Run the conformance CLI

    cd host && npm run build
    node dist/cli.js \
      ../../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json \
      ../dist-wasm/phq9.wasm

## Scope

Execution core + conformance runner + data-driven engine (158 scorers live). Live `score(id)`,
two-trigger display, and Schema-6 `scorer_outputs` shipped (SP2a/b). Deferred: server-side
`http`/`python`/`r` executors (SP3).

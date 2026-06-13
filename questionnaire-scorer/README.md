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

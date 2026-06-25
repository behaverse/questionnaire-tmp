# questionnaire-scorer — Handoff

**Path:** `questionnaire-scorer/` · **Stack:** Rust → wasm (scorer impls) + TypeScript host/runner · **Status:** ✅ built + merged (OD-16 SP1) · **Suggested branch:** `work/scorer`

> The Scorer execution core and conformance runner for OD-16 scoring: a normative raw-wasm **Scorer ABI v1**, a reference **PHQ-9** scorer, a TS host that compiles + runs scorers, and a `scorer-conformance` CLI. The Web Viewer (SP2a/b) and the Editor (ED-D4b) run scorers through this same host.
> For deep detail see [README.md](README.md) and the normative [ABI.md](ABI.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md).

## What it is
- **ABI v1 ([ABI.md](ABI.md), normative).** A Scorer is a wasm module that imports nothing and is deterministic; exports `memory`, `scorer_abi_version`, `scorer_alloc`, `scorer_dealloc`, `scorer_score`. Returns a length-prefixed UTF-8 JSON envelope `{ok:true,output}` or `{ok:false,error}`; never traps on bad input.
- **`abi/`** — `scorer-abi` Rust crate: ABI plumbing + the `scorer!(score)` macro. Authors write `fn score(&Value) -> Result<Value,String>` and build a `cdylib` for `wasm32-unknown-unknown` (no wasm-bindgen).
- **`scorers/phq9/`** — the reference PHQ-9 scorer (Rust), built to `dist-wasm/phq9.wasm` by `scripts/build-phq9.mjs` (the build script also syncs the sha256 into `scr_phq9.json`).
- **`host/`** — TS host: `compileScorer`/`runScorer` ([host/src/runScorer.ts](host/src/runScorer.ts)), the conformance runner ([host/src/conformance.ts](host/src/conformance.ts), `checkScorer`), and the `scorer-conformance` CLI ([host/src/cli.ts](host/src/cli.ts)).
- **Conformance checks:** sha256 match → ABI version `==1` → every `test_case` returns `ok:true` + validates against `output_schema` + deep-equals `expected` → determinism across repeated runs. Non-`wasm` impl kinds are reported `not_checked`.

## Run & test
    # Rust (scorer-abi + phq9 unit tests; 9)
    bash -c '. "$HOME/.cargo/env" && cd questionnaire-scorer && cargo test'

    # Host + conformance (6; the npm `pretest` rebuilds dist-wasm/phq9.wasm first)
    ( cd questionnaire-scorer/host && npm install && npm test )

    # Conformance CLI against the PHQ-9 entity + binary
    ( cd questionnaire-scorer/host && npm run build && \
      node dist/cli.js \
        ../../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json \
        ../dist-wasm/phq9.wasm )

Gotchas: `source $HOME/.cargo/env` first (cargo + the `wasm32-unknown-unknown` target). The wasm binary lives in `dist-wasm/` and must be rebuilt (`node scripts/build-phq9.mjs`, or just `npm test` which runs it as `pretest`) whenever `scorers/phq9` changes, or its sha256 drifts from `scr_phq9.json` and conformance fails.

## What's left to do
This component (OD-16 SP1) is feature-complete and merged. Live `score(id)` in the Web Viewer, the two-trigger model, and Schema 6 `scorer_outputs` persistence were delivered separately (SP2a/b, ED-D4b). The remaining items are SP3 and library growth.

**Now** — none required; the engine + runner are done.

**Next**
- **More reference scorers.** Only PHQ-9 exists. Add GAD-7 / PSS-10 / a Solution-bearing example — useful conformance fixtures as the Scorer library grows. ([FOLLOWUPS.md](FOLLOWUPS.md))
- **External Scorer SDKs.** Document/scaffold authoring scorers in languages other than Rust against ABI v1 (any core-wasm target implementing the five exports is conformant — see [ABI.md](ABI.md)).
- **Cross-impl agreement.** When a Scorer ships >1 impl kind, have the runner assert all kinds deep-equal on every test case. ([FOLLOWUPS.md](FOLLOWUPS.md))

**Deferred / blocked (OD-16 SP3)**
- 🔒 **Server-side executors** (Behaverse-side). Only the `wasm`/browser executor exists; add `http`/`python`/`r` executors (the runner currently reports these `not_checked`). ([FOLLOWUPS.md](FOLLOWUPS.md))
- 🔒 **Forward `scorer_outputs` to Behaverse.** Server-side persistence/forwarding of scorer outputs (depends on SP3 executors + Behaverse sink).
- 🔒 **Library scorer-artifact storage + publish gate.** Wire `checkScorer` into Library ingestion so a Scorer cannot publish unless its declared impls are conformant; the schema validator currently SKIPs with "runner not yet implemented" — that is the hook. ([FOLLOWUPS.md](FOLLOWUPS.md))
- **Reproducible builds.** `phq9.wasm`'s sha256 is kept in sync by the build script, not a reproducible toolchain — revisit if drift becomes a problem. ([FOLLOWUPS.md](FOLLOWUPS.md))
- **npm publish.** `@behaverse/questionnaire-scorer` is local-only; publish at the deferred repo split. ([FOLLOWUPS.md](FOLLOWUPS.md))

## Conventions & gotchas
- **ABI v1 is normative** ([ABI.md](ABI.md)). Don't change exports/return protocol without bumping the version; the host and the conformance CLI both assert `scorer_abi_version() == 1`.
- A conformant scorer **never traps** on bad input and **ignores unrecognised `scored_responses` keys** (select only the prompt ids it scores; treat its own absent keys as missing).
- After any Rust change, **rebuild the wasm** so its sha256 re-syncs into `scr_phq9.json` — otherwise conformance fails on the hash check.
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing (the harvester agent shares this checkout).

## References
- [README.md](README.md) · [ABI.md](ABI.md) (normative) · [FOLLOWUPS.md](FOLLOWUPS.md)
- PHQ-9 entity fixture: `../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json`
- Consumers: Web Viewer scoring (SP2a/b) and Editor live score preview (ED-D4b) run scorers via this host.
- Root [HANDOFF.md](../HANDOFF.md) for system-wide context.

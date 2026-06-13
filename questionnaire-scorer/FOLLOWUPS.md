# Follow-ups

- **Executors:** only the `wasm` executor exists. Add `http`/`python`/`r` executors (sub-project 3); the conformance runner reports other kinds as `not_checked`.
- **Reference scorers:** only PHQ-9. Add GAD-7 / PSS-10 / a Solution-bearing example as the Scorer library grows.
- **Cross-impl agreement:** when a Scorer ships >1 impl kind, the runner should assert all kinds agree on every test case (determinism across kinds).
- **Library publish gate:** wire `checkScorer` into Library ingestion so a Scorer entity cannot publish unless its declared impls are conformant (sub-project 3). (The schema validator currently SKIPs scorer conformance with "runner not yet implemented" — that is the hook.)
- **Reproducible builds:** `phq9.wasm`'s sha256 is kept in sync by the build script rather than via a reproducible toolchain; revisit if drift becomes a problem.
- **npm publish:** `@behaverse/questionnaire-scorer` is local-only; publish at the deferred repo split.

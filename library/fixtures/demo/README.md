# Demo content (richer questionnaire for the live demo)

A self-contained, **EN-only** six-item questionnaire — **`qst_wellbeing@v26.0601`** ("Wellbeing
check-in") — for demoing the participant flow with something more substantial than the one-item
`qst_min` test fixture. Six prompts (`pr_wb_*`) + one questionnaire; options are inline (a 5-point
agreement scale); no scores.

This lives **outside** `library/tests/fixtures/` on purpose, so it is **not** ingested by the test
suite (which asserts on the qst_min fixture) — it is demo seed data only.

## Seed it

Into a running Library (uses `DATABASE_URL`):

```bash
DATABASE_URL=postgresql://localhost/library library ingest library/fixtures/demo --release v26.0601
```

It then appears in the Library catalogue (domain `wellbeing`), is launchable via library-web's
**Try it**, and the VS preview endpoint renders it. To list it in the participant-app catalogue,
create a deployment of `qst_wellbeing@v26.0601` (see `docs/testing-participant-flow.md`).

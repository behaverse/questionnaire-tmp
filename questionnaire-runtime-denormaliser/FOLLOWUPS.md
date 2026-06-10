# Follow-ups — questionnaire-runtime-denormaliser

Deferred / out-of-scope work discovered while building the denormaliser.

- **Complete the canonical example entity set + regenerate runtime examples.**
  The canonical Schema 2 examples (`schemas/questionnaire/examples/{minimal,phq9,kitchensink}.json`)
  reference ~14 reusable entities that don't exist in `schemas/questionnaire/examples/library_examples/`
  (e.g. `pr_feel_good`, `pr_phq9_2..9`, and kitchensink's `pr_essay`/`pr_mood`/`pr_name`/`pr_topics`/`pr_year_born`).
  They pass `tools/tests` only because JSON Schema checks ref *format*, not resolvability.
  Author the missing entities, then regenerate `schemas/runtime/examples/*.json` from real denormaliser output.

- **Cycle detection in ref resolution.** v1 assumes the entity graph is acyclic
  (guaranteed by hard-pinning, OD-06). A malformed cyclic input would recurse until
  Python's recursion limit. Add an explicit visited-set guard if untrusted inputs become possible.

- **Expand the internal strict runtime schema.** Currently a lightweight tightening
  (requires top-level `locale`; scores require `impl`). Could be expanded to fully
  validate the faithful-projection option/item shapes once the Web Viewer pins the contract.

- **Behavioural-channel reconciliation.** Vacuous for questionnaire input (Schema 2 carries
  no channel declarations). Revisit when cognitive-task inputs (which may declare channels) arrive.

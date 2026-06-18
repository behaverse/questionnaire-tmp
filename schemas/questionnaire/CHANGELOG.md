# Changelog

This schema uses Calendar Versioning (`vYY.MMDD`) per the [Behaverse schemas policy](https://behaverse.org/schemas/#versioning).

## [v26.0618] — 2026-06-18

### Added (severity: additive)

- **Option slider display fields** — `min_label`, `max_label`, `center_label` (strings) and `initial_value` (number) on every Option. They describe a `number` option's endpoints / initial handle; a viewer renders a `number` option carrying `min_label`/`max_label` as a slider (no `slider` input_data_type). Existing instances stay valid.
- **Unlabeled ordinal choices** — `OptionChoiceContent.text` is now optional, so an ordinal scale may label only some choices (e.g. endpoints). Convention: nominal scales should still label every choice.
- **Option-order randomization** — `Option.randomize` (boolean) requests that a viewer shuffle this option's choice order at presentation; source order and scores are stored verbatim. Maps PsyToolkit `o: random`. Existing instances stay valid.

**Severity:** `additive`.

## [v26.0609] — 2026-06-09

### Changed (severity: breaking)

- **Retargeted the embedded Instrument Metadata `$ref`** from `instrument/v26.0528` to `instrument/v26.0609`. This adopts the optional `instrument_id` + `variant` fields AND the `authors`→`author` rename that Schema 1 made at v26.0605. Questionnaire instances must now use `author` (singular); imported `survey_db` content emits no author field and is unaffected.
- Property URIs otherwise stable.

**Severity:** `breaking` (the `authors`→`author` rename propagates to Schema 2).

## [v26.0602] — 2026-06-02

### Changed (severity: breaking — per OD-16 resolved 2026-06-02)

- **Scoring runtime semantics pivoted to external Scorer entity.** Schema 2 no longer carries an in-JSON formula language for scoring. A new procedural Library entity `Scorer` (`scr_*`) owns the procedure; the Questionnaire declares scores by id via `scores[]: { id, scorer, path, name?, description? }` referencing JSON Pointer paths into the Scorer's structured output.
- **`ScoringDef` removed** — replaced by `scores[]` entries referencing a Scorer.
- **`InterpretationBand` removed** — bands live inside the Scorer's `output_schema`.
- **`Subscale` shape narrowed** — entity now carries only `id`, `name`, `description`, `content`. `prompt_ids` and `weight_per_prompt` removed.
- **Subscale membership moved to the Prompt** — `Prompt.subscales: string[]` (multi-valued, references `scl_*` ids).
- **Questionnaire's top-level `subscales[]` block removed** — Subscale entities still exist in the Library; the Questionnaire just doesn't enumerate them.
- **New top-level `scores[]`** — array of `Score` entries.
- **New top-level `lock_show_score_timing: boolean`** — default `false`; when `true`, deployments cannot override the canonical show-score timing per OD-16 §4.4.
- **Cross-schema `$ref` to Schema 1 v26.0528 unchanged.**

### Added
- `$defs.Scorer` — versioned scoring procedure with inputs schema, output schema, implementations (WASM/HTTP/Python/R), and test cases.
- `$defs.ScorerImplementation` — implementation reference with `kind` discriminator.
- `$defs.ScorerTestCase` — input/expected pair for conformance testing.
- `$defs.Score` — JSON Pointer reference into a Scorer's output.
- `examples/library_examples/subscales/` and `examples/library_examples/scorers/` directories with at least one example each.
- Validator extension `check_score_paths` (publish-time gate) and `check_scorer_conformance` (stub for future implementation).

### Migrated
- v26.0601 `ScoringDef` entries → v26.0602 `scores[]` entries (each `ScoringDef` maps to one or more `Score` entries plus a new Scorer entity).
- v26.0601 `InterpretationBand` entries → fields in the corresponding Scorer's `output_schema`.
- v26.0601 `Subscale.prompt_ids` → `Prompt.subscales[]` on each referenced Prompt.
- v26.0601 `Subscale.weight_per_prompt` → encoded in the Scorer implementation (not in the schema).

### Deferred
- Scorer conformance-test execution against live implementations (validator currently stubs with `SKIPPED`).
- Composite-scorer batteries combining outputs across instruments (single-instrument scorers ship in this version; cross-instrument composites are a future use case enabled by the contract).

**Severity:** `breaking` (analytically distinct from v26.0601).

## [v26.0601] — 2026-06-01

### Changed (severity: breaking — per OD-15 resolved 2026-05-31)

- **Reusable-entity model pivoted to align with the legacy survey_database catalogue.** Eleven reusable entity types in two categories:
  - Content-bearing: Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx
  - Ref-binding: Question, Item, Solution
- **Item** = Question + Option (saved `it_*` or inline on Page elements). New entity.
- **Question** redefined as Prompt + optional Context + optional Instruction (refs-only). No polymorphic widget types.
- **Option** carries structural fields (`input_data_type`, `measurement_type`, `selection`, `min`/`max`/`step`, per-choice `value`/`index`) at the top level plus translatable text inside `content`.
- **UI input widget** derived from Option's `(input_data_type, measurement_type, selection)` triple — not declared on the question.
- **Content** model: all content-bearing entities use `content.{lang} = { status, ...fields }` instead of v26.0528's `text` + `translations` split.
- **Page** `entries[]` renamed to `elements[]`. Heterogeneous: Section / Message ref / saved Item ref + overrides / inline Item.
- **Section** carries `shared_option` for matrix layouts; inner Items inherit.
- **Construct** on Prompt; **Dimension** on Prompt + Option (same concept, typically matching).
- **Reversed** on Prompt; scoring applies `value' = max + min − value`.
- **Solution** new entity (`sol_*`) for correct-answer Items.
- **Five new entity types** (Message, Context, Placeholder, Help, RegEx) — were missing from v26.0528.

### Migrated
- Legacy `Prompt.dimension` migrates 1:1 to new `Prompt.dimension`.
- New `Prompt.construct` left blank by importer for human curation.
- Legacy `aiss_q_1` (composition row) → `it_aiss_q_1` (Item).

### Deferred to future Scoring OD
- Subscale auto-derivation from `construct`
- `reversed` auto-application in scoring aggregation
- Item-level / questionnaire-level scoring rules

**Severity:** `breaking` (analytically distinct from v26.0528).

## [v26.0528] — 2026-05-28

### Added

- Initial version of the Questionnaire Definition schema.
- Top-level required: `metadata`, `pages`.
- `metadata` field embeds Schema 1 (Instrument) via cross-schema `$ref`, narrowed to `qst_*` id prefix.
- `Page`, `Section`, `Block`, `Subscale` $defs with their relationships (Page contains Section + Question; Block references PageIds; Subscale references QuestionIds; Section cannot nest; Section cannot span pages).
- Discriminated `oneOf` Question polymorphism: `QuestionRadio`, `QuestionCheckbox`, `QuestionSlider`, `QuestionText`, `QuestionTextarea`, `QuestionRanking`, `QuestionDate`, `QuestionFile`, `QuestionDisplay`, plus `QuestionExtension` (IRI types).
- Library-reference $defs: `QuestionReference`, `OptionSetReference`, `InstructionReference`, `PromptReference`. OD-05 overridability enforced via `additionalProperties: false`.
- Reference field name: `ref` (not `$ref`).
- `Expression` $def (string; WASM evaluator owns parsing).
- `Style` (cascading) + `FlowInstrument` (root-only) + `max_time_seconds` on Page.
- `LogicRule`, `ScoringDef` + `InterpretationBand`, `PerQuestionValidation`, `CrossQuestionValidationRule`.
- `InlineTranslations` with per-language status (G1) and BCP-47 language tags with hierarchical fallback.
- Hybrid `additionalProperties` policy: strict + `extensions{}` + `x_*` prefix.

**Severity:** `additive` (first published version).

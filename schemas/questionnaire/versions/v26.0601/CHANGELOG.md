# Changelog

This schema uses Calendar Versioning (`vYY.MMDD`) per the [Behaverse schemas policy](https://behaverse.org/schemas/#versioning).

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

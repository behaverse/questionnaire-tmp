# Changelog

This schema uses Calendar Versioning (`vYY.MMDD`) per the [Behaverse schemas policy](https://behaverse.org/schemas/#versioning).

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

# Schemas 5 (Response Data) + 6 (Session Metadata) Authoring Spec

**Date drafted:** 2026-06-03
**Author:** OD-17 resolution committee (grilling session 2026-06-02/03)
**Predecessor:** none — first version of both schemas.
**CalVer:** Schema 5 ships at v26.0603; Schema 6 ships at v26.0603.
**Severity:** initial (no prior version).
**Authoritative source documents:**
- [design/05_data_model.md](../../../design/05_data_model.md) §"Schema 5", §"Schema 6"
- [design/05c_bdm_alignment.md](../../../design/05c_bdm_alignment.md) — BDM deviations
- [design/05b_scoring.md](../../../design/05b_scoring.md) — Scorer entity contract (for `scorer_outputs` shape)

This spec covers two schemas in one deliverable because they're tightly coupled — Schema 6 carries the session-level identity and metadata that every Schema 5 response row refers to, and Schema 6 hosts `scorer_outputs` (per OD-17g) which is the per-session aggregate produced by Scorers whose per-item outputs land in Schema 5's `score` / `correct` columns.

Per OD-17 (resolved 2026-06-03), Schema 5 is **strict adherence** to the [BDM Response trial table](https://github.com/behaverse/data-model/blob/main/spec/trials/1-response.qmd) with three documented deviations (D1 `stimulus_id` typing; D2 no BDM home for session-level scorer outputs; D3 `session_id` naming). Schema 6 is our own design (BDM has no equivalent session-metadata table) and follows our v26.0602 vocabulary.

---

## 1 — Folder layout

```
schemas/
├── instrument/                       # Schema 1 — unchanged at v26.0528
├── questionnaire/                    # Schema 2 — unchanged at v26.0602
├── response/                         # ← NEW (Schema 5)
│   ├── schema.json                   # JSON Schema (Draft 2020-12)
│   ├── context.jsonld                # JSON-LD context
│   ├── README.md
│   ├── CHANGELOG.md
│   └── examples/
│       ├── phq9_session_responses.json   # one full session's response rows
│       ├── minimal_single_response.json  # minimal valid single response
│       └── kitchensink_responses.json    # exercises every documented field
└── session/                          # ← NEW (Schema 6)
    ├── schema.json
    ├── context.jsonld
    ├── README.md
    ├── CHANGELOG.md
    └── examples/
        ├── phq9_session.json          # full session record with scorer_outputs
        ├── minimal_session.json
        └── kitchensink_session.json
```

The pre-existing `schemas/instrument/` and `schemas/questionnaire/` directories are untouched.

---

## 2 — Conventions (unchanged from Schema 1+2)

- **JSON Schema Draft 2020-12** for both schemas.
- **`additionalProperties: false`** on project-owned objects.
- **`^x_` patternProperties + `extensions: {}`** for forward-compatible widening.
- **CalVer in `$id`**: `https://behaverse.org/schemas/response/v26.0603/schema.json`, `.../session/v26.0603/schema.json`.
- **Severity tag** on each schema (in metadata): initial release = no severity yet.
- **Cross-schema `$ref`**: Schema 5 does *not* reference Schema 6's JSON Schema directly; the relationship is by ID convention (a Response row's `session_id` references a Session record's `session_id`). Cross-validation lives in the validator (§7), not in the schema.

---

## 3 — Schema 5 (Response Data) — top-level shape

Schema 5 supports **two JSON shapes**:

1. **Single response** — one row, one JSON object. Validates against `$defs.Response`. Emitted per-row by viewers during a session (per OD-13 forwarding).
2. **Response set** — an object wrapping multiple rows for an entire session. Validates against `$defs.ResponseSet`. Used for batched offline export.

The schema's root `oneOf`s the two shapes:

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id":     "https://behaverse.org/schemas/response/v26.0603/schema.json",
  "title":   "Behaverse Response Data",
  "description": "Per OD-17, strict adherence to the BDM Response trial table with three documented deviations (see design/05c_bdm_alignment.md).",
  "oneOf": [
    { "$ref": "#/$defs/Response" },
    { "$ref": "#/$defs/ResponseSet" }
  ],
  "$defs": { ... }
}
```

### 3.1 `Response` — single row

The 60+ BDM columns mapped to JSON object properties. Required fields per BDM:

```jsonc
"Response": {
  "type": "object",
  "required": [
    "response_id",
    "agent_id",
    "session_index",
    "instrument_id",
    "multitask_type",
    "block_index",
    "block_type",
    "transformation_name",
    "trial_index",
    "trial_start_datetime",
    "stimulus_id",
    "stimulus_type"
  ],
  "properties": {
    // Key
    "response_id": {
      "type": "integer",
      "description": "Primary key, unique within a session's response set."
    },
    // Context
    "study_name":   { "type": "string" },
    "group_name":   { "type": "string" },
    "agent_id":     { "type": "string", "description": "Participant identifier." },
    "session_index":{ "type": "integer", "minimum": 1,
                      "description": "1-based per-agent ordering. Deviation from BDM session_id (D3 in 05c_bdm_alignment.md)." },
    "session_id":   { "type": "string", "format": "uuid",
                      "description": "Our project-specific UUID v4 (D3). Globally unique." },
    "activity_index":{ "type": "integer", "minimum": 1 },
    "language":     { "type": "string", "description": "BCP-47 base or full tag." },
    // Task
    "instrument_id":          { "type": "string", "pattern": "^qst_[a-z0-9_]+$" },
    "instrument_repetition":  { "type": "integer", "minimum": 0 },
    "timeline_id":            { "type": "string",
                                "description": "Our Block id (blk_…) when present (OD-17e)." },
    "timeline_repetition":    { "type": "integer", "minimum": 0 },
    "multitask_type":         { "type": "string",
                                "enum": ["", "concurrent", "compound"],
                                "description": "Empty string = no multitasking (BDM convention)." },
    "task_index":             { "type": "integer", "minimum": 1 },
    "job_type":               { "type": "string" },
    "job_description":        { "type": "string" },
    "job_repeat":             { "type": "string", "enum": ["new", "repeat", "switch"] },
    "block_index":            { "type": "integer", "minimum": 1,
                                "description": "Our Page order within the questionnaire (OD-17e). Required." },
    "block_name":             { "type": "string",
                                "description": "Our Page id (page_…) when present." },
    "block_type":             { "type": "string",
                                "enum": ["tutorial", "practice", "test", "instruction"] },
    "transformation_name":    { "type": "string",
                                "description": "Required by BDM; default 'identity' for questionnaires." },
    "trial_index":            { "type": "string",
                                "description": "Item order within Page. BDM uses 'id' type." },
    "episode_index":          { "type": "integer", "minimum": 1 },
    "trial_start_datetime":   { "type": "string", "format": "date-time" },
    "trial_seed":             { "type": "integer" },
    // Stimulus
    "stimulus_index":         { "type": "array", "items": { "type": "integer" } },
    "stimulus_id":            { "type": "string",
                                "description": "Synthetic id concatenating Question-side entity ids. D1 deviation: string instead of BDM integer." },
    "stimulus_type":          { "type": "string",
                                "enum": ["text", "image", "audio", "video", "instruction", "composite"] },
    "stimulus_onset":         { "type": "number", "description": "Seconds from trial start." },
    "stimulus_panel_count":   { "type": "integer", "minimum": 1 },
    "stimulus_structure":     { "type": "string" },
    "stimulus_structure_source_type": { "type": "string" },
    "stimulus_structure_source":      { "type": "string" },
    "stimulus_set_size":      { "type": "integer", "minimum": 0 },
    "stimulus_count":         { "type": "integer", "minimum": 0 },
    "stimulus_source_type":   { "type": "string" },
    "stimulus_source":        { "type": "string" },
    "stimulus_index_in_source":{ "type": "integer" },
    "stimulus_position_index": { "type": "integer" },
    "stimulus_description":   { "type": "string",
                                "description": "Concatenated text of Context + Instruction + Prompt in active locale (or Message text for Message rows)." },
    "stimulus_role":          { "type": "string" },
    // Option
    "option_source_type":     { "type": "string" },
    "option_source":          { "type": "string" },
    "option_count":           { "type": "integer", "minimum": 0 },
    "option_id":              { "type": "string",
                                "description": "Our Option id (opt_…). Note: BDM types this integer; we deviate." },
    "option_data_type":       { "type": "string",
                                "enum": ["choice", "number", "text"] },
    "measurement_type":       { "type": "string",
                                "enum": ["nominal", "ordinal", "interval", "ratio"] },
    // Input
    "input_interface_type":   { "type": "string" },
    "input_action_type":      { "type": "string" },
    "input_count":            { "type": "integer", "minimum": 0 },
    // Expectation
    "expected_response_option_index":  { "type": "integer" },
    "expected_response_description":   { "type": "string" },
    // Response
    "response_structure":     { "type": "string" },
    "response_count":         { "type": "integer", "minimum": 0 },
    "response_option_index":  { "type": "integer" },
    "response_description":   { "type": "string" },
    "response_numeric":       { "type": "number" },
    "response_time":          { "type": "number",
                                "description": "Milliseconds from stimulus onset to response submission." },
    "response_datetime":      { "type": "string", "format": "date-time" },
    "response_validation_time": { "type": "number" },
    "response_initiation_time": { "type": "number" },
    "response_skipped":       { "type": "boolean" },
    "timed_out":              { "type": "boolean" },
    // Evaluation
    "accuracy":               { "type": "number" },
    "correct":                { "type": "boolean",
                                "description": "Per OD-16 16c: present only when Item has a Solution. Omitted otherwise." },
    "score":                  { "type": "number",
                                "description": "Per OD-16 16a: per-item scored_value (post-reversal applied)." },
    "evaluation_label":       { "type": "string" },
    // Feedback
    "feedback_description":   { "type": "string" },
    // Outcome
    "outcome_description":    { "type": "string" },
    "outcome_numeric":        { "type": "number" },
    // Accessory
    "additional_measures":    { "type": "string",
                                "description": "JSON-stringified extras. Project use: optional Item id for joins." },
    // Project extensions
    "extensions":             { "type": "object" }
  },
  "additionalProperties": false,
  "patternProperties": {
    "^x_": {}
  }
}
```

### 3.2 `ResponseSet` — batched session emission

```jsonc
"ResponseSet": {
  "type": "object",
  "required": ["session_id", "responses"],
  "properties": {
    "session_id": { "type": "string", "format": "uuid",
                    "description": "Our UUID v4 — matches the Session record (Schema 6)." },
    "responses":  {
      "type": "array",
      "items": { "$ref": "#/$defs/Response" }
    }
  },
  "additionalProperties": false,
  "patternProperties": {
    "^x_": {}
  }
}
```

The `responses` array's row order is meaningful — it follows the participant's submission order (which is also `(block_index, trial_index)`-ordered for a linear questionnaire).

---

## 4 — Schema 6 (Session Metadata) — top-level shape

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id":     "https://behaverse.org/schemas/session/v26.0603/schema.json",
  "title":   "Behaverse Session Metadata",
  "description": "Per-session metadata: identity, lifecycle, locale, device, and per-Scorer aggregate outputs (per OD-16/OD-17g). Schema 6 is our own design; BDM has no equivalent.",
  "type":    "object",
  "required": [
    "session_id",
    "session_index",
    "agent_id",
    "instrument_id",
    "instrument_version",
    "status",
    "started_at"
  ],
  "properties": {
    "session_id":        { "type": "string", "format": "uuid",
                           "description": "Globally-unique UUID v4 (our existing semantic — OD-17h)." },
    "session_index":     { "type": "integer", "minimum": 1,
                           "description": "1-based per-agent ordering count (BDM-aligned — OD-17h)." },
    "agent_id":          { "type": "string" },
    "instrument_id":     { "type": "string", "pattern": "^qst_[a-z0-9_]+$" },
    "instrument_version":{ "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$",
                           "description": "CalVer; pinned at session-mint per OD-14 sub-question 3." },
    "deployment_id":     { "type": "string" },
    "status": {
      "type": "string",
      "enum": [
        "not_started",
        "in_progress",
        "completed",
        "submitted",
        "forwarded",
        "validated",
        "abandoned"
      ]
    },
    "started_at":           { "type": "string", "format": "date-time" },
    "completed_at":         { "type": "string", "format": "date-time" },
    "submitted_at":         { "type": "string", "format": "date-time",
                              "description": "Viewer Service receipt timestamp (per OD-13)." },
    "forwarded_at":         { "type": "string", "format": "date-time",
                              "description": "Behaverse delivery receipt (per OD-13)." },
    "forward_attempts":     { "type": "integer", "minimum": 0, "default": 0 },
    "forward_failure_reason":{ "type": "string" },
    "initial_locale": {
      "type": "object",
      "required": ["language"],
      "properties": {
        "language": { "type": "string", "description": "BCP-47 base (ISO 639-1)." },
        "region":   { "type": ["string", "null"], "description": "Optional region subtag." }
      },
      "additionalProperties": false
    },
    "last_active_locale": { "$ref": "#/$defs/Locale" },
    "device": { "$ref": "#/$defs/Device" },
    "scorer_outputs": {
      "type": "object",
      "description": "Per OD-17g: per-Scorer structured output. Keyed by CalVer-pinned Scorer ref (scr_…@vYY.MMDD). Each value conforms to the Scorer entity's output_schema.",
      "patternProperties": {
        "^scr_[a-z0-9_]+@v\\d{2}\\.\\d{4}$": { "type": "object" }
      },
      "additionalProperties": false
    },
    "extensions": { "type": "object" }
  },
  "additionalProperties": false,
  "patternProperties": {
    "^x_": {}
  },
  "$defs": {
    "Locale": {
      "type": "object",
      "required": ["language"],
      "properties": {
        "language": { "type": "string" },
        "region":   { "type": ["string", "null"] }
      },
      "additionalProperties": false
    },
    "Device": {
      "type": "object",
      "properties": {
        "user_agent":   { "type": "string" },
        "platform":     { "type": "string" },
        "device_type":  { "type": "string", "enum": ["desktop", "tablet", "mobile", "kiosk", "other"] },
        "viewport":     { "type": "string", "description": "e.g., \"1920x1080\"" },
        "timezone":     { "type": "string", "description": "IANA tz name." }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 5 — `scorer_outputs` shape detail

The `scorer_outputs` object on Schema 6 is keyed by CalVer-pinned Scorer reference. Each value is the **full structured output** the Scorer produced for this session, conforming to the Scorer entity's `output_schema` per OD-16's path (B). Example for a PHQ-9 session:

```jsonc
"scorer_outputs": {
  "scr_phq9@v26.0602": {
    "total":         12,
    "severity":      "moderate",
    "band":          { "min": 10, "max": 14, "label": "Moderate Depression" },
    "missing_count": 0
  }
}
```

Schema 6 validates only that the field is an *object*; the *contents* are validated against the referenced Scorer's `output_schema` by the validator (§7), not by Schema 6's JSON Schema (which has no way to know which Scorer was invoked).

Only Scorers that were actually invoked appear here. For `show_score: false` deployments where no Scorer ran, the field may be entirely absent.

---

## 6 — Cross-schema relationships

| From | To | Mechanism |
|---|---|---|
| Schema 5 `Response.session_id` | Schema 6 `session_id` | By-id reference (no JSON Schema `$ref`); cross-validation in the validator. |
| Schema 5 `Response.instrument_id` | Schema 1 `id` | By-id; matches `qst_…` pattern. |
| Schema 5 `Response.stimulus_id` | Schema 2 entities (Context, Instruction, Prompt, Message) | Synthetic id; cross-validation by parsing the synthetic and checking each part exists in the questionnaire's Library refs. |
| Schema 6 `scorer_outputs.<ref>` | Schema 2 Scorer entity's `output_schema` | The Scorer ref pins which entity to dereference; the value object must conform to that entity's `output_schema`. |

None of these are JSON Schema `$ref`s — they're by-id contracts validated at publish time by the standalone validator.

---

## 7 — Validator extensions

Two new entity types to validate (`response/` and `session/` schema files). The existing `tools/validate_schemas.py` walks `schemas/` and detects schema directories; it should pick up the new ones if the directory structure matches the existing pattern. Confirm in the implementation.

Three new cross-checks should be added:

### 7.1 `check_response_set_session_consistency`

For each `ResponseSet` example, verify the `session_id` matches an example session file (if both schemas have examples in the same study slug). Skip if no corresponding session example exists.

### 7.2 `check_stimulus_id_decomposable`

For each `Response` example, parse the `stimulus_id` (split on `+`) and verify each part's prefix is one of `ctx_`, `ins_`, `pr_`, `msg_`. Report `STIMULUS_ID_MALFORMED` if not. Does not cross-reference Library examples (those live in a different schema family).

### 7.3 `check_scorer_outputs_against_schema`

For each `Session` example with `scorer_outputs`, look up the corresponding Scorer entity in `schemas/questionnaire/examples/library_examples/scorers/` and validate the output value against its `output_schema`. Report `UNRESOLVED_SCORER` or `OUTPUT_VALIDATION_FAILED` per missing/invalid entry.

All three checks are publish-time gates, not schema-level validation. The schema files alone permit the deviations.

---

## 8 — Examples

### 8.1 `schemas/response/examples/`

**`minimal_single_response.json`** — minimal valid `Response`:

```jsonc
{
  "response_id":          1,
  "agent_id":             "agent_001",
  "session_index":        1,
  "instrument_id":        "qst_phq9",
  "multitask_type":       "",
  "block_index":          1,
  "block_type":           "test",
  "transformation_name":  "identity",
  "trial_index":          "1",
  "trial_start_datetime": "2026-06-03T14:30:00Z",
  "stimulus_id":          "pr_phq9_1",
  "stimulus_type":        "text"
}
```

**`phq9_session_responses.json`** — `ResponseSet` for a full PHQ-9 session (9 items), with all per-item fields populated, including `score` (scored_value), realistic timings, locale.

**`kitchensink_responses.json`** — exercises every documented field, including `correct` (one Solution-bearing attention-check item), Block (`timeline_id`), `additional_measures`, multiple stimulus types.

### 8.2 `schemas/session/examples/`

**`minimal_session.json`** — minimum-required-fields session record.

**`phq9_session.json`** — full PHQ-9 session record with `scorer_outputs.scr_phq9@v26.0602` matching the Scorer example from v26.0602.

**`kitchensink_session.json`** — exercises every field including device, last_active_locale (differs from initial), abandoned status, multiple scorer_outputs entries.

---

## 9 — JSON-LD contexts

### 9.1 `schemas/response/context.jsonld`

```jsonc
{
  "@context": {
    "@vocab":        "https://behaverse.org/schemas/response#",
    "bdm":           "https://behaverse.org/data-model#",
    "schema":        "http://schema.org/",
    "dc":            "http://purl.org/dc/terms/",

    "response_id":           { "@id": "bdm:response_id" },
    "agent_id":              { "@id": "bdm:agent_id" },
    "session_index":         { "@id": "bdm:session_index" },
    "session_id":            { "@id": "bdm:session_id",
                               "@type": "@id",
                               "@comment": "Our project deviation D3: UUID, not integer." },
    "instrument_id":         { "@id": "bdm:instrument_id", "@type": "@id" },
    "block_index":           { "@id": "bdm:block_index" },
    "stimulus_id":           { "@id": "bdm:stimulus_id" },
    "stimulus_description":  { "@id": "bdm:stimulus_description" },
    "option_id":             { "@id": "bdm:option_id" },
    "response_numeric":      { "@id": "bdm:response_numeric" },
    "response_time":         { "@id": "bdm:response_time" },
    "correct":               { "@id": "bdm:correct" },
    "score":                 { "@id": "bdm:score" },
    "additional_measures":   { "@id": "bdm:additional_measures" }
    // ... all other BDM columns
  }
}
```

### 9.2 `schemas/session/context.jsonld`

Maps Schema 6 fields to a project vocabulary URI (`https://behaverse.org/schemas/session#`) and the nested `scorer_outputs` to a per-key vocabulary keyed by Scorer ref.

---

## 10 — CHANGELOG entries (initial)

Both schemas ship with a CHANGELOG entry for v26.0603:

```markdown
## [v26.0603] — 2026-06-03

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for [Response Data | Session Metadata].
- Examples directory with minimal, realistic, and kitchen-sink coverage.
- JSON-LD context with vocabulary mappings.

**Severity:** initial (no prior version).

**Authoritative source:** [design/05_data_model.md](../../design/05_data_model.md) §"[Schema 5 | Schema 6]", [design/05c_bdm_alignment.md](../../design/05c_bdm_alignment.md) (BDM deviations), [design/05b_scoring.md](../../design/05b_scoring.md) (Scorer contract for scorer_outputs).
```

---

## 11 — Implementation order

Roughly 18 tasks across 6 phases. See the corresponding plan file (`2026-06-03-schemas-5-and-6.md`) for the bite-sized step list.

1. Skeleton schema files (both directories created, $id set).
2. Schema 5 categories: Key + Context + Task (~10 fields).
3. Schema 5 categories: Stimulus + Option + Input (~15 fields).
4. Schema 5 categories: Expectation + Response + Evaluation + Feedback + Outcome + Accessory (~15 fields).
5. Schema 5 `ResponseSet` wrapper + root `oneOf`.
6. Schema 6 top-level + Locale/Device $defs.
7. Schema 6 `scorer_outputs` patternProperties.
8. Examples (3 per schema = 6 files).
9. Validator extensions (3 new checks).
10. JSON-LD contexts.
11. CHANGELOGs and READMEs.
12. Final smoke test + tag.

---

## 12 — Out of scope for this spec

- **Scorer conformance runner** (still SKIPPED stub from v26.0602).
- **CSV export tooling** (Schema 5 is *defined* as BDM-aligned; the CSV serializer is a separate deliverable).
- **xAPI Schema 4a integration** (Schema 4a wraps Schema 5 response objects as `result.response`; the integration is documented but the actual Schema 4a author is a future deliverable).
- **Inline schema versioning beyond CalVer** (no `formula_language_version`-style sub-versioning; CalVer covers it).
- **Migration from any prior format** — these are initial releases. Legacy `survey_database` migration goes through Schema 2 (already done in v26.0601/0602); response data from legacy systems is a separate importer concern.
- **BDM Stimulus / Option dictionary tables** — per OD-17f, our synthetic `stimulus_id` is self-describing (via `stimulus_description`); we don't ship parallel BDM Stimulus dictionary files. If a future requirement needs them, that's a separate spec.

---

## 13 — Locked decisions (OD-17 recap)

| Sub-OD | Resolution |
|---|---|
| 17a-d | Strict adherence to BDM Response trial table (collapsed). |
| 17e | BDM `block_*` ← our Page; our Block → BDM `timeline_id`. |
| 17f | `stimulus_id` is synthetic string concatenating Question-side entity ids. Messages: `msg_…` directly. |
| 17g | Per-questionnaire scorer outputs live in Schema 6's `scorer_outputs`, not in Schema 5 rows. |
| 17h | Our `session_id` = UUID v4; new `session_index` = integer per-agent counter. |

Three BDM deviations logged in [05c_bdm_alignment.md](../../../design/05c_bdm_alignment.md) for upstream change requests.

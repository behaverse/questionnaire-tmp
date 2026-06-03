# Schemas 3 (Questionnaire Runtime) + 7 (Viewer Conformance Manifest) Authoring Spec

**Date drafted:** 2026-06-03
**Author:** OD-18 resolution committee (grilling session 2026-06-03)
**Predecessor:** none — initial versions of both schemas.
**CalVer:** Schema 3 ships at v26.0603; Schema 7 ships at v26.0603.
**Severity:** initial.
**Authoritative source documents:**
- [design/05d_runtime.md](../../../design/05d_runtime.md) — OD-18 resolution body
- [design/05_data_model.md](../../../design/05_data_model.md) §"Schema 3"
- [design/05b_scoring.md](../../../design/05b_scoring.md) — Scorer entity (for `impl` embedding)
- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) — Schema 2 v26.0602 entity model (for content the runtime carries)

Two schemas in one deliverable because their relationship is tight: Schema 3 is generated against a Schema 7 manifest (which trims features), and the Schema 3 cache key embeds the SHA-256 of Schema 7.

Per OD-18, **Schema 3 is a *thin runtime envelope***: it validates the runtime-specific structural additions (provenance, scores[].impl, no-ref invariant on key fields, locale-collapsed `content`) and permits the embedded Schema 2-shaped content with minimal further constraint. Strict entity-shape validation is the canonical Schema 2's job; the denormaliser is responsible for producing entity content that's also Schema 2-valid. The runtime envelope's role is to mark *that* a document is a runtime and capture the runtime-specific bookkeeping.

---

## 1 — Folder layout

```
schemas/
├── instrument/                       # Schema 1 — unchanged
├── questionnaire/                    # Schema 2 — unchanged
├── response/                         # Schema 5 — unchanged
├── session/                          # Schema 6 — unchanged
├── runtime/                          # ← NEW (Schema 3)
│   ├── schema.json
│   ├── context.jsonld
│   ├── README.md
│   ├── CHANGELOG.md
│   └── examples/
│       ├── phq9_runtime.json         # full runtime for a PHQ-9 session
│       ├── minimal_runtime.json      # smallest valid runtime
│       └── kitchensink_runtime.json  # exercises every field
└── viewer_conformance/               # ← NEW (Schema 7)
    ├── schema.json
    ├── context.jsonld
    ├── README.md
    ├── CHANGELOG.md
    └── examples/
        ├── web_viewer_manifest.json      # the Web Viewer's manifest
        ├── native_viewer_manifest.json   # the Godot Native Viewer's manifest
        └── minimal_manifest.json         # smallest valid manifest
```

Other `schemas/*/` directories are untouched.

---

## 2 — Conventions (unchanged from prior schemas)

- JSON Schema Draft 2020-12.
- `additionalProperties: false` on project-owned structural fields; the *embedded Schema 2 content* in Schema 3 is permitted more loosely (see §3.3).
- `^x_` patternProperties + `extensions: {}` on root for forward-compatible widening.
- CalVer in `$id`:
  - `https://behaverse.org/schemas/runtime/v26.0603/schema.json`
  - `https://behaverse.org/schemas/viewer_conformance/v26.0603/schema.json`

---

## 3 — Schema 3 (Questionnaire Runtime) shape

### 3.1 Root structure

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id":     "https://behaverse.org/schemas/runtime/v26.0603/schema.json",
  "title":   "Behaverse Questionnaire Runtime",
  "description": "Per OD-18 (resolved 2026-06-03), a denormalised view of a Schema 2 Questionnaire suitable for direct viewer consumption.",

  "type": "object",
  "required": ["provenance", "metadata", "pages"],
  "properties": {
    "provenance":              { "$ref": "#/$defs/RuntimeProvenance" },
    "metadata":                { "$ref": "#/$defs/EmbeddedInstrument" },
    "locale":                  { "type": "string", "description": "BCP-47 base or full tag — the runtime's primary locale. Matches provenance.locale." },
    "available_locales":       { "type": "array", "items": { "type": "string" },
                                 "description": "Only present when multi-locale runtime (pre_fetch_all_locales: true). Lists all locales whose text is included." },
    "style":                   { "type": "object", "description": "Cascading style fields per Schema 2." },
    "flow":                    { "type": "object", "description": "Flow controls per Schema 2." },
    "pages":                   { "type": "array", "minItems": 1, "items": { "type": "object" },
                                 "description": "Pages with all refs inlined. Structurally Schema 2-shaped; not strict-validated here." },
    "blocks":                  { "type": "array", "items": { "type": "object" } },
    "scores":                  { "type": "array", "items": { "$ref": "#/$defs/PinnedScore" } },
    "logic":                   { "type": "array", "items": { "type": "object" } },
    "validation":              { "type": "array", "items": { "type": "object" } },
    "lock_show_score_timing":  { "type": "boolean", "default": false },
    "extensions":              { "type": "object" }
  },
  "additionalProperties": false,
  "patternProperties": {
    "^x_": {}
  }
}
```

### 3.2 `$defs.RuntimeProvenance`

Records the inputs that produced this runtime, for analyst reproducibility (per OD-18 §4.1 and 05d §5).

```jsonc
"RuntimeProvenance": {
  "type": "object",
  "required": [
    "source_questionnaire_id",
    "source_questionnaire_version",
    "locale",
    "viewer_conformance_hash",
    "deployment_runtime_policy_hash",
    "generated_at",
    "denormaliser_version"
  ],
  "properties": {
    "source_questionnaire_id":      { "type": "string", "pattern": "^qst_[a-z0-9_]+$" },
    "source_questionnaire_version": { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$" },
    "locale":                       { "type": "string", "description": "Primary locale used for runtime generation (BCP-47)." },
    "viewer_conformance_hash":      { "type": "string", "pattern": "^[a-f0-9]{64}$",
                                      "description": "SHA-256 of the viewer conformance manifest (Schema 7) the runtime was trimmed against." },
    "deployment_runtime_policy_hash":{ "type": "string", "pattern": "^[a-f0-9]{64}$",
                                       "description": "SHA-256 of the deployment.runtime_policy sub-object." },
    "generated_at":                 { "type": "string", "format": "date-time" },
    "denormaliser_version":         { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$",
                                      "description": "CalVer of the behaverse-runtime-denormaliser library that produced this runtime." },
    "stripped_scorer_refs":         { "type": "array",
                                      "items": { "type": "string", "pattern": "^scr_[a-z0-9_]+@v\\d{2}\\.\\d{4}$" },
                                      "description": "Scorer refs from Schema 2 elided per OD-18e selective stripping." },
    "stripped_logic_rule_ids":      { "type": "array", "items": { "type": "string" },
                                      "description": "LogicRule ids elided under disable_in_session_scoring." }
  },
  "additionalProperties": false
}
```

### 3.3 `$defs.EmbeddedInstrument`

Schema 3 embeds the Instrument metadata inline (vs. Schema 2 which embeds via cross-schema `$ref`). We permit the structure loosely here — Schema 1 strict validation is the canonical source.

```jsonc
"EmbeddedInstrument": {
  "type": "object",
  "required": ["id", "title", "language"],
  "properties": {
    "id":          { "type": "string", "pattern": "^qst_[a-z0-9_]+$" },
    "title":       { "type": "string" },
    "description": { "type": "string" },
    "language":    { "type": "string" }
  },
  "additionalProperties": true
}
```

`additionalProperties: true` here intentionally — Schema 1's full field set is permitted; the runtime envelope only enforces the minimal required fields.

### 3.4 `$defs.PinnedScore`

Each `scores[]` entry in the runtime carries the chosen Scorer implementation embedded (per OD-18d).

```jsonc
"PinnedScore": {
  "type": "object",
  "required": ["id", "scorer", "path", "impl"],
  "properties": {
    "id":          { "type": "string", "pattern": "^[a-z][a-z0-9_]*$" },
    "scorer":      { "type": "string", "pattern": "^scr_[a-z0-9_]+@v\\d{2}\\.\\d{4}$" },
    "path":        { "type": "string", "pattern": "^(/[^/]*)+$" },
    "impl":        { "$ref": "#/$defs/PinnedScorerImpl" },
    "name":        { "type": "string" },
    "description": { "type": "string" }
  },
  "additionalProperties": false,
  "patternProperties": { "^x_": {} }
}
```

### 3.5 `$defs.PinnedScorerImpl`

The chosen Scorer implementation, mirroring Schema 2's `ScorerImplementation` $def with strict kinds.

```jsonc
"PinnedScorerImpl": {
  "type": "object",
  "required": ["kind"],
  "oneOf": [
    { "properties": { "kind": { "const": "wasm" },   "url": { "type": "string", "format": "uri" }, "sha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" } }, "required": ["kind", "url", "sha256"], "additionalProperties": false },
    { "properties": { "kind": { "const": "http" },   "url": { "type": "string", "format": "uri" } }, "required": ["kind", "url"], "additionalProperties": false },
    { "properties": { "kind": { "const": "python" }, "package": { "type": "string" } }, "required": ["kind", "package"], "additionalProperties": false },
    { "properties": { "kind": { "const": "r" },      "package": { "type": "string" } }, "required": ["kind", "package"], "additionalProperties": false }
  ]
}
```

---

## 4 — Schema 7 (Viewer Conformance Manifest) shape

### 4.1 Root structure

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id":     "https://behaverse.org/schemas/viewer_conformance/v26.0603/schema.json",
  "title":   "Behaverse Viewer Conformance Manifest",
  "description": "Per OD-18c (resolved 2026-06-03), a per-viewer JSON document declaring supported features. Stored in the Viewer Service's viewer-registry table; hashed into the runtime cache key.",

  "type": "object",
  "required": [
    "viewer_id",
    "viewer_version",
    "schema_support",
    "evaluator",
    "widgets",
    "scorer_impl_kinds"
  ],
  "properties": {
    "viewer_id":        { "type": "string", "pattern": "^[a-z][a-z0-9-]*$",
                          "description": "Stable identifier for the viewer product, e.g. 'behaverse-web-viewer'." },
    "viewer_version":   { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$",
                          "description": "CalVer of the viewer release this manifest describes." },
    "schema_support": {
      "type": "object",
      "required": ["questionnaire", "instrument"],
      "properties": {
        "questionnaire": { "type": "array", "items": { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$" }, "minItems": 1 },
        "instrument":    { "type": "array", "items": { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$" }, "minItems": 1 },
        "runtime":       { "type": "array", "items": { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$" }, "minItems": 1 },
        "response":      { "type": "array", "items": { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$" } },
        "session":       { "type": "array", "items": { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$" } }
      },
      "additionalProperties": false
    },
    "evaluator": {
      "type": "object",
      "required": ["language_version", "functions"],
      "properties": {
        "language_version": { "type": "string",
                              "description": "Version of the WASM expression-evaluator language this viewer ships (per OD-11)." },
        "functions":        { "type": "array", "items": { "type": "string" }, "uniqueItems": true,
                              "description": "Supported function and operator names." }
      },
      "additionalProperties": false
    },
    "widgets": {
      "type": "array",
      "items": {
        "type": "string",
        "description": "Widget identifier in the form '<input_data_type>.<measurement_type>.<selection>' per OD-15."
      },
      "uniqueItems": true,
      "minItems": 1
    },
    "behavioural_channels": {
      "type": "array",
      "items": { "type": "string",
                 "enum": ["response_time", "mouse", "keyboard", "webcam", "microphone"] },
      "uniqueItems": true,
      "description": "Channels this viewer can capture (per OD-07)."
    },
    "scorer_impl_kinds": {
      "type": "array",
      "items": { "type": "string", "enum": ["wasm", "http", "python", "r"] },
      "uniqueItems": true,
      "minItems": 1,
      "description": "Scorer implementation kinds this viewer can invoke (per OD-16e Z)."
    },
    "logic_actions": {
      "type": "array",
      "items": { "type": "string", "enum": ["skip", "visibility", "piping", "branch"] },
      "uniqueItems": true,
      "description": "LogicRule action types this viewer implements."
    },
    "locale_switching":  { "type": "boolean", "description": "Whether the viewer offers a mid-session language switcher." },
    "resume":            { "type": "boolean", "description": "Whether the viewer supports session resume per OD-14." },
    "max_session_duration_minutes": { "type": "integer", "minimum": 1 },
    "viewer_url":        { "type": "string", "format": "uri",
                           "description": "Stable URL where this manifest is published; the Viewer Service fetches it once at viewer-registration time." },
    "extensions":        { "type": "object" }
  },
  "additionalProperties": false,
  "patternProperties": { "^x_": {} }
}
```

---

## 5 — Cross-schema relationships

| From | To | Mechanism |
|---|---|---|
| Schema 3 `provenance.source_questionnaire_id@version` | Schema 2 instance | By-id; the runtime was generated *from* that exact Schema 2 version. |
| Schema 3 `provenance.viewer_conformance_hash` | Schema 7 instance | SHA-256 of the Schema 7 manifest the runtime was trimmed against. Cross-validation walks the registered manifests. |
| Schema 3 `scores[].scorer` | Schema 2 Scorer entity | The CalVer-pinned Scorer ref; its `output_schema` defines the shape of `Session.scorer_outputs[ref]` (per OD-17g). |
| Schema 3 `scores[].impl` | Schema 2 `Scorer.implementations[]` | The chosen impl is one of the Scorer's declared implementations. |
| Schema 7 `schema_support.questionnaire[]` | Schema 2 versions | Lists which Schema 2 CalVer versions this viewer can render. |
| Schema 7 `widgets[]` | Option-triple kinds | A widget identifier like `"choice.ordinal.single"` corresponds to a Schema 2 Option with `(input_data_type: "choice", measurement_type: "ordinal", selection: "single")`. |

No JSON Schema `$ref` between the schema documents — cross-validation is a publish-time concern in the validator (§7).

---

## 6 — Examples

### 6.1 Schema 3 examples (3 files in `schemas/runtime/examples/`)

**`minimal_runtime.json`** — smallest valid runtime:

```jsonc
{
  "provenance": {
    "source_questionnaire_id":       "qst_minimal",
    "source_questionnaire_version":  "v26.0602",
    "locale":                        "en",
    "viewer_conformance_hash":       "0000000000000000000000000000000000000000000000000000000000000000",
    "deployment_runtime_policy_hash":"1111111111111111111111111111111111111111111111111111111111111111",
    "generated_at":                  "2026-06-03T14:30:00Z",
    "denormaliser_version":          "v26.0603"
  },
  "metadata": {
    "id":       "qst_minimal",
    "title":    "Minimal Questionnaire",
    "language": "en"
  },
  "locale": "en",
  "pages": [
    {
      "id": "page_only",
      "elements": []
    }
  ]
}
```

**`phq9_runtime.json`** — realistic PHQ-9 runtime. Includes:
- `provenance` block with realistic hashes.
- `metadata` mirroring the Schema 1 Instrument doc inline.
- 1 page with 9 inline Items (each = inline Question with Prompt+Context+Instruction + inline Option for the 4-point frequency Likert).
- `scores[]` with 3 entries (phq9_total, phq9_severity, phq9_band_label), each carrying `impl: { kind: "wasm", url, sha256 }`.
- `lock_show_score_timing: true` (clinical instrument).

**`kitchensink_runtime.json`** — exercises every documented field. Includes:
- `available_locales: ["en", "pt"]` (multi-locale runtime — kiosk mode).
- `style` and `flow` blocks.
- `blocks[]` (timeline-level structure).
- `logic[]` and `validation[]` blocks.
- `provenance.stripped_scorer_refs` and `stripped_logic_rule_ids` non-empty.
- Multiple impl kinds across `scores[]` entries (one wasm, one http, one python).

### 6.2 Schema 7 examples (3 files in `schemas/viewer_conformance/examples/`)

**`minimal_manifest.json`** — smallest valid manifest:

```jsonc
{
  "viewer_id":      "minimal-viewer",
  "viewer_version": "v26.0603",
  "schema_support": {
    "questionnaire": ["v26.0602"],
    "instrument":    ["v26.0528"]
  },
  "evaluator": {
    "language_version": "v1.0",
    "functions":        ["if", "and", "or", "not", "==", "!=", ">=", "<=", "score"]
  },
  "widgets":           ["choice.ordinal.single"],
  "scorer_impl_kinds": ["wasm"]
}
```

**`web_viewer_manifest.json`** — full Web Viewer manifest:

```jsonc
{
  "viewer_id":       "behaverse-web-viewer",
  "viewer_version":  "v26.0603",
  "viewer_url":      "https://viewers.behaverse.org/web-viewer/v26.0603/conformance.json",
  "schema_support": {
    "questionnaire": ["v26.0528", "v26.0601", "v26.0602"],
    "instrument":    ["v26.0528"],
    "runtime":       ["v26.0603"],
    "response":      ["v26.0603"],
    "session":       ["v26.0603"]
  },
  "evaluator": {
    "language_version": "v1.0",
    "functions":        ["if", "and", "or", "not", "==", "!=", ">=", "<=", "+", "-", "*", "/", "score"]
  },
  "widgets": [
    "choice.ordinal.single", "choice.nominal.single",
    "choice.nominal.multiple", "number.interval.single",
    "number.ratio.single", "text.nominal.single"
  ],
  "behavioural_channels": ["response_time", "mouse", "keyboard"],
  "scorer_impl_kinds":    ["wasm", "http"],
  "logic_actions":        ["skip", "visibility", "piping", "branch"],
  "locale_switching":     true,
  "resume":               true,
  "max_session_duration_minutes": 180
}
```

**`native_viewer_manifest.json`** — Godot Native Viewer manifest. Differs from web: behavioural_channels include `webcam` and `microphone`; scorer_impl_kinds only `wasm` (offline-capable); locale_switching `false` (kiosks pin a single locale).

---

## 7 — Validator extensions

`tools/validate_schemas.py` already auto-detects `schemas/*/examples/`. The two new directories will be picked up automatically once they exist. Two new cross-checks:

### 7.1 `check_pinned_scorer_consistency`

For each Schema 3 example, for each `scores[]` entry, look up the corresponding Scorer entity in `schemas/questionnaire/examples/library_examples/scorers/` and verify that the `impl.kind` matches one declared in the Scorer's `implementations[]`. Reports:
- `UNRESOLVED_SCORER` — Scorer ref doesn't match any known Scorer entity.
- `IMPL_KIND_NOT_DECLARED` — the pinned `impl.kind` isn't in the Scorer's `implementations[]`.
- `URL_MISMATCH` — for WASM/HTTP impls, the pinned URL doesn't match what the Scorer declares.

### 7.2 `check_runtime_provenance_completeness`

For each Schema 3 example, verify:
- `provenance.source_questionnaire_version` matches the `qst_*@vYY.MMDD` Calendar Versioning format.
- `provenance.viewer_conformance_hash` is a valid SHA-256 (64 hex chars).
- `provenance.denormaliser_version` is set.

Add tests in `tools/tests/test_validator.py` for both.

---

## 8 — JSON-LD contexts

### 8.1 `schemas/runtime/context.jsonld`

```jsonc
{
  "@context": {
    "@vocab": "https://behaverse.org/schemas/runtime#",
    "provenance":              { "@id": "https://behaverse.org/schemas/runtime#provenance" },
    "metadata":                { "@id": "https://behaverse.org/schemas/instrument#metadata" },
    "pages":                   { "@id": "https://behaverse.org/schemas/questionnaire#pages", "@container": "@list" },
    "blocks":                  { "@id": "https://behaverse.org/schemas/questionnaire#blocks", "@container": "@set" },
    "scores":                  { "@id": "https://behaverse.org/schemas/questionnaire#scores", "@container": "@set" },
    "impl":                    { "@id": "https://behaverse.org/schemas/runtime#impl" },
    "source_questionnaire_id": { "@id": "https://behaverse.org/schemas/runtime#source_questionnaire_id", "@type": "@id" },
    "viewer_conformance_hash": { "@id": "https://behaverse.org/schemas/runtime#viewer_conformance_hash" },
    "denormaliser_version":    { "@id": "https://behaverse.org/schemas/runtime#denormaliser_version" }
  }
}
```

### 8.2 `schemas/viewer_conformance/context.jsonld`

```jsonc
{
  "@context": {
    "@vocab": "https://behaverse.org/schemas/viewer_conformance#",
    "viewer_id":          { "@id": "https://behaverse.org/schemas/viewer_conformance#viewer_id" },
    "viewer_version":     { "@id": "https://behaverse.org/schemas/viewer_conformance#viewer_version" },
    "schema_support":     { "@id": "https://behaverse.org/schemas/viewer_conformance#schema_support" },
    "evaluator":          { "@id": "https://behaverse.org/schemas/viewer_conformance#evaluator" },
    "widgets":            { "@id": "https://behaverse.org/schemas/viewer_conformance#widgets", "@container": "@set" },
    "behavioural_channels":{ "@id": "https://behaverse.org/schemas/viewer_conformance#behavioural_channels", "@container": "@set" },
    "scorer_impl_kinds":  { "@id": "https://behaverse.org/schemas/viewer_conformance#scorer_impl_kinds", "@container": "@set" },
    "logic_actions":      { "@id": "https://behaverse.org/schemas/viewer_conformance#logic_actions", "@container": "@set" },
    "viewer_url":         { "@id": "https://behaverse.org/schemas/viewer_conformance#viewer_url", "@type": "@id" }
  }
}
```

---

## 9 — CHANGELOG entries (initial)

Both schemas ship with v26.0603 entries. Content per spec §10 in the prior Schemas 5+6 spec — adapted to each schema's content.

---

## 10 — Implementation order

Roughly 14 tasks across 6 phases. See the corresponding plan file (`2026-06-03-schemas-3-and-7.md`).

1. Skeleton schemas (both directories created, $id set, basic root + smoke tests).
2. Schema 3 `RuntimeProvenance`, `EmbeddedInstrument`, `PinnedScore`, `PinnedScorerImpl` $defs.
3. Schema 3 root validation (required fields, additionalProperties, x_ patterns).
4. Schema 7 root validation (required fields, schema_support, evaluator, widgets, scorer_impl_kinds).
5. Examples (3 per schema).
6. Validator extensions (2 cross-checks).
7. JSON-LD contexts.
8. CHANGELOG + README.
9. Final smoke + tag.

---

## 11 — Locked decisions (OD-18 recap)

| Sub-OD | Resolution |
|---|---|
| 18a | Server-side Viewer Service production; shared Python denormaliser library. |
| 18b | Single-locale default; `pre_fetch_all_locales: true` opt-in for kiosks (Schema 3 `available_locales` field marks multi-locale). |
| 18c | Formal Schema 7 manifest; per-viewer; published at stable URL; stored in viewer-registry. |
| 18d | Scorer impl pinned via deployment-preference ∩ Scorer.impls ∩ viewer.scorer_impl_kinds intersection. |
| 18e | Selective scoring stripping via LogicRule graph walk; `disable_in_session_scoring: true` flag. |
| 18f | 5-tuple cache key; Postgres-backed; LRU; admin purge. |

---

## 12 — Out of scope for this spec

- **The Python denormaliser library** (`behaverse-runtime-denormaliser`) — separate Python package deliverable.
- **The Viewer Service `runtime_cache` table** and admin API endpoints — service-side work.
- **The Editor preview integration** — Editor-side work.
- **Strict Schema 2 validation of embedded content** — the runtime envelope only validates runtime-specific additions. Strict entity-shape validation against Schema 2 v26.0602 is a separate validation pass when needed.
- **xAPI Schema 4a authoring** — wraps Schema 5 response objects; separate deliverable.
- **Behavioural Channels Schema 4b** — sibling deliverable, not blocked but also not bundled here.
- **CSV serializer for Schema 5** — analyst-tooling concern.
- **Manifest publication mechanics per viewer** — each viewer team handles its own release process.
- **Pre-warming cache strategy** — post-MVP optimisation.

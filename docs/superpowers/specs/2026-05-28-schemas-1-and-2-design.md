# Schemas 1 + 2 Authoring Spec

**Status:** Approved by grilling session 2026-05-28. Ready for implementation.
**Scope:** Local authoring of `Instrument` (Schema 1) and `Questionnaire` (Schema 2). No publication to behaverse.org/schemas/ in this phase.
**Schemas not in this session:** Runtime (3), Event Data (4a), Behavioural Channels (4b), Response (5), Session Metadata (6) — each gets its own session later.

This spec captures 21 design decisions from the 2026-05-28 grilling session, with concrete JSON Schema fragments, rationale, and a list of knock-on edits required to existing design docs.

---

## 1 — Folder layout

```
schemas/
  README.md                       # what this dir is, how to validate, links to design/
  VERSIONING.md                   # mirrors behaverse/schemas/VERSIONING.md (CalVer policy)
  instrument/
    README.md
    CHANGELOG.md
    context.jsonld                # JSON-LD context (property URIs to Dublin Core / Schema.org / DataCite)
    schema.json                   # current version (v26.0528)
    examples/
      phq9_metadata.json
      bdi2_metadata.json
      ipt_metadata.json           # optional: a cognitive-task example to exercise the generic id pattern
    versions/                     # empty initially
  questionnaire/
    README.md
    CHANGELOG.md
    context.jsonld
    schema.json                   # current version (v26.0528)
    examples/
      minimal.json                # smallest valid questionnaire (1 page, 1 radio question)
      phq9.json                   # realistic PHQ-9 with subscale + scoring + interpretation bands
      kitchensink.json            # exercises blocks, sections, logic, validation, translations, randomization, references
    versions/
tools/
  validate_schemas.py             # CLI; validates each example against its schema; exits non-zero on failure
  requirements.txt                # jsonschema>=4.x
```

**Conventions:**

| Convention | Value |
|---|---|
| JSON Schema dialect | **Draft 2020-12** (per design/05_data_model.md:13; intentional divergence from behaverse/schemas' draft-07) |
| Version stamp | **v26.0528** for both schemas (CalVer, per `project_calver_versioning.md` auto-memory) |
| `$id` URL form | `https://behaverse.org/schemas/{name}/v26.0528/schema.json` (version as **path segment**, matches behaverse bcsv pattern) |
| Current vs. archived | `schema.json` is the current; `versions/<vYY.MMDD>/` directories archive prior versions |
| Filename | Always `schema.json` (version is in the path, not the filename) |
| Field naming | `snake_case` for project-owned fields |

**Mirror to behaverse/schemas later** is a verbatim copy: `cp -r schemas/instrument /path/to/behaverse-schemas/instrument`. No re-stamping or URL rewriting.

---

## 2 — Schema 1: Instrument

**Purpose:** Bibliographic and psychometric properties for any instrument — questionnaires today, cognitive tasks and other paradigms later. Generic across instrument types.

**Why "Instrument" and not "Questionnaire Metadata":** Schema 2 is questionnaire-specific (it defines the structural wrapper of pages + questions). The metadata fields (title, authors, license, psychometrics, classification) apply equally to a paper depression scale and an n-back task. Separating them at the schema level lets a future Cognitive-Task Definition schema also embed Instrument metadata without renaming. The Library can catalogue all instrument types from day one.

### 2.1 — Top-level required vs. optional

**Two-layer model:** JSON Schema enforces a minimum-valid floor; the Library publish workflow layers on stricter requirements at promote-to-published time. Drafts, in-development instruments, and imported-with-gaps records all validate at the schema layer.

| Field | Schema floor | Library publish |
|---|---|---|
| `id` | **Required** | required |
| `title` | **Required** | required |
| `description` | **Required** | required (moved from "Recommended" in current design) |
| `language` | **Required** | required |
| `version` | optional | **required** (moved from Schema "Required" in current design) |
| `authors` | optional | **required (≥1)** |
| `license` | optional | **required** |
| `short_title`, `available_languages`, `publication`, `classification`, `psychometrics`, `usage`, `provenance`, `timestamps`, `license_notes`, `rights_holder`, `request_url`, `translations` | optional | optional / UI-warned |

**Note on `translations`:** Per Q9-D (per-entity inline translation model), every entity bearing translatable text carries its own `translations` block — including the Instrument itself. Schema 1 defines `InlineTranslations` in its `$defs`; Schema 2 has the same $def (duplicated, since JSON Schema's $ref doesn't bridge cleanly into another schema's $defs at the *deeply nested* level). The `translations` block on the Instrument covers `title`, `description`, `short_title`. If `available_languages` lists `pt-BR`, then `translations["pt-BR"]` must exist with `status: "validated"` for the instrument to be considered served-able in pt-BR (cross-document concern; enforced by the Library, not the schema).

**Rationale:**
- `description` required because search/discovery breaks without it; one sentence is negligible cost.
- `publication` optional because cognitive paradigms (n-back, Stroop) often have no single canonical publication and new instruments aren't published yet.
- `language` required (not moveable to publish-only) because the locale-resolution algorithm uses canonical language as its lowest-precedence fallback (design/05_data_model.md:514). Without it, runtime locale resolution has no base case.
- `version` moveable to publish-only because brand-new instruments in the Editor don't have a version stamped until save-as; the Editor auto-stamps `v26.0528` before publish.

### 2.2 — Field shapes

#### `id`

```jsonc
"id": {
  "type": "string",
  "pattern": "^[a-z]+_[a-z0-9_]+$",
  "minLength": 3,
  "maxLength": 64
}
```

Permissive prefix. Schema 2 narrows the embedded `metadata.id` to `^qst_[a-z0-9_]+$` via `allOf`. Future Cognitive-Task Definition narrows to `^tsk_[a-z0-9_]+$`. The instrument subtype is established by which Definition schema validates an instance.

#### `title`, `description`, `short_title`

```jsonc
"title":       { "type": "string", "minLength": 1, "maxLength": 256 },
"description": { "type": "string", "minLength": 1, "maxLength": 2048 },
"short_title": { "type": "string", "minLength": 1, "maxLength": 64 }
```

#### `language` and `available_languages`

Uses BCP-47 with hierarchical fallback. Patterns accept ISO 639-1 (`pt`), with optional script (`zh-Hans`) and/or region (`pt-BR`) subtags.

```jsonc
"$defs": {
  "LanguageCode": {
    "type": "string",
    "pattern": "^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$",
    "description": "BCP-47 language tag. ISO 639-1 base (e.g. 'pt') with optional script (e.g. 'zh-Hans') and/or region (e.g. 'pt-BR'). Runtime resolution falls back from most-specific to base to canonical."
  }
},
"language":            { "$ref": "#/$defs/LanguageCode" },
"available_languages": { "type": "array", "items": { "$ref": "#/$defs/LanguageCode" }, "uniqueItems": true }
```

**Examples accepted:** `pt`, `pt-BR`, `pt-PT`, `en`, `en-GB`, `en-US`, `zh`, `zh-Hans`, `zh-Hant`, `zh-Hans-CN`.

**Runtime fallback algorithm** (implemented in Viewer Service + WASM evaluator, not in schema):
1. Most-specific match (e.g. `pt-BR`)
2. Drop region → base language (e.g. `pt`)
3. Drop script → base language
4. Fall through to instrument's canonical `language`
5. If even that's missing → schema validation error (caught at validation time, not runtime)

#### `version`

```jsonc
"version": {
  "type": "string",
  "pattern": "^v\\d{2}\\.\\d{4}(\\.dev\\d+)?$",
  "description": "Calendar version vYY.MMDD per Behaverse schemas policy. Optional .devN suffix for in-development iterations on the same date."
}
```

#### `authors[]`

```jsonc
"authors": {
  "type": "array",
  "items": {
    "type": "object",
    "required": ["name"],
    "properties": {
      "name":        { "type": "string", "minLength": 1 },
      "orcid":       { "type": "string", "pattern": "^\\d{4}-\\d{4}-\\d{4}-\\d{3}[0-9X]$" },
      "affiliation": { "type": "string" },
      "email":       { "type": "string", "format": "email" }
    },
    "additionalProperties": false
  }
}
```

Inner `name` required; the rest optional. Library publish layer enforces `minItems: 1`.

#### `publication`

Optional at top level; if present, `year` and `citation` required inside. `publication.license` is **removed** (duplicated with top-level `license` per design/11_content_licensing.md; the Instrument's own license is the canonical).

```jsonc
"publication": {
  "type": "object",
  "required": ["year", "citation"],
  "properties": {
    "year":      { "type": "integer", "minimum": 1800, "maximum": 2100 },
    "citation":  { "type": "string", "minLength": 1 },
    "doi":       { "type": "string", "pattern": "^10\\.\\d+/.+$" },
    "isbn":      { "type": "string" },
    "publisher": { "type": "string" },
    "url":       { "type": "string", "format": "uri" }
  },
  "additionalProperties": false
}
```

**Knock-on edit:** design/05_data_model.md:87 must remove `license` from the publication block's list.

#### `license`, `license_notes`, `rights_holder`, `request_url`

Closed controlled vocabulary from [design/11_content_licensing.md](../../../design/11_content_licensing.md).

```jsonc
"license": {
  "enum": [
    "public_domain", "cc0", "cc_by", "cc_by_nc", "cc_by_sa",
    "proprietary_open_redistribution", "proprietary_restricted",
    "unknown", "mixed_see_components"
  ]
},
"license_notes": { "type": "string", "maxLength": 1024 },
"rights_holder": { "type": "string" },
"request_url":   { "type": "string", "format": "uri" }
```

#### `classification`

Mixed open/closed vocabularies per the grilling decision.

```jsonc
"classification": {
  "type": "object",
  "properties": {
    "domain": {
      "type": "array",
      "items": { "type": "string", "minLength": 1, "maxLength": 64 },
      "description": "Open vocabulary. Preferred values documented in schemas/instrument/README.md. Library maintains a registry; novel values flagged for curator review."
    },
    "population": {
      "type": "array",
      "items": { "type": "string", "minLength": 1, "maxLength": 64 },
      "description": "Open vocabulary; same registry pattern as domain."
    },
    "tags": {
      "type": "array",
      "items": { "type": "string", "minLength": 1, "maxLength": 64 },
      "description": "Free-form analytic labels; no registry."
    },
    "age_range": {
      "type": "array",
      "prefixItems": [
        { "type": "integer", "minimum": 0, "maximum": 120 },
        { "type": "integer", "minimum": 0, "maximum": 120 }
      ],
      "items": false,
      "minItems": 2,
      "maxItems": 2
    },
    "administration_mode": {
      "type": "array",
      "items": {
        "enum": ["self_report", "interviewer", "observer", "informant", "performance"]
      },
      "uniqueItems": true
    }
  },
  "additionalProperties": false
}
```

#### `psychometrics`

```jsonc
"psychometrics": {
  "type": "object",
  "properties": {
    "item_count":        { "type": "integer", "minimum": 1 },
    "estimated_minutes": { "type": "number",  "minimum": 0 },
    "reliability": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "value"],
        "properties": {
          "type":        { "type": "string" },
          "value":       { "type": "number" },
          "population":  { "type": "string" },
          "sample_size": { "type": "integer", "minimum": 1 },
          "ci_lower":    { "type": "number" },
          "ci_upper":    { "type": "number" },
          "citation":    { "type": "string" }
        },
        "additionalProperties": false
      }
    },
    "validity": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "value"],
        "properties": {
          "type":        { "type": "string" },
          "value":       { "type": "number" },
          "comparator":  { "type": "string" },
          "population":  { "type": "string" },
          "sample_size": { "type": "integer", "minimum": 1 },
          "citation":    { "type": "string" }
        },
        "additionalProperties": false
      }
    },
    "norms": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["population"],
        "properties": {
          "population":  { "type": "string" },
          "n":           { "type": "integer", "minimum": 1 },
          "mean":        { "type": "number" },
          "sd":          { "type": "number" },
          "median":      { "type": "number" },
          "percentiles": {
            "type": "object",
            "patternProperties": { "^p\\d{1,2}$": { "type": "number" } },
            "additionalProperties": false
          },
          "citation":    { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  },
  "additionalProperties": false
}
```

**Open `reliability.type` / `validity.type` strings** — preferred values (`cronbach_alpha`, `test_retest`, `split_half`, `omega`, `kr20`, `content_validity`, `criterion_concurrent`, `criterion_predictive`, `construct_convergent`, `construct_discriminant`, etc.) documented in `schemas/instrument/README.md`. Closed enum would risk rejecting emerging methods (ICC variants, Bayesian credible intervals).

**Flagged as experimental** by the user: the psychometrics shape may need iteration once real examples surface. Document this in the schema's CHANGELOG.

#### `usage`, `provenance`, `timestamps`

```jsonc
"usage": {
  "type": "object",
  "properties": {
    "requires_permission": { "type": "boolean" },
    "cost":                { "enum": ["free", "paid", "negotiable"] },
    "clinical_use_only":   { "type": "boolean" },
    "training_required":   { "type": "boolean" }
  },
  "additionalProperties": false
},
"provenance": {
  "type": "object",
  "description": "Imported-content only. See design/13_importers.md.",
  "properties": {
    "source":                 { "type": "string" },
    "source_version":         { "type": "string" },
    "imported_at":            { "type": "string", "format": "date-time" },
    "imported_by":            { "type": "string" },
    "import_loss_report_url": { "type": "string", "format": "uri" },
    "importer_version":       { "type": "string" }
  },
  "additionalProperties": false
},
"timestamps": {
  "type": "object",
  "properties": {
    "created":   { "type": "string", "format": "date-time" },
    "modified":  { "type": "string", "format": "date-time" },
    "published": { "type": "string", "format": "date-time" }
  },
  "additionalProperties": false
}
```

#### `translations` (per-entity, on the Instrument itself)

```jsonc
"translations": { "$ref": "#/$defs/InlineTranslations" }
```

With `InlineTranslations` defined in Schema 1's `$defs`:

```jsonc
"InlineTranslations": {
  "type": "object",
  "patternProperties": {
    "^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$": {
      "type": "object",
      "required": ["status", "fields"],
      "properties": {
        "status": { "enum": ["draft", "complete", "validated"] },
        "fields": {
          "type": "object",
          "description": "Sparse parallel mirror of the entity's translatable fields. For Instrument: { title?, description?, short_title? }. Shape varies per parent entity type; not validated here."
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

Schema 2 carries an identical `InlineTranslations` $def for use on its own entities (Page, Section, Block, Subscale, Question, OptionSet, ScoringDef). The duplication is intentional: each schema is self-contained; cross-schema `$ref` into deeply nested `$defs` of another schema is awkward in JSON Schema 2020-12 and slows down tooling.

### 2.3 — additionalProperties policy

**Hybrid:** strict everywhere + explicit extension points.

- Top-level Instrument object: `additionalProperties: false`.
- Every declared nested object: `additionalProperties: false`.
- Two extension points:
  - **`extensions: { type: "object" }`** at the top level — open for non-standard project-level fields.
  - **`patternProperties: { "^x_": {} }`** allowed on any declared object — `x_*` prefixed fields pass through.

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://behaverse.org/schemas/instrument/v26.0528/schema.json",
  "title": "Instrument Metadata",
  "type": "object",
  "required": ["id", "title", "description", "language"],
  "properties": {
    /* all fields above, including translations */
    "extensions": { "type": "object" }
  },
  "patternProperties": { "^x_": {} },
  "additionalProperties": false,
  "$defs": {
    "LanguageCode": { /* BCP-47 pattern */ },
    "InlineTranslations": { /* per-language status, sparse fields mirror */ }
  }
}
```

This catches `autors` → `authors` typos while leaving a non-painful path for legitimate extensions.

---

## 3 — Schema 2: Questionnaire

**Purpose:** Complete structural specification of a questionnaire — pages, blocks, sections, questions, subscales, logic, scoring, validation. The source of truth for what a questionnaire is. Stored in the Library, produced by the Editor, consumed by viewers.

**Schema 1 embedded inline at `metadata`** via cross-schema `$ref` with `allOf` narrowing:

```jsonc
"properties": {
  "metadata": {
    "allOf": [
      { "$ref": "https://behaverse.org/schemas/instrument/v26.0528/schema.json" },
      {
        "type": "object",
        "properties": {
          "id": { "pattern": "^qst_[a-z0-9_]+$" }
        }
      }
    ]
  },
  /* ... */
}
```

The `allOf` narrows the Instrument's permissive `^[a-z]+_[a-z0-9_]+$` id pattern to questionnaire-specific `^qst_[a-z0-9_]+$`. Validator config (Python `jsonschema` lib) registers a URI → local-file resolver so `https://behaverse.org/schemas/instrument/v26.0528/schema.json` resolves to `schemas/instrument/v26.0528/schema.json` during dev.

### 3.1 — Top-level structure

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://behaverse.org/schemas/questionnaire/v26.0528/schema.json",
  "title": "Questionnaire Definition",
  "type": "object",
  "required": ["metadata", "pages"],
  "properties": {
    "@context":     { "type": "string", "default": "https://behaverse.org/schemas/questionnaire/context.jsonld" },
    "metadata":     { /* allOf ref + narrowing, above */ },
    "style":        { "$ref": "#/$defs/Style" },
    "flow":         { "$ref": "#/$defs/FlowInstrument" },
    "pages":        { "type": "array", "items": { "$ref": "#/$defs/Page" }, "minItems": 1 },
    "blocks":       { "type": "array", "items": { "$ref": "#/$defs/Block" } },
    "subscales":    { "type": "array", "items": { "$ref": "#/$defs/Subscale" } },
    "logic":        { "type": "array", "items": { "$ref": "#/$defs/LogicRule" } },
    "scoring":      { "type": "array", "items": { "$ref": "#/$defs/ScoringDef" } },
    "validation":   { "type": "array", "items": { "$ref": "#/$defs/CrossQuestionValidationRule" } },
    "extensions":   { "type": "object" }
  },
  "patternProperties": { "^x_": {} },
  "additionalProperties": false,
  "$defs": { /* see §3.2 */ }
}
```

**Note:** the design's top-level `translations` field is removed (per Q9-D — translations are inline per-entity now). Questionnaire-level text (metadata title/description, page titles, etc.) carries its own inline translations on the entity bearing the text.

### 3.2 — $defs catalogue

#### Identifier types

```jsonc
"InstrumentId":    { "type": "string", "pattern": "^[a-z]+_[a-z0-9_]+$",  "minLength": 3, "maxLength": 64 },
"QuestionId":      { "type": "string", "pattern": "^q_[a-z0-9_]+$",       "maxLength": 64 },
"OptionSetId":     { "type": "string", "pattern": "^os_[a-z0-9_]+$",      "maxLength": 64 },
"InstructionId":   { "type": "string", "pattern": "^ins_[a-z0-9_]+$",     "maxLength": 64 },
"PromptId":        { "type": "string", "pattern": "^pr_[a-z0-9_]+$",      "maxLength": 64 },
"SubscaleId":      { "type": "string", "pattern": "^scl_[a-z0-9_]+$",     "maxLength": 64 },
"PageId":          { "type": "string", "pattern": "^page_[a-z0-9_]+$",    "maxLength": 64 },
"SectionId":       { "type": "string", "pattern": "^sec_[a-z0-9_]+$",     "maxLength": 64 },
"BlockId":         { "type": "string", "pattern": "^blk_[a-z0-9_]+$",     "maxLength": 64 },
"Version":         { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}(\\.dev\\d+)?$" },
"VersionedRef":    {
  "type": "string",
  "pattern": "^(q|os|ins|pr)_[a-z0-9_]+@v\\d{2}\\.\\d{4}(\\.dev\\d+)?$",
  "description": "A reusable-entity reference: {entity_id}@{version}"
}
```

#### `Expression` and `LanguageCode`

```jsonc
"Expression": {
  "type": "string",
  "minLength": 1,
  "maxLength": 1024,
  "$comment": "Expression grammar defined by the WASM evaluator (OD-11). Schema does not validate grammar; the Library performs static analysis before publish. Examples: 'q_phq9_1 > 2', 'contains(q_symptoms, \"severe\")', 'sum(scl_anxiety)'."
},
"LanguageCode": { /* same as in Schema 1 */ }
```

#### `Style` and `FlowInstrument`

`Style` cascades through Questionnaire → Block → Page → Section → Question (most-specific wins on shared keys). `FlowInstrument` is **root-only** (does not cascade).

```jsonc
"Style": {
  "type": "object",
  "properties": {
    "progress_bar":         { "type": "boolean" },
    "question_numbering":   { "enum": ["sequential", "per_page", "none"] },
    "label_visible":        { "type": "boolean" },
    "layout":               { "type": "string", "description": "Entity-specific: 'matrix' for Section, 'dropdown'/'toggle' for radio, etc." },
    "anchors_visible_only": { "type": "boolean" },
    "multiline":            { "type": "boolean" },
    "icon":                 { "type": "string" }
  },
  "patternProperties": { "^x_": {} },
  "additionalProperties": false
},

"FlowInstrument": {
  "type": "object",
  "properties": {
    "allow_back":       { "type": "boolean" },
    "require_complete": { "type": "boolean" },
    "randomize_pages":  { "type": "boolean" },
    "max_time_seconds": { "type": ["number", "null"], "minimum": 0 }
  },
  "patternProperties": { "^x_": {} },
  "additionalProperties": false
}
```

**Deployment-overridable subset** (`style.progress_bar`, `style.question_numbering`, `flow.max_time_seconds`) is enforced at the Viewer Service, not in Schema 2.

#### `Page`

```jsonc
"Page": {
  "type": "object",
  "required": ["id", "entries"],
  "properties": {
    "id":               { "$ref": "#/$defs/PageId" },
    "title":            { "type": "string" },
    "description":      { "type": "string" },
    "entries":          { "type": "array", "items": { "$ref": "#/$defs/PageEntry" }, "minItems": 1 },
    "show_if":          { "$ref": "#/$defs/Expression" },
    "randomize":        { "type": "boolean", "default": false },
    "max_time_seconds": { "type": ["number", "null"], "minimum": 0 },
    "style":            { "$ref": "#/$defs/Style" },
    "translations":     { "$ref": "#/$defs/InlineTranslations" }
  },
  "additionalProperties": false
},

"PageEntry": {
  "oneOf": [
    { "$ref": "#/$defs/Section" },
    { "$ref": "#/$defs/Question" },
    { "$ref": "#/$defs/QuestionReference" }
  ]
}
```

**`max_time_seconds` on Page and at Flow root:** both timers run; first to expire wins (runtime resolution).

#### `Section`

```jsonc
"Section": {
  "type": "object",
  "required": ["id", "questions"],
  "properties": {
    "id":                    { "$ref": "#/$defs/SectionId" },
    "title":                 { "type": "string" },
    "questions": {
      "type": "array",
      "items": {
        "oneOf": [
          { "$ref": "#/$defs/Question" },
          { "$ref": "#/$defs/QuestionReference" }
        ]
      },
      "minItems": 1
    },
    "show_if":               { "$ref": "#/$defs/Expression" },
    "randomize":             { "type": "boolean", "default": false },
    "shared_option_set":     {
      "oneOf": [
        { "$ref": "#/$defs/OptionSetReference" },
        { "$ref": "#/$defs/OptionSet" }
      ]
    },
    "style":                 { "$ref": "#/$defs/Style" },
    "translations":          { "$ref": "#/$defs/InlineTranslations" }
  },
  "additionalProperties": false
}
```

Sections cannot nest; cannot span pages (enforced by `PageEntry` containing Section, not Section containing Section).

#### `Block`

```jsonc
"Block": {
  "type": "object",
  "required": ["id", "page_ids"],
  "properties": {
    "id":          { "$ref": "#/$defs/BlockId" },
    "title":       { "type": "string" },
    "description": { "type": "string" },
    "page_ids":    { "type": "array", "items": { "$ref": "#/$defs/PageId" }, "minItems": 1, "uniqueItems": true },
    "show_if":     { "$ref": "#/$defs/Expression" },
    "randomize":   { "type": "boolean", "default": false },
    "translations":{ "$ref": "#/$defs/InlineTranslations" }
  },
  "additionalProperties": false
}
```

#### `Subscale`

```jsonc
"Subscale": {
  "type": "object",
  "required": ["id", "name", "question_ids"],
  "properties": {
    "id":           { "$ref": "#/$defs/SubscaleId" },
    "name":         { "type": "string" },
    "description":  { "type": "string" },
    "question_ids": { "type": "array", "items": { "$ref": "#/$defs/QuestionId" }, "minItems": 1, "uniqueItems": true },
    "weight_per_question": {
      "type": "object",
      "patternProperties": { "^q_[a-z0-9_]+$": { "type": "number" } },
      "additionalProperties": false
    },
    "translations": { "$ref": "#/$defs/InlineTranslations" }
  },
  "additionalProperties": false
}
```

#### `Question` polymorphism

Discriminated `oneOf` with one `$def` per type plus a `QuestionExtension` catch-all for IRI-typed extension questions.

```jsonc
"Question": {
  "oneOf": [
    { "$ref": "#/$defs/QuestionRadio" },
    { "$ref": "#/$defs/QuestionCheckbox" },
    { "$ref": "#/$defs/QuestionSlider" },
    { "$ref": "#/$defs/QuestionText" },
    { "$ref": "#/$defs/QuestionTextarea" },
    { "$ref": "#/$defs/QuestionRanking" },
    { "$ref": "#/$defs/QuestionDate" },
    { "$ref": "#/$defs/QuestionFile" },
    { "$ref": "#/$defs/QuestionDisplay" },
    { "$ref": "#/$defs/QuestionExtension" }
  ]
},

"QuestionBase": {
  "$comment": "Not used directly; shows the fields common to every Question variant.",
  "type": "object",
  "required": ["id", "type", "prompt"],
  "properties": {
    "id":         { "$ref": "#/$defs/QuestionId" },
    "type":       { "type": "string" },
    "prompt":     { "type": "string", "minLength": 1 },
    "required":   { "type": "boolean", "description": "OD-05 overridable at reference time." },
    "show_if":    { "$ref": "#/$defs/Expression", "description": "OD-05 overridable at reference time." },
    "validation": { "$ref": "#/$defs/PerQuestionValidation" },
    "style":      { "$ref": "#/$defs/Style" },
    "tags":       { "type": "array", "items": { "type": "string" } },
    "translations": { "$ref": "#/$defs/InlineTranslations" }
  }
},

"QuestionRadio": {
  "type": "object",
  "required": ["id", "type", "prompt", "properties"],
  "properties": {
    /* all QuestionBase fields */
    "id":           { "$ref": "#/$defs/QuestionId" },
    "type":         { "const": "radio" },
    "prompt":       { "type": "string", "minLength": 1 },
    "required":     { "type": "boolean" },
    "show_if":      { "$ref": "#/$defs/Expression" },
    "validation":   { "$ref": "#/$defs/PerQuestionValidation" },
    "style":        { "$ref": "#/$defs/Style" },
    "tags":         { "type": "array", "items": { "type": "string" } },
    "translations": { "$ref": "#/$defs/InlineTranslations" },
    "properties":   { "$ref": "#/$defs/RadioProperties" }
  },
  "additionalProperties": false
},

"RadioProperties": {
  "type": "object",
  "properties": {
    "option_set": {
      "oneOf": [
        { "$ref": "#/$defs/OptionSetReference" },
        { "$ref": "#/$defs/OptionSet" }
      ]
    },
    "randomize_options": { "type": "boolean", "default": false }
  },
  "required": ["option_set"],
  "additionalProperties": false
}
```

**Other Question$defs follow the same pattern.** Each declares `"type": { "const": "<core-name>" }` and has its own `<Type>Properties` $def.

```jsonc
"QuestionExtension": {
  "type": "object",
  "required": ["id", "type", "prompt"],
  "properties": {
    "id":           { "$ref": "#/$defs/QuestionId" },
    "type":         { "type": "string", "pattern": "^https://behaverse\\.org/types/[a-z0-9_]+$" },
    "prompt":       { "type": "string" },
    "required":     { "type": "boolean" },
    "show_if":      { "$ref": "#/$defs/Expression" },
    "validation":   { "$ref": "#/$defs/PerQuestionValidation" },
    "style":        { "$ref": "#/$defs/Style" },
    "tags":         { "type": "array", "items": { "type": "string" } },
    "translations": { "$ref": "#/$defs/InlineTranslations" },
    "properties":   { "type": "object", "description": "Shape not validated here; the extension type's manifest validates it." }
  },
  "additionalProperties": false
}
```

#### `QuestionReference` and other entity references

Per OD-05: only `required` and `show_if` are overridable. The `ref` field is `lowercase` (no `$`, no `@`) to avoid JSON Schema overload.

```jsonc
"QuestionReference": {
  "type": "object",
  "required": ["ref"],
  "properties": {
    "ref":      {
      "type": "string",
      "pattern": "^q_[a-z0-9_]+@v\\d{2}\\.\\d{4}(\\.dev\\d+)?$"
    },
    "required": { "type": "boolean" },
    "show_if":  { "$ref": "#/$defs/Expression" }
  },
  "additionalProperties": false
},

"OptionSetReference": {
  "type": "object",
  "required": ["ref"],
  "properties": {
    "ref": { "type": "string", "pattern": "^os_[a-z0-9_]+@v\\d{2}\\.\\d{4}(\\.dev\\d+)?$" }
  },
  "additionalProperties": false
},

"InstructionReference": {
  "type": "object",
  "required": ["ref"],
  "properties": {
    "ref": { "type": "string", "pattern": "^ins_[a-z0-9_]+@v\\d{2}\\.\\d{4}(\\.dev\\d+)?$" }
  },
  "additionalProperties": false
},

"PromptReference": {
  "type": "object",
  "required": ["ref"],
  "properties": {
    "ref": { "type": "string", "pattern": "^pr_[a-z0-9_]+@v\\d{2}\\.\\d{4}(\\.dev\\d+)?$" }
  },
  "additionalProperties": false
}
```

`additionalProperties: false` is the schema-level enforcement of OD-05: any attempt to inline-override `prompt`, `type`, `properties`, `validation`, etc. on a reference is rejected at validation time. This is the structural fork-trigger the Editor expects (design/05_data_model.md:227).

#### `OptionSet` (inline)

For inline option sets when not referenced from the Library:

```jsonc
"OptionSet": {
  "type": "object",
  "required": ["options"],
  "properties": {
    "id":         { "$ref": "#/$defs/OptionSetId" },
    "name":       { "type": "string" },
    "options": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["value", "text"],
        "properties": {
          "value": { "type": ["string", "number", "boolean"] },
          "text":  { "type": "string", "minLength": 1 },
          "icon":  { "type": "string" }
        },
        "additionalProperties": false
      },
      "minItems": 1
    },
    "translations": { "$ref": "#/$defs/InlineTranslations" }
  },
  "additionalProperties": false
}
```

#### `LogicRule`

```jsonc
"LogicRule": {
  "type": "object",
  "required": ["type", "condition", "action"],
  "properties": {
    "id":        { "type": "string", "pattern": "^[a-z][a-z0-9_]+$" },
    "type":      { "enum": ["skip", "visibility", "piping", "branch"] },
    "condition": { "$ref": "#/$defs/Expression" },
    "action": {
      "type": "object",
      "properties": {
        "skip_to":    { "type": "string" },
        "show":       { "type": "boolean" },
        "target_id":  { "type": "string" },
        "field_path": { "type": "string" },
        "source":     { "type": "string" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

Field semantics per `type`:
- `skip`: `action.skip_to = <page_id>` — skip to target when condition true
- `visibility`: `action.target_id = <id>`, `action.show: bool` — show/hide target
- `piping`: `action.field_path = "<dotted path>"`, `action.source = <question_id>` — substitute question's answer into target text
- `branch`: `action.skip_to = <page_id>` — navigate to non-default next page

The schema doesn't enforce per-type sub-field requirements via discrimination (would be verbose; runtime evaluator validates).

#### `ScoringDef` and `InterpretationBand`

```jsonc
"ScoringDef": {
  "type": "object",
  "required": ["id", "formula"],
  "properties": {
    "id":      { "type": "string", "pattern": "^[a-z][a-z0-9_]+$" },
    "name":    { "type": "string" },
    "formula": { "$ref": "#/$defs/Expression" },
    "range": {
      "type": "array",
      "prefixItems": [{ "type": "number" }, { "type": "number" }],
      "items": false,
      "minItems": 2,
      "maxItems": 2
    },
    "interpretation": {
      "type": "array",
      "items": { "$ref": "#/$defs/InterpretationBand" }
    },
    "translations": { "$ref": "#/$defs/InlineTranslations" }
  },
  "additionalProperties": false
},

"InterpretationBand": {
  "type": "object",
  "required": ["label"],
  "properties": {
    "min":      { "type": ["number", "null"] },
    "max":      { "type": ["number", "null"] },
    "label":    { "type": "string" },
    "severity": { "type": "string" }
  },
  "additionalProperties": false
}
```

**Bands array order-significant** (walk in order; first match wins). **Bands inclusive on both ends.** **Null sentinels** for unbounded bands. **`severity` open string** (preferred values documented in `schemas/questionnaire/README.md`).

Per user note: scoring shape is **experimental** and may need iteration once real examples surface.

#### `PerQuestionValidation` and `CrossQuestionValidationRule`

```jsonc
"PerQuestionValidation": {
  "type": "object",
  "properties": {
    "format": { "type": "string", "description": "Regex pattern. Validity of the regex itself is checked at runtime by the WASM evaluator." },
    "range": {
      "type": "array",
      "prefixItems": [
        { "type": ["number", "null"] },
        { "type": ["number", "null"] }
      ],
      "items": false,
      "minItems": 2, "maxItems": 2
    },
    "length": {
      "type": "array",
      "prefixItems": [
        { "type": ["integer", "null"] },
        { "type": ["integer", "null"] }
      ],
      "items": false,
      "minItems": 2, "maxItems": 2
    },
    "format_message": { "type": "string", "maxLength": 256 },
    "range_message":  { "type": "string", "maxLength": 256 },
    "length_message": { "type": "string", "maxLength": 256 }
  },
  "additionalProperties": false
},

"CrossQuestionValidationRule": {
  "type": "object",
  "required": ["id", "condition", "message"],
  "properties": {
    "id":        { "type": "string", "pattern": "^[a-z][a-z0-9_]+$" },
    "condition": { "$ref": "#/$defs/Expression",
                   "description": "Encodes the VIOLATION (fires-when-true), symmetric with LogicRule.condition." },
    "message":   { "type": "string", "maxLength": 256 },
    "targets":   { "type": "array", "items": { "$ref": "#/$defs/QuestionId" } }
  },
  "additionalProperties": false
}
```

**Crucial semantic:** `condition` encodes the **violation**, not the requirement. *"Q2 must be answered if Q1 = yes"* encodes as `"q_1 == 'yes' && is_empty(q_2)"`. The natural English requirement form is the *negation* of the condition. This keeps validation symmetric with `LogicRule.condition` (both fire-when-true).

**`required` lives at the Question's top level**, NOT inside `validation`. Reason: OD-05 says `required` IS overridable on a reference; the validation sub-object is NOT. Top-level placement lets `QuestionReference.additionalProperties: false` admit `required` while rejecting `validation`.

**Messages are translatable** via per-entity inline translations (the per-entity translations block can address `validation.format_message` / `validation.range_message` / `validation.length_message`).

#### `InlineTranslations` (per-entity, G1 status granularity)

```jsonc
"InlineTranslations": {
  "type": "object",
  "patternProperties": {
    "^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$": {
      "type": "object",
      "required": ["status", "fields"],
      "properties": {
        "status": { "enum": ["draft", "complete", "validated"] },
        "fields": {
          "type": "object",
          "description": "Sparse parallel mirror of the entity's translatable fields. Shape varies per parent entity type. additionalProperties:true here is the deliberate exception to the hybrid policy — strict shape validation per parent type is impractical without per-parent-typed translation $defs."
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

**Reusable entities translate themselves** (one source of truth per entity, in the Library). **References inherit** the entity's translations automatically — `QuestionReference.additionalProperties: false` structurally forbids re-declaring translations on a reference (OD-05).

**Questionnaire-level readiness** for serving in language L is computed by the Library/Viewer Service:

```
ready(L) := every-entity (self + referenced) has translations.L.status === "validated"
```

— aggregated across the dependency graph. Reusable entities are AND-ed in exactly once even if referenced 50 times. This is a cross-document concern; not enforced by Schema 2.

**Example: a radio question with inline translations**

```jsonc
{
  "id": "q_phq9_1",
  "type": "radio",
  "prompt": "Have you felt sad?",
  "properties": {
    "option_set": { "ref": "os_likert5@v26.0528" }
  },
  "translations": {
    "pt": {
      "status": "validated",
      "fields": {
        "prompt": "Você se sentiu triste?"
      }
    },
    "pt-BR": {
      "status": "validated",
      "fields": {
        "prompt": "Você se sentiu triste ou para baixo?"
      }
    },
    "es": {
      "status": "draft",
      "fields": {
        "prompt": "¿Se ha sentido triste?"
      }
    }
  }
}
```

The `os_likert5@v26.0528` option-set carries its own translations in the Library; this question doesn't redeclare them.

### 3.3 — Top-level `extensions` and `x_*` policy

Same hybrid as Schema 1.

```jsonc
"extensions": { "type": "object" }
/* plus */
"patternProperties": { "^x_": {} }
```

---

## 4 — JSON-LD `context.jsonld`

Each schema dir contains a `context.jsonld` mapping fields to standard vocabularies. Delivers OD-06's "Property URIs stable across versions" commitment.

### Sketch: `schemas/instrument/context.jsonld`

```jsonc
{
  "@context": {
    "@vocab":   "https://behaverse.org/schemas/instrument#",
    "instrument": "https://behaverse.org/schemas/instrument#",
    "schema":   "http://schema.org/",
    "dc":       "http://purl.org/dc/terms/",
    "datacite": "http://datacite.org/schema/kernel-4#",
    "xsd":      "http://www.w3.org/2001/XMLSchema#",

    "id":            "@id",
    "title":         { "@id": "dc:title" },
    "short_title":   { "@id": "schema:alternateName" },
    "description":   { "@id": "dc:description" },
    "language":      { "@id": "dc:language" },
    "available_languages": { "@id": "schema:inLanguage", "@container": "@set" },
    "version":       { "@id": "schema:version" },
    "authors":       { "@id": "schema:author", "@container": "@list" },
    "publication":   { "@id": "schema:isBasedOn" },
    "license":       { "@id": "dc:license" },
    "license_notes": { "@id": "schema:usageInfo" },
    "rights_holder": { "@id": "schema:copyrightHolder" },
    "request_url":   { "@id": "schema:url", "@type": "@id" },
    "classification": { "@id": "schema:about" },
    "psychometrics": { "@id": "instrument:psychometrics" },
    "usage":         { "@id": "instrument:usage" },
    "provenance":    { "@id": "instrument:provenance" },
    "timestamps":    { "@id": "instrument:timestamps" }
  }
}
```

### Sketch: `schemas/questionnaire/context.jsonld`

```jsonc
{
  "@context": {
    "@vocab":      "https://behaverse.org/schemas/questionnaire#",
    "questionnaire": "https://behaverse.org/schemas/questionnaire#",
    "instrument":  "https://behaverse.org/schemas/instrument#",
    "schema":      "http://schema.org/",
    "dc":          "http://purl.org/dc/terms/",

    "metadata":  { "@id": "instrument:metadata", "@context": "https://behaverse.org/schemas/instrument/context.jsonld" },
    "style":     { "@id": "questionnaire:style" },
    "flow":      { "@id": "questionnaire:flow" },
    "pages":     { "@id": "questionnaire:pages", "@container": "@list" },
    "blocks":    { "@id": "questionnaire:blocks", "@container": "@set" },
    "subscales": { "@id": "questionnaire:subscales", "@container": "@set" },
    "logic":     { "@id": "questionnaire:logic", "@container": "@set" },
    "scoring":   { "@id": "questionnaire:scoring", "@container": "@set" },
    "validation": { "@id": "questionnaire:validation", "@container": "@set" },

    "entries":     { "@id": "questionnaire:entries", "@container": "@list" },
    "questions":   { "@id": "questionnaire:questions", "@container": "@list" },
    "page_ids":    { "@id": "questionnaire:page_ids", "@container": "@set" },
    "question_ids": { "@id": "questionnaire:question_ids", "@container": "@set" },

    "ref":         { "@id": "questionnaire:ref", "@type": "@id" },
    "condition":   { "@id": "questionnaire:condition" },
    "action":      { "@id": "questionnaire:action" },
    "formula":     { "@id": "questionnaire:formula" },
    "interpretation": { "@id": "questionnaire:interpretation" }
  }
}
```

Field-by-field semantic-web mapping refinements are an iteration target; the day-one mapping above is good enough to deliver the URI-stability promise.

---

## 5 — Examples

### 5.1 — `schemas/questionnaire/examples/minimal.json`

The smallest valid questionnaire. Validates the schema floor.

```jsonc
{
  "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
  "metadata": {
    "id": "qst_minimal",
    "title": "Minimal example",
    "description": "Smallest valid questionnaire for schema CI.",
    "language": "en"
  },
  "pages": [
    {
      "id": "page_only",
      "entries": [
        {
          "id": "q_feel_good",
          "type": "radio",
          "prompt": "How do you feel today?",
          "properties": {
            "option_set": {
              "options": [
                { "value": 0, "text": "Bad" },
                { "value": 1, "text": "Neutral" },
                { "value": 2, "text": "Good" }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

### 5.2 — `schemas/questionnaire/examples/phq9.json`

Realistic PHQ-9 with subscale, scoring, interpretation bands, Portuguese translation. Uses inline questions (no reusable-entity refs — those require the Library to exist).

```jsonc
{
  "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
  "metadata": {
    "id": "qst_phq9",
    "title": "Patient Health Questionnaire-9",
    "short_title": "PHQ-9",
    "description": "Self-report measure of depression severity over the past 2 weeks.",
    "version": "v26.0528",
    "language": "en",
    "available_languages": ["en", "pt", "pt-BR"],
    "authors": [
      { "name": "Robert L. Spitzer" },
      { "name": "Janet B. W. Williams" },
      { "name": "Kurt Kroenke" }
    ],
    "publication": {
      "year": 2001,
      "citation": "Kroenke K, Spitzer RL, Williams JBW. The PHQ-9: Validity of a brief depression severity measure. J Gen Intern Med. 2001;16:606-613.",
      "doi": "10.1046/j.1525-1497.2001.016009606.x"
    },
    "license": "proprietary_open_redistribution",
    "rights_holder": "Pfizer Inc.",
    "classification": {
      "domain": ["depression", "screening"],
      "population": ["adults"],
      "age_range": [18, 99],
      "administration_mode": ["self_report"]
    },
    "psychometrics": {
      "item_count": 9,
      "estimated_minutes": 5,
      "reliability": [
        { "type": "cronbach_alpha", "value": 0.89, "population": "primary care", "sample_size": 6000 }
      ]
    },
    "translations": {
      "pt": {
        "status": "validated",
        "fields": {
          "title": "Questionário sobre Saúde do Paciente-9",
          "short_title": "PHQ-9",
          "description": "Medida de autorrelato de gravidade de depressão nas últimas 2 semanas."
        }
      },
      "pt-BR": {
        "status": "validated",
        "fields": {
          "title": "Questionário sobre Saúde do Paciente-9",
          "short_title": "PHQ-9",
          "description": "Autorrelato de gravidade da depressão nas últimas duas semanas."
        }
      }
    }
  },
  "pages": [
    /* 9 questions on a single page, each a radio with 4-point Likert + per-question translations */
  ],
  "subscales": [
    {
      "id": "scl_phq9_total",
      "name": "PHQ-9 Total",
      "question_ids": ["q_phq9_1", "q_phq9_2", "q_phq9_3", "q_phq9_4", "q_phq9_5", "q_phq9_6", "q_phq9_7", "q_phq9_8", "q_phq9_9"]
    }
  ],
  "scoring": [
    {
      "id": "total_score",
      "name": "Total score",
      "formula": "sum(scl_phq9_total)",
      "range": [0, 27],
      "interpretation": [
        { "min": 0,  "max": 4,  "label": "None to minimal", "severity": "none" },
        { "min": 5,  "max": 9,  "label": "Mild",            "severity": "mild" },
        { "min": 10, "max": 14, "label": "Moderate",        "severity": "moderate" },
        { "min": 15, "max": 19, "label": "Moderately severe", "severity": "moderately_severe" },
        { "min": 20, "max": 27, "label": "Severe",          "severity": "severe" }
      ]
    }
  ]
}
```

(Full file authored during implementation; this is the structural outline.)

### 5.3 — `schemas/questionnaire/examples/kitchensink.json`

Exercises every $def at least once: Block, Section with shared option-set, randomized Page, randomized Block, all 9 core Question types, QuestionExtension with IRI type, QuestionReference (`ref`-only and `ref + required + show_if`), Logic of each rule type, multi-band Scoring, Cross-question Validation, BCP-47 translations with mixed status. Goal: a single artefact that walks every schema path during validation.

### 5.4 — `schemas/instrument/examples/*.json`

Three small examples:
- `phq9_metadata.json` — questionnaire-style instrument
- `bdi2_metadata.json` — proprietary_restricted licensed instrument with publication details
- `ipt_metadata.json` — IRI-prefixed cognitive task (e.g. `id: "tsk_iat"`) to exercise the permissive prefix pattern

---

## 6 — Validator script

`tools/validate_schemas.py`:

```python
#!/usr/bin/env python3
"""Validates every example file against its schema. Exits non-zero on any failure.

Usage:
  python tools/validate_schemas.py
  python tools/validate_schemas.py --strict   # treat warnings as errors

The validator registers a URI resolver so cross-schema $refs
(e.g. https://behaverse.org/schemas/instrument/v26.0528/schema.json)
resolve to local files under schemas/.
"""
# Pseudocode outline:
# 1. Load both schemas (instrument, questionnaire) into a Registry with local URI mapping.
# 2. For each example in schemas/{instrument,questionnaire}/examples/, identify which schema applies (by directory).
# 3. Validate via jsonschema.Draft202012Validator(schema, registry=...).
# 4. Print one line per example: PASS / FAIL + path.
# 5. Exit code: 0 if all pass, 1 if any fail.
# 6. --strict adds: also fail if an example doesn't exercise novel $defs.
```

`tools/requirements.txt`:

```
jsonschema>=4.20.0
referencing>=0.30.0
```

CI integration deferred to Library scaffolding (out of this session's scope). The script is callable from the repo root: `python tools/validate_schemas.py`.

---

## 7 — Knock-on edits to existing design docs

These edits to `design/05_data_model.md` are required to make the design consistent with the spec:

| Line | Current text | Edit |
|---|---|---|
| 32–38 | URL table says `behaverse.org/schemas/questionnaire/metadata/vYY.MMDD.json` and `behaverse.org/schemas/questionnaire/definition/vYY.MMDD.json` | Update to `behaverse.org/schemas/instrument/vYY.MMDD/schema.json` and `behaverse.org/schemas/questionnaire/vYY.MMDD/schema.json` (Schema 1 renamed to Instrument; URL form matches bcsv pattern: version as path segment, filename `schema.json`) |
| 79–101 | Schema 1 required/optional table | Update to match §2.1's two-layer model. `description` moves to Required; `publication` and `version` move to Optional/publish-layer. |
| 84 | `language: ... ISO 639-1` | Update to BCP-47 |
| 87 | publication's optional fields include `license` | Remove `license` from publication (duplicates top-level) |
| 207 | Question: "Each question carries (at minimum): `id`, `type`, `prompt`, optional `required`, ..." | Note: `required` is *overridable on a reference* (OD-05); `validation` is not. |
| 214 | Library reference notation `{ "$ref": "q_depression_1@v26.0523" }` | Replace with `{ "ref": "q_depression_1@v26.0523" }` (lowercase, no `$`) |
| 217–225 | Override table | Confirm `required` is in the overridable column; `validation` (regex/range/length) is in the not-overridable column |
| 236 | Flow keys list includes `randomize_pages_in_block`, `randomize_questions_in_page`, `randomize_questions_in_section` | Remove these three array forms. Per-entity `randomize` is the only mechanism. Block gets a `randomize` field. |
| 247–251 | Translations: "A flat map keyed by `language → field-path → translated-text`" | Replace with: per-entity inline `translations` block; per-language status granularity; reusable entities translate once and references inherit. |
| 502 | "Translations are keyed by language only. pt-BR and pt-PT resolve to the same translation entries" | Replace with: "Translations may be keyed at any BCP-47 granularity. Runtime resolution falls back from specific to base to canonical." |
| 514 | Locale resolution precedence chain | The chain stays; the match step within each precedence level uses BCP-47 fallback. |

Additional editorial note: design/05_data_model.md's "open questions for Schema 2" section (lines 319–328) lists four open syntax questions — validation, logic, versioning, scoring. All four are resolved in this spec. The "open questions" section should be removed when the design doc is next updated.

---

## 8 — Areas flagged for revisit

User-flagged or self-flagged for iteration once real examples surface:

| Area | Why flagged | When to revisit |
|---|---|---|
| **Psychometrics shape** | "Still experimental; may need updates once we encounter real examples" (user note in Q16) | After migration of `survey_database/` content yields ≥10 instruments with full psychometric data |
| **Scoring interpretation bands** | "Still experimental; may need updates once we encounter real examples" (user note in Q17) | After PHQ-9, GAD-7, BDI-II are migrated and their cutoffs validated end-to-end |
| **Severity vocabulary** | Open string; preferred values documented but not enforced | After ≥20 scorings are catalogued; closed enum could be promoted if vocabulary stabilises |
| **Validity statistic type discrimination** | A `oneOf` per `validity.type` would tighten value-shape constraints (CFI vs correlation vs CVR) | After ≥10 instruments with diverse validity reporting are catalogued |
| **Per-page time limits beyond `max_time_seconds`** | Cognitive-test paradigms may need `time_per_trial_ms`, etc. | Phase 4 — Native Viewer + Embedded |
| **Logic rule per-`type` sub-action constraints** | Schema currently allows any combination of action sub-fields; runtime evaluator validates | After Web Viewer spike (HANDOFF.md #4) surfaces shape errors |

---

## 9 — Versioning + future evolution

- Current version of both schemas: **v26.0528** (today). Stamped in `$id` and in the schema's `version` body field.
- Archives go to `schemas/{name}/versions/v<YY.MMDD>/schema.json` when a new version supersedes the current.
- The `CHANGELOG.md` per schema records every version transition with a `severity` tag (`breaking` / `additive` / `corrective`) per `project_calver_versioning.md` auto-memory.
- **Property URIs are stable across versions** (per OD-06 + Behaverse policy). The JSON-LD `context.jsonld` is the contract that delivers this — fields keep their `@id` even as the JSON Schema bumps.
- When a future Cognitive-Task Definition schema is authored, it embeds the same `Instrument` Schema 1 via `$ref`. Schema 1 doesn't bump; the new Definition schema is born at its own version.

---

## 10 — Out of scope for this spec

- **Cross-document validation.** The Library's static analysis pass validates: (a) expression-referenced question IDs exist in `pages[]`; (b) `Subscale.question_ids` exist; (c) `Block.page_ids` exist; (d) reusable-entity refs (`q_*@v...`, `os_*@v...`, etc.) resolve in the Library; (e) interpretation bands don't overlap; (f) cross-questionnaire translation completeness. None of these are JSON Schema concerns.
- **The four other Schemas in the MVP.** Schemas 3 (Runtime), 4a (Event Data), 4b (Behavioural Channels), 5 (Response Data), 6 (Session Metadata) each get their own brainstorming + spec sessions later.
- **Editor authoring UI.** OD-03 says Editor preview shares the Web Viewer's renderer; authoring UI design is a separate session.
- **Library catalogue UI and API.** Specified in design/06_library.md; scaffolding tracked in HANDOFF.md #2.
- **WASM expression evaluator implementation.** OD-11. Tracked separately in HANDOFF.md #3.
- **Publication to behaverse.org/schemas/.** Local only for now; publication is a verbatim `cp` later.

---

## Appendix A — Locked decisions (21)

For quick reference and traceability.

| # | Decision | Locked answer |
|---|---|---|
| 1 | Schema 1 name + scope | **Instrument** (generic); Schema 2 stays **Questionnaire** (structural). Schema 1 embedded in Schema 2 at `metadata`. Library / Editor names unchanged today; broaden when a second instrument-definition schema arrives. |
| 2 | Folder names | `schemas/instrument/`, `schemas/questionnaire/` (short, bare). |
| 3 | `$id` URL form | `https://behaverse.org/schemas/{name}/v26.0528/schema.json` — version as path segment; matches bcsv. |
| 4 | JSON Schema dialect | **Draft 2020-12** (intentional divergence from behaverse/schemas' draft-07). |
| 5 | Schema 1 required floor | `{id, title, description, language}`; Library publish layer adds `{version, authors, license}`. |
| 6 | Schema 1 ↔ Schema 2 wiring | Inline embedding via cross-schema `$ref` at `metadata`. Self-contained instances. |
| 7 | `additionalProperties` policy | **Hybrid:** strict everywhere + `extensions{}` + `x_*` prefix safety valves. |
| 8 | Classification vocabularies | `domain`/`population`/`tags` open with registry; `administration_mode` closed enum; `age_range` numeric tuple. |
| 9 | Question polymorphism | **Discriminated `oneOf` with `$defs` per type**, plus `QuestionExtension` catch-all for IRI types. |
| 10 | Reference field name | **`ref`** (lowercase, no `$`, no `@`). Avoids JSON Schema overload. |
| 11 | Expression encoding | **String** (WASM evaluator parses; schema constrains length). |
| 12 | Translation encoding | **Per-entity inline (D)** with **per-language status (G1)**. Top-level `translations` block removed. |
| 13 | Reusable entity discipline | Entities translate themselves once; references inherit; structurally guaranteed by `additionalProperties: false` on `QuestionReference`. |
| 14 | Schema 1 id prefix policy | Permissive `^[a-z]+_[a-z0-9_]+$`; Schema 2 narrows embedded `metadata.id` to `^qst_[a-z0-9_]+$` via `allOf`. |
| 15 | `publication{}` shape | Optional at top level; if present, inner `year` + `citation` required. **`publication.license` removed** (duplicate of top-level). |
| 16 | `psychometrics{}` shape | All-optional sub-fields; open type strings on reliability/validity; norms array with population required per row. **Experimental**; revisit after real examples. |
| 17 | Scoring interpretation band shape | `{ min, max, label, severity? }` per band; null-sentinel unbounded; inclusive both ends; open severity vocab. **Experimental**; revisit. |
| 18 | Validation rule shape | `required` at Question top level (overridable); `validation` sub-object for format/range/length + messages (not overridable); cross-question `condition` encodes violation (fires-when-true). |
| 19 | Style/Flow constraints | Drop redundant `flow.randomize_*_in_*` arrays — per-entity `randomize` is the sole mechanism (Block gets one). Style cascades; Flow root-only. `max_time_seconds` on Page **and** Flow root. Deployment-overridable subset enforced at Viewer Service. |
| 20 | `context.jsonld` per schema | **Include** day-one. Aligns property URIs with OD-06 stability commitment; matches behaverse convention. |
| 21 | `LanguageCode` shape | **BCP-47 with hierarchical fallback**: `pt-BR → pt → canonical`. Authors pick granularity; runtime resolves. |

---

## Appendix B — Implementation order (preview for the writing-plans phase)

Suggested order; final plan written by `writing-plans` skill in the next phase:

1. `schemas/instrument/schema.json` (Schema 1, all of §2)
2. `schemas/instrument/context.jsonld`
3. `schemas/instrument/examples/*.json` (3 examples)
4. `tools/validate_schemas.py` + `requirements.txt`; verify the 3 Schema-1 examples pass
5. `schemas/questionnaire/schema.json` (Schema 2, all of §3)
6. `schemas/questionnaire/context.jsonld`
7. `schemas/questionnaire/examples/minimal.json` — verify the smallest case passes
8. `schemas/questionnaire/examples/phq9.json` — verify a realistic case passes
9. `schemas/questionnaire/examples/kitchensink.json` — verify every $def gets exercised
10. `schemas/README.md`, `schemas/VERSIONING.md`, per-schema `README.md` + `CHANGELOG.md`
11. Apply knock-on edits to `design/05_data_model.md` (§7 of this spec)

Estimated effort: 2–3 focused days for an implementer who follows the spec.

---

*Spec authored 2026-05-28 from a /grill-me session covering 21 design decisions across 11 question rounds. All decisions locked and traceable. Ready for the writing-plans phase.*

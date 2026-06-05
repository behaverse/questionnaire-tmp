# Schema 4a (Event Data) Authoring Spec

**Date drafted:** 2026-06-05
**Author:** OD-19 resolution committee (grilling session 2026-06-04 / 2026-06-05)
**Predecessor:** none — initial version.
**CalVer:** Schema 4a ships at v26.0605.
**Severity:** initial.
**Authoritative source documents:**
- [design/05e_events_vocabulary.md](../../../design/05e_events_vocabulary.md) — locked vocabulary (24 verbs / 15 object types / 5 actor types / ~50 extension keys)
- [design/05c_bdm_alignment.md](../../../design/05c_bdm_alignment.md) — BDM deviations (D4 namespace+vocabulary, D5 agent→actor, D6 scoping hierarchy)
- [design/05_data_model.md](../../../design/05_data_model.md) §"Schema 4a"

Per OD-19 (resolved 2026-06-05), Schema 4a uses our own `bdm:` namespace covering 24 verbs, 15 object types, 5 actor types, and ~50 extension keys. The JSON Schema validates the **vocabulary** strictly (controlled enums for verb / object.objectType / actor.objectType) while keeping extension keys open (any `bdm:*` key permitted with any value, since extensions are open-by-design per BDM/xAPI conventions).

---

## 1 — Folder layout

```
schemas/
├── ... (existing schemas)
└── events/                            # ← NEW (Schema 4a)
    ├── schema.json                    # JSON Schema (Draft 2020-12)
    ├── context.jsonld                 # JSON-LD context with bdm: + xapi: + schema: + as2: prefixes
    ├── README.md
    ├── CHANGELOG.md
    └── examples/
        ├── minimal_event.json         # smallest valid Event
        ├── phq9_event_stream.json     # realistic event stream (one PHQ-9 trial)
        ├── cognitive_event_stream.json # N-back trial event stream
        └── kitchensink_event_batch.json # exercises every verb, object, actor type
```

---

## 2 — Conventions (unchanged from prior schemas)

- JSON Schema Draft 2020-12.
- `additionalProperties: false` on project-owned objects; `^x_` patternProperties for forward-compat widening.
- CalVer in `$id`: `https://behaverse.org/schemas/events/v26.0605/schema.json`.
- **Vocabulary enums are STRICT** — `verb`, `object.objectType`, `actor.objectType` are enumerated; values outside the 05e inventory are rejected.
- **Extension keys are OPEN** — `result.extensions` and `context.extensions` accept any `bdm:*`-prefixed key with any value type. Per-key shape contracts are documented in 05e §4, not enforced by JSON Schema (matches xAPI's open-by-design extension model).

---

## 3 — Schema 4a top-level shape

Two top-level shapes, mirroring Schema 5's pattern:

1. **`Event`** — one event, one JSON object. Validates against `$defs.Event`. Emitted per-event by engines during a RuntimeInstance.
2. **`EventBatch`** — an object wrapping multiple events for batched export. Validates against `$defs.EventBatch`. Used for JSON-document batched delivery.

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id":     "https://behaverse.org/schemas/events/v26.0605/schema.json",
  "title":   "Behaverse Event Data (BDM Events extension)",
  "description": "Per OD-19 (resolved 2026-06-05), BDM Events vocabulary covering questionnaires, cognitive tasks, and video games under a single bdm: namespace.",
  "oneOf": [
    { "$ref": "#/$defs/Event" },
    { "$ref": "#/$defs/EventBatch" }
  ],
  "$defs": { "..." }
}
```

**Transport.** Per [05_data_model.md](../../../design/05_data_model.md) §Schema 4a: NDJSON in the wire format (one event per line). The JSON Schema validates one event at a time (the `Event` branch) or a batched JSON object containing multiple events (the `EventBatch` branch).

---

## 4 — `$defs.Event`

The base structure mirrors BDM Events (see [design/05_data_model.md](../../../design/05_data_model.md) and the BDM Events spec). Required fields tightened to the Behaverse profile (per OD-19a (β)): `actor`, `verb`, `object`, `timestamp` are required.

```jsonc
{
  "$id": "#/$defs/Event",
  "type": "object",
  "required": ["actor", "verb", "object", "timestamp"],
  "properties": {
    "version":    { "type": "string", "pattern": "^v\\d{2}\\.\\d{4}$",
                    "description": "BDM CalVer; populated by LRS." },
    "timestamp":  { "type": "string", "format": "date-time",
                    "description": "RFC9557 datetime with timezone offset." },
    "stored":     { "type": "string", "format": "date-time" },
    "updated":    { "type": "string", "format": "date-time" },
    "actor":      { "$ref": "#/$defs/Actor" },
    "verb":       { "$ref": "#/$defs/Verb" },
    "object":     { "$ref": "#/$defs/EventObject" },
    "result":     { "$ref": "#/$defs/Result" },
    "context":    { "$ref": "#/$defs/Context" },
    "authority":  { "type": "object" },
    "attachments":{ "type": "array", "items": { "type": "object" } }
  },
  "additionalProperties": false,
  "patternProperties": { "^x_": {} }
}
```

> **BDM upstream proposal D5 (per 05c).** BDM's current Events spec uses the field name `agent`; this schema uses `actor` to align with xAPI. Until D5 merges, our emission writes `actor`; if needing BDM-current-conformance, the Viewer Service's outbound adapter renames `actor` → `agent` at the boundary.

### 4.1 `Actor`

```jsonc
{
  "$id": "#/$defs/Actor",
  "type": "object",
  "required": ["objectType", "id"],
  "properties": {
    "objectType": {
      "type": "string",
      "enum": ["bdm:Agent", "bdm:Group", "bdm:Engine", "bdm:Orchestrator", "bdm:Researcher"]
    },
    "id":   { "type": "string" },
    "name": { "type": "string" }
  },
  "additionalProperties": false
}
```

### 4.2 `Verb`

The verb is a `bdm:`-prefixed CURIE; strict enum of 24 values per 05e §2.

```jsonc
{
  "$id": "#/$defs/Verb",
  "type": "string",
  "enum": [
    "bdm:initialized", "bdm:started", "bdm:paused", "bdm:resumed",
    "bdm:completed", "bdm:submitted", "bdm:abandoned",
    "bdm:presented",
    "bdm:clicked", "bdm:drag_and_dropped", "bdm:key_pressed", "bdm:typed",
    "bdm:selected", "bdm:deselected", "bdm:adjusted",
    "bdm:got_focus", "bdm:lost_focus", "bdm:consented",
    "bdm:trial_started", "bdm:trial_ended", "bdm:state_changed",
    "bdm:recording_started", "bdm:recording_ended",
    "bdm:navigated"
  ]
}
```

### 4.3 `EventObject`

```jsonc
{
  "$id": "#/$defs/EventObject",
  "type": "object",
  "required": ["objectType", "id"],
  "properties": {
    "objectType": {
      "type": "string",
      "enum": [
        "bdm:RuntimeInstance", "bdm:Screen", "bdm:Panel", "bdm:Stimulus",
        "bdm:Option", "bdm:Trial", "bdm:UIComponent", "bdm:Window",
        "bdm:Feedback", "bdm:ConsentForm", "bdm:Consent",
        "bdm:Recording", "bdm:Timer", "bdm:Scorer", "bdm:LocaleSwitch"
      ]
    },
    "id":   { "type": "string",
              "description": "Object IRI following https://behaverse.org/data-model/{object_type}/{id} pattern, or a relative id." },
    "name": { "type": "string" }
  },
  "additionalProperties": false
}
```

### 4.4 `Result`

```jsonc
{
  "$id": "#/$defs/Result",
  "type": "object",
  "properties": {
    "extensions": { "$ref": "#/$defs/BDMExtensions" }
  },
  "additionalProperties": true
}
```

(`additionalProperties: true` on Result because BDM's Result may carry xAPI-standard fields like `success`, `completion`, `score`, `duration` — we don't constrain those structurally; we use extensions for everything BDM-specific.)

### 4.5 `Context`

```jsonc
{
  "$id": "#/$defs/Context",
  "type": "object",
  "properties": {
    "extensions": { "$ref": "#/$defs/BDMExtensions" }
  },
  "additionalProperties": true
}
```

### 4.6 `BDMExtensions`

Open object — any `bdm:*` key with any value type. Per-key shape contracts documented in [05e_events_vocabulary.md](../../../design/05e_events_vocabulary.md) §4 but not enforced at the JSON Schema level (xAPI-style open extensions).

```jsonc
{
  "$id": "#/$defs/BDMExtensions",
  "type": "object",
  "patternProperties": {
    "^bdm:[a-z][a-z0-9_]*$": {}
  },
  "additionalProperties": false
}
```

---

## 5 — `$defs.EventBatch`

For batched JSON-document delivery (the NDJSON wire format is a sequence of individual `Event`s, validated one line at a time).

```jsonc
{
  "$id": "#/$defs/EventBatch",
  "type": "object",
  "required": ["events"],
  "properties": {
    "batch_id": { "type": "string", "description": "Optional batch identifier." },
    "events":   { "type": "array", "items": { "$ref": "#/$defs/Event" }, "minItems": 1 }
  },
  "additionalProperties": false,
  "patternProperties": { "^x_": {} }
}
```

---

## 6 — Examples (4 files)

### 6.1 `examples/minimal_event.json`

The smallest possible valid `Event`:

```jsonc
{
  "timestamp": "2026-06-05T14:30:00Z",
  "actor": {
    "objectType": "bdm:Agent",
    "id": "agent_001"
  },
  "verb": "bdm:initialized",
  "object": {
    "objectType": "bdm:RuntimeInstance",
    "id": "rt_550e8400"
  }
}
```

### 6.2 `examples/phq9_event_stream.json`

An `EventBatch` containing the event stream for **one PHQ-9 item trial** (per 05e §6.2 walkthrough):

```jsonc
{
  "batch_id": "phq9_trial_1_stream",
  "events": [
    { "timestamp": "...", "actor": {"objectType":"bdm:Engine", ...}, "verb": "bdm:trial_started",
      "object": {"objectType":"bdm:Trial","id":"..."},
      "context": {"extensions": {"bdm:trial_index": "1", ...}} },
    { "timestamp": "...", "actor": {"objectType":"bdm:Engine", ...}, "verb": "bdm:presented",
      "object": {"objectType":"bdm:Stimulus","id":"pr_phq9_1"} },
    { "timestamp": "...", "actor": {"objectType":"bdm:Agent", ...}, "verb": "bdm:clicked",
      "object": {"objectType":"bdm:UIComponent","id":"radio_1"} },
    { "timestamp": "...", "actor": {"objectType":"bdm:Agent", ...}, "verb": "bdm:selected",
      "object": {"objectType":"bdm:Option","id":"opt_phq9_freq_4"} },
    { "timestamp": "...", "actor": {"objectType":"bdm:Engine", ...}, "verb": "bdm:trial_ended",
      "object": {"objectType":"bdm:Trial","id":"..."},
      "result": {"extensions": {"bdm:response_id": 5701, "bdm:response_description": "Several days",
                                 "bdm:response_numeric": 1, "bdm:response_option_index": 1,
                                 "bdm:response_time": 4.197}} }
  ]
}
```

### 6.3 `examples/cognitive_event_stream.json`

An `EventBatch` for an N-back trial (per 05e §6.6 walkthrough):

```jsonc
{
  "events": [
    { "timestamp": "...", "verb": "bdm:trial_started", ...,
      "context": {"extensions": {"bdm:block_index": 2, "bdm:block_type": "test"}} },
    { "timestamp": "...", "verb": "bdm:presented",
      "object": {"objectType":"bdm:Stimulus","id":"letter_T"} },
    { "timestamp": "...", "verb": "bdm:key_pressed",
      "object": {"objectType":"bdm:UIComponent","id":"keyboard"},
      "result": {"extensions": {"bdm:key": "ArrowLeft", "bdm:key_code": 37}} },
    { "timestamp": "...", "verb": "bdm:trial_ended",
      "result": {"extensions": {"bdm:response_description":"ArrowLeft",
                                 "bdm:response_time": 0.432,
                                 "bdm:correct": true, "bdm:response_id": "R"}} }
  ]
}
```

### 6.4 `examples/kitchensink_event_batch.json`

A large `EventBatch` exercising **every verb at least once** and **most object types and actor types** — including a consent flow at the start, multiple concurrent recordings, a tab-switch with window-focus events, a paused/resumed cycle, a state_changed (locale switch), and a session lifecycle (initialized → started → completed → submitted). Used as the validator's coverage target.

---

## 7 — JSON-LD context

```jsonc
{
  "@context": {
    "@vocab":     "https://behaverse.org/schemas/events#",
    "bdm":        "https://behaverse.org/data-model/vocab/",
    "xapi":       "https://w3id.org/xapi/",
    "schema":     "http://schema.org/",
    "as2":        "https://www.w3.org/ns/activitystreams#",

    "actor":      { "@id": "https://behaverse.org/data-model/vocab/actor" },
    "verb":       { "@id": "https://behaverse.org/data-model/vocab/verb", "@type": "@id" },
    "object":     { "@id": "https://behaverse.org/data-model/vocab/object" },
    "objectType": { "@id": "@type" },
    "result":     { "@id": "https://behaverse.org/data-model/vocab/result" },
    "context":    { "@id": "https://behaverse.org/data-model/vocab/context" },
    "extensions": { "@id": "https://behaverse.org/data-model/vocab/extensions" },
    "events":     { "@id": "https://behaverse.org/schemas/events#events", "@container": "@list" }
  }
}
```

The `bdm:` prefix bound to a working URI base; final URI expansion is BDM's `@context` concern when the namespace is merged upstream.

---

## 8 — Validator extensions

`tools/validate_schemas.py` auto-detects `schemas/*/examples/` directories. Schema 4a's `events/` directory is picked up automatically. Three new project-side checks:

### 8.1 `check_event_verbs_in_vocabulary`

For each `Event` example, verify `verb` is in the 24-verb enum. (Redundant with schema validation, but provides a clean diagnostic when verbs are added without schema updates.)

### 8.2 `check_event_object_types_in_vocabulary`

For each `Event` example, verify `object.objectType` is in the 15-type enum and `actor.objectType` is in the 5-type enum.

### 8.3 `check_event_extension_key_prefixes`

For each `Event` example, walk `result.extensions` and `context.extensions`; verify every key matches `^bdm:` (warns on `x_` keys; flags errors on bare or other-prefixed keys).

These complement the schema-level validation by surfacing clean per-example diagnostics in the validator output.

---

## 9 — CHANGELOG entry (initial)

```markdown
## [v26.0605] — 2026-06-05

### Added (initial release)

- Initial JSON Schema (Draft 2020-12) for BDM Event Data per OD-19.
- Root oneOf: single `Event` (for per-event NDJSON-line emission) or `EventBatch` (for batched JSON-document delivery).
- Strict enums on `verb` (24 values), `object.objectType` (15 values), `actor.objectType` (5 values) per locked vocabulary in design/05e_events_vocabulary.md.
- Open `bdm:*` extension keys under `result.extensions` and `context.extensions` (xAPI-style open extensions; per-key shape contracts documented in 05e §4).
- Four examples: minimal_event, phq9_event_stream, cognitive_event_stream, kitchensink_event_batch.
- JSON-LD context with `bdm:`, `xapi:`, `schema:`, `as2:` prefixes.
- Three validator cross-checks: vocabulary enforcement for verbs, object types, and extension key prefixes.

### BDM deviations logged (per 05c_bdm_alignment.md)

- **D4** `bdm:` namespace + full 24-verb / 15-object-type / 5-actor-type vocabulary (this schema embodies the proposal).
- **D5** Field name `agent` → `actor` (xAPI alignment).
- **D6** Scoping hierarchy with Activity vs RuntimeInstance distinction (session_id / activity_id / activity_index / runtime_id context keys).

**Severity:** initial (no prior version).
**Authoritative source:** design/05e_events_vocabulary.md (locked vocabulary), design/05c_bdm_alignment.md (BDM deviations).
```

---

## 10 — Implementation order (15 tasks)

1. Skeleton schema + smoke tests.
2. `Verb` enum + tests.
3. `EventObject` (object types) + tests.
4. `Actor` (actor types) + tests.
5. `Result` / `Context` / `BDMExtensions` + tests.
6. Full `Event` root with all required fields + tests.
7. `EventBatch` + root oneOf + tests.
8. `minimal_event.json` example.
9. `phq9_event_stream.json` example.
10. `cognitive_event_stream.json` example.
11. `kitchensink_event_batch.json` example.
12. Validator: `check_event_verbs_in_vocabulary` + `check_event_object_types_in_vocabulary`.
13. Validator: `check_event_extension_key_prefixes`.
14. `context.jsonld` + CHANGELOG + README.
15. Final smoke + tag `events-v26.0605`.

---

## 11 — Out of scope for this spec

- **Schema 4b (Behavioural Channels)** — sibling schema for the recording attachment files. Not bundled here.
- **xAPI 2.0 strict-profile validation** — our schema is BDM-strict (under our bdm: vocabulary); xAPI compatibility is achieved via the Viewer Service's outbound BDM-to-xAPI adapter at the forwarding boundary, not in this schema.
- **NDJSON transport validation** — `schemas/events/schema.json` validates per-line Events or wrapped EventBatches. The NDJSON file format itself (newline-delimited) is a transport concern outside the JSON Schema.
- **Schema 4a → BDM Events adapter** — when BDM's `agent` field hasn't yet renamed to `actor`, the Viewer Service runs a one-line rename in its outbound serialiser. Out of scope for this schema.
- **Live conformance against the BDM Events spec** — once D4/D5/D6 land upstream, this schema becomes BDM-canonical. Until then, schema 4a validates the project's emission shape, and the BDM-alignment doc (05c) tracks the deviations.

---

## 12 — Locked decisions (OD-19 recap)

| Concern | Resolution |
|---|---|
| Vocabulary namespace | Own `bdm:` namespace; no juggling xAPI/Schema.org/AS2 in our emissions |
| Verbs | 24 across 6 layers (full enum in §4.2) |
| Object types | 15 (full enum in §4.3) |
| Actor types | 5 (full enum in §4.1) |
| Extensions | Open under `bdm:*` prefix; per-key types not enforced by JSON Schema |
| Root shape | `oneOf [Event, EventBatch]` mirroring Schema 5 |
| Required Event fields | `actor`, `verb`, `object`, `timestamp` (tighter than minimal xAPI) |
| BDM upstream changes | D4 (namespace+vocabulary), D5 (agent→actor), D6 (scoping hierarchy) — logged in 05c |

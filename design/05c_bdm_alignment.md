# 05c — BDM alignment & proposed upstream changes

**Status.** Live. **Owner:** Project owner is also the BDM model owner; this document feeds into BDM upstream change requests (issues / PRs on [github.com/behaverse/data-model](https://github.com/behaverse/data-model)).

This document tracks **every place where our Schema 5 (Response Data) and Schema 6 (Session Metadata) deviate from the [Behaverse Data Model](https://github.com/behaverse/data-model) (BDM) spec** — and what change to BDM would close each deviation. Per OD-17 (resolved 2026-06-02), Schema 5 commits to strict adherence to BDM's Response trial table. The deviations below are local exceptions, intentionally and individually justified.

The structure of this document is operational: each entry should be copy-pasteable into a BDM issue or PR by the owner when convenient.

---

## Deviation index

| # | Surface | BDM spec | Our value | Reason | Proposed BDM change |
|---|---|---|---|---|---|
| D1 | `Response.stimulus_id` | integer | string (synthetic id, e.g. `pr_phq9_1+ctx_phq9_intro+ins_likert_4`) | Integer FK into a separate Stimulus dictionary table is unergonomic for questionnaire data where stimuli are textual compositions of (Context, Instruction, Prompt). Synthetic string id is deterministic and self-describing. | Relax `stimulus_id` typing from `integer` to `string \| integer`, OR document a string-form convention for questionnaire instruments. |
| D2 | Scorer output location | (no BDM-defined home) | Our Schema 6 `scorer_outputs` field (keyed by CalVer-pinned `scr_…@vYY.MMDD`) | BDM has no session-level aggregate-scoring table. Per-questionnaire scorer outputs (e.g., `phq9_total: 12`, `phq9_severity: "moderate"`) are session-level facts that shouldn't repeat ×N on every Response row. | Add a BDM session-level "scoring outputs" table (or extend the existing session-metadata table) that holds aggregated scoring outputs per (session, scorer). Suggested column shape: `agent_id`, `session_id`/`session_index`, `scorer_id`, `scorer_version`, `output` (JSON), `computed_at`. |
| D3 | `Response.session_id` naming | column name `session_id`, typed `integer`, description text calls it "session_index" | Our `session_id` is UUID v4 (globally-unique session identity); we use a separate `session_index` column for the integer per-agent ordering. | Two-part change: (a) rename BDM's current `session_id` column to `session_index` to match its own description text; (b) add a new `session_id` column typed `string` (UUID v4) for globally-unique session identity. (a) is mechanical naming cleanup; (b) extends BDM with a globally-unique handle that downstream tooling needs anyway. |
| D4 | BDM Events vocabulary | BDM Events spec uses CURIE prefixes `xapi:`, `schema:`, `as2:` and gives an example verb `xapi:completed` but does not define a project-canonical events vocabulary. | We define our own `bdm:` namespace with a canonical Events vocabulary: 24 verbs across 6 layers, 15 object types, 5 actor types, ~50 extension keys (see [05e_events_vocabulary.md](05e_events_vocabulary.md)). Single-namespace replaces juggling xAPI/Schema.org/AS2. | Add the `bdm:` prefix definition to BDM's `@context` (suggested base URI: `https://behaverse.org/data-model/vocab/`). Register the full 05e vocabulary upstream as BDM-canonical Events vocabulary — verbs, object types, actor types, extension keys. Designed to cover questionnaires, cognitive tasks, and video games. |
| D5 | BDM Events base structure: `agent` field | BDM Events spec field name `agent` (defined as "extends xapi:actor") | We use `actor` as the field name (matching xAPI 2.0 terminology, where `Agent` is one *type* of Actor). | Rename BDM's Events-spec field `agent` → `actor` to align with xAPI terminology. The valid `Agent` type CURIE remains; it becomes one possible value of `actor.objectType` (alongside `Group`, `Engine`, `Orchestrator`, `Researcher` per 05e §3.1). |
| D6 | Scoping hierarchy in events | BDM Events spec has a `context` field but no documented sub-fields for Activity vs RuntimeInstance distinction; our prior D3 already addressed `session_id` semantics. | We add scoping context keys: `bdm:session_id` (study session), `bdm:activity_id` / `bdm:activity_index` (planned interaction, e.g., "complete PHQ-9"), `bdm:runtime_id` (specific runtime execution that distinguishes restarts). These form the hierarchy: Session → Activity → RuntimeInstance → Block → Trial. | Document the scoping hierarchy in BDM Events spec. The four-level hierarchy (`session_id`, `activity_id`, `activity_index`, `runtime_id`) lets analysts filter and group events at any level. Activity vs RuntimeInstance distinction is important for restartable instruments and for distinguishing the *plan* from the *execution*. |

Six deviations currently open. None are blocking; all have local workarounds documented below.

---

## D1 — `stimulus_id` typing (Response table)

**BDM (current).**
```yaml
- categories: [Stimulus]
  variable_name: stimulus_id
  required: true
  data_type: integer
  description: A unique identifier assigned to the stimulus.
```

**Our usage.** `stimulus_id` is a synthetic string id concatenating the Question-side entity ids in canonical order: Context (if any), Instruction (if any), Prompt. Plus-sign separator. Examples:

| Item composition | `stimulus_id` |
|---|---|
| Prompt only | `pr_phq9_1` |
| Context + Prompt | `ctx_phq9_intro+pr_phq9_1` |
| Context + Instruction + Prompt | `ctx_phq9_intro+ins_likert_4+pr_phq9_1` |
| Message (page element with no Question) | `msg_welcome` |

`stimulus_description` carries the concatenated text content of those parts (in the active locale).

The synthetic id is deterministic: same set of parts ⇒ same id, regardless of whether the Question is saved as a Library `q_…` entity or authored inline on a Page element. CalVer version pins are *not* part of the id — they live in a sidecar column (`stimulus_id_version` or in `additional_measures`).

**Why we deviate.** The integer-typed `stimulus_id` in BDM assumes a stimulus dictionary table (`2-stimulus.qmd`) where each stimulus is a row with a numeric primary key. That works for cognitive tests where stimuli are atomic (letter T, image, sound clip). Questionnaire stimuli are *compositional* — the same Prompt with a different Context is conceptually a different stimulus, and the same Context with a different Prompt is also a different stimulus. Forcing a hash-to-integer mapping loses readability without solving anything; readers want to recognise `pr_phq9_1+ctx_phq9_intro` immediately.

**Proposed upstream change.** Relax `data_type` from `integer` to `string | integer` (one of), OR document a questionnaire-specific string convention (e.g., `data_type: string` when `stimulus_type` is in a questionnaire-related enum value). Either form preserves the existing integer convention for cognitive-test data while permitting our usage.

---

## D2 — Session-level scorer outputs (no BDM home)

**BDM (current).** No session-level aggregate-scoring table or column exists. The Response table's Evaluation category has `score` (float, per-trial), `correct` (boolean, per-trial), `accuracy`, `evaluation_label` — all *per-response*. The Outcome category has `outcome_description` and `outcome_numeric` — also per-response.

**Our usage.** Per OD-16, a Scorer entity produces a *structured output object* per session (not per response). Example for PHQ-9:

```jsonc
{
  "scr_phq9@v26.0602": {
    "total":         12,
    "severity":      "moderate",
    "band":          { "min": 10, "max": 14, "label": "Moderate Depression" },
    "missing_count": 0
  }
}
```

Per OD-17g, this lives in **Schema 6 (Session Metadata)** under a `scorer_outputs` field. Schema 6 is our own design (not a BDM-defined surface), so we structure it natively. The per-row `score` and `correct` columns in BDM Response receive our per-item `scored_value` and Solution-bearing correctness — those mappings are clean.

**Why we deviate.** Putting session-aggregated scorer outputs on every Response row (in `additional_measures` as JSON string) would repeat the same JSON payload N times for an N-item questionnaire. That's storage waste and semantically wrong (per-row vs. per-session). A separate top-level CSV file would be a sibling to BDM Response but not a BDM-defined table. Schema 6 is the clean home; the deviation is that BDM has no equivalent we can lean on.

**Proposed upstream change.** Add a BDM session-level scoring-outputs surface. Suggested shape:

```yaml
# Hypothetical: spec/sessions/N-scoring.qmd
- variable_name: agent_id           # required
  data_type: string
- variable_name: session_id         # required (or session_index per D3)
- variable_name: study_name         # required (FK to Studies)
- variable_name: scorer_id          # required
  data_type: string
- variable_name: scorer_version     # required
  data_type: string                 # CalVer string
- variable_name: output             # required
  data_type: string                 # JSON-stringified structured output
- variable_name: computed_at        # required
  data_type: datetime
```

This would give cognitive-test users session-level aggregates (total accuracy, mean RT, etc.) and questionnaire users session-level scorer outputs — both via the same surface.

---

## D3 — `session_id` semantics and naming (Response + session-level surfaces)

**BDM (current).**
```yaml
- categories: [Context]
  variable_name: session_id
  required: true
  data_type: integer
  description: When there are multiple sessions, this variable indicates the order
    of each session (i.e., the first session completed by the subject has `session_index`
    = 1, the second session has `session_index` = 2 ...).
```

Note BDM's own description calls it `session_index` — the variable_name and the documented concept disagree on naming.

**Our usage.** Two distinct concepts under two distinct names:

- `session_id` — UUID v4. Globally unique. Generated at session-mint by the Viewer Service. Pinned across resume (per OD-14). Used as primary handle in storage, in OD-13 forwarding queues, in cross-system linkage.
- `session_index` — integer, 1-based, per-agent ordering of completed sessions. Computed at session-mint by counting prior completed sessions of the same `agent_id` in the same study.

Both are emitted in Schema 6. In Schema 5 (Response) rows, `session_index` is the BDM-aligned column (our deviation: we use the name `session_index`, not BDM's current `session_id`); `session_id` (UUID) is a sidecar column we emit alongside.

**Why we deviate.** Using UUID v4 in BDM's `session_id` column would break BDM's integer typing. Using BDM's integer in our `session_id` would lose globally-unique identity. Both are needed. Two columns under two names is the least-bad answer.

**Proposed upstream change.** Two-part change to BDM:

(a) **Rename `session_id` → `session_index`** in BDM's Response (and any other table that uses it). Mechanical; the description text already calls it `session_index`. Resolves an internal naming inconsistency in BDM itself.

(b) **Add `session_id` as a new column** typed `string` (UUID v4 by convention) for globally-unique session identity. Required where session-level cross-system linkage is needed; optional in pure local-CSV settings. This serves downstream tools (databases, longitudinal linkage, audit trails) that need a stable handle independent of agent-scoped ordering.

Together, (a) and (b) keep BDM's per-agent ordering semantic (now correctly named) and add the globally-unique-identity semantic that BDM lacks today.

---

## D4 — BDM Events vocabulary (`bdm:` namespace + 24 verbs + 15 object types + 5 actor types + extension keys)

**BDM (current).** The Events spec example uses `verb: "xapi:completed"` — i.e., verbs drawn from the pre-imported `xapi:`, `schema:`, `as2:` prefixes. There is no project-canonical events vocabulary documented in BDM; each consumer picks CURIEs from those three external vocabularies (or its own).

**Our usage.** OD-19 (resolved 2026-06-05) defines a complete Behaverse-canonical events vocabulary under a new `bdm:` namespace. See [05e_events_vocabulary.md](05e_events_vocabulary.md) for the full body. Summary:

- **24 verbs** across 6 layers: RuntimeInstance lifecycle (7), Presentation (1 polymorphic), Agent interactions (10), System events (3), Recording lifecycle (2), Navigation (1).
- **15 object types**: `RuntimeInstance`, `Screen`, `Panel`, `Stimulus`, `Option`, `Trial`, `UIComponent`, `Window`, `Feedback`, `ConsentForm`, `Consent`, `Recording`, `Timer`, `Scorer`, `LocaleSwitch`.
- **5 actor types**: `Agent`, `Group`, `Engine`, `Orchestrator`, `Researcher`.
- **~50 extension keys** spanning response data, scoping/hierarchy, environment, interaction-specific, lifecycle/navigation, feedback, consent, recording, state-change.

**Why we deviate.** Mixing xAPI/Schema.org/AS2 namespaces in BDM Events creates inconsistency (some verbs from one source, some from another), forces analysts to learn three vocabularies, and creates redundancies when concepts overlap across them. A single `bdm:` namespace gives Behaverse complete control over semantics, consistent naming, and one vocabulary to learn. Crucially, the vocabulary is designed to cover **multiple domains** — questionnaires, cognitive tasks, and (looking ahead) video games — under one consistent set of verbs, so the same downstream analytics tooling can process all of them.

**Proposed upstream change.** Add the `bdm:` prefix to BDM's Events `@context` (suggested expansion: `https://behaverse.org/data-model/vocab/`). Register the full 24-verb / 15-object-type / 5-actor-type / extension-key inventory upstream as the canonical BDM Events vocabulary. The full inventory is documented in [05e_events_vocabulary.md](05e_events_vocabulary.md) §2 (verbs), §3 (object types + actor types), §4 (extension keys), with worked use cases in §6 covering consent flows, single/multi-select questionnaires, text inputs, tab-switch handling, cognitive task trials, and concurrent multi-source recordings.

---

## D5 — BDM Events base structure: `agent` field rename → `actor`

**BDM (current).**
```yaml
- variable_name: agent
  data_type: str | dict
  description: The person or software that performed the action described by the event. Same as schema:agent, extends xapi:actor.
```

**Our usage.** OD-19 uses `actor` as the field name on each event, matching xAPI 2.0 terminology where `Agent` is one *type* of Actor (alongside `Group`, and our domain-specific types `Engine` / `Orchestrator` / `Researcher`).

**Why we deviate.** BDM's own description acknowledges the field "extends xapi:actor" — i.e., the underlying concept is xAPI's Actor. Naming the field `agent` is semantically inconsistent: an Agent is a specific *type* of Actor, not the umbrella category. Renaming to `actor` aligns the field name with the concept it represents and matches xAPI conventions cleanly.

**Proposed upstream change.** Rename BDM's Events-spec field `agent` → `actor`. Mechanical naming cleanup; no semantic change. The `Agent` CURIE type remains valid (it's now one possible value of `actor.objectType` rather than the field name itself). This rename pairs cleanly with the actor-type vocabulary introduced in D4 (`Agent` / `Group` / `Engine` / `Orchestrator` / `Researcher`).

---

## D6 — Scoping hierarchy: Activity vs RuntimeInstance distinction

**BDM (current).** BDM Response columns include `agent_id`, `session_id` (integer ordering, per D3), `activity_index`, `instrument_id`, `instrument_repetition`, `timeline_id`, `timeline_repetition`, `block_index`, `trial_index`. Events spec carries a `context` field but does not document a canonical sub-field set for the runtime-execution distinction.

**Our usage.** OD-19 introduces a four-level scoping hierarchy in events `context.extensions`:

```
Study session (bdm:session_id, optional, set by orchestrator)
  └ Activity (bdm:activity_id / bdm:activity_index — what is planned)
      └ RuntimeInstance (bdm:runtime_id — one specific runtime execution)
          └ Block (bdm:block_index / bdm:block_name / bdm:block_type)
              └ Trial (bdm:trial_index, one Schema 5 Response row)
```

The key new distinction is **Activity vs RuntimeInstance**:
- **Activity** = the *planned* interaction (e.g., "complete the PHQ-9"). Identified by `bdm:activity_id`; its order within the session by `bdm:activity_index`.
- **RuntimeInstance** = one specific *runtime execution* of an Activity. Distinguishes restarts: if the same Activity is restarted twice, there are two RuntimeInstances. Identified by `bdm:runtime_id`.

**Why we deviate.** BDM doesn't document a clean separation between "what was planned" and "what was actually executed (possibly multiple times)". `instrument_repetition` in BDM Response captures repetition counts but doesn't give each repetition a stable handle for cross-event grouping. Adding `runtime_id` as a stable identifier per runtime execution lets analysts group all events from one execution cleanly, distinct from re-runs.

**Proposed upstream change.** Document the four-level scoping hierarchy in BDM Events spec context. The four context keys (`session_id`, `activity_id`, `activity_index`, `runtime_id`) form a hierarchy that lets analysts filter and group events at any level. Activity vs RuntimeInstance distinction is critical for restartable instruments and for connecting *planning* metadata (which Activity was scheduled) with *execution* metadata (which RuntimeInstance(s) actually ran).

---

## Maintenance notes

- **When closing a deviation:** when BDM merges a change that resolves a deviation, remove the entry from §"Deviation index" and the corresponding detail section; note the closure in [CHANGELOG.md](../schemas/questionnaire/CHANGELOG.md) of the affected schema (or a forthcoming `schemas/response/CHANGELOG.md`).
- **When discovering a new deviation:** add an entry to §"Deviation index" with the next `D{n}` id and a full detail section below. Cross-reference the OD that produced the deviation.
- **Naming the surface:** Schemas 5 and 6 are *our* schemas; their files do not need to match BDM column names internally beyond the deviations listed here. The mapping from our internal field names to BDM column names is documented in the individual schema specs (TBD: `docs/superpowers/specs/...schema-5-design.md`).

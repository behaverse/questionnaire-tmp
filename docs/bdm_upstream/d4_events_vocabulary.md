# Add a canonical `bdm:` Events vocabulary (24 verbs / 15 object types / 5 actor types)

> **Suggested labels:** `spec:events`, `enhancement`, `vocabulary`
> **Target files:** `spec/events/index.qmd`, `assets/schemas/events.yaml`
> **Source:** questionnaire_apps design doc `design/05c_bdm_alignment.md`, deviation **D4** (full inventory in `design/05e_events_vocabulary.md`)
> **Cluster:** files with **D5** and **D6** as the Events-spec change set.

## Summary

The Events spec follows xAPI and draws verbs from the pre-imported `xapi:`, `schema:`, and `as2:` prefixes (the worked example uses `verb: "xapi:completed"`), but defines **no project-canonical events vocabulary** — each consumer picks CURIEs from those three external vocabularies or invents its own. We propose adding a single `bdm:` namespace with a complete, domain-spanning Events vocabulary.

## Current behaviour

`spec/events/index.qmd` documents the event structure and notes:

> The following prefixes are already imported in the BDM events schema: **xapi** (Experience API), **schema** (SchemaOrg), **as2** (ActivityStream 2).

The example verb is `xapi:completed`. There is no canonical verb / object-type / actor-type inventory.

## What we define

A complete Behaverse-canonical vocabulary under a new `bdm:` namespace:

- **24 verbs** across 6 layers: RuntimeInstance lifecycle (7), Presentation (1 polymorphic), Agent interactions (10), System events (3), Recording lifecycle (2), Navigation (1).
- **15 object types:** `RuntimeInstance`, `Screen`, `Panel`, `Stimulus`, `Option`, `Trial`, `UIComponent`, `Window`, `Feedback`, `ConsentForm`, `Consent`, `Recording`, `Timer`, `Scorer`, `LocaleSwitch`.
- **5 actor types:** `Agent`, `Group`, `Engine`, `Orchestrator`, `Researcher`.
- **~50 extension keys** spanning response data, scoping/hierarchy, environment, interaction-specific, lifecycle/navigation, feedback, consent, recording, and state-change.

The vocabulary is deliberately designed to cover **multiple domains** — questionnaires, cognitive tasks, and (looking ahead) video games — under one consistent set of verbs, so the same downstream analytics tooling can process all of them.

## Why a single `bdm:` namespace

Mixing xAPI / Schema.org / AS2 namespaces in Events creates inconsistency (some verbs from one source, some from another), forces analysts to learn three vocabularies, and creates redundancy when concepts overlap across them. One `bdm:` namespace gives Behaverse complete control over semantics, consistent naming, and one vocabulary to learn — across all three domains.

## Proposed change

1. Add the `bdm:` prefix to the Events `@context` (suggested expansion: `https://behaverse.org/data-model/vocab/`).
2. Register the full 24-verb / 15-object-type / 5-actor-type / extension-key inventory upstream as the canonical BDM Events vocabulary.

The full inventory (verbs §2, object types + actor types §3, extension keys §4) and worked use cases §6 — consent flows, single/multi-select questionnaires, text inputs, tab-switch handling, cognitive-task trials, concurrent multi-source recordings — are in `design/05e_events_vocabulary.md`; attach or paste that document when filing.

## Related

- **D5** — Events `agent` → `actor` field rename (the actor-type values above attach to `actor.objectType`).
- **D6** — the scoping-hierarchy context keys that accompany this vocabulary.

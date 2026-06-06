# Rename the Events `agent` field → `actor` (align with xAPI Actor)

> **Suggested labels:** `spec:events`, `enhancement`, `naming`, `breaking`
> **Target files:** `spec/events/index.qmd`, `assets/schemas/events.yaml`
> **Source:** questionnaire_apps design doc `design/05c_bdm_alignment.md`, deviation **D5**
> **Cluster:** files with **D4** and **D6** as the Events-spec change set.

## Summary

The Events base structure names the top-level actor field `agent`, while its own description says the field "extends xapi:actor." In xAPI 2.0, `Agent` is one *type* of Actor — not the umbrella category — so the field should be named `actor`. We propose a mechanical rename.

## Current behaviour

```yaml
# spec/events/index.qmd / assets/schemas/events.yaml
- variable_name: agent
  data_type: str | dict
  description: The person or software that performed the action described by the event.
    Same as schema:agent, extends xapi:actor.
```

## What we use

The field name `actor`. `Agent` becomes one possible value of `actor.objectType`, alongside `Group`, `Engine`, `Orchestrator`, and `Researcher` (the actor-type vocabulary introduced in **D4**).

## Why

BDM's own description acknowledges the field "extends xapi:actor" — the underlying concept *is* xAPI's Actor. Naming the field `agent` is semantically inconsistent: an Agent is a specific type of Actor, not the umbrella. Renaming to `actor` aligns the field name with the concept it represents and matches xAPI conventions cleanly.

## Proposed change

Rename the Events-spec field `agent` → `actor`. No semantic change. The `Agent` CURIE type remains valid — it becomes one possible value of `actor.objectType` rather than the field name itself. This pairs directly with the actor-type vocabulary in **D4** (`Agent` / `Group` / `Engine` / `Orchestrator` / `Researcher`).

This is a breaking field rename for emitters, but the migration is purely mechanical; a transition-window alias (`agent` → `actor`) could smooth adoption if desired.

## Related

- **D4** — the actor-type vocabulary that becomes `actor.objectType` values.
- **D6** — the events scoping-hierarchy context keys (same Events-spec change set).

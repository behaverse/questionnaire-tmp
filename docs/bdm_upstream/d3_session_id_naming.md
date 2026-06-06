# Rename `session_id` → `session_index`, and add a UUID `session_id`

> **Suggested labels:** `spec:trials`, `enhancement`, `naming`, `breaking`
> **Target files:** `spec/trials/1-response.qmd` (rendered from `assets/auto-generated/trials/response.yml`; type defined in `assets/schemas/trials.yaml`)
> **Source:** questionnaire_apps design doc `design/05c_bdm_alignment.md`, deviation **D3**

## Summary

BDM's Response `session_id` is typed `integer`, but its own description text calls the concept `session_index` — the variable name and the documented semantics disagree. Separately, downstream tooling needs a **globally-unique** session handle, which an integer per-agent ordering can't provide. We propose a two-part change: rename the existing column to match its semantics, and add a new UUID column for global identity.

## Current behaviour

```yaml
# assets/auto-generated/trials/response.yml
- categories: [Context]
  variable_name: session_id
  required: true
  data_type: integer
  description: When there are multiple sessions, this variable indicates the order
    of each session (i.e., the first session completed by the subject has `session_index`
    = 1, the second session has `session_index` = 2 ...).
```

Note: the description names the concept `session_index`, and `response.yml` additionally carries a maintainer remark that `session_name`, `session_id`, and `session_repetition` are not currently used — so the blast radius of renaming the integer column is small.

## What questionnaire/runtime data needs

Two distinct concepts under two distinct names:

- **`session_id`** — UUID v4, globally unique, generated at session-mint, pinned across resume, used as the primary handle in storage, in forwarding queues, and in cross-system linkage.
- **`session_index`** — integer, 1-based, per-agent ordering of completed sessions (computed by counting prior completed sessions of the same `agent_id` in the same study).

Using a UUID in BDM's integer `session_id` column would break the typing; using BDM's integer in our `session_id` would lose globally-unique identity. Both are needed.

## Proposed change

Two parts:

**(a) Rename `session_id` → `session_index`** in Response (and any other table that uses it). Mechanical; the description text already calls it `session_index`, and the column is noted as currently unused. Resolves an internal naming inconsistency in BDM itself.

**(b) Add a new `session_id` column typed `string`** (UUID v4 by convention) for globally-unique session identity. Required where session-level cross-system linkage is needed; optional in pure local-CSV settings. Serves databases, longitudinal linkage, and audit trails that need a stable handle independent of agent-scoped ordering.

Together, (a) keeps BDM's per-agent ordering semantic (now correctly named) and (b) adds the globally-unique-identity semantic BDM lacks today.

## Related

- **D2** — the proposed session-level scoring-outputs table keys on `session_id` / `session_index`.
- **D6** — `session_id` is the top of the proposed events scoping hierarchy.

# Document the session → activity → runtime → block → trial scoping hierarchy in Events

> **Suggested labels:** `spec:events`, `documentation`, `enhancement`
> **Target files:** `spec/events/index.qmd` (the `context` field), with reference to Response columns in `spec/trials/1-response.qmd`
> **Source:** questionnaire_apps design doc `design/05c_bdm_alignment.md`, deviation **D6**
> **Cluster:** files with **D4** and **D5** as the Events-spec change set.

## Summary

The Events `context` field carries study/studyflow/environment information but documents **no canonical sub-fields** distinguishing a *planned* interaction (Activity) from a *specific runtime execution* (RuntimeInstance). Restartable instruments need a stable per-execution handle so that all events from one run can be grouped cleanly, distinct from re-runs. We propose documenting a four-level scoping hierarchy in the Events context.

## Current behaviour

Response columns already include `agent_id`, `session_id` (integer ordering — see **D3**), `activity_index`, `instrument_id`, `instrument_repetition`, `timeline_id`, `timeline_repetition`, `block_index`, `trial_index`. The Events `context` field exists but documents no canonical sub-field set for the runtime-execution distinction. `instrument_repetition` counts repetitions but gives no stable per-execution handle for cross-event grouping.

## What we add

A four-level scoping hierarchy in events `context.extensions`:

```
Study session   (bdm:session_id   — optional, set by orchestrator)
  └ Activity     (bdm:activity_id / bdm:activity_index — what is planned)
      └ RuntimeInstance (bdm:runtime_id — one specific runtime execution)
          └ Block          (bdm:block_index / bdm:block_name / bdm:block_type)
              └ Trial      (bdm:trial_index — one Response row)
```

The key new distinction is **Activity vs RuntimeInstance**:

- **Activity** = the *planned* interaction (e.g. "complete the PHQ-9"). Identified by `bdm:activity_id`; its order within the session by `bdm:activity_index`.
- **RuntimeInstance** = one specific *runtime execution* of an Activity. Distinguishes restarts: if the same Activity is restarted twice, there are two RuntimeInstances. Identified by `bdm:runtime_id`.

(Consistent with the existing Response note that, in questionnaires, `block_index` may refer to distinct pages.)

## Why

BDM doesn't document a clean separation between "what was planned" and "what was actually executed (possibly multiple times)." `instrument_repetition` captures repetition counts but doesn't give each repetition a stable handle. Adding `runtime_id` as a stable identifier per runtime execution lets analysts group all events from one execution cleanly, distinct from re-runs.

## Proposed change

Document the four-level scoping hierarchy in the Events spec `context`. The four context keys (`session_id`, `activity_id`, `activity_index`, `runtime_id`) form a hierarchy that lets analysts filter and group events at any level. The Activity-vs-RuntimeInstance distinction is critical for restartable instruments and for connecting *planning* metadata (which Activity was scheduled) with *execution* metadata (which RuntimeInstance(s) actually ran).

## Related

- **D3** — `session_id` semantics (top of this hierarchy).
- **D4** / **D5** — same Events-spec change set.

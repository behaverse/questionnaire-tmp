# Add a session-level scoring-outputs surface

> **Suggested labels:** `spec`, `enhancement`, `questionnaires`, `scoring`
> **Target area:** no existing home — Response (`spec/trials/1-response.qmd`) is per-trial; there is no `spec/sessions/` area. Closest non-trial surfaces today are `spec/general/3-studyflows.qmd` and dataset cards.
> **Source:** questionnaire_apps design doc `design/05c_bdm_alignment.md`, deviation **D2**

## Summary

BDM has no session-level aggregate-scoring surface. The Response table's evaluation fields are all **per-trial** (`score`, `correct`, `accuracy`, `evaluation_label`, `outcome_description`, `outcome_numeric`). But many instruments produce a structured scoring result that is a **per-session** fact (e.g. a PHQ-9 total and severity band). There is nowhere in BDM to put it. We propose adding a session-level scoring-outputs table.

## Current behaviour

No session-level aggregate-scoring table or column exists. Per-trial evaluation lives on Response; there is no per-session equivalent.

## What questionnaire data needs

A scorer produces one **structured output object per session**, not per response. Example for PHQ-9:

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

We currently keep this in our own Session-Metadata schema under a `scorer_outputs` field, keyed by a CalVer-pinned scorer ref (`scr_…@vYY.MMDD`). The per-trial `score` / `correct` columns in Response still receive our per-item scored value and per-item correctness — those mappings are clean. The gap is purely the session-level aggregate.

## Why not put it on Response rows

Storing a session-aggregated scorer output on every Response row (e.g. as JSON in `additional_measures`) repeats the same payload N times for an N-item questionnaire — storage waste, and semantically wrong (per-row vs per-session).

## Proposed change

Add a BDM session-level scoring-outputs surface. Suggested column shape:

```yaml
# Hypothetical: a new session-level table (e.g. spec/sessions/…-scoring)
- variable_name: agent_id        # required
  data_type: string
- variable_name: session_id      # required (or session_index — see D3)
- variable_name: study_name      # required (FK to Studies)
- variable_name: scorer_id       # required
  data_type: string
- variable_name: scorer_version  # required (CalVer string)
  data_type: string
- variable_name: output          # required (JSON-stringified structured output)
  data_type: string
- variable_name: computed_at     # required
  data_type: datetime
```

This serves **both** communities through one surface: cognitive-test users get session-level aggregates (total accuracy, mean RT, …) and questionnaire users get session-level scorer outputs.

## Related

- **D3** — the key column (`session_id` / `session_index`) depends on the session-identity change proposed there.

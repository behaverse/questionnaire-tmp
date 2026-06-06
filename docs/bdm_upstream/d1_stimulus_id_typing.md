# Relax `Response.stimulus_id` typing from `integer` to `string | integer`

> **Suggested labels:** `spec:trials`, `enhancement`, `questionnaires`
> **Target files:** `spec/trials/1-response.qmd` (rendered from `assets/auto-generated/trials/response.yml`; type defined in `assets/schemas/trials.yaml`), context in `spec/trials/2-stimulus.qmd`
> **Source:** questionnaire_apps design doc `design/05c_bdm_alignment.md`, deviation **D1**

## Summary

`Response.stimulus_id` is typed `integer`, which assumes an integer foreign key into the Stimulus dictionary table (`spec/trials/2-stimulus.qmd`). That fits cognitive tests, where stimuli are atomic (a letter, an image, a sound clip). It does **not** fit questionnaire instruments, where a stimulus is a *composition* of textual parts. We propose relaxing the type so a deterministic, self-describing string id is permitted.

## Current behaviour

```yaml
# assets/auto-generated/trials/response.yml
- categories: [Stimulus]
  variable_name: stimulus_id
  required: true
  data_type: integer
  description: A unique identifier assigned to the stimulus.
```

## What questionnaire data needs

For questionnaires, `stimulus_id` is a synthetic **string** id concatenating the question-side entity ids in canonical order — Context (if any), Instruction (if any), Prompt — with a `+` separator:

| Item composition | `stimulus_id` |
|---|---|
| Prompt only | `pr_phq9_1` |
| Context + Prompt | `ctx_phq9_intro+pr_phq9_1` |
| Context + Instruction + Prompt | `ctx_phq9_intro+ins_likert_4+pr_phq9_1` |
| Message (page element with no question) | `msg_welcome` |

`stimulus_description` carries the concatenated text of those parts in the active locale. The id is deterministic — the same set of parts yields the same id whether the question is a saved library entity or authored inline. (Version pins live in a sidecar column, not in the id.)

## Why an integer doesn't work here

Questionnaire stimuli are compositional: the same Prompt with a different Context is conceptually a different stimulus, and vice-versa. Forcing a hash-to-integer mapping loses readability without solving anything — readers want to recognise `ctx_phq9_intro+pr_phq9_1` immediately, not look up integer `4271` in a dictionary.

## Proposed change

Relax `data_type` from `integer` to `string | integer` (one-of) — **OR** document a questionnaire-specific string convention (e.g. `data_type: string` when `stimulus_type` is in a questionnaire-related enum value).

Either form is **additive/backward-compatible**: existing integer usage for cognitive-test data is untouched; the union simply also admits the string form questionnaire instruments need.

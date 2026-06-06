# BDM upstream change requests

Copy-pasteable issue drafts for the six deviations our Schema 5 (Response) and Schema 6 (Session Metadata) take from the [Behaverse Data Model](https://github.com/behaverse/data-model) (BDM), one file per deviation. Generated from the authoritative source: [`design/05c_bdm_alignment.md`](../../design/05c_bdm_alignment.md). The project owner is also the BDM owner; these are ready to file as issues/PRs against `behaverse/data-model` when convenient.

**Status:** drafts only — nothing has been posted to GitHub.

## The six deviations

| File | Deviation | Surface | Substance |
|---|---|---|---|
| [d1_stimulus_id_typing.md](d1_stimulus_id_typing.md) | D1 | Response table | Relax `stimulus_id` from `integer` to `string \| integer` |
| [d2_session_scorer_outputs.md](d2_session_scorer_outputs.md) | D2 | (new) session level | Add a session-level scoring-outputs surface |
| [d3_session_id_naming.md](d3_session_id_naming.md) | D3 | Response table | Rename `session_id` → `session_index`; add UUID `session_id` |
| [d4_events_vocabulary.md](d4_events_vocabulary.md) | D4 | Events spec | Add `bdm:` namespace + 24-verb / 15-object-type / 5-actor-type vocabulary |
| [d5_agent_actor_rename.md](d5_agent_actor_rename.md) | D5 | Events spec | Rename `agent` field → `actor` |
| [d6_scoping_hierarchy.md](d6_scoping_hierarchy.md) | D6 | Events spec | Document session → activity → runtime → block → trial hierarchy |

## Dependencies & clusters

- **Events-spec cluster — D4, D5, D6** touch the same files (`spec/events/index.qmd`, `assets/schemas/events.yaml`). File them together or as one PR series; they cross-reference each other. D4 (vocabulary) is the anchor; D5 and D6 build on it.
- **D2 depends on D3** — the proposed session-level scoring table keys on the `session_id` / `session_index` columns D3 renames/adds.
- **D1 and D3** are independent Response-table changes; either can go first.

Suggested order: the mechanical/low-risk renames first (**D5**, **D3**), then the small widening (**D1**), then the additive surfaces (**D2**, **D4**, **D6**).

## Each file's format

Every draft starts with an `# H1` that is the **suggested issue title**, followed by a blockquote with suggested labels, the upstream target files, and the 05c source reference, then the issue body (Summary → Current behaviour → What we need → Why → Proposed change → Related).

## Filing one (when you're ready)

`gh` is authenticated and `behaverse/data-model` is reachable. To file a draft as an issue, use the H1 as the title and the file as the body:

```bash
gh issue create --repo behaverse/data-model \
  --title "Relax Response.stimulus_id typing from integer to string | integer" \
  --body-file docs/bdm_upstream/d1_stimulus_id_typing.md \
  --label "spec:trials,enhancement,questionnaires"
```

(The duplicated H1 in the body is harmless; strip it first if you prefer.) Confirm the labels exist in the upstream repo, or drop `--label`.

## When a deviation is accepted upstream

Per `design/05c_bdm_alignment.md` § "Maintenance notes": when BDM merges a change that closes a deviation, remove the entry from 05c's deviation index and detail section, delete the corresponding draft here, and note the closure in the affected schema's CHANGELOG.

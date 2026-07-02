# Design — multi-select replay reconstruction (emit + use option index)

- **Date:** 2026-07-02
- **Track:** QA / research tooling — replay (#7), first deferred RP3 follow-on
- **Branch:** `work/replay-multiselect`
- **Predecessor:** RP1/RP2/RP3-core (merged); this fixes the documented "multi-select answers are not
  reconstructed" limitation in [web-viewer/docs/replay.md](../../../web-viewer/docs/replay.md).

## Problem

The replay renderer reconstructs single-select and numeric answers, but a **multi-select (checkbox)** item
replays blank. Root cause: replay's `reconstruct` derives answers only from the `bdm:trial_ended` summary
event, and for multi-select that event carries no machine-readable per-option data — only a joined display
string in `bdm:response_description` (the per-option `indices`/`values` array is written to the Schema-5
response *row*, never the event). So `CheckboxGroup`, which needs an **array of selected option values**,
gets nothing.

The player already emits an ordered per-toggle stream — `bdm:selected` / `bdm:deselected`, one per option
click — but those events carry only the option's display **text** (`object.name`), not a machine-readable
index. Recovering values from text is fragile (locale-dependent; breaks on duplicate option texts).

## Decision

**Emit the option index on the selection events, and reconstruct the multi-select answer by replaying the
ordered `bdm:selected` / `bdm:deselected` stream.** Chosen (owner) over text-matching the display string.
This is **forward-only**: sessions recorded after this ships replay their checkboxes; already-recorded
multi-select sessions stay blank (documented). Single-select replay is unchanged.

## Scope

**In scope:**
1. Capture: add the option index to `bdm:selected` / `bdm:deselected` (`result.extensions["bdm:option_index"]`).
2. Replay: reconstruct a per-element selected-index set from that stream; render it as the multi-select array.
3. Tests (capture + reconstruct + ReplayView + e2e fixture) and a doc update.

**Out of scope:** single-select replay changes (works; its e2e must stay green); "momentary pre-commit
highlighting" of single-select changes (a separate deferred item, though this lays groundwork); any Schema-5
/ response-row changes; backfilling historical sessions.

## Data model / vocabulary

- New result-extension key **`bdm:option_index`** (integer) on the `bdm:selected` and `bdm:deselected`
  verbs, giving the 1-based option `index` of the toggled option. Additive to the open `result.extensions`
  map; symmetric with `trial_ended`'s existing `bdm:response_option_index`. Schema 4a (Event Data) is not
  yet authored (OD-19), so no schema version bump — this is a vocabulary addition to note, not a migration.
- The index is the questionnaire option `index` (as in `option.options[].index`), which
  `mergeOptions()` surfaces as `MergedChoice.index`.

## Components

### 1. Capture — [web-viewer/src/app/events.ts](../../../web-viewer/src/app/events.ts)

`selected` and `deselected` builders gain a trailing `optionIndex?: number` parameter. When defined, the
event carries `result: { extensions: { 'bdm:option_index': optionIndex } }`; when undefined (index could
not be resolved), the event is emitted unchanged (no extension) so nothing regresses.

### 2. Capture — [web-viewer/src/app/App.tsx](../../../web-viewer/src/app/App.tsx) (`handleAnswer`, ~445-457)

`choices = mergeOptions(opt, locale)` is already computed there. Resolve the toggled option's index with a
small helper `indexFor(v) = choices.find((ch) => ch.value === v)?.index` and pass it to `ev.selected` /
`ev.deselected` at all three call sites (added / removed / scalar). If `choices` is empty (missing-locale
degraded path, already handled by the surrounding try/catch), `indexFor` returns `undefined` and the
extension is omitted.

### 3. Replay — [web-viewer/src/replay/reconstruct.ts](../../../web-viewer/src/replay/reconstruct.ts)

- `RecAnswer` gains `selectedIndices?: number[]`.
- `stateAt(absMs)` already walks rows in timestamp order up to the cursor. Extend it: keep the running
  "current element" from `bdm:trial_started` (already tracked as `elementKey`); on `bdm:selected` with a
  numeric `ext["bdm:option_index"]`, add it to that element's answer `selectedIndices` set; on
  `bdm:deselected`, remove it. De-dupe (a set) and preserve insertion order for stable rendering.
- The existing `bdm:trial_ended` handling (optionIndex / numeric / description) is retained unchanged, so
  single-select and numeric keep working. When both are present for an element, `selectedIndices` is the
  multi-select signal used by ReplayView (see below); they do not conflict because a given element is
  either single- or multi-select.

### 4. Replay — [web-viewer/src/replay/ReplayView.tsx](../../../web-viewer/src/replay/ReplayView.tsx) (`toAnswerValue`)

For an element whose option is multiple-choice (`option.selection === 'multiple'`), if
`a.selectedIndices` is non-empty, map each index to its option `value`
(`opt.options.find((o) => o.index === idx)?.value` — the same lookup single-select already uses) and return
the resulting `value[]` array (dropping any unmapped indices). Otherwise fall through to the existing
single-value logic. `CheckboxGroup` receives the array and marks each matching choice `data-selected`.

### 5. Tests

- **reconstruct** ([reconstruct.test.ts](../../../web-viewer/src/replay/reconstruct.test.ts)): a stream of
  `trial_started(el)`, `selected(idx1)`, `selected(idx2)`, `deselected(idx1)` yields
  `stateAt(end).answers[el].selectedIndices === [2]`, and an intermediate cursor (after the two selects,
  before the deselect) yields `[1, 2]`. Absent-extension `selected` events are ignored gracefully.
- **ReplayView** ([ReplayView.test.tsx](../../../web-viewer/src/replay/ReplayView.test.tsx)): a
  multiple-choice element with `selectedIndices` renders exactly those options with `data-selected="true"`.
- **capture** (events/App test, wherever `ev.selected` emission is covered): a multi-select toggle emits
  `bdm:selected` with `result.extensions["bdm:option_index"]` equal to the option index; a toggle whose
  value has no resolvable index emits no extension.
- **e2e** ([tools/respondent-bot/tests/e2e/replay.spec.ts](../../../tools/respondent-bot/tests/e2e/replay.spec.ts)
  + its `replay-bundle.json` fixture): add a multi-select item to the fixture runtime plus
  `trial_started` / `selected` (×2, each with `bdm:option_index`) / `trial_ended` statements, and assert
  the two toggled checkboxes replay as `data-selected` at the end of the timeline. The existing
  single-select assertions stay.

### 6. Docs — [web-viewer/docs/replay.md](../../../web-viewer/docs/replay.md)

Replace the "multi-select answers are not reconstructed" limitation with: multi-select now reconstructs
from the ordered `bdm:selected`/`bdm:deselected` stream via `bdm:option_index`; **forward-only** — sessions
recorded before this shipped lack the index and replay blank.

## Testing strategy

- Unit (vitest): reconstruct + ReplayView + capture, per above. `cd web-viewer && npm test`.
- e2e (Playwright): `cd tools/respondent-bot && npm run e2e -- replay.spec.ts` (multi-select assertions
  added; single-select assertions retained).
- Type/lint: `cd web-viewer && npm run build` (and `npm run build:lib` since the renderer is a shared lib).

## Risks

- **Forward-only coverage.** Accepted + documented. Old multi-select recordings stay blank.
- **Index resolution at capture.** If the locale texts are missing, `mergeOptions` yields no choices and no
  index is emitted (extension omitted) — the toggle simply won't reconstruct. This mirrors the existing
  degraded path and is rare; no crash.
- **Renderer-lib rebuild.** The renderer ships as a lib consumed by the editor; run `build:lib` and keep the
  change confined to replay + capture so the editor is unaffected.

## Deliverables checklist

- [ ] `events.ts` selected/deselected carry `bdm:option_index` when known; `App.tsx` passes the resolved index.
- [ ] `reconstruct.ts` builds `selectedIndices` from the selected/deselected stream; single-select untouched.
- [ ] `ReplayView.tsx` renders the multi-select array from `selectedIndices`.
- [ ] Unit tests (reconstruct, ReplayView, capture) + e2e fixture/assertions; `npm test`, `npm run e2e`,
      `npm run build`, `npm run build:lib` all green.
- [ ] `web-viewer/docs/replay.md` limitation updated (forward-only note).
- [ ] FOLLOWUPS updated: mark "checkbox/multi-select reconstruction" done in `web-viewer/FOLLOWUPS.md`
      (+ the mirror line in `viewer-service/FOLLOWUPS.md` if present); refresh HANDOFF #7 remaining list.

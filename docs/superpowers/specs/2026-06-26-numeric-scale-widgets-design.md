# Numeric-scale widgets: slider + rating buttons (+ widget-id fix)

**Date:** 2026-06-26 · **Components:** `questionnaire-runtime-denormaliser/`, `web-viewer/` · **Status:** design (pre-implementation)

## Goal

Make `number.interval` / `number.ratio` scales render and reach participants, and present them well:
the 4 harvested slider scales (FSQ 1–7, RPS 1–9, SHS 1–7, SECS 0–100) currently **fail viewer
pre-flight** and never render, so their (correct, live) scorers are unreachable. Fix the root cause,
then render numeric scales as **rating buttons** (short integer scales) or a **slider** (wide/continuous
ranges), with an optional per-item author override.

## Root cause (confirmed)

The denormaliser derives a viewer widget id by joining all three option facets:
`questionnaire-runtime-denormaliser/src/denormaliser/manifest.py::_widget_triple` returns
`input.measurement.selection` with `selection` defaulting to `"single"`. So a `number`/`interval`
option (no `selection`) becomes **`number.interval.single`**. But the canonical widget vocabulary
(design/05a §13), the web-viewer renderer (`web-viewer/src/renderer/derive.ts`), and the viewer
manifest (`web-viewer/public/manifest.json`) all use **`number.interval`** — `selection` is a
*choice*-only facet. Pre-flight (`reconcile_manifest`) therefore rejects every number/text option as
`unsupported_widget`. (This affects any number/text option, not only the 4 sliders.)

## 1. Denormaliser fix

`_widget_triple(option)` → produce the canonical id, matching `derive.ts`:
- `choice` → `choice.{measurement}.{selection}` (selection defaults to `single`) — unchanged.
- `number` → `number.{measurement}`; `text` → `text.{measurement}` — **drop** the selection segment.
- anything else → `{input}.{measurement}` (best-effort; will simply not match the manifest → still flagged).

No manifest change. After this, `number.interval` / `number.ratio` (already in the manifest) pass
pre-flight.

## 2. Renderer presentation rule (web-viewer `ItemRenderer`)

For a `number.*` widget id, choose the component:

1. **Author hint** — if `element.style?.layout` is one of `slider` | `rating` | `input`, honour it.
2. **Auto fallback** (no/unknown hint):
   - bounded (`min` and `max` both set) **and** integer step **and** point-count `(max - min) / step + 1 ≤ 11` → **rating buttons**;
   - bounded but wider/finer (point-count > 11, or non-integer/absent step) → **slider**;
   - unbounded (missing `min` or `max`) → existing **NumberInput**.

Maps the current data with no edits: FSQ 1–7 (7), RPS 1–9 (9), SHS 1–7 (7) → rating buttons;
SECS 0–100 (101) → slider.

### Plumbing for the hint
Item-level `style` already survives denormalisation — the resolver (`resolve.py::resolve_refs`) passes
through **all** keys (no whitelist), and the strict runtime schema is permissive (no
`additionalProperties: false`). The only change needed is the **TS type**: add
`style?: { layout?: string }` to the runtime `ItemElement` (`web-viewer/src/renderer/types.ts`) so the
renderer can read `element.style?.layout` type-safely. Items without a hint use the auto fallback, so
the 4 current scales need no data changes.

## 3. New components (web-viewer `src/renderer/widgets/`)

- **`Slider.tsx`** — `<input type="range">` bound to `min` / `max` / `step`; a live numeric value
  readout; numeric end labels (`min` … `max`); `aria-label` from the prompt; emits the numeric value
  via `onChange`. Native range input → keyboard-accessible.
- **`NumberRating.tsx`** — a segmented row of numbered buttons for each value `min, min+step, … max`;
  `role="radiogroup"` with each button a `radio` (matches `RadioGroup` semantics + look); emits the
  numeric value. Wraps on narrow widths.

Both produce the same single numeric answer the scorers already consume (`logic/scoring.ts`); no
scorer or answer-shape change.

## 4. No manifest / viewer_version bump

Slider and rating buttons are **presentations of the existing `number.interval` / `number.ratio`
ids** — the manifest, pre-flight, and `viewer_version` are unchanged. (A `viewer_version` bump would
force every cached runtime to re-mint; explicitly avoided.)

## 5. Testing

- **Denormaliser** (`questionnaire-runtime-denormaliser/tests/`): `_widget_triple` returns
  `number.interval` / `text.nominal` (no `.single`) and `choice.nominal.single` (unchanged); a
  number-option fixture passes `reconcile_manifest` against a manifest listing `number.interval`.
- **web-viewer** (`src/renderer/`): unit tests for `Slider` (renders range with min/max/step, emits
  value) and `NumberRating` (renders the right buttons, radiogroup semantics, emits value); and
  `ItemRenderer` selection — 1–7 → rating, 0–100 → slider, `style.layout` override forces the choice,
  unbounded → NumberInput.

## 6. Deploy (go-live)

- **Viewer Service** bundles the denormaliser → **redeploy VS**, then **purge `runtime_cache`** for the
  4 questionnaires (documented op-gotcha: stale cached runtimes keep serving the old rejection).
- **Player (web-viewer)** redeploys for the new components.
- Verify: the 4 scales render (buttons / slider) in the live player and their scores compute.

## Files

| File | Change |
|---|---|
| `questionnaire-runtime-denormaliser/src/denormaliser/manifest.py` | EDIT — canonical `_widget_triple` |
| `questionnaire-runtime-denormaliser/tests/…` | EDIT — widget-triple + reconcile tests |
| `web-viewer/src/renderer/types.ts` | EDIT — `ItemElement.style?: { layout?: string }` (item style already flows through the resolver) |
| `web-viewer/src/renderer/widgets/Slider.tsx` | NEW |
| `web-viewer/src/renderer/widgets/NumberRating.tsx` | NEW |
| `web-viewer/src/renderer/widgets/*.test.tsx` | NEW/EDIT |
| `web-viewer/src/renderer/ItemRenderer.tsx` | EDIT — number-presentation selection |

## Out of scope (YAGNI)

- New widget ids / manifest entries / `viewer_version` bump.
- Semantic slider end labels (the data has only a single technical `label`; use numeric ends).
- Authoring the `style.layout` hint in the editor (renderer honours it; editor UI is a later task).
- Re-harvesting the 4 scales (auto fallback handles them).

# Numeric-scale Widgets (slider + rating buttons) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make `number.interval`/`number.ratio` scales pass viewer pre-flight and render well — as rating buttons (short integer scales) or a slider (wide ranges), with an optional per-item `style.layout` override.

**Architecture:** (1) Fix the denormaliser's widget-id derivation so number/text widgets get the canonical id (no `.single`) the manifest already lists. (2) In the web-viewer renderer, choose a presentation for `number.*` items via a pure helper (author hint → auto-by-range), backed by two new components. Presentation-only: no manifest or `viewer_version` change.

**Tech Stack:** Python 3 + pytest (denormaliser); React 19 + TypeScript + Vitest + React Testing Library (web-viewer renderer lib).

## Global Constraints

- **No manifest / `viewer_version` change.** Slider and rating buttons are presentations of the existing `number.interval` / `number.ratio` ids.
- **Canonical widget ids** (design/05a §13, matching `web-viewer/src/renderer/derive.ts`): `choice.{m}.{selection}`, `number.{m}`, `text.{m}` — `selection` is choice-only.
- **Auto rule:** bounded (`min` & `max` set) + integer `step` + point-count `(max-min)/step + 1 ≤ 11` → rating buttons; bounded but wider/finer → slider; unbounded → number input.
- **Hint values:** `style.layout` ∈ `slider | rating | input` overrides the auto rule.
- **Answer shape unchanged:** every numeric widget emits a single number (or null) — the scorers already consume this.
- web-viewer renderer commands run from `web-viewer/`: tests `npx vitest run <path>`, lib build `npm run build:lib`. Denormaliser: `cd questionnaire-runtime-denormaliser && python -m pytest <path>`.

---

## Task 1: Denormaliser widget-id fix

**Files:**
- Modify: `questionnaire-runtime-denormaliser/src/denormaliser/manifest.py` (`_widget_triple`)
- Test: `questionnaire-runtime-denormaliser/tests/test_manifest.py`

**Interfaces:**
- Produces: `_widget_triple(option: dict) -> str` returning the canonical id (number/text drop the selection segment).

- [ ] **Step 1: Write the failing tests** — append to `tests/test_manifest.py`:

```python
from denormaliser.manifest import _widget_triple


def test_widget_triple_number_drops_selection():
    assert _widget_triple({"input_data_type": "number", "measurement_type": "interval"}) == "number.interval"
    # selection present on a number option is ignored
    assert _widget_triple({"input_data_type": "number", "measurement_type": "ratio", "selection": "single"}) == "number.ratio"


def test_widget_triple_text_drops_selection():
    assert _widget_triple({"input_data_type": "text", "measurement_type": "nominal"}) == "text.nominal"


def test_widget_triple_choice_keeps_selection():
    assert _widget_triple({"input_data_type": "choice", "measurement_type": "nominal", "selection": "single"}) == "choice.nominal.single"
    assert _widget_triple({"input_data_type": "choice", "measurement_type": "nominal", "selection": "multiple"}) == "choice.nominal.multiple"
    # choice with no selection defaults to single
    assert _widget_triple({"input_data_type": "choice", "measurement_type": "ordinal"}) == "choice.ordinal.single"


def test_number_interval_passes_manifest_reconcile():
    ctx = make_ctx({"widgets": ["number.interval", "number.ratio"]})
    doc = _doc_with_option({"input_data_type": "number", "measurement_type": "interval", "min": 1, "max": 7, "step": 1})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd questionnaire-runtime-denormaliser && python -m pytest tests/test_manifest.py -q`
Expected: FAIL — current `_widget_triple` returns `number.interval.single`, so the asserts and the reconcile test fail.

- [ ] **Step 3: Implement the canonical derivation** — replace `_widget_triple` in `src/denormaliser/manifest.py`:

```python
def _widget_triple(option: dict) -> str:
    """Canonical viewer widget id (design/05a §13). `selection` is a CHOICE-only facet:
    choice → input.measurement.selection (default 'single'); number/text → input.measurement."""
    i = str(option.get("input_data_type"))
    m = str(option.get("measurement_type"))
    if i == "choice":
        s = str(option.get("selection", "single"))
        return f"{i}.{m}.{s}"
    return f"{i}.{m}"
```

(The function name `_widget_triple` is kept though it is no longer always a triple — it is referenced by `reconcile_manifest` in the same file.)

- [ ] **Step 4: Run to verify they pass**

Run: `cd questionnaire-runtime-denormaliser && python -m pytest tests/test_manifest.py -q`
Expected: PASS (new + existing manifest tests).

- [ ] **Step 5: Run the full denormaliser suite** (the id is used by golden/preflight tests)

Run: `cd questionnaire-runtime-denormaliser && python -m pytest -q`
Expected: PASS. If a golden/preflight fixture asserted the old `number.*.single` id, update that fixture's expected id to the canonical `number.*` (the new behaviour is correct); note any such change in your report.

- [ ] **Step 6: Commit**

```bash
git add questionnaire-runtime-denormaliser/src/denormaliser/manifest.py questionnaire-runtime-denormaliser/tests/test_manifest.py
git commit -m "fix(denormaliser): canonical widget id — number/text drop the choice-only selection segment"
```

---

## Task 2: `numberPresentation` helper (pure decision logic)

**Files:**
- Create: `web-viewer/src/renderer/numberPresentation.ts`
- Test: `web-viewer/src/renderer/numberPresentation.test.ts`

**Interfaces:**
- Produces: `numberPresentation(option: { min?: number; max?: number; step?: number }, layout?: string): 'slider' | 'rating' | 'input'`

- [ ] **Step 1: Write the failing test**

```typescript
// web-viewer/src/renderer/numberPresentation.test.ts
import { describe, it, expect } from 'vitest'
import { numberPresentation } from './numberPresentation'

describe('numberPresentation', () => {
  it('small bounded integer scales → rating', () => {
    expect(numberPresentation({ min: 1, max: 7, step: 1 })).toBe('rating')   // FSQ/SHS
    expect(numberPresentation({ min: 1, max: 9, step: 1 })).toBe('rating')   // RPS
    expect(numberPresentation({ min: 0, max: 10, step: 1 })).toBe('rating')  // 11 points (boundary)
  })
  it('wide or fine bounded ranges → slider', () => {
    expect(numberPresentation({ min: 0, max: 100, step: 1 })).toBe('slider') // SECS (101 pts)
    expect(numberPresentation({ min: 0, max: 5, step: 0.5 })).toBe('slider') // non-integer step
  })
  it('unbounded → input', () => {
    expect(numberPresentation({ step: 1 })).toBe('input')
    expect(numberPresentation({ min: 0 })).toBe('input')
  })
  it('a valid style.layout hint overrides the auto rule', () => {
    expect(numberPresentation({ min: 1, max: 7, step: 1 }, 'slider')).toBe('slider')
    expect(numberPresentation({ min: 0, max: 100, step: 1 }, 'rating')).toBe('rating')
    expect(numberPresentation({ min: 1, max: 7, step: 1 }, 'input')).toBe('input')
    expect(numberPresentation({ min: 1, max: 7, step: 1 }, 'matrix')).toBe('rating') // unknown hint ignored
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd web-viewer && npx vitest run src/renderer/numberPresentation.test.ts`
Expected: FAIL — cannot resolve `./numberPresentation`.

- [ ] **Step 3: Implement**

```typescript
// web-viewer/src/renderer/numberPresentation.ts
export type NumberPresentation = 'slider' | 'rating' | 'input'

const MAX_RATING_POINTS = 11

/** Pick how a number.* widget should render. A valid `layout` hint wins; otherwise: bounded
 *  small-integer scales become rating buttons, wider/finer bounded ranges a slider, and
 *  unbounded numbers a plain input. */
export function numberPresentation(
  option: { min?: number; max?: number; step?: number },
  layout?: string,
): NumberPresentation {
  if (layout === 'slider' || layout === 'rating' || layout === 'input') return layout
  const { min, max } = option
  if (min == null || max == null) return 'input'
  const step = option.step ?? 1
  const integerStep = Number.isInteger(step) && step > 0
  if (integerStep) {
    const points = (max - min) / step + 1
    if (points <= MAX_RATING_POINTS) return 'rating'
  }
  return 'slider'
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd web-viewer && npx vitest run src/renderer/numberPresentation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/renderer/numberPresentation.ts web-viewer/src/renderer/numberPresentation.test.ts
git commit -m "feat(web-viewer): numberPresentation helper (hint → auto-by-range)"
```

---

## Task 3: `Slider` component

**Files:**
- Create: `web-viewer/src/renderer/widgets/Slider.tsx`
- Test: `web-viewer/src/renderer/widgets/Slider.test.tsx`

**Interfaces:**
- Produces: `Slider({ label, min, max, step, value, onChange }: { label: string; min?: number; max?: number; step?: number; value: number | string | (number|string)[] | null; onChange: (v: number | null) => void })`

- [ ] **Step 1: Write the failing test**

```tsx
// web-viewer/src/renderer/widgets/Slider.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders a range input bound to min/max/step and shows end labels', () => {
    render(<Slider label="How happy" min={0} max={100} step={1} value={null} onChange={() => {}} />)
    const range = screen.getByRole('slider', { name: 'How happy' }) as HTMLInputElement
    expect(range).toHaveAttribute('type', 'range')
    expect(range.min).toBe('0'); expect(range.max).toBe('100'); expect(range.step).toBe('1')
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })
  it('emits the numeric value on change and shows a readout', () => {
    const onChange = vi.fn()
    render(<Slider label="How happy" min={0} max={100} step={1} value={42} onChange={onChange} />)
    const range = screen.getByRole('slider', { name: 'How happy' })
    expect(screen.getByText('42')).toBeInTheDocument()
    fireEvent.change(range, { target: { value: '55' } })
    expect(onChange).toHaveBeenCalledWith(55)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd web-viewer && npx vitest run src/renderer/widgets/Slider.test.tsx`
Expected: FAIL — cannot resolve `./Slider`.

- [ ] **Step 3: Implement**

```tsx
// web-viewer/src/renderer/widgets/Slider.tsx
type Props = {
  label: string
  min?: number
  max?: number
  step?: number
  value: number | string | (number | string)[] | null
  onChange: (value: number | null) => void
}

export function Slider({ label, min, max, step, value, onChange }: Props) {
  const current = typeof value === 'number' ? value : null
  const mid = min != null && max != null ? (min + max) / 2 : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="text-2xl font-semibold tabular-nums" aria-hidden>
        {current ?? '—'}
      </div>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={current != null ? String(current) : undefined}
        min={min}
        max={max}
        step={step}
        value={current ?? mid}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full max-w-md accent-[var(--qv-prompt-color,#18181b)]"
      />
      <div className="flex max-w-md justify-between text-sm text-zinc-500" aria-hidden>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd web-viewer && npx vitest run src/renderer/widgets/Slider.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/renderer/widgets/Slider.tsx web-viewer/src/renderer/widgets/Slider.test.tsx
git commit -m "feat(web-viewer): Slider widget for wide numeric ranges"
```

---

## Task 4: `NumberRating` component

**Files:**
- Create: `web-viewer/src/renderer/widgets/NumberRating.tsx`
- Test: `web-viewer/src/renderer/widgets/NumberRating.test.tsx`

**Interfaces:**
- Produces: `NumberRating({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step?: number; value: number | string | (number|string)[] | null; onChange: (v: number) => void })`

- [ ] **Step 1: Write the failing test**

```tsx
// web-viewer/src/renderer/widgets/NumberRating.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberRating } from './NumberRating'

describe('NumberRating', () => {
  it('renders a radiogroup with one button per value', () => {
    render(<NumberRating label="Agreement" min={1} max={7} step={1} value={null} onChange={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: 'Agreement' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(7)
    expect(screen.getByRole('radio', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '7' })).toBeInTheDocument()
  })
  it('marks the selected value and emits the number on click', async () => {
    const onChange = vi.fn()
    render(<NumberRating label="Agreement" min={1} max={7} step={1} value={4} onChange={onChange} />)
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(screen.getByRole('radio', { name: '6' }))
    expect(onChange).toHaveBeenCalledWith(6)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd web-viewer && npx vitest run src/renderer/widgets/NumberRating.test.tsx`
Expected: FAIL — cannot resolve `./NumberRating`.

- [ ] **Step 3: Implement**

```tsx
// web-viewer/src/renderer/widgets/NumberRating.tsx
type Props = {
  label: string
  min: number
  max: number
  step?: number
  value: number | string | (number | string)[] | null
  onChange: (value: number) => void
}

export function NumberRating({ label, min, max, step, value, onChange }: Props) {
  const s = step && step > 0 ? step : 1
  const values: number[] = []
  for (let v = min; v <= max + 1e-9; v += s) values.push(Number(v.toFixed(6)))
  const selected = typeof value === 'number' ? value : null
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {values.map((v) => {
        const isSel = selected === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={isSel}
            onClick={() => onChange(v)}
            data-selected={isSel}
            className={`min-w-[2.75rem] rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors ${
              isSel
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500'
            }`}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd web-viewer && npx vitest run src/renderer/widgets/NumberRating.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/renderer/widgets/NumberRating.tsx web-viewer/src/renderer/widgets/NumberRating.test.tsx
git commit -m "feat(web-viewer): NumberRating widget (segmented numbered buttons)"
```

---

## Task 5: Wire `ItemRenderer` + `ItemElement.style` type

**Files:**
- Modify: `web-viewer/src/renderer/types.ts` (`ItemElement`)
- Modify: `web-viewer/src/renderer/ItemRenderer.tsx`
- Modify: `web-viewer/src/renderer/ItemRenderer.test.tsx` (already exists — APPEND tests, do not recreate)

**Interfaces:**
- Consumes: `numberPresentation` (Task 2), `Slider` (Task 3), `NumberRating` (Task 4).

The existing test file uses **vitest globals** (`test(...)`, `vi.fn()` — no `describe`/`vi` import) and already imports `render, screen, fireEvent` from RTL and `ItemRenderer`, `ItemElement`. Match that style; do not add a duplicate `import`.

- [ ] **Step 1: Add `style` to `ItemElement`** in `web-viewer/src/renderer/types.ts`. The current type is:

```typescript
export type ItemElement = {
  id?: string
  question: Question
  option: OptionEntity
  required?: boolean
  show_if?: string
}
```

Add one field:

```typescript
export type ItemElement = {
  id?: string
  question: Question
  option: OptionEntity
  required?: boolean
  show_if?: string
  style?: { layout?: string }
}
```

- [ ] **Step 2: Write the failing tests** — APPEND to the existing `web-viewer/src/renderer/ItemRenderer.test.tsx` (reuses its already-imported `render`, `screen`, `ItemRenderer`, `ItemElement`, and the global `test`/`vi`):

```tsx
const numberItem = (option: Partial<ItemElement['option']>, style?: ItemElement['style']): ItemElement => ({
  id: 'it_n',
  question: { prompt: { content: { en: { text: 'Rate it' } } } },
  option: { input_data_type: 'number', measurement_type: 'interval', min: 1, max: 7, step: 1, ...option },
  style,
})

test('number 1–7 scale renders rating buttons (radiogroup)', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({})} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('radiogroup', { name: 'Rate it' })).toBeInTheDocument()
  expect(screen.getAllByRole('radio')).toHaveLength(7)
})
test('number 0–100 scale renders a slider', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({ min: 0, max: 100, step: 1 })} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('slider', { name: 'Rate it' })).toBeInTheDocument()
})
test('style.layout=slider hint overrides on a short scale', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({}, { layout: 'slider' })} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('slider', { name: 'Rate it' })).toBeInTheDocument()
})
test('unbounded number renders a plain number input (spinbutton)', () => {
  render(<ItemRenderer answerKey="n" element={numberItem({ min: undefined, max: undefined })} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('spinbutton', { name: 'Rate it' })).toBeInTheDocument()
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd web-viewer && npx vitest run src/renderer/ItemRenderer.test.tsx`
Expected: FAIL — number items currently all render `NumberInput` (a `spinbutton`), so the rating/slider assertions fail.

- [ ] **Step 4: Wire the number branch** in `web-viewer/src/renderer/ItemRenderer.tsx`. Add imports at the top:

```tsx
import { numberPresentation } from './numberPresentation'
import { Slider } from './widgets/Slider'
import { NumberRating } from './widgets/NumberRating'
```

Replace the existing `else if (kind.startsWith('number.'))` branch:

```tsx
      } else if (kind.startsWith('number.')) {
        widget = <NumberInput label={prompt} min={element.option.min} max={element.option.max} step={element.option.step} value={value} onChange={(v) => onAnswer(answerKey, v)} />
      } else {
```

with:

```tsx
      } else if (kind.startsWith('number.')) {
        const pres = numberPresentation(element.option, element.style?.layout)
        if (pres === 'slider') {
          widget = <Slider label={prompt} min={element.option.min} max={element.option.max} step={element.option.step} value={value} onChange={(v) => onAnswer(answerKey, v)} />
        } else if (pres === 'rating') {
          widget = <NumberRating label={prompt} min={element.option.min!} max={element.option.max!} step={element.option.step} value={value} onChange={(v) => onAnswer(answerKey, v)} />
        } else {
          widget = <NumberInput label={prompt} min={element.option.min} max={element.option.max} step={element.option.step} value={value} onChange={(v) => onAnswer(answerKey, v)} />
        }
      } else {
```

(`element.style` is now typed via Task 5 Step 1. `element.option.min!`/`max!` are non-null in the `rating` branch because `numberPresentation` only returns `rating` when both are set.)

- [ ] **Step 5: Run to verify it passes**

Run: `cd web-viewer && npx vitest run src/renderer/ItemRenderer.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Typecheck, full renderer tests, and rebuild the lib**

Run: `cd web-viewer && npx tsc -b && npx vitest run src/renderer/ && npm run build:lib`
Expected: tsc clean; all renderer tests pass; the lib builds (this refreshes `dist-lib/` consumed by the editor + player).

- [ ] **Step 7: Commit**

```bash
git add web-viewer/src/renderer/types.ts web-viewer/src/renderer/ItemRenderer.tsx web-viewer/src/renderer/ItemRenderer.test.tsx
git commit -m "feat(web-viewer): render number scales as slider / rating buttons via numberPresentation"
```

---

## Deploy (post-merge, manual — not a TDD task)

After the branch merges to master:

1. **Viewer Service** (bundles the denormaliser): redeploy — `scripts/redeploy-participant-stack.sh vs` (or the documented VS redeploy path).
2. **Purge `runtime_cache`** for the 4 questionnaires (FSQ/SECS/RPS/SHS) so they re-mint with the fixed widget id (documented op-gotcha — stale cached runtimes keep the old `unsupported_widget` rejection). `DELETE FROM runtime_cache` (or the scoped purge used by the scorer go-live).
3. **Player (web-viewer)** redeploys (Vercel auto-deploy on push) for the new components.
4. **Verify live:** open each of the 4 scales in the player (via Try-it/preview), confirm FSQ/RPS/SHS render as rating buttons and SECS as a slider, answer items, and confirm the scores compute.

---

## Self-Review (against spec)

- **§1 denormaliser fix** → Task 1 (`_widget_triple` canonical; tests incl. reconcile-passes). ✓
- **§2 presentation rule + hint plumbing** → Task 2 (`numberPresentation`) + Task 5 Step 1 (`ItemElement.style` type; item style already flows through the resolver). ✓
- **§3 components** → Task 3 (Slider), Task 4 (NumberRating). ✓
- **§4 no manifest/viewer_version bump** → no task touches the manifest. ✓
- **§5 testing** → denormaliser tests (Task 1), helper/component/ItemRenderer tests (Tasks 2–5). ✓
- **§6 deploy** → Deploy section (manual). ✓
- Threshold `≤ 11` consistent (spec §2 ↔ `MAX_RATING_POINTS` Task 2). Hint values `slider|rating|input` consistent across Tasks 2 & 5. Component prop signatures consistent between definition (Tasks 3/4) and use (Task 5).

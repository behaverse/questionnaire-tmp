# Slider (`t: range`) Harvester Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest PsyToolkit `t: range` (slider) questionnaires into canonical Schema-2 entities, adding the four native slider fields + unlabeled-ordinal-choices to the schema (`v26.0618`).

**Architecture:** Additive schema bump first (new Option display fields; relax choice-text), then harvester per-item options: a new `RawOption` lets each item carry its own number option; the parser handles `t: range`; the drafter builds `number` options and dedups them. Slider is `input_data_type: number` (ranges reach 0–100), never a discrete choice.

**Tech Stack:** Python 3, dataclasses, BeautifulSoup, jsonschema; pytest. Spec: `docs/superpowers/specs/2026-06-18-questionnaire-harvester-slider-support-design.md`.

## Global Constraints

- **Faithfulness (owner directive):** keep source text exactly; never normalise content to force reuse. Case/whitespace are cosmetic; real word/number differences must stay distinct.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** a concurrent agent may share this checkout. Work only in the isolated worktree (already created: `.claude/worktrees/slider-support`, branch `harvester-slider-0618`); merge via a throwaway master worktree. Never `git checkout master` in the main working dir.
- **Schema version:** target is `v26.0618`, severity `additive`. Current live `$id` is `v26.0609` (no snapshot dir yet).
- **Run commands from the worktree root** `.claude/worktrees/slider-support`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **Slider mapping:** `input_data_type="number"`, `measurement_type="interval"`, dimension default `"rating"`; `reverse` → `Prompt.reversed`; `center_label` exists in schema but PsyToolkit never emits a midpoint label.

---

### Task 1: Schema `v26.0618` — slider fields + unlabeled ordinal choices

**Files:**
- Create: `schemas/questionnaire/versions/v26.0609/schema.json` (snapshot of current live)
- Create: `schemas/questionnaire/versions/v26.0609/context.jsonld` (snapshot)
- Modify: `schemas/questionnaire/schema.json` (`$id`/`version`; `OptionBase` props; `OptionChoiceContent.required`)
- Modify: `schemas/questionnaire/CHANGELOG.md` (new entry)
- Create: `schemas/questionnaire/examples/library_examples/options/opt_slider_happiness.json`
- Create: `schemas/questionnaire/examples/library_examples/options/opt_unlabeled_ordinal.json`

**Interfaces:**
- Produces: Option schema accepting `min_label`/`max_label`/`center_label` (string), `initial_value` (number), and choice options whose `content` entries may omit `text`.

- [ ] **Step 1: Snapshot the current live schema** (the bump archives the *old* version)

```bash
cd .claude/worktrees/slider-support
mkdir -p schemas/questionnaire/versions/v26.0609
cp schemas/questionnaire/schema.json     schemas/questionnaire/versions/v26.0609/schema.json
cp schemas/questionnaire/context.jsonld  schemas/questionnaire/versions/v26.0609/context.jsonld
```

Note: do NOT add the new fields to `context.jsonld` — the existing `min`/`max`/`step` are not mapped there either; follow that precedent.

- [ ] **Step 2: Write the failing schema test** (an example exercising the new shapes)

Create `schemas/questionnaire/examples/library_examples/options/opt_slider_happiness.json`:

```json
{
  "id": "opt_slider_happiness",
  "dimension": "happiness",
  "input_data_type": "number",
  "measurement_type": "interval",
  "min": 1,
  "max": 7,
  "step": 1,
  "min_label": "not a very happy person",
  "max_label": "a very happy person",
  "initial_value": 5,
  "content": { "en": { "status": "validated", "label": "Subjective Happiness 1–7" } }
}
```

Create `schemas/questionnaire/examples/library_examples/options/opt_unlabeled_ordinal.json` (middle point has no `text`):

```json
{
  "id": "opt_unlabeled_ordinal",
  "dimension": "agreement",
  "input_data_type": "choice",
  "measurement_type": "ordinal",
  "selection": "single",
  "options": [
    { "index": 1, "value": 1 },
    { "index": 2, "value": 2 },
    { "index": 3, "value": 3 }
  ],
  "content": {
    "en": {
      "status": "validated",
      "options": [
        { "index": 1, "text": "disagree" },
        { "index": 2 },
        { "index": 3, "text": "agree" }
      ]
    }
  }
}
```

- [ ] **Step 3: Run the validator to verify it fails**

Run: `python tools/validate_schemas.py`
Expected: FAIL — `opt_slider_happiness` rejected (`min_label`/`max_label`/`center_label`/`initial_value` are `additionalProperties:false` on `OptionBase`); `opt_unlabeled_ordinal` rejected (`OptionChoiceContent` requires `text`).

- [ ] **Step 4: Add the four display fields to `OptionBase`**

In `schemas/questionnaire/schema.json`, inside `OptionBase.properties` (after the `"step"` line ~362), add:

```json
        "min_label":        { "type": "string", "minLength": 1 },
        "max_label":        { "type": "string", "minLength": 1 },
        "center_label":     { "type": "string", "minLength": 1 },
        "initial_value":    { "type": "number" },
```

- [ ] **Step 5: Relax `OptionChoiceContent` to allow unlabeled choices**

In `schemas/questionnaire/schema.json`, change `OptionChoiceContent.required` from `["index", "text"]` to `["index"]`:

```json
    "OptionChoiceContent": {
      "type": "object",
      "required": ["index"],
      "properties": {
        "index": { "type": "integer", "minimum": 1 },
        "text":  { "type": "string", "minLength": 1 }
      },
      "additionalProperties": false
    },
```

- [ ] **Step 6: Bump `$id` and `version` to `v26.0618`**

In `schemas/questionnaire/schema.json` change the `$id` line:

```json
  "$id": "https://behaverse.org/schemas/questionnaire/v26.0618/schema.json",
```

If a top-level `"version"` field exists, set it to `v26.0618` too (grep: `grep -n '"version"' schemas/questionnaire/schema.json`).

- [ ] **Step 7: Run the validator to verify it passes**

Run: `python tools/validate_schemas.py`
Expected: PASS — `All N example(s) passed.` (N = previous 44 + 2 new).

- [ ] **Step 8: Add the CHANGELOG entry**

Prepend under the title in `schemas/questionnaire/CHANGELOG.md` (above the `## [v26.0609]` section):

```markdown
## [v26.0618] — 2026-06-18

### Added (severity: additive)

- **Option slider display fields** — `min_label`, `max_label`, `center_label` (strings) and `initial_value` (number) on every Option. They describe a `number` option's endpoints / initial handle; a viewer renders a `number` option carrying `min_label`/`max_label` as a slider (no `slider` input_data_type). Existing instances stay valid.
- **Unlabeled ordinal choices** — `OptionChoiceContent.text` is now optional, so an ordinal scale may label only some choices (e.g. endpoints). Convention: nominal scales should still label every choice.

**Severity:** `additive`.
```

- [ ] **Step 9: Commit**

```bash
git add schemas/questionnaire
git commit -m "feat(questionnaire): v26.0618 — Option slider fields + unlabeled ordinal choices"
```

---

### Task 2: Harvester data model — per-item options (`raw.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/raw.py`
- Test: `questionnaire-harvester/tests/test_raw.py`

**Interfaces:**
- Produces: `RawOption` dataclass; `RawItem.option: RawOption | None`; `RawQuestionnaire.scale: RawScale | None`. `RawOption(input_data_type, measurement_type, dimension, selection=None, anchors=[], values=[], min=None, max=None, step=None, min_label=None, max_label=None, center_label=None, initial_value=None)`.

- [ ] **Step 1: Write the failing test**

Append to `questionnaire-harvester/tests/test_raw.py`:

```python
def test_raw_questionnaire_supports_per_item_number_option():
    from harvester.raw import RawQuestionnaire, RawOption
    from harvester.licensing import LicenseFlag
    rq = RawQuestionnaire(
        qst_id="qst_shs", title="SHS", short_title="SHS", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x/shs.html",
        instruction_text="Indicate the point on the scale.", scale=None,
        items=[{"text": "In general, I consider myself:",
                "option": {"input_data_type": "number", "measurement_type": "interval",
                           "dimension": "rating", "min": 1.0, "max": 7.0, "step": 1.0,
                           "min_label": "not a very happy person", "max_label": "a very happy person",
                           "initial_value": 5.0}}],
        license=LicenseFlag.unknown("https://x/shs.html"))
    assert rq.scale is None
    assert isinstance(rq.items[0].option, RawOption)
    assert rq.items[0].option.max == 7.0
    assert rq.items[0].option.min_label == "not a very happy person"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_raw.py::test_raw_questionnaire_supports_per_item_number_option -v`
Expected: FAIL — `cannot import name 'RawOption'`.

- [ ] **Step 3: Add `RawOption`, extend `RawItem`, make `scale` optional**

In `questionnaire-harvester/src/harvester/raw.py`, after the `RawScale` dataclass add:

```python
@dataclass
class RawOption:
    input_data_type: str
    measurement_type: str
    dimension: str
    selection: str | None = None
    anchors: list = field(default_factory=list)
    values: list = field(default_factory=list)
    min: float | None = None
    max: float | None = None
    step: float | None = None
    min_label: str | None = None
    max_label: str | None = None
    center_label: str | None = None
    initial_value: float | None = None
```

Replace the `RawItem` dataclass with:

```python
@dataclass
class RawItem:
    text: str
    construct: str | None = None
    reversed: bool = False
    option: "RawOption | None" = None

    def __post_init__(self):
        if isinstance(self.option, dict):
            self.option = RawOption(**self.option)
```

In `RawQuestionnaire`, change the `scale` field type annotation to `RawScale | None`, and in `__post_init__` guard the scale coercion (it already uses `isinstance(self.scale, dict)`, which safely skips `None` — leave as is).

- [ ] **Step 4: Run test to verify it passes**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_raw.py -v`
Expected: PASS (new test + existing raw tests).

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/raw.py questionnaire-harvester/tests/test_raw.py
git commit -m "feat(harvester): RawOption + per-item RawItem.option; scale optional"
```

---

### Task 3: Parse `t: range` blocks (`psytoolkit.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psytoolkit.py`
- Test: `questionnaire-harvester/tests/test_psytoolkit.py`

**Interfaces:**
- Consumes: `RawOption`, `RawItem` (Task 2); `_blocks` (existing).
- Produces: `_parse_range_brace(brace: str) -> dict`; `_parse_range_block(block_lines) -> (instruction_text, [RawItem])`; `parse()` returns a `RawQuestionnaire` with `scale=None` and per-item number options for `t: range` pages.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psytoolkit.py`:

```python
def test_parse_range_brace_params_and_flags():
    from harvester.sources.psytoolkit import _parse_range_brace
    p = _parse_range_brace("min=1,max=7,left=not happy,right=very happy,start=5,reverse")
    assert p["min"] == "1" and p["max"] == "7"
    assert p["left"] == "not happy" and p["right"] == "very happy"
    assert p["start"] == "5" and p["reverse"] is True


def test_parse_range_block_builds_number_options():
    from harvester.sources.psytoolkit import _parse_range_block
    block = [
        "l: shs",
        "t: range",
        "q: Indicate the point on the scale.",
        "- {min=1,max=7,left=not a very happy person,right=a very happy person} In general, I consider myself:",
        "- {min=1,max=7,left=not at all,right=a great deal,reverse} To what extent does this describe you?",
    ]
    instr, items = _parse_range_block(block)
    assert instr == "Indicate the point on the scale."
    assert len(items) == 2
    assert items[0].text == "In general, I consider myself:"
    assert items[0].option.input_data_type == "number"
    assert items[0].option.measurement_type == "interval"
    assert items[0].option.min == 1.0 and items[0].option.max == 7.0 and items[0].option.step == 1.0
    assert items[0].option.min_label == "not a very happy person"
    assert items[0].option.max_label == "a very happy person"
    assert items[1].reversed is True


def test_parse_range_item_missing_minmax_refused():
    from harvester.sources.psytoolkit import _parse_range_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_range_block(["l: x", "t: range", "- {left=lo,right=hi} no range here"])


def test_parse_full_range_page_via_public_surface():
    dsl = ("l: shs\nt: range\nq: Indicate the point on the scale.\n"
           "- {min=1,max=7,left=not a very happy person,right=a very happy person} In general, I consider myself:\n")
    html = f"<html><h1>Subjective Happiness Scale (SHS)</h1><pre>{dsl}</pre></html>"
    rq = PsyToolkitAdapter().parse(html, "https://x/happiness-shs.html")
    assert rq.qst_id == "qst_shs"
    assert rq.scale is None
    assert len(rq.items) == 1
    assert rq.items[0].option.max == 7.0
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -k range -v`
Expected: FAIL — `_parse_range_brace` / `_parse_range_block` not defined.

- [ ] **Step 3: Add the range parsers**

In `questionnaire-harvester/src/harvester/sources/psytoolkit.py`, import `RawOption` (extend the existing raw import):

```python
from harvester.raw import RawQuestionnaire, RawScale, RawItem, RawOption
```

Add these module-level functions after `_parse_block` (around line 121):

```python
def _parse_range_brace(brace: str) -> dict:
    """Parse a `{min=1,max=7,left=...,right=...,start=5,reverse}` item brace.
    `key=value` pairs become strings; bare flags (e.g. `reverse`) become True.
    PsyToolkit separates params by comma, so labels never contain commas."""
    params: dict = {}
    for part in brace.split(","):
        part = part.strip()
        if "=" in part:
            k, v = part.split("=", 1)
            params[k.strip()] = v.strip()
        elif part:
            params[part] = True
    return params


def _parse_range_block(block_lines):
    """From a `t: range` block, return (instruction_text, [RawItem with .option]).

    Each `-` item carries its own number option (min/max/step + left/right labels).
    Refuses (PsyToolkitParseError) a range item whose brace lacks min/max."""
    q_parts, items, in_q = [], [], False
    for ln in block_lines[1:]:
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            text = re.sub(r"^-\s*", "", s)
            m = re.match(r"^\{([^}]*)\}\s*(.*)", text)
            if not m:
                continue
            params = _parse_range_brace(m.group(1))
            stem = m.group(2).strip()
            if "min" not in params or "max" not in params:
                raise PsyToolkitParseError("range item missing min/max")
            if not stem:
                continue
            opt = RawOption(
                input_data_type="number", measurement_type="interval", dimension="rating",
                min=float(params["min"]), max=float(params["max"]),
                step=float(params["step"]) if "step" in params else 1.0,
                min_label=params.get("left") or None, max_label=params.get("right") or None,
                initial_value=float(params["start"]) if "start" in params else None)
            items.append(RawItem(text=stem, reversed=bool(params.get("reverse")), option=opt))
        elif re.match(r"^[a-z]:", s):
            if s.startswith("q:"):
                q_parts, in_q = [s[2:].strip()], True
            else:
                in_q = False
        elif in_q and s.strip():
            q_parts.append(s.strip())
    return " ".join(p for p in q_parts if p), items
```

- [ ] **Step 4: Branch `parse()` to handle range when no scale is present**

In `parse()`, replace the scale-detection block. Find (lines ~146-178):

```python
        # --- find the scale(s) actually used by `t: scale` question blocks ---
        blocks = _blocks(dsl)
        used = []
        for b in blocks:
            for ln in b:
                bm = re.match(r"^t:\s*scale\s+(\S+)", ln)
                if bm and bm.group(1) not in used:
                    used.append(bm.group(1))
        if not used:
            raise PsyToolkitParseError("no `t: scale` question block found")
        if len(used) > 1:
            # genuinely multi-scale: can't be represented as one single-scale questionnaire
            raise PsyToolkitParseError(f"multiple distinct scales {used} — needs manual handling")
        scale_name, anchors, values = _parse_scale(dsl, used[0])

        # merge items from ALL blocks that use this scale (multi-page single-scale);
        # take the instruction from the first such block
        instruction_text, items = None, []
        for b in blocks:
            if any(re.match(rf"^t:\s*scale\s+{re.escape(scale_name)}\b", ln) for ln in b):
                instr, its = _parse_block(b)
                if instruction_text is None:
                    instruction_text = instr
                items.extend(its)
        if not items:
            raise PsyToolkitParseError("question block has no items")

        # peel a leading temporal frame ("Over the last 2 weeks,") into a Context
        context_text, instruction_text = split_temporal_context(instruction_text)

        scale = RawScale(
            input_data_type="choice", measurement_type="ordinal", selection="single",
            dimension=scale_name, anchors=anchors, values=values)
```

Replace with:

```python
        blocks = _blocks(dsl)
        used = []
        for b in blocks:
            for ln in b:
                bm = re.match(r"^t:\s*scale\s+(\S+)", ln)
                if bm and bm.group(1) not in used:
                    used.append(bm.group(1))

        if used:
            if len(used) > 1:
                raise PsyToolkitParseError(f"multiple distinct scales {used} — needs manual handling")
            scale_name, anchors, values = _parse_scale(dsl, used[0])
            instruction_text, items = None, []
            for b in blocks:
                if any(re.match(rf"^t:\s*scale\s+{re.escape(scale_name)}\b", ln) for ln in b):
                    instr, its = _parse_block(b)
                    if instruction_text is None:
                        instruction_text = instr
                    items.extend(its)
            if not items:
                raise PsyToolkitParseError("question block has no items")
            scale = RawScale(
                input_data_type="choice", measurement_type="ordinal", selection="single",
                dimension=scale_name, anchors=anchors, values=values)
        else:
            range_blocks = [b for b in blocks if any(re.match(r"^t:\s*range\b", ln) for ln in b)]
            if not range_blocks:
                raise PsyToolkitParseError("no `t: scale` or `t: range` question block found")
            instruction_text, items = None, []
            for b in range_blocks:
                instr, its = _parse_range_block(b)
                if instruction_text is None:
                    instruction_text = instr
                items.extend(its)
            if not items:
                raise PsyToolkitParseError("range block has no items")
            scale = None

        # peel a leading temporal frame ("Over the last 2 weeks,") into a Context
        context_text, instruction_text = split_temporal_context(instruction_text)
```

(The `return RawQuestionnaire(... scale=scale ...)` tail is unchanged and now passes `scale=None` for range pages.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -v`
Expected: PASS (range tests + all existing scale tests).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psytoolkit.py questionnaire-harvester/tests/test_psytoolkit.py
git commit -m "feat(harvester): parse t:range (slider) blocks into per-item number options"
```

---

### Task 4: Dedup fingerprint for number options (`dedup.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/dedup.py:6-16` (`option_fingerprint`)
- Test: `questionnaire-harvester/tests/test_dedup.py`

**Interfaces:**
- Consumes: nothing new.
- Produces: `option_fingerprint` distinguishes number options by `min`/`max`/`step`/`min_label`/`max_label`/`center_label`/`initial_value`; choice-option fingerprints unchanged.

- [ ] **Step 1: Write the failing test**

Append to `questionnaire-harvester/tests/test_dedup.py`:

```python
def test_number_option_fingerprint_distinguishes_labels_and_range():
    from harvester.dedup import option_fingerprint
    def num(mn, mx, left, right):
        return {"input_data_type": "number", "measurement_type": "interval",
                "dimension": "rating", "min": mn, "max": mx,
                "min_label": left, "max_label": right,
                "content": {"en": {"status": "validated", "label": "x"}}}
    a = num(1, 7, "not happy", "very happy")
    b = num(1, 7, "less happy", "more happy")    # same range, different labels
    c = num(0, 100, "not happy", "very happy")   # same labels, different range
    a2 = num(1, 7, "Not Happy", "Very Happy")    # case-only difference -> same
    assert option_fingerprint(a) != option_fingerprint(b)
    assert option_fingerprint(a) != option_fingerprint(c)
    assert option_fingerprint(a) == option_fingerprint(a2)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_dedup.py::test_number_option_fingerprint_distinguishes_labels_and_range -v`
Expected: FAIL — `a` and `b` (and `a` vs `c`) collide (current else-branch ignores min/max/labels).

- [ ] **Step 3: Fold number fields into the fingerprint**

In `questionnaire-harvester/src/harvester/dedup.py`, replace `option_fingerprint`:

```python
def option_fingerprint(o: dict) -> str:
    en = (o.get("content", {}).get("en") or {})
    anchors = [norm(a.get("text", "")) for a in (en.get("options") or [])]
    values = [a.get("value") for a in (o.get("options") or [])]
    base = [o.get("input_data_type"), o.get("measurement_type"), o.get("selection")]
    if anchors:
        payload = base + [values, anchors]
    else:
        payload = base + [o.get("dimension"), norm(en.get("units", "")),
                          o.get("min"), o.get("max"), o.get("step"),
                          norm(o.get("min_label", "")), norm(o.get("max_label", "")),
                          norm(o.get("center_label", "")), o.get("initial_value")]
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_dedup.py -v`
Expected: PASS (new test + existing dedup tests — choice path unchanged).

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/dedup.py questionnaire-harvester/tests/test_dedup.py
git commit -m "feat(harvester): option_fingerprint folds number fields (slider dedup)"
```

---

### Task 5: Build number options + per-item wiring (`draft.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/draft.py` (`_build_option` → split; `draft()` option loop)
- Test: `questionnaire-harvester/tests/test_draft.py`

**Interfaces:**
- Consumes: `RawOption`/`RawItem`/`RawScale` (per-item `option` or shared `scale`); `option_fingerprint`, `lookup_option`.
- Produces: per-item options. Number option dict keys: `id` (`opt_<slug>_<dim>_<n>`), `dimension`, `input_data_type:"number"`, `measurement_type`, `min`, `max`, optional `step`/`min_label`/`max_label`/`center_label`/`initial_value`, `content.en.{status,label}`. Identical sliders dedup within a run and against `scales_index`.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_draft.py`:

```python
def _shs_range():
    from harvester.raw import RawQuestionnaire, RawOption
    from harvester.licensing import LicenseFlag
    def item(stem, left, right, rev=False):
        return {"text": stem, "reversed": rev,
                "option": {"input_data_type": "number", "measurement_type": "interval",
                           "dimension": "rating", "min": 1.0, "max": 7.0, "step": 1.0,
                           "min_label": left, "max_label": right, "initial_value": None}}
    return RawQuestionnaire(
        qst_id="qst_shs", title="SHS", short_title="SHS", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x/shs.html",
        instruction_text="Indicate the point on the scale.", scale=None,
        items=[item("In general, I consider myself:", "not a very happy person", "a very happy person"),
               item("To what extent does this describe you?", "not at all", "a great deal"),
               item("And to what extent not?", "not at all", "a great deal", rev=True)],
        license=LicenseFlag.unknown("https://x/shs.html"))


def test_draft_builds_number_options_and_dedups_identical_sliders():
    res = draft(_shs_range(), version="v26.0618", scales_index={}, instr_index={})
    qst = res.entities["questionnaire"][0]
    opts = res.entities["option"]
    # items 2 and 3 share an identical slider (same range+labels) -> 2 distinct options total
    assert len(opts) == 2
    first = next(o for o in opts if o["min_label"] == "not a very happy person")
    assert first["input_data_type"] == "number" and first["measurement_type"] == "interval"
    assert first["min"] == 1.0 and first["max"] == 7.0 and first["step"] == 1.0
    assert "options" not in first and "selection" not in first
    assert first["content"]["en"]["label"] == "SHS 1–7"
    # reversed flag rides on the prompt, not the option
    assert res.entities["prompt"][2]["reversed"] is True


def test_draft_number_option_reuses_global_index():
    res0 = draft(_shs_range(), version="v26.0618", scales_index={}, instr_index={})
    shared = next(o for o in res0.entities["option"] if o["min_label"] == "not at all")
    from harvester.dedup import option_fingerprint
    idx = {option_fingerprint(shared): ["opt_shared_rating"]}
    res = draft(_shs_range(), version="v26.0618", scales_index=idx, instr_index={})
    refs = {e["option"]["ref"] for e in res.entities["questionnaire"][0]["pages"][0]["elements"]}
    assert "opt_shared_rating@v26.0618" in refs
    assert "opt_shared_rating" in res.reused
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_draft.py -k "number_option" -v`
Expected: FAIL — `draft()` still assumes a shared `rq.scale` (AttributeError on `None`).

- [ ] **Step 3: Split `_build_option` and add `_resolve_option`**

In `questionnaire-harvester/src/harvester/draft.py`, replace `_build_option` (lines ~23-37) with:

```python
def _fmt_num(x):
    f = float(x)
    return int(f) if f.is_integer() else f


def _build_choice_option(spec, slug: str, short_title: str) -> dict:
    dim = sanitize(spec.dimension)
    return {
        "id": f"opt_{sanitize(slug)}_{dim}_{len(spec.anchors)}",
        "dimension": dim, "input_data_type": spec.input_data_type,
        "measurement_type": spec.measurement_type, "selection": spec.selection,
        "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(spec.values)],
        "content": {"en": {"status": "validated",
            "label": f"{short_title} {len(spec.anchors)}-point {spec.dimension}",
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(spec.anchors)]}},
    }


def _build_number_option(spec, slug: str, short_title: str, n: int) -> dict:
    dim = sanitize(spec.dimension)
    opt = {
        "id": f"opt_{sanitize(slug)}_{dim}_{n}",
        "dimension": dim, "input_data_type": "number", "measurement_type": spec.measurement_type,
        "min": float(spec.min), "max": float(spec.max),
        "content": {"en": {"status": "validated",
            "label": f"{short_title} {_fmt_num(spec.min)}–{_fmt_num(spec.max)}"}},
    }
    if spec.step is not None:
        opt["step"] = float(spec.step)
    if spec.min_label:
        opt["min_label"] = spec.min_label
    if spec.max_label:
        opt["max_label"] = spec.max_label
    if spec.center_label:
        opt["center_label"] = spec.center_label
    if spec.initial_value is not None:
        opt["initial_value"] = float(spec.initial_value)
    return opt


def _resolve_option(spec, slug, short_title, res, scales_index, mint_cache) -> str:
    """Build `spec`'s canonical Option, then reuse (global index, then this run) or mint it.
    Returns the opt_id to reference. `mint_cache` maps fingerprint -> minted id for this run."""
    if spec.input_data_type == "number":
        opt = _build_number_option(spec, slug, short_title, n=len(mint_cache) + 1)
    else:
        opt = _build_choice_option(spec, slug, short_title)
    existing = lookup_option(opt, scales_index)
    if existing:
        if existing not in res.reused:
            res.reused.append(existing)
        return existing
    fp = option_fingerprint(opt)
    if fp in mint_cache:
        return mint_cache[fp]
    opt_id = opt["id"]
    res.entities["option"].append(opt)
    res.minted.append(opt_id)
    mint_cache[fp] = opt_id
    return opt_id
```

Ensure the import line at the top of `draft.py` includes `option_fingerprint` (it currently imports `lookup_option, lookup_instruction` from `harvester.dedup`; add `option_fingerprint`):

```python
from harvester.dedup import option_fingerprint, lookup_option, lookup_instruction
```

- [ ] **Step 4: Rewrite the option/prompt section of `draft()`**

In `draft()`, delete the old `# --- Option: reuse or mint ---` block (the `opt = _build_option(rq, slug)` … `res.minted.append(opt_id)` lines ~44-53). Keep the Instruction and Context sections. Then replace the `# --- Prompts ---` loop so the option is resolved per item:

```python
    # --- Prompts + per-item options ---
    mint_cache: dict = {}
    elements = []
    for i, item in enumerate(rq.items, start=1):
        spec = item.option or rq.scale
        opt_id = _resolve_option(spec, slug, rq.short_title, res, scales_index, mint_cache)
        pr_id = f"pr_{sanitize(slug)}_{i}"
        prompt = {"id": pr_id, "content": {"en": {"status": "validated", "text": item.text}}}
        if item.construct:
            prompt["construct"] = item.construct
        if getattr(item, "reversed", False):
            prompt["reversed"] = True
        res.entities["prompt"].append(prompt)
        res.minted.append(pr_id)
        question = {"prompt": {"ref": f"{pr_id}@{version}"},
                    "instruction": {"ref": f"{ins_id}@{version}"}}
        if ctx_ref:
            question["context"] = {"ref": ctx_ref}
        elements.append({
            "option": {"ref": f"{opt_id}@{version}"},
            "question": question,
            "required": True,
        })
```

(The Questionnaire-assembly section after the loop is unchanged.)

- [ ] **Step 5: Run the full draft + dedup + raw suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_draft.py questionnaire-harvester/tests/test_dedup.py questionnaire-harvester/tests/test_raw.py -v`
Expected: PASS — new number tests + all existing Likert draft tests (shared-scale path now flows through `_resolve_option` with the same ids/dedup behaviour).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/draft.py questionnaire-harvester/tests/test_draft.py
git commit -m "feat(harvester): build number (slider) options + per-item option wiring"
```

---

### Task 6: End-to-end, version bump, sweep, handoff

**Files:**
- Modify: `questionnaire-harvester/src/harvester/cli.py` (default `--version`)
- Modify: `questionnaire-harvester/src/harvester/draft.py` (`PROVENANCE`/version strings if any reference v26.0617 — check)
- Create: `questionnaire-harvester/tests/fixtures/psytoolkit_range.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md`

**Interfaces:**
- Consumes: full pipeline (Tasks 2–5) + schema `v26.0618` (Task 1).
- Produces: a validating `t: range` import; harvester defaults to `v26.0618`.

- [ ] **Step 1: Bump the harvester default version to `v26.0618`**

Find every `v26.0617` default in the harvester:

```bash
grep -rn "v26.0617" questionnaire-harvester/src
```

In `questionnaire-harvester/src/harvester/cli.py` change `h.add_argument("--version", default="v26.0617")` to `default="v26.0618"`. Update any other `v26.0617` default found by the grep to `v26.0618`. (Leave the harvested `output/` files — they re-validate fine; the sweep in Step 6 rewrites range pages at the new version.)

- [ ] **Step 2: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psytoolkit_range.html`:

```html
<html><head><title>SHS</title></head><body>
<h1>Subjective Happiness Scale (SHS)</h1>
<div id="content"><p>A 4-item scale of global subjective happiness.</p></div>
<pre>
l: shs
t: range
q: For each of the following statements, indicate the point on the scale that describes you.
- {min=1,max=7,left=not a very happy person,right=a very happy person,start=4} In general, I consider myself:
- {min=1,max=7,left=less happy,right=more happy,start=4} Compared to most of my peers, I consider myself:
- {min=1,max=7,left=not at all,right=a great deal,start=4} To what extent does this characterization describe you?
- {min=1,max=7,left=not at all,right=a great deal,start=4,reverse} To what extent does this characterization NOT describe you?
</pre>
<h2 id="refs">References</h2>
<ul><li>Lyubomirsky, S., &amp; Lepper, H. S. (1999). A measure of subjective happiness. Social Indicators Research, 46, 137-155.</li></ul>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_range_slider_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_range.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/happiness-shs.html",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    qst = json.loads((out / "questionnaires" / "qst_shs.json").read_text())
    assert len(qst["pages"][0]["elements"]) == 4
    # slider options are numbers with endpoint labels; identical ones dedup
    opt_files = list((out / "options").glob("*.json"))
    assert opt_files, "expected minted slider options"
    one = json.loads(opt_files[0].read_text())
    assert one["input_data_type"] == "number"
    assert "min_label" in one and "max_label" in one
```

- [ ] **Step 3: Run the e2e test to verify it fails (or passes if pipeline complete)**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_range_slider_harvest_validates -v`
Expected: PASS once Tasks 1–5 are merged. If it FAILS on validation, read the error — the schema (`--schemas`) must be the `v26.0618` tree from Task 1.

- [ ] **Step 4: Run the FULL harvester suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — all prior tests (38) + the new range/raw/dedup/draft/e2e tests.

- [ ] **Step 5: Commit the e2e + version bump**

```bash
git add questionnaire-harvester/src/harvester/cli.py questionnaire-harvester/tests/fixtures/psytoolkit_range.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e t:range slider harvest validates; default v26.0618"
```

- [ ] **Step 6: Sweep the six real slider pages**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
B=https://us.psytoolkit.org/survey-library
for u in happiness-shs.html risk-rps.html vams-mood-scales.html spider-fear-fsq.html lseq.html political-conservatism.html; do
  out=$(python -m harvester.cli harvest "$B/$u" 2>&1); rc=$?
  errs=$(python -c "from pathlib import Path; from harvester.validate import validate_tree; e=validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618'); print('OK' if not e else 'ERR '+str(e[0]))")
  if [ $rc -eq 0 ] && [ "$errs" = "OK" ] && echo "$out" | grep -q "^harvested "; then
    git add -A questionnaire-harvester/; echo "OK  $u :: $(echo "$out" | grep -oE 'qst_[a-z0-9]+' | head -1)"
  else
    git clean -fdq questionnaire-harvester/output questionnaire-harvester/questions
    git checkout -q questionnaire-harvester/register.md questionnaire-harvester/questions 2>/dev/null
    echo "FAIL $u :: rc=$rc errs=$errs :: $(echo "$out" | tail -1)"
  fi
done
```

Expected: all six `OK`. Then validate the whole tree at `v26.0618`:

```bash
python -c "from pathlib import Path; from harvester.validate import validate_tree; print(validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: `OK`.

- [ ] **Step 7: Commit the sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest 6 PsyToolkit slider (t:range) questionnaires"
```

- [ ] **Step 8: Update the harvester HANDOFF**

In `questionnaire-harvester/HANDOFF.md`, update the State line count (106 → 112), bump the validate `release` examples to `v26.0618`, add a one-paragraph note that `t: range` is now supported (slider = `number` + `min_label`/`max_label`/`initial_value`; schema `v26.0618`), and move "slider" out of the "what's next" list. Commit:

```bash
git add questionnaire-harvester/HANDOFF.md
git commit -m "docs(harvester): HANDOFF — slider support shipped (v26.0618, 112 total)"
```

---

## Final integration (after all tasks)

- [ ] **Run both affected suites + schema validator**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m pytest questionnaire-harvester/tests -q
python tools/validate_schemas.py
```

Expected: harvester suite green; `All N example(s) passed.`

- [ ] **Merge to master via a throwaway master worktree** (never check out master in the main dir)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git fetch origin -q
git worktree add .claude/worktrees/mm-slider master
git -C .claude/worktrees/mm-slider merge --no-ff harvester-slider-0618 -m "merge: harvester — slider (t:range) support + schema v26.0618"
# re-run tests inside the mm worktree, then:
git -C .claude/worktrees/mm-slider push origin master
git worktree remove .claude/worktrees/mm-slider
```

If the main working dir is itself on `master` and clean (editor agent finished), merging `--no-ff` directly in the main dir + `git push origin master` is acceptable instead (this is how the prior harvester merge shipped).

- [ ] **Clean up the feature worktree**

```bash
git worktree remove .claude/worktrees/slider-support
git branch -d harvester-slider-0618
```

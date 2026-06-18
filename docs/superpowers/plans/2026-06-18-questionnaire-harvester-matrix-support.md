# Matrix (`t: multiradio`) Harvester Support — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest PsyToolkit `t: multiradio` (matrix) questionnaires — one shared prompt per block, per-item choice option sets — adding an `OptionBase.randomize` field to schema `v26.0618`.

**Architecture:** Reuse the slider per-item-option engine. Add a shared-prompt path to the drafter (one Prompt referenced by all items, no per-item stem, no instruction). Matrix items are stem-less choice options; `q:` becomes the shared prompt verbatim; `o: random` → `OptionBase.randomize`.

**Tech Stack:** Python 3, dataclasses, BeautifulSoup, jsonschema; pytest. Spec: `docs/superpowers/specs/2026-06-18-questionnaire-harvester-matrix-support-design.md`.

## Global Constraints

- **Faithfulness (owner directive):** keep source text exactly; never fabricate prompt/option text or normalise to force reuse.
- **No PRs:** finish by merging to `master` and pushing.
- **Multi-agent git hazard:** work only in the isolated worktree (`.claude/worktrees/matrix-support`, branch `harvester-matrix-0618`). Commit with `git add <paths> && git commit` on the current HEAD — never checkout/reset/rebase/switch branches; verify `git log --oneline -1` after each commit. Merge via a throwaway master worktree (or directly if main dir is on a clean master).
- **Schema:** amend `v26.0618` in place (same-day additive); do NOT mint a new version or snapshot. Only ADD `OptionBase.randomize`.
- **Run commands from the worktree root** `.claude/worktrees/matrix-support`.
- **Harvester test env:** `export PYTHONPATH=library/src:questionnaire-harvester/src` before pytest/CLI.
- **Matrix mapping:** whole `q:` → one shared Prompt; items stem-less choice options (`ordinal`/`single`, `dimension="rating"`); values from `o: scores …` else positional `1…N`; `o: random` → `randomize: true`; no per-item instruction. Single multiradio block per page; refuse otherwise.

---

### Task 1: Schema `v26.0618` — add `OptionBase.randomize`

**Files:**
- Modify: `schemas/questionnaire/schema.json` (`OptionBase.properties`)
- Modify: `schemas/questionnaire/CHANGELOG.md` (extend the `v26.0618` entry)
- Create: `schemas/questionnaire/examples/library_examples/options/opt_randomized_pair.json`

**Interfaces:**
- Produces: Option schema accepting an optional `randomize` boolean.

- [ ] **Step 1: Write the failing schema example**

Create `schemas/questionnaire/examples/library_examples/options/opt_randomized_pair.json`:

```json
{
  "id": "opt_randomized_pair",
  "dimension": "narcissism",
  "input_data_type": "choice",
  "measurement_type": "ordinal",
  "selection": "single",
  "randomize": true,
  "options": [
    { "index": 1, "value": 0 },
    { "index": 2, "value": 1 }
  ],
  "content": {
    "en": {
      "status": "validated",
      "options": [
        { "index": 1, "text": "When people compliment me I sometimes get embarrassed" },
        { "index": 2, "text": "I know that I am good because everybody keeps telling me so" }
      ]
    }
  }
}
```

- [ ] **Step 2: Run the validator to verify it fails**

Run: `python tools/validate_schemas.py`
Expected: FAIL — `opt_randomized_pair` rejected (`randomize` is `additionalProperties:false` on `OptionBase`).

- [ ] **Step 3: Add the `randomize` field to `OptionBase`**

In `schemas/questionnaire/schema.json`, inside `OptionBase.properties`, add after the `"initial_value"` line:

```json
        "randomize":        { "type": "boolean", "default": false },
```

- [ ] **Step 4: Run the validator to verify it passes**

Run: `python tools/validate_schemas.py`
Expected: PASS — `All N example(s) passed.` (N = prior 46 + 1).

- [ ] **Step 5: Extend the `v26.0618` CHANGELOG entry**

In `schemas/questionnaire/CHANGELOG.md`, under the existing `### Added (severity: additive)` list of the `## [v26.0618]` section, add one bullet:

```markdown
- **Option-order randomization** — `Option.randomize` (boolean) requests that a viewer shuffle this option's choice order at presentation; source order and scores are stored verbatim. Maps PsyToolkit `o: random`. Existing instances stay valid.
```

- [ ] **Step 6: Commit**

```bash
git add schemas/questionnaire
git commit -m "feat(questionnaire): v26.0618 — add Option.randomize (option-order shuffle)"
```

---

### Task 2: Data model — shared prompt + option randomize (`raw.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/raw.py`
- Test: `questionnaire-harvester/tests/test_raw.py`

**Interfaces:**
- Produces: `RawOption.randomize: bool = False`; `RawItem.text: str | None`; `RawQuestionnaire.shared_prompt_text: str | None = None`.

- [ ] **Step 1: Write the failing test**

Append to `questionnaire-harvester/tests/test_raw.py`:

```python
def test_raw_supports_shared_prompt_and_option_randomize():
    from harvester.raw import RawQuestionnaire, RawOption, RawItem
    from harvester.licensing import LicenseFlag
    rq = RawQuestionnaire(
        qst_id="qst_npi", title="NPI", short_title="NPI", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x/npi.html",
        instruction_text=None, scale=None,
        shared_prompt_text="For each pair, choose the one you identify with most.",
        items=[{"text": None,
                "option": {"input_data_type": "choice", "measurement_type": "ordinal",
                           "selection": "single", "dimension": "rating",
                           "anchors": ["A", "B"], "values": [0.0, 1.0], "randomize": True}}],
        license=LicenseFlag.unknown("https://x/npi.html"))
    assert rq.shared_prompt_text.startswith("For each pair")
    assert rq.items[0].text is None
    assert isinstance(rq.items[0].option, RawOption)
    assert rq.items[0].option.randomize is True
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_raw.py::test_raw_supports_shared_prompt_and_option_randomize -v`
Expected: FAIL — `RawQuestionnaire.__init__() got an unexpected keyword argument 'shared_prompt_text'`.

- [ ] **Step 3: Add the fields**

In `questionnaire-harvester/src/harvester/raw.py`:

Add `randomize` to `RawOption` (after `initial_value`):

```python
    initial_value: float | None = None
    randomize: bool = False
```

Change `RawItem.text` annotation to optional:

```python
@dataclass
class RawItem:
    text: str | None
    construct: str | None = None
    reversed: bool = False
    option: "RawOption | None" = None
```

Add `shared_prompt_text` to `RawQuestionnaire` (after `context_text`):

```python
    context_text: str | None = None
    shared_prompt_text: str | None = None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_raw.py -v`
Expected: PASS (new test + existing raw tests).

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/raw.py questionnaire-harvester/tests/test_raw.py
git commit -m "feat(harvester): RawOption.randomize + optional RawItem.text + shared_prompt_text"
```

---

### Task 3: Parse `t: multiradio` blocks (`psytoolkit.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/sources/psytoolkit.py`
- Test: `questionnaire-harvester/tests/test_psytoolkit.py`

**Interfaces:**
- Consumes: `RawOption`, `RawItem` (Task 2); `_blocks`, `split_temporal_context` (existing).
- Produces: `_parse_multiradio_block(block_lines) -> (shared_prompt_text, [RawItem])`; `parse()` returns a `RawQuestionnaire` with `scale=None`, `instruction_text=None`, `shared_prompt_text=<q:>` and per-item choice options for multiradio pages.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_psytoolkit.py`:

```python
def test_parse_multiradio_block_groups_items_and_scores():
    from harvester.sources.psytoolkit import _parse_multiradio_block
    block = [
        "l: cas",
        "t: multiradio 2",
        "o: random",
        "o: scores 0 1",
        "q: For each pair, choose the one you identify with most.",
        "- A1",
        "- A2",
        "- B1",
        "- B2",
    ]
    prompt, items = _parse_multiradio_block(block)
    assert prompt == "For each pair, choose the one you identify with most."
    assert len(items) == 2
    assert items[0].text is None
    assert items[0].option.input_data_type == "choice"
    assert items[0].option.measurement_type == "ordinal"
    assert items[0].option.anchors == ["A1", "A2"]
    assert items[0].option.values == [0.0, 1.0]
    assert items[0].option.randomize is True
    assert items[1].option.anchors == ["B1", "B2"]


def test_parse_multiradio_positional_values_when_free():
    from harvester.sources.psytoolkit import _parse_multiradio_block
    block = ["l: pmi", "t: multiradio 3", "o: free", "q: Rate yourself.",
             "- low", "- mid", "- high", "- bad", "- ok", "- good"]
    prompt, items = _parse_multiradio_block(block)
    assert len(items) == 2
    assert items[0].option.values == [1.0, 2.0, 3.0]
    assert items[0].option.randomize is False


def test_parse_multiradio_refuses_non_divisible():
    from harvester.sources.psytoolkit import _parse_multiradio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_multiradio_block(["l: x", "t: multiradio 2", "q: q", "- a", "- b", "- c"])


def test_parse_multiradio_refuses_scores_length_mismatch():
    from harvester.sources.psytoolkit import _parse_multiradio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_multiradio_block(["l: x", "t: multiradio 2", "o: scores 0 1 2", "q: q", "- a", "- b"])


def test_parse_full_multiradio_page_via_public_surface():
    dsl = ("l: npi\nt: multiradio 2\no: random\no: scores 0 1\n"
           "q: For each pair, choose the one you identify with most.\n"
           "- I am modest\n- I am superior\n- I blend in\n- I stand out\n")
    html = f"<html><h1>Narcissism (NPI-16)</h1><pre>{dsl}</pre></html>"
    rq = PsyToolkitAdapter().parse(html, "https://x/narcism-npi16.html")
    assert rq.scale is None
    assert rq.instruction_text is None
    assert rq.shared_prompt_text.startswith("For each pair")
    assert len(rq.items) == 2
    assert rq.items[0].option.randomize is True


def test_parse_refuses_multiple_multiradio_blocks():
    dsl = ("l: a\nt: multiradio 2\no: scores 0 1\nq: q1\n- a\n- b\n\n"
           "l: b\nt: multiradio 2\no: scores 0 1\nq: q2\n- c\n- d\n")
    html = f"<html><h1>Demo (D)</h1><pre>{dsl}</pre></html>"
    from harvester.sources.psytoolkit import PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        PsyToolkitAdapter().parse(html, "https://x/demo.html")
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -k multiradio -v`
Expected: FAIL — `_parse_multiradio_block` not defined.

- [ ] **Step 3: Add the multiradio parser**

In `questionnaire-harvester/src/harvester/sources/psytoolkit.py`, add this function after `_parse_range_block` (before the `class PsyToolkitAdapter` line):

```python
def _parse_multiradio_block(block_lines):
    """From a `t: multiradio N` block, return (shared_prompt_text, [RawItem]).

    Matrix items have no per-item stem: the `-` lines are response options, grouped
    into consecutive N-chunks (one chunk = one item's choice option set). Values come
    from `o: scores ...` (length N) else positional 1..N. `o: random` -> RawOption.randomize.
    The shared `q:` is the prompt for every item. Refuses (PsyToolkitParseError) on a
    non-divisible `-` count, an o:scores length != N, an empty anchor, or a missing N.
    """
    n = None
    scores = None
    randomize = False
    anchors_all = []
    q_parts, in_q = [], False
    for ln in block_lines[1:]:
        s = ln.rstrip()
        if re.match(r"^-\s", s) or s.strip() == "-":
            in_q = False
            anchors_all.append(re.sub(r"^-\s*", "", s).strip())
        elif re.match(r"^t:\s*multiradio", s):
            in_q = False
            m = re.match(r"^t:\s*multiradio\s+(\d+)", s)
            if m:
                n = int(m.group(1))
        elif re.match(r"^o:", s):
            in_q = False
            od = s[2:].strip()
            if od == "random":
                randomize = True
            elif od.startswith("scores"):
                scores = [float(x) for x in od.split()[1:]]
        elif re.match(r"^[a-z]:", s):
            if s.startswith("q:"):
                q_parts, in_q = [s[2:].strip()], True
            else:
                in_q = False
        elif in_q and s.strip():
            q_parts.append(s.strip())
    if not n:
        raise PsyToolkitParseError("multiradio block missing column count N")
    if not anchors_all or len(anchors_all) % n != 0:
        raise PsyToolkitParseError(f"multiradio: {len(anchors_all)} options not divisible by {n}")
    if any(not a for a in anchors_all):
        raise PsyToolkitParseError("multiradio has an empty option label")
    if scores is not None and len(scores) != n:
        raise PsyToolkitParseError(f"multiradio scores length {len(scores)} != {n}")
    values = scores if scores is not None else [float(i + 1) for i in range(n)]
    items = []
    for k in range(0, len(anchors_all), n):
        opt = RawOption(
            input_data_type="choice", measurement_type="ordinal", selection="single",
            dimension="rating", anchors=anchors_all[k:k + n], values=list(values),
            randomize=randomize)
        items.append(RawItem(text=None, option=opt))
    return " ".join(p for p in q_parts if p), items
```

Also extend the raw import at the top of the file if needed (it already imports `RawOption` from the slider work — verify the line reads `from harvester.raw import RawQuestionnaire, RawScale, RawItem, RawOption`).

- [ ] **Step 4: Branch `parse()` for multiradio + guard the temporal split**

In `parse()`, change the scale/range branch into a three-way branch and initialise `shared_prompt_text`. Replace the block that currently reads:

```python
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

with:

```python
        range_blocks = [b for b in blocks if any(re.match(r"^t:\s*range\b", ln) for ln in b)]
        mr_blocks = [b for b in blocks if any(re.match(r"^t:\s*multiradio\b", ln) for ln in b)]
        scale = None
        shared_prompt_text = None
        instruction_text = None

        if used:
            if len(used) > 1:
                raise PsyToolkitParseError(f"multiple distinct scales {used} — needs manual handling")
            scale_name, anchors, values = _parse_scale(dsl, used[0])
            items = []
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
        elif range_blocks:
            items = []
            for b in range_blocks:
                instr, its = _parse_range_block(b)
                if instruction_text is None:
                    instruction_text = instr
                items.extend(its)
            if not items:
                raise PsyToolkitParseError("range block has no items")
        elif mr_blocks:
            if len(mr_blocks) > 1:
                raise PsyToolkitParseError("multiple multiradio blocks — needs manual handling")
            shared_prompt_text, items = _parse_multiradio_block(mr_blocks[0])
            if not items:
                raise PsyToolkitParseError("multiradio block has no items")
        else:
            raise PsyToolkitParseError("no `t: scale`, `t: range`, or `t: multiradio` question block found")

        # peel a leading temporal frame ("Over the last 2 weeks,") into a Context
        context_text = None
        if instruction_text:
            context_text, instruction_text = split_temporal_context(instruction_text)
```

Then in the `return RawQuestionnaire(...)` call at the end of `parse()`, add the `shared_prompt_text` argument:

```python
            domain=[], population=[],          # not derivable from the DSL — classify later
            context_text=context_text, shared_prompt_text=shared_prompt_text)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_psytoolkit.py -v`
Expected: PASS (multiradio tests + all existing scale/range tests).

- [ ] **Step 6: Commit**

```bash
git add questionnaire-harvester/src/harvester/sources/psytoolkit.py questionnaire-harvester/tests/test_psytoolkit.py
git commit -m "feat(harvester): parse t:multiradio (matrix) blocks into shared-prompt + per-item options"
```

---

### Task 4: Dedup fingerprint folds `randomize` (`dedup.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/dedup.py` (`option_fingerprint`)
- Test: `questionnaire-harvester/tests/test_dedup.py`

**Interfaces:**
- Produces: `option_fingerprint` distinguishes an otherwise-identical choice option by `randomize`, while NON-randomized choice fingerprints stay byte-identical to before (so the committed `scales-index.json` keeps matching).

- [ ] **Step 1: Write the failing test**

Append to `questionnaire-harvester/tests/test_dedup.py`:

```python
def test_choice_fingerprint_distinguishes_randomize_but_keeps_legacy():
    from harvester.dedup import option_fingerprint
    def choice(randomize):
        o = {"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
             "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
             "content": {"en": {"status": "validated", "options": [
                 {"index": 1, "text": "a"}, {"index": 2, "text": "b"}]}}}
        if randomize:
            o["randomize"] = True
        return o
    plain = choice(False)
    rand = choice(True)
    assert option_fingerprint(plain) != option_fingerprint(rand)
    # legacy (no randomize key) fingerprint must be unchanged: equals an explicit randomize=False
    plain_false = choice(False); plain_false["randomize"] = False
    assert option_fingerprint(plain) == option_fingerprint(plain_false)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_dedup.py::test_choice_fingerprint_distinguishes_randomize_but_keeps_legacy -v`
Expected: FAIL — `plain` and `rand` currently collide (the choice branch ignores `randomize`).

- [ ] **Step 3: Fold `randomize` into the choice branch (append only when truthy)**

In `questionnaire-harvester/src/harvester/dedup.py`, in `option_fingerprint`, change the `if anchors:` branch so it appends a `randomize` marker ONLY when the option is randomized (this keeps non-randomized fingerprints identical to the pre-change formula):

```python
    if anchors:
        payload = base + [values, anchors]
        if o.get("randomize"):
            payload = payload + ["randomize"]
    else:
        payload = base + [o.get("dimension"), norm(en.get("units", "")),
                          o.get("min"), o.get("max"), o.get("step"),
                          norm(o.get("min_label", "")), norm(o.get("max_label", "")),
                          norm(o.get("center_label", "")), o.get("initial_value")]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_dedup.py -v`
Expected: PASS (new test + existing dedup tests — non-randomized choice path unchanged).

- [ ] **Step 5: Commit**

```bash
git add questionnaire-harvester/src/harvester/dedup.py questionnaire-harvester/tests/test_dedup.py
git commit -m "feat(harvester): option_fingerprint folds randomize (append-when-true)"
```

---

### Task 5: Draft shared-prompt path + per-item choice ids + randomize (`draft.py`)

**Files:**
- Modify: `questionnaire-harvester/src/harvester/draft.py`
- Test: `questionnaire-harvester/tests/test_draft.py`

**Interfaces:**
- Consumes: `RawQuestionnaire.shared_prompt_text`, `RawItem.text` (may be None), `RawOption.randomize` (Tasks 2-3); `option_fingerprint` randomize-aware (Task 4).
- Produces: `_build_choice_option(spec, slug, short_title, n=None)` — counter id `opt_<slug>_<dim>_<n>` when `n` given, else legacy `opt_<slug>_<dim>_<len(anchors)>`; emits `randomize: true` when set. `_resolve_option(..., per_item=False)`. `draft()`: shared-prompt minting (one `pr_<slug>_shared`), instruction skipped when `instruction_text` is falsy, instruction ref omitted from questions when no instruction.

- [ ] **Step 1: Write the failing tests**

Append to `questionnaire-harvester/tests/test_draft.py`:

```python
def _npi_matrix():
    from harvester.raw import RawQuestionnaire
    from harvester.licensing import LicenseFlag
    def item(a, b):
        return {"text": None,
                "option": {"input_data_type": "choice", "measurement_type": "ordinal",
                           "selection": "single", "dimension": "rating",
                           "anchors": [a, b], "values": [0.0, 1.0], "randomize": True}}
    return RawQuestionnaire(
        qst_id="qst_npi", title="NPI", short_title="NPI", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x/npi.html",
        instruction_text=None, scale=None,
        shared_prompt_text="For each pair, choose the one you identify with most.",
        items=[item("I am modest", "I am superior"), item("I blend in", "I stand out")],
        license=LicenseFlag.unknown("https://x/npi.html"))


def test_draft_matrix_shared_prompt_and_per_item_options():
    res = draft(_npi_matrix(), version="v26.0618", scales_index={}, instr_index={})
    qst = res.entities["questionnaire"][0]
    els = qst["pages"][0]["elements"]
    # one shared prompt, referenced by every element, no instruction minted
    assert len(res.entities["prompt"]) == 1
    assert res.entities["prompt"][0]["id"] == "pr_npi_shared"
    assert res.entities["prompt"][0]["content"]["en"]["text"].startswith("For each pair")
    assert {e["question"]["prompt"]["ref"] for e in els} == {"pr_npi_shared@v26.0618"}
    assert all("instruction" not in e["question"] for e in els)
    assert res.entities["instruction"] == []
    # two distinct per-item choice options with counter ids + randomize
    opts = res.entities["option"]
    assert len(opts) == 2
    assert {o["id"] for o in opts} == {"opt_npi_rating_1", "opt_npi_rating_2"}
    assert all(o["input_data_type"] == "choice" and o["randomize"] is True for o in opts)


def test_draft_likert_still_uses_legacy_choice_id():
    # regression: shared scale (no per-item option) keeps the len-based id
    res = draft(_gad7(), version="v26.0617", scales_index={}, instr_index={})
    opt = res.entities["option"][0]
    assert opt["id"] == "opt_gad7_frequency_4"
    assert "randomize" not in opt
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_draft.py -k "matrix or legacy_choice" -v`
Expected: FAIL — `draft()` references `item.text` for the prompt (None for matrix) and has no shared-prompt path.

- [ ] **Step 3: Add counter id + randomize to `_build_choice_option`**

In `questionnaire-harvester/src/harvester/draft.py`, replace `_build_choice_option` with:

```python
def _build_choice_option(spec, slug: str, short_title: str, n=None) -> dict:
    dim = sanitize(spec.dimension)
    oid = (f"opt_{sanitize(slug)}_{dim}_{n}" if n is not None
           else f"opt_{sanitize(slug)}_{dim}_{len(spec.anchors)}")
    opt = {
        "id": oid,
        "dimension": dim, "input_data_type": spec.input_data_type,
        "measurement_type": spec.measurement_type, "selection": spec.selection,
        "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(spec.values)],
        "content": {"en": {"status": "validated",
            "label": f"{short_title} {len(spec.anchors)}-point {spec.dimension}",
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(spec.anchors)]}},
    }
    if getattr(spec, "randomize", False):
        opt["randomize"] = True
    return opt
```

- [ ] **Step 4: Add `per_item` to `_resolve_option`**

In `_resolve_option`, change the option-build dispatch so per-item choice options get a counter id:

```python
def _resolve_option(spec, slug, short_title, res, scales_index, mint_cache, per_item=False) -> str:
    """Build `spec`'s canonical Option, then reuse (global index, then this run) or mint it.
    Returns the opt_id to reference. `mint_cache` maps fingerprint -> minted id for this run.
    `per_item` options (slider/matrix) use the counter id scheme to avoid collisions."""
    if spec.input_data_type == "number":
        opt = _build_number_option(spec, slug, short_title, n=len(mint_cache) + 1)
    elif per_item:
        opt = _build_choice_option(spec, slug, short_title, n=len(mint_cache) + 1)
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

- [ ] **Step 5: Add shared-prompt + instruction-guard to `draft()`**

In `draft()`, replace the Instruction section and the Prompts loop. Change the Instruction section to skip when absent:

```python
    # --- Instruction: reuse or mint (skipped when absent, e.g. matrix) ---
    ins_id = None
    if rq.instruction_text:
        ins = {"id": f"ins_{sanitize(slug)}_instruction",
               "content": {"en": {"status": "validated", "text": rq.instruction_text}}}
        existing_ins = lookup_instruction(ins, instr_index)
        if existing_ins:
            ins_id = existing_ins
            res.reused.append(ins_id)
        else:
            ins_id = ins["id"]
            res.entities["instruction"].append(ins)
            res.minted.append(ins_id)
```

Keep the Context section unchanged. Then replace the `# --- Prompts + per-item options ---` loop with:

```python
    # --- Shared prompt (matrix): one prompt referenced by every item ---
    shared_prompt_id = None
    if rq.shared_prompt_text:
        shared_prompt_id = f"pr_{sanitize(slug)}_shared"
        res.entities["prompt"].append(
            {"id": shared_prompt_id,
             "content": {"en": {"status": "validated", "text": rq.shared_prompt_text}}})
        res.minted.append(shared_prompt_id)

    # --- Per-item options + prompts ---
    mint_cache: dict = {}
    elements = []
    for i, item in enumerate(rq.items, start=1):
        spec = item.option or rq.scale
        opt_id = _resolve_option(spec, slug, rq.short_title, res, scales_index,
                                 mint_cache, per_item=item.option is not None)
        if shared_prompt_id:
            pr_ref = shared_prompt_id
        else:
            pr_id = f"pr_{sanitize(slug)}_{i}"
            prompt = {"id": pr_id, "content": {"en": {"status": "validated", "text": item.text}}}
            if item.construct:
                prompt["construct"] = item.construct
            if getattr(item, "reversed", False):
                prompt["reversed"] = True
            res.entities["prompt"].append(prompt)
            res.minted.append(pr_id)
            pr_ref = pr_id
        question = {"prompt": {"ref": f"{pr_ref}@{version}"}}
        if ins_id:
            question["instruction"] = {"ref": f"{ins_id}@{version}"}
        if ctx_ref:
            question["context"] = {"ref": ctx_ref}
        elements.append({
            "option": {"ref": f"{opt_id}@{version}"},
            "question": question,
            "required": True,
        })
```

- [ ] **Step 6: Run the full harvester suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — new matrix/legacy tests + all existing Likert/slider tests (their per-item-prompt + instruction behaviour is unchanged because `shared_prompt_text` is None and `instruction_text` is set for them).

- [ ] **Step 7: Commit**

```bash
git add questionnaire-harvester/src/harvester/draft.py questionnaire-harvester/tests/test_draft.py
git commit -m "feat(harvester): draft shared-prompt path + per-item choice ids + randomize"
```

---

### Task 6: End-to-end, sweep, handoff

**Files:**
- Create: `questionnaire-harvester/tests/fixtures/psytoolkit_multiradio.html`
- Test: `questionnaire-harvester/tests/test_cli_e2e.py`
- Modify: `questionnaire-harvester/HANDOFF.md` (untracked local note — edit on disk, do NOT git-add)

**Interfaces:**
- Consumes: full pipeline (Tasks 2-5) + schema `v26.0618` (Task 1).
- Produces: a validating `t: multiradio` import; 4 matrix questionnaires harvested.

- [ ] **Step 1: Write the failing e2e test**

Create `questionnaire-harvester/tests/fixtures/psytoolkit_multiradio.html`:

```html
<html><head><title>NPI</title></head><body>
<h1>Narcissism (NPI-16)</h1>
<div id="content"><p>A 16-item forced-choice narcissism measure.</p></div>
<pre>
l: npi
t: multiradio 2
o: random
o: scores 0 1
q: For each pair of statements, choose the one you identify with most.
- When people compliment me I sometimes get embarrassed
- I know that I am good because everybody keeps telling me so
- I prefer to blend in with the crowd
- I like to be the center of attention
</pre>
<h2 id="refs">References</h2>
<ul><li>Ames, D. R., Rose, P., &amp; Anderson, C. P. (2006). The NPI-16. Journal of Research in Personality, 40, 440-450.</li></ul>
</body></html>
```

Append to `questionnaire-harvester/tests/test_cli_e2e.py`:

```python
def test_multiradio_harvest_validates(tmp_path, monkeypatch):
    fixture = (Path(__file__).parent / "fixtures" / "psytoolkit_multiradio.html").read_text()
    monkeypatch.setattr("harvester.sources.base.SourceAdapter.fetch", lambda self, url: fixture)
    out = tmp_path / "output"; out.mkdir()
    rc = cli.main(["harvest", "https://us.psytoolkit.org/survey-library/narcism-npi16.html",
                   "--out", str(out),
                   "--scales-index", str(tmp_path / "missing-index.json"),
                   "--register", str(tmp_path / "register.md"),
                   "--questions", str(tmp_path / "questions"),
                   "--schemas", str(REPO / "schemas"), "--version", "v26.0618"])
    assert rc == 0
    # h1 "Narcissism (NPI-16)" -> acronym "(NPI-16)" sanitizes to qst_npi16
    qst = json.loads((out / "questionnaires" / "qst_npi16.json").read_text())
    els = qst["pages"][0]["elements"]
    assert len(els) == 2
    # all elements share one prompt; no instruction
    assert len({e["question"]["prompt"]["ref"] for e in els}) == 1
    assert all("instruction" not in e["question"] for e in els)
    opt = json.loads(next((out / "options").glob("*.json")).read_text())
    assert opt["input_data_type"] == "choice" and opt["randomize"] is True
```

- [ ] **Step 2: Run the e2e test**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests/test_cli_e2e.py::test_multiradio_harvest_validates -v`
Expected: PASS once Tasks 1-5 are merged. If it FAILS on validation, read the error — `--schemas` must be the `v26.0618` tree with `Option.randomize` from Task 1.

- [ ] **Step 3: Run the FULL harvester suite**

Run: `export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q`
Expected: PASS — all prior tests + the new matrix/raw/dedup/draft/e2e tests.

- [ ] **Step 4: Commit the e2e**

```bash
git add questionnaire-harvester/tests/fixtures/psytoolkit_multiradio.html questionnaire-harvester/tests/test_cli_e2e.py
git commit -m "test(harvester): e2e t:multiradio matrix harvest validates"
```

- [ ] **Step 5: Sweep the four real matrix pages**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
B=https://us.psytoolkit.org/survey-library
for u in anger-cas.html narcism-npi16.html locus-of-control-rotter.html pmi.html; do
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
python -c "from pathlib import Path; from harvester.validate import validate_tree; print(validate_tree(Path('questionnaire-harvester/output'),Path('schemas'),release='v26.0618') or 'OK')"
```

Expected: all four `OK`; final tree validation `OK`. If a page fails transiently (timeout), retry it once. A genuine parse refusal: note it, do NOT fabricate.

- [ ] **Step 6: Commit the sweep**

```bash
git add -A questionnaire-harvester/
git commit -m "feat(harvester): harvest 4 PsyToolkit matrix (t:multiradio) questionnaires"
```

- [ ] **Step 7: Update the HANDOFF (untracked — edit on disk only)**

Edit `questionnaire-harvester/HANDOFF.md` on disk: update the State count (≈110 → ≈114), add a one-line note that `t: multiradio` is now supported (shared prompt + per-item option sets; `Option.randomize` for `o: random`; schema `v26.0618`), and move "matrix" out of the "what's next" list. Do **NOT** `git add` it — `/HANDOFF.md` is gitignored. No commit for this step.

---

## Final integration (after all tasks)

- [ ] **Run both suites + validator**

```bash
export PYTHONPATH=library/src:questionnaire-harvester/src
python -m pytest questionnaire-harvester/tests -q
python tools/validate_schemas.py
```

Expected: harvester suite green; `All N example(s) passed.`

- [ ] **Merge to master + push** (the main dir is on a clean `master`; merging `--no-ff` directly there + pushing is the established pattern; otherwise use a throwaway master worktree)

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
# if main dir is on master and clean apart from unrelated untracked files:
git merge --no-ff harvester-matrix-0618 -m "merge: harvester — matrix (t:multiradio) support + Option.randomize (v26.0618)"
export PYTHONPATH=library/src:questionnaire-harvester/src && python -m pytest questionnaire-harvester/tests -q && python tools/validate_schemas.py
git push origin master
```

- [ ] **Clean up the feature worktree**

```bash
git worktree remove .claude/worktrees/matrix-support
git branch -d harvester-matrix-0618
```

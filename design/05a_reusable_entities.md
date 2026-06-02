# 05a — Reusable entities (Schema 2 content model — OD-15)

**Status:** **OD-15 resolved 2026-05-31.** This document is the authoritative body for the OD-15 resolution; the Resolution-log row in [10_open_decisions.md](10_open_decisions.md) points here. All 23 sub-questions resolved across grilling sessions on 2026-05-29 / 2026-05-30 / 2026-05-31 (see §18 Resolution log). The Subscales sub-area (Q15) was deferred to a future Scoring OD and has since been resolved as **OD-16** (2026-06-02) — body in [05b_scoring.md](05b_scoring.md). Per OD-16, the Subscale entity carries only `id` / `name` / `description` / `content` (no `prompt_ids`, no `weight_per_prompt`); membership lives on the Prompt (`Prompt.subscales: string[]`); and a new procedural entity `Scorer` (`scr_*`) is introduced. The v26.0528 entity model in [05_data_model.md](05_data_model.md) §"Schema 2" is preserved as historical reference (with a callout pointing here); it will be rewritten alongside the next-CalVer schema implementation.

This document extends [05_data_model.md](05_data_model.md) §"Schema 2" with a deep dive on the reusable-entity model. The currently-implemented Schema 2 (commit `b910faa`, tag `v26.0528`) reflects the *prior* model that this document supersedes; the new model lands once the grill-me session on OD-15 resolves.

---

## 1. Glossary

Read this first; the rest of the document relies on these definitions being held in mind. The legacy [survey_database/](../survey_database/) and the v26.0528 schema both use some of these terms loosely; this document tightens them.

| Term | Definition | Distinct from |
|---|---|---|
| **Prompt** | The stem text the participant reads — the wording of the thing being asked. The atomic content unit. | Item (Prompt has no response options); Question (Prompt has no framing) |
| **Context** | A background sentence or paragraph that frames the prompt ("In the next questions we mean by 'social skills'...") or provides some context about the question ("During the past 6 months..."). Distinct from Instruction because Context sets the *meaning* of what follows; Instruction sets how to *respond*. | Instruction (background vs. how-to); Message (Context attaches to a question; Message is standalone page text) |
| **Instruction** | Text describing how the participant should enter their responses ("Rate each on the scale below"). | Context (how-to vs. background); Message (Instruction attaches to a question; Message is standalone) |
| **Question** | The complete "asking" unit — **optional Context + Prompt + optional Instruction**. Does **not** include the response options. Can live inline in a Page or be saved as a reusable Library entity (`q_*`). | Item (Question has no response options); Prompt (Question may include framing) |
| **Option** | The response-options specification. Options can have multiple parameters and metadata, including *input_data_type* (choice / number / text), *measurement_type* (nominal / ordinal / interval / ratio), the numeric bounds, units and bounds for numeric inputs, validation patterns and placedholder text for text inputs, and (for choice types) the array of available choices with their values and labels. There is also a *dimension* parameter that indicates what semantic dimension the option refers to (e.g., asking about agreement, similarity, frequency, etc.) Can live inline or be saved as a reusable Library entity (`opt_*`). Replaces the v26.0528 term `OptionSet`. | Item (Option is just the response-options half); a *choice* (a single row inside a choice-type Option's array) |
| **Item** | The complete administered unit — **Question + Option**. A refs-only Library entity (`it_*`) per Q1c resolved 2026-05-30. Composition-level fields like `required` and `show_if` are *use-specific overrides* (per OD-05) that live on the Page element that references the Item, not on the Item entity itself. Items can also be authored inline on Page elements for one-off use. | Question (Item adds the response options); Question and Option each on their own (an Item binds them) |
| **UI input widget** | The user-interface control the viewer renders to capture the participant's response: radio buttons, checkbox list, slider, numeric spinner, text input, etc. Derived from the Option's `input_data_type` × `measurement_type` pair; not declared explicitly in the schema. | Option (Option specifies *what* the response options are logically; the UI input widget is *how* the viewer draws it) |
| **Construct** | The psychometric concept the Prompt loads on (e.g. `sensation_seeking`, `depression`, `working_memory`). Determines how the response contributes to a participant's score on that construct. Lives on the Prompt. | Dimension (a Construct is *what* is being measured analytically; a Dimension is *what kind of judgment / scale* the option provides) |
| **Dimension** | The kind of judgment or scale (e.g. `agreement`, `frequency`, `duration`, `similarity`, `presence`). Lives on **both Prompt and Option** — and optionally Instruction — describing the same concept on each side of an Item. A `frequency`-asking Prompt naturally pairs with a `frequency`-scale Option; mismatches are allowed (the AISS case: similarity Prompt with agreement Option) but Library warns. Per the user clarification 2026-05-31. Same field name in legacy survey_database. | Construct (what's measured analytically vs. what kind of judgment the prompt asks for); Option's `label` (human-readable identifier, separate from Dimension) |
| **Composition** | The structure that defines an actual questionnaire's contents. Maps to the legacy `compositions` table where each row carries a `questionnaire_id` + `version` + `element_type` (`header` / `message` / `question`) + the per-element fields needed (e.g. for a question row: `prompt_id`, `option_id`, `context_id`, `instruction_id`, `is_required`, `condition`). In our model, the equivalent surface is the questionnaire's `metadata` (the legacy `header` row) + its `pages[].entries[]` list (the legacy `message` and `question` rows, augmented by the OD-12 Page / Block / Section layer). Not used here as a generic synonym for "any ref-binding"; reserved specifically for questionnaire content. | A Question or Item considered standalone (each is a ref-binding *entity*, not the whole questionnaire's Composition) |
| **Reversed** | A boolean property of a Prompt indicating that the Prompt is worded as the *opposite* of its Construct. Example: if the Construct is `happiness` and the Prompt is "Are you feeling sad?", `reversed = true` — a high response on a frequency-style Option means the participant feels sad often, which contributes *negatively* to the happiness score. The scoring engine applies the reversal as `value' = max + min - value` before aggregating. | A Construct itself (Reversed is a property of *how a Prompt loads on its Construct*, not of the Construct) |
| **Solution** | The correct response for a Prompt that has one (math problems, attention checks, lie-detector / catch items). Per Q16c (resolved 2026-05-30), a separate reusable entity (`sol_*`) binding a Prompt-ref + optional Option-ref + `expected_response` value. Legacy `survey_database.Solution` had 35 rows. See §12a. | Construct / scoring formulas (Solutions are right-answer truth; scoring formulas are how *any* answer maps to a score, including comparing against a Solution) |
| **Scoring** | The process by which participant responses are converted into scores. Happens at multiple levels: per-Item (one response → one scored value, with `reversed` applied) and per-questionnaire (Item scores aggregated into Construct / subscale / total scores, with bands and interpretation). The full scoring model is **out of scope for OD-15**; flagged here so the glossary terms used by scoring (Construct, Dimension, Reversed, Solution, subscale) are defined consistently with whatever the future scoring OD lands on. | The schema (the schema describes content; scoring is a separate concern handled by the scoring engine, the WASM evaluator per OD-11, and a future scoring-specific design decision) |
| **Message** | Standalone participant-facing text that is not a Question — a welcome screen, an end-of-questionnaire thank you, an informational page, a transition between sections. Stands alone as a Page entry. | Context / Instruction (which attach to a Question) |
---

## 2. Why this document exists

The v26.0528 Schema 2 treats **Question** as the primary reusable atom, with one polymorphic `Question` $def per UI input widget type (Radio, Checkbox, Slider, …) and a flat `OptionSet` companion that just holds `{ options: [{ value, text }] }`. **Prompt** and **Instruction** are minor side entities.

The legacy [survey_database/](../survey_database/) — the 793-Prompt catalogue the project will migrate from — encodes a different model:

- A **Question is not a UI-widget atom.** It is a small composition (Prompt + optional Context + optional Instruction). An **Item** binds a Question to an Option; the Item is what appears on a Page.
- **Prompts carry psychometric metadata** the v26.0528 schema discards: a concept-level **`name`**, a **Construct** (what the prompt measures), **`topics`** (analytic tags), and **`reversed`** (the prompt loads on its Construct in the negative direction).
- **Options carry rich response-options metadata** the v26.0528 schema discards: `input_data_type` (`choice` / `number` / `text`), `measurement_type` (`nominal` / `ordinal` / `interval` / `ratio`), `min` / `max` / `step` / `units` for numeric inputs, references to a Placeholder and a Help, optional `input_validation` (a RegEx reference). For choice-type Options, an array of choices each with an `index`, a numeric `value`, and a translatable text label.
- **Four reusable entity types are absent from v26.0528:** **Message**, **Context** (collapsed into Instruction), **Placeholder**, **Help**, **RegEx**.
- **The UI input widget the viewer renders is derived, not declared.** It comes from the Option's `input_data_type` × `measurement_type` pair (§13), not from a `type: "radio"` field on a Question.

The v26.0528 implementation is correct as JSON Schema, but the entities it standardises are not the ones the legacy catalogue needs to round-trip into. Adopting a survey_database–aligned model means:

- **Nine** reusable entity types (vs. four in v26.0528).
- A **composition-shaped Item** as the Page entry (vs. a polymorphic-widget Question).
- The Page / Block / Section structural layer **retained** — OD-12 stands, this is the UX-grade layer over the legacy's flat composition table.

OD-12's resolution (Block / Page / Section / Subscale / Tag) is orthogonal to OD-15. OD-15 reshapes *what goes inside a Page's `elements[]`*, not the existence of pages.

---

## 3. Entity inventory

Eleven reusable entity types. Each lives in the Library, carries its own CalVer-versioned ID, holds participant-facing text in a `content` language-keyed map (when applicable), and is hard-pinned by references (per OD-06). Counts are from `survey_db.sqlite` as of 2026-05-29.

**Two categories** (user-stated design principle, 2026-05-30):

- **Content-bearing entities** hold human-authored text or numeric content. The text lives in a `content` map keyed by BCP-47 language tag (per the user-requested shape change 2026-05-31 — see §18 group M); each language entry carries a `status` and the translatable fields for that language. All languages are peer entries; the "canonical" language is whichever key matches the instrument-level `metadata.language` declaration.
- **Ref-binding entities** hold only references to other entities. They are the named compositions of the system. No content of their own (with one documented exception — Solution carries an `expected_response` value).

| # | Entity | Category | ID prefix | Library count | Carries | Purpose |
|---|---|---|---|---|---|---|
| 1 | **Message** | content | `msg_` | 100 | `type` (string-array), `content` (language-keyed map of `{ status, text }`) | Standalone participant-facing text (welcome, end, transitions, informational pages). Not a Question. |
| 2 | **Context** | content | `ctx_` | 30 | `content` (language-keyed map of `{ status, text }`) | Background paragraph that sets the meaning of an upcoming Question ("when we say 'social skills' we mean..."). |
| 3 | **Instruction** | content | `ins_` | 22 | `dimension` (optional), `content` (language-keyed map of `{ status, text }`) | How to interact with the response options ("Rate each on the 7-point scale below"). |
| 4 | **Prompt** | content | `pr_` | 793 | `name` (optional), `construct` (optional), `dimension` (optional), `topics[]` (optional), `reversed` (optional, defaults false), `content` (language-keyed map of `{ status, text }`) | The stem text the participant reads. The atomic content of a Question. |
| 5 | **Option** | content | `opt_` | (~30 sets, 560 rows) | Structural fields outside `content`: `dimension` (optional), `input_data_type` (required), `measurement_type` (required), `selection` (required for choice-type), `min` / `max` / `step` (for numeric), refs to Placeholder / Help / RegEx (optional), `options[]` array of `{ index, value }` for choice-type. Translatable fields inside `content` language-map: `label`, `units`, per-choice `text` keyed by `index`. | The response-options spec. Determines the UI input widget via §13. |
| 6 | **Placeholder** | content | `ph_` | 11 | `content` (language-keyed map of `{ status, text }`) | Hint text inside an input field ("e.g. 5"). |
| 7 | **Help** | content | `help_` | 21 | `content` (language-keyed map of `{ status, text }`) | Tooltip / "?" content next to a field. |
| 8 | **RegEx** | content | `rx_` | 7 | `regex` (non-translatable), `example_input` (non-translatable), optional `content` (language-keyed map of `{ status, description }`) | Reusable validation patterns. |
| 9 | **Question** | **ref-binding** | `q_` | — (added by this design) | ref to Prompt, optional ref to Context, optional ref to Instruction. **No content.** | The "asking" composition. Bound under one Library id so it can be governed, named, and reused across questionnaires. |
| 10 | **Item** | **ref-binding** | `it_*` | — (added by this design) | ref to Question, ref to Option. **No content.** | The complete administered unit. Bound under one Library id; reusable across questionnaires. Composition-level fields (`required`, `show_if`) live on the *Page element* that uses the Item, not on the Item entity (per OD-05 override semantics). |
| 11 | **Solution** | ref-binding (hybrid) | `sol_` | 35 | ref to Prompt, optional ref to Option, `expected_response` (value — the documented exception to the refs-only rule), optional `content` (language-keyed map of `{ status, description }`) | The correct response for a Prompt that has a right answer (math problems, attention checks, lie-detector / catch items). Per Q16c resolved 2026-05-30. |

The v26.0528 entity prefixes change as follows: `q_` is preserved but **redefined** (was: polymorphic-widget atom; is now: refs-only Question composition). `os_` is **removed** (replaced by `opt_`). The other v26.0528 entity prefixes (`pr_`, `ins_`) keep their identity but gain richer fields. `it_` and `sol_` are new (Q1c resolved 2026-05-30 → both Item and Question saved as refs-only; Q16c resolved 2026-05-30 → Solution as a hybrid entity).

**Design principle: refs-only for binding entities.** Question and Item never carry textual or numeric content. To change the wording of a Question, you change the referenced Prompt (or fork it and update the Question to reference the new version). This means content and composition are separable concerns: peer review approves content atoms (Prompts, Options, etc.) and bindings (Questions, Items) independently. The legacy survey_database model has this implicit; we make it explicit.

---

## 4. Entity: Message

A **Message** is participant-facing text that is *not* a Question — welcome, end-of-questionnaire thanks, transitions, informational/consent text. The legacy data has 100 messages.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^msg_[a-z0-9_]+$` |
| `type` | array of strings | yes | Categorical tags for purpose. String-array per Q7c (e.g. `["purpose", "instruction"]`). Open vocabulary with curator registry — preferred values: `welcome`, `purpose`, `instruction`, `information`, `consent`, `transition`, `privacy`, `thank_you`, `end`, `debriefing`, `job`. |
| `content` | object | yes | Language-keyed map. Each key is a BCP-47 tag matching `^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$`. Each value is `{ status: "draft" \| "complete" \| "validated", text: string }`. Markdown allowed in `text` (subject to viewer support). |

**Example:**

```jsonc
{
  "id": "msg_aiss_m_1",
  "type": ["purpose", "instruction"],
  "content": {
    "en": {
      "status": "validated",
      "text": "Please answer how much each statement applies to you. There are no right or wrong answers — your honest response is what matters most."
    },
    "pt": {
      "status": "validated",
      "text": "Por favor, indique o quanto cada afirmação se aplica a si. Não há respostas certas ou erradas — o que importa é a sua resposta honesta."
    }
  }
}
```

**Where used:** as a top-level entry in a Page's `elements[]`.

---

## 5. Entity: Context

A **Context** is a background paragraph that prepares the participant to answer correctly. It sets the *meaning* of something in the upcoming Question; it does not tell them how to respond. (Compare Instruction.)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^ctx_[a-z0-9_]+$` |
| `content` | object | yes | Language-keyed map. Each value: `{ status, text }`. |

**Example:**

```jsonc
{
  "id": "ctx_physical_activity_definition",
  "content": {
    "en": {
      "status": "validated",
      "text": "When we ask about 'physical activity' in the next questions, we mean any movement that increases your heart rate beyond resting — including walking, cycling, climbing stairs, household chores, and structured exercise."
    },
    "pt": {
      "status": "validated",
      "text": "Quando perguntamos sobre 'atividade física' nas próximas questões, queremos dizer qualquer movimento que aumente a sua frequência cardíaca acima do repouso."
    }
  }
}
```

Contexts attach to a Question (via the Question composition's `context` field), not to a Page directly. If you want a standalone background paragraph as a Page entry, use a Message.

---

## 6. Entity: Instruction

An **Instruction** describes how the participant should interact with the response options. Distinct from Context (which sets meaning) and Message (which is standalone).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^ins_[a-z0-9_]+$` |
| `dimension` | string | optional | The Dimension the instruction is written for (e.g. `agreement`, `frequency`). Used to match the Instruction to compatible Options. See §16 on Dimension semantics. Same vocabulary as Option/Prompt `dimension`. |
| `content` | object | yes | Language-keyed map. Each value: `{ status, text }`. |

**Example:**

```jsonc
{
  "id": "ins_agreement_likert_7",
  "dimension": "agreement",
  "content": {
    "en": { "status": "validated", "text": "Indicate how strongly you agree or disagree with each statement using the 7-point scale." },
    "pt": { "status": "validated", "text": "Indique o quanto concorda ou discorda de cada afirmação usando a escala de 7 pontos." }
  }
}
```

Instructions attach to a Question, not to a Page directly.

---

## 7. Entity: Prompt

The **Prompt** is the stem text — what the participant reads. The legacy library has 793 prompts.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^pr_[a-z0-9_]+$` (e.g. `pr_aiss_q_1`). |
| `name` | string | optional | Concept label independent of `id` (e.g. `marry_foreign`, `cold_water`). Used in scoring formulas and analysis exports as the variable name. Distinct from `id` because two Prompts measuring the same concept in different questionnaires can share a `name` while having different `id`s. See Q4a on requirement. |
| `construct` | string | optional | The psychometric concept this Prompt loads on (e.g. `sensation_seeking`, `depression`). See §16. Open vocabulary; preferred values documented in the Library's registry. Q3b. |
| `dimension` | string | optional | The kind of judgment the Prompt asks for (e.g. `frequency`, `agreement`, `similarity`). Same concept as Option's `dimension` — Prompt and Option typically share the same value, and Library warns when they differ. Open vocabulary; same registry as Option (Q3c). Per user clarification 2026-05-31. |
| `topics[]` | array of strings | optional | Free-form analytic tags (e.g. `["risk_taking", "novelty_seeking"]`). The v26.0528 `tags` field is merged here under the new name (Q6). |
| `reversed` | boolean | optional, default `false` | If `true`, the Prompt loads on its Construct in the *negative* direction: high option-value responses *decrease* the participant's Construct score. Applied at scoring time as `value' = max + min - value`. See §16. |
| `content` | object | yes | Language-keyed map. Each value: `{ status, text }`. |

**Example (from AISS sensation-seeking scale):**

```jsonc
{
  "id": "pr_aiss_q_2",
  "name": "cold_water",
  "construct": "sensation_seeking",
  "dimension": "similarity",
  "topics": ["risk_taking", "novelty_seeking"],
  "reversed": true,
  "content": {
    "en": {
      "status": "validated",
      "text": "When the water is very cold, I prefer not to swim even if it is a hot day."
    },
    "pt": {
      "status": "validated",
      "text": "Quando a água está muito fria, prefiro não nadar mesmo num dia quente."
    }
  }
}
```

`reversed: true` means: if the participant strongly agrees (high positive value on the answer scale), the contribution to their AISS sensation-seeking score is *negative*, because preferring to avoid cold water is the *opposite* of sensation-seeking.

**Note on `construct` vs. legacy `dimension`.** The legacy `Prompt.dimension` field is overloaded — see §16 for the detailed analysis and the recommended resolution.

---

## 8. Entity: Question (ref-binding)

A **Question** is a refs-only Library entity bundling a Prompt with optional Context and Instruction under a single addressable ID. It carries no content of its own — all text comes from the referenced atoms.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^q_[a-z0-9_]+$` |
| `prompt` | object | yes | `{ ref: "pr_…@v…" }` — the Prompt ref. |
| `context` | object | optional | `{ ref: "ctx_…@v…" }` — Context ref. |
| `instruction` | object | optional | `{ ref: "ins_…@v…" }` — Instruction ref. |

Question carries no `content` of its own — the referenced Prompt, Context, and Instruction each carry their own per-language `content`. To translate the Question, translate its constituent atoms.

**Example:**

```jsonc
{
  "id": "q_aiss_2",
  "prompt":      { "ref": "pr_aiss_q_2@v26.0528" },
  "instruction": { "ref": "ins_agreement_likert_7@v26.0528" }
}
```

A Question can also appear **inline** inside an Item (when an author has a one-off framing not worth saving). The inline form has the same shape minus the `id` field. See §8a (Item) for usage.

---

## 8a. Entity: Item (ref-binding)

An **Item** is the participant-administered unit, expressed as a refs-only Library entity bundling a Question with an Option. The Item entity holds no use-specific fields; `required` and `show_if` (the legacy `is_required` and `condition`) live on the *Page element* that references the Item, per OD-05 override semantics.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^it_[a-z0-9_]+$` |
| `question` | object | yes | `{ ref: "q_…@v…" }` — a saved Question ref, OR an inline Question composition with the same shape as §8 (without `id`). |
| `option` | object | yes | `{ ref: "opt_…@v…" }` — an Option ref. (Inline Options at this position are open question Q1d — see §18; current recommendation: ref only at the Item level.) |

**Example (saved Item with saved Question and saved Option):**

```jsonc
{
  "id": "it_aiss_2",
  "question": { "ref": "q_aiss_2@v26.0528" },
  "option":   { "ref": "opt_agreement_7@v26.0528" }
}
```

**Example (saved Item with an inline Question and a saved Option):**

```jsonc
{
  "id": "it_demographic_age",
  "question": {
    "prompt": { "ref": "pr_demographic_age@v26.0528" }
  },
  "option": { "ref": "opt_age_years@v26.0528" }
}
```

**Where Items appear.** A Page element can be:

1. **A saved Item reference** with use-specific overrides per OD-05:
   ```jsonc
   { "ref": "it_aiss_2@v26.0528", "required": true, "show_if": "..." }
   ```
2. **An inline Item composition** (one-off; not saved):
   ```jsonc
   {
     "question": { "ref": "q_aiss_2@v26.0528" },
     "option":   { "ref": "opt_agreement_7@v26.0528" },
     "required": true
   }
   ```
3. **A Message ref:**
   ```jsonc
   { "ref": "msg_aiss_m_1@v26.0528" }
   ```
4. **A Section** (per OD-12, retained).

**When to save an Item vs. inline it.** Save an Item when the same Question + Option pairing is meaningful across questionnaires (canonical PHQ-9 items, standard attention checks, etc.). Inline an Item for one-off uses where the binding isn't reused. The legacy `survey_database` has 935 composition rows, mostly one-off pairings — these migrate as inline Items by default; curators can promote frequently-reused ones to saved Items post-migration.

---

## 9. Entity: Option

The **Option** is the response-options specification. It defines what the participant can respond — the input type, the measurement type, the bounds (for numeric), the validation (for text), and (for choice types) the array of available choices.

The Option is what determines the **UI input widget** (§13).

This entity is what v26.0528 called `OptionSet`. The user's point in the OD-15 review: "Option does not have to be a set." A numeric input has no set; a text input has no set; only choice-type Options have an array of choices. Singular "Option" covers all three.

The Option separates **structural** fields (universal across languages — input type, value, index, min/max/step) from **content** fields (per-language — label, units, per-choice text). The split is Variant α from the content-shape grilling (2026-05-31).

### Structural fields (top-level on the Option)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^opt_[a-z0-9_]+$` (e.g. `opt_agreement_7`, `opt_hours_per_week`). |
| `dimension` | string | optional | The kind of judgment / scale the Option is structured around (e.g. `agreement`, `frequency`, `duration`, `similarity`). See §16. Open vocabulary. |
| `input_data_type` | enum | yes | `choice` / `number` / `text` |
| `measurement_type` | enum | yes | `nominal` / `ordinal` / `interval` / `ratio` |
| `min` | number | optional | Lower bound for numeric inputs (universal across languages). |
| `max` | number | optional | Upper bound (universal). |
| `step` | number | optional | Increment (universal). |
| `placeholder` | object | optional | Inline Placeholder OR `{ ref: "ph_…@v…" }`. |
| `help` | object | optional | Inline Help OR `{ ref: "help_…@v…" }`. |
| `input_validation` | object | optional | Inline regex string OR `{ ref: "rx_…@v…" }`. |
| `options` | array | required for `input_data_type: choice`; absent otherwise | Structural facts per choice: `{ index, value }`. The displayed `text` per choice lives inside `content` (see below). |
| `selection` | enum | required for `input_data_type: choice`; absent otherwise | `"single"` (radio) or `"multiple"` (checkbox). |
| `min_selected` | integer | optional, only when `selection: "multiple"` | Minimum number of choices required. Default 0. |
| `max_selected` | integer | optional, only when `selection: "multiple"` | Maximum number allowed. Default = number of options. |
| `content` | object | yes | Language-keyed map of per-language translatable content (see below). |

Per-choice structural row (only for `input_data_type: choice`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `index` | integer | yes | 1-based position within the set. Used as the key linking the structural choice to its per-language text in `content.{lang}.options[]`. |
| `value` | number / null | yes | Numeric value contributed to scoring when this choice is selected. `null` means the choice doesn't contribute (e.g. "prefer not to say"). |

### Content fields (inside `content.{lang}`)

Each language entry in `content` carries `status` plus the translatable fields:

| Field | Type | Required | Notes |
|---|---|---|---|
| `status` | enum | yes | `"draft"` / `"complete"` / `"validated"`. |
| `label` | string | optional | Human-readable name of the Option in this language. |
| `units` | string | optional | Physical unit in this language (`"h/week"`, `"h/semana"`, `"minutes"`, `"minutos"`). |
| `options` | array | optional, present iff the structural `options[]` is present | Array of `{ index, text }` rows; `index` matches the structural row, `text` is the displayed label in this language. |

### Example: choice / ordinal (7-point agreement) — Variant α

```jsonc
{
  "id": "opt_agreement_7",
  "dimension": "agreement",
  "input_data_type": "choice",
  "measurement_type": "ordinal",
  "selection": "single",
  "options": [
    { "index": 1, "value": -1.00 },
    { "index": 2, "value": -0.66 },
    { "index": 3, "value": -0.33 },
    { "index": 4, "value":  0.00 },
    { "index": 5, "value":  0.33 },
    { "index": 6, "value":  0.66 },
    { "index": 7, "value":  1.00 }
  ],
  "content": {
    "en": {
      "status": "validated",
      "label": "7-point agreement scale",
      "options": [
        { "index": 1, "text": "strongly disagree" },
        { "index": 2, "text": "disagree" },
        { "index": 3, "text": "somewhat disagree" },
        { "index": 4, "text": "neither agree nor disagree" },
        { "index": 5, "text": "somewhat agree" },
        { "index": 6, "text": "agree" },
        { "index": 7, "text": "strongly agree" }
      ]
    },
    "pt": {
      "status": "validated",
      "label": "Escala de concordância de 7 pontos",
      "options": [
        { "index": 1, "text": "discordo totalmente" },
        { "index": 2, "text": "discordo" },
        { "index": 3, "text": "discordo um pouco" },
        { "index": 4, "text": "nem concordo nem discordo" },
        { "index": 5, "text": "concordo um pouco" },
        { "index": 6, "text": "concordo" },
        { "index": 7, "text": "concordo totalmente" }
      ]
    }
  }
}
```

### Example: number / ratio (hours per week)

```jsonc
{
  "id": "opt_hours_per_week",
  "dimension": "duration",
  "input_data_type": "number",
  "measurement_type": "ratio",
  "min": 0,
  "max": 168,
  "step": 1,
  "placeholder": { "ref": "ph_hours_per_week@v26.0528" },
  "content": {
    "en": { "status": "validated", "label": "Hours per week (0–168)", "units": "h/week" },
    "pt": { "status": "validated", "label": "Horas por semana (0–168)", "units": "h/semana" }
  }
}
```

No structural `options[]` — numeric input. `units` lives inside `content` because it's translatable (`h/week` → `h/semana`).

### Example: text / interval (free-text year)

```jsonc
{
  "id": "opt_year_4digit",
  "input_data_type": "text",
  "measurement_type": "interval",
  "input_validation": { "ref": "rx_year_4digit@v26.0528" },
  "placeholder": { "ref": "ph_year_yyyy@v26.0528" },
  "content": {
    "en": { "status": "validated", "label": "Four-digit year" },
    "pt": { "status": "validated", "label": "Ano de quatro dígitos" }
  }
}
```

---

## 10. Entity: Placeholder

The hint text inside an input field. Reused across many Options.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^ph_[a-z0-9_]+$` |
| `content` | object | yes | Language-keyed map. Each value: `{ status, text }`. |

**Example:**

```jsonc
{
  "id": "ph_hours_per_week",
  "content": {
    "en": { "status": "validated", "text": "e.g. 5" },
    "pt": { "status": "validated", "text": "ex.: 5" }
  }
}
```

---

## 11. Entity: Help

Tooltip / "?" content shown next to a field on hover or click. Distinct from Context (background framing) and Placeholder (in-field hint).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^help_[a-z0-9_]+$` |
| `content` | object | yes | Language-keyed map. Each value: `{ status, text }`. Markdown allowed in `text`. |

**Example:**

```jsonc
{
  "id": "help_orcid_format",
  "content": {
    "en": {
      "status": "validated",
      "text": "**ORCID** is a 16-digit identifier in the form `0000-0000-0000-0000`. Find or register yours at [orcid.org](https://orcid.org)."
    },
    "pt": {
      "status": "validated",
      "text": "O **ORCID** é um identificador de 16 dígitos no formato `0000-0000-0000-0000`. Encontre ou registe o seu em [orcid.org](https://orcid.org)."
    }
  }
}
```

---

## 12. Entity: RegEx

A named validation pattern. Referenced from an Option's `input_validation` field, possibly from a future Question-level per-Item validation override.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^rx_[a-z0-9_]+$` |
| `regex` | string | yes | The pattern. ECMAScript flavour per Q8b. Not translatable — same regex pattern in every language. |
| `example_input` | string | yes | A string matching the pattern; used in docs and Editor UI. Not translatable. |
| `content` | object | optional | Language-keyed map for the (optional) `description` field only. Each value: `{ status, description }`. Absent if the RegEx has no human-readable description. |

**Example:**

```jsonc
{
  "id": "rx_year_4digit",
  "regex": "^(19|20)\\d{2}$",
  "example_input": "2026",
  "content": {
    "en": { "status": "validated", "description": "Four-digit year between 1900 and 2099." },
    "pt": { "status": "validated", "description": "Ano de quatro dígitos entre 1900 e 2099." }
  }
}
```

---

## 12a. Entity: Solution

A **Solution** records the correct response for a Prompt that has one — math problems, attention checks, lie-detector / catch items. The legacy `survey_database.Solution` table has 35 rows (~3.7% of Prompts) with columns `question_id` (= the Prompt's id) and `expected_response`.

Per Q16c (resolved 2026-05-30) Solution is a separate reusable entity rather than an inline field on Prompt or Item. The separation lets the same Prompt's correct-answer record evolve (e.g. add multiple acceptable answers, add partial-credit rules) independently of the Prompt itself, and lets a Prompt be used with multiple Options where the expected_response format depends on the Option.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `^sol_[a-z0-9_]+$` (e.g. `sol_aiss_q_1`). |
| `prompt` | object | yes | `{ ref: "pr_…@v…" }` — the Prompt the correct answer is for. One Solution per Prompt is the common case; multiple Solutions for the same Prompt (e.g. one per Option variant) are allowed and disambiguated by the optional `option` field. |
| `option` | object | optional | `{ ref: "opt_…@v…" }` — narrows the Solution to a specific Prompt-Option pairing. Absent when the expected_response is meaningful regardless of which Option the Item uses (rare). |
| `expected_response` | string / number / boolean / `null` | yes | The correct answer. Type matches the referenced Option's value type — string for `input_data_type: text`, number for `number`, the option's `value` (or array index) for `choice`. Not translatable (canonical value). The Library's static analysis verifies the type matches. |
| `content` | object | optional | Language-keyed map for the (optional) `description` field only. Each value: `{ status, description }`. Absent if the Solution has no description. |

**Example:**

```jsonc
{
  "id": "sol_attention_check_3",
  "prompt": { "ref": "pr_attention_check_3@v26.0528" },
  "option": { "ref": "opt_agreement_7@v26.0528" },
  "expected_response": 4,
  "content": {
    "en": {
      "status": "validated",
      "description": "Attention check: 'Please select 4 (the middle option)'. Failed responses flag the session for review."
    }
  }
}
```

**Open in scoring (out of OD-15 scope):** how a participant's response compares to a Solution (exact match? tolerance? partial credit? time-weighted?) and how Solution outcomes aggregate into scores. The Solution entity stores the truth; the future scoring OD says how to use it.

---

## 13. UI input widget derivation

The viewer picks the **UI input widget** from the Option's `input_data_type` × `measurement_type` pair, optionally refined by `selection` (for choice types) and by `style.layout` (a presentational hint that lives on the Item or higher per OD-12 / v26.0528).

| `input_data_type` | `measurement_type` | `selection` | UI input widget | Notes |
|---|---|---|---|---|
| `choice` | `nominal` | `single` | Radio | Categorical, no order (e.g. gender, country). |
| `choice` | `nominal` | `multiple` | Checkbox | Multi-select categorical (e.g. "select all that apply"). |
| `choice` | `ordinal` | `single` | Radio (typically Likert layout) | Ordered categorical (e.g. 7-point agreement). Refinements via `style.layout` (`dropdown`, `slider-like`). |
| `choice` | `interval` | `single` | Radio (often visual scale with anchors) | Equal-interval categorical (e.g. 0/25/50/75/100). |
| `choice` | `ratio` | `single` | Radio | Equal intervals + true zero (e.g. 0%/25%/50%/75%/100%). |
| `number` | `ratio` | — | Numeric input (spinner or slider; refined by `style.layout`) | True-zero numeric. |
| `number` | `interval` | — | Numeric input | E.g. year. |
| `text` | `nominal` / `interval` / `ratio` | — | Text input (validated by `input_validation` if present) | Free response. |

Legacy data counts (560 option rows):

| Combination | Rows | Renders as |
|---|---|---|
| `choice` / `ordinal` | 207 | Radio (Likert — dominant pattern) |
| `choice` / `interval` | 145 | Radio (scaled) |
| `choice` / `nominal` | 136 | Radio or Checkbox (depending on `selection`) |
| `choice` / `ratio` | 35 | Radio (proportions) |
| `number` / `ratio` | 15 | Numeric input |
| `text` / `ratio` | 6 | Text input |
| `text` / `interval` | 1 | Text input |
| (other / null) | 13 | — |

---

## 14. Page-element shapes for Items

Items appear on a Page as one of two shapes (per Q1c resolved 2026-05-30 → both Item and Question saved as ref-only entities; Q1a-resolved → `oneOf` shape):

### Shape (a) — Saved Item reference with OD-05 overrides

```jsonc
{
  "ref": "it_aiss_2@v26.0528",
  "required": true,
  "show_if": "q_screening == 'yes'"
}
```

The `ref` resolves to a saved Item entity (§8a). The `required` and `show_if` fields are *use-specific overrides* per OD-05 — they live on the Page element, not the Item entity. The Item entity itself is refs-only (no `required`, no `show_if`).

### Shape (b) — Inline Item composition (one-off)

```jsonc
{
  "question": { "ref": "q_aiss_2@v26.0528" },
  "option":   { "ref": "opt_agreement_7@v26.0528" },
  "required": true,
  "show_if":  null
}
```

The inline form has the same `question` + `option` shape as a saved Item (§8a) but without an `id` field, plus the use-specific composition fields. The `question` field can hold either a saved Question ref OR an inline Question (Prompt-ref + optional Context-ref + Instruction-ref).

### Field summary (both shapes)

| Field | Shape (a) | Shape (b) | Notes |
|---|---|---|---|
| `ref` | yes | — | Saved Item ref. Mutually exclusive with `question` + `option`. |
| `question` | — | yes | Saved Question ref OR inline Question (see §8). |
| `option` | — | yes | Saved Option ref. (Inline Options at this level are open Q1d.) |
| `required` | optional override (OD-05) | optional override (OD-05) | Default false. |
| `show_if` | optional override (OD-05) | optional override (OD-05) | Expression string. |
| `id` | not applicable (the Item's own id is used; same-Item-reused-twice in one questionnaire is open Q1b) | optional inline-id; defaults from the embedded Question's Prompt slug | See Q1b. |

---

## 15. Page composition

A Page's `elements[]` is heterogeneous. Each element is one of: a **Message ref**, a **saved Item ref** (with use-specific overrides), an **inline Item composition**, or a **Section** (per OD-12).

```jsonc
{
  "id": "page_aiss_intro_and_items_1_5",
  "title": "Sensation seeking — first 5 items",
  "elements": [
    { "ref": "msg_aiss_m_1@v26.0528" },                        // Message ref

    { "ref": "it_aiss_1@v26.0528", "required": true },          // saved Item ref + OD-05 override

    {                                                            // inline Item (one-off)
      "question": { "ref": "q_aiss_2@v26.0528" },
      "option":   { "ref": "opt_agreement_7@v26.0528" },
      "required": true
    },

    {                                                            // inline Item with inline Question
      "question": { "prompt": { "ref": "pr_local_addon@v26.0528" } },
      "option":   { "ref": "opt_agreement_7@v26.0528" },
      "required": false
    }
    // ... items 4-5
  ]
}
```

A Section (matrix layout, per OD-12) is a natural fit because all Items in a matrix share the same Option: the Section can carry the Option ref once and each Item inside the Section can omit its own `option`. Open question Q11d on the inheritance mechanism (Section-level Option vs. per-Item override).

---

## 16. Construct and Dimension — disentangling the legacy `dimension`

This section addresses the user-flagged confusion in the survey_database around `dimension` and `reversed`. Read it carefully — the rest of OD-15's resolution depends on these concepts being clean.

### 16.1 The legacy field is multivalent

The survey_database has a `dimension` field on three entities: Prompt, Option (as `option_id`-grouped), and Instruction. In real legacy data:

- `pr_aiss_q_1.dimension = "similarity"` — the kind of judgment the prompt asks for.
- `opt_agreement_7.dimension = "agreement"` — the kind of scale the response is collected on.
- `ins_agreement_likert_7.dimension = "agreement"` — instructions written for the agreement scale.

These are all **the same concept** ("what kind of judgment / scale is this side of the Item about"), applied to different entities. The legacy gets it right: same name, same meaning, across Prompt, Option, and Instruction. **Most of the time the values match** (a `frequency` Prompt is paired with a `frequency` Option). When they don't (the AISS case: similarity-asking Prompt with agreement-scale Option) it's a deliberate authoring choice that we want to preserve, not a bug.

What the legacy **misses** is a separate concept: **the psychometric construct the Prompt loads on.** Nowhere does the legacy say "this Prompt measures sensation_seeking". That's metadata the analysis pipeline needs to compute scores.

### 16.2 The resolution

**Two distinct fields:**

| Field | Lives on | Semantics | Vocabulary |
|---|---|---|---|
| `construct` | **Prompt only** | The psychometric construct the Prompt loads on (`sensation_seeking`, `depression`, `working_memory`). What you'd report a score for. | Q3b — open with registry |
| `dimension` | **Prompt, Option, and Instruction** (same concept on each) | The kind of judgment / scale (`agreement`, `frequency`, `duration`, `similarity`). Typically matches across the three within one Item; Library warns when Prompt.dimension ≠ Option.dimension. | Q3c — open with registry |
| `reversed` | **Prompt** | Whether the Prompt is worded as the *opposite* of its Construct (e.g. construct = `happiness`, prompt = "Are you feeling sad?" → `reversed: true`). Applied at scoring as `value' = max + min - value`. See §16.4. | boolean |

**The legacy `Prompt.dimension` migrates 1:1 to the new `Prompt.dimension`.** No transformation needed. The new `construct` field is left blank by the importer for human curation. (Per Q3d resolved 2026-05-31.)

### 16.3 Why Construct and Dimension are different concepts

Same Dimension, different Constructs — the reuse the legacy data demonstrates:

| Item | Prompt.dimension | Option.dimension | Prompt.construct |
|---|---|---|---|
| PHQ-9 item 1: "Little interest or pleasure..." | `frequency` | `frequency` | `depression` |
| GAD-7 item 1: "Feeling nervous, anxious..." | `frequency` | `frequency` | `anxiety` |
| Sleep item: "How often do you wake up at night?" | `frequency` | `frequency` | `sleep_quality` |

Same Construct, different Dimensions (rarer, but valid):

| Item | Prompt.dimension | Option.dimension | Prompt.construct |
|---|---|---|---|
| "How often do you feel sad?" | `frequency` | `frequency` | `depression` |
| "How intensely do you feel sad?" | `intensity` | `intensity` | `depression` |
| "How much do you agree that you've been sad lately?" | `agreement` | `agreement` | `depression` |

Prompt.dimension ≠ Option.dimension (the AISS authoring choice):

| Item | Prompt.dimension | Option.dimension | Prompt.construct | Library warning? |
|---|---|---|---|---|
| AISS item 1: "I can see how it would be interesting to marry someone from a foreign country" | `similarity` (asks similarity-to-self) | `agreement` (Likert) | `sensation_seeking` | Yes — warns "Prompt's dimension `similarity` differs from Option's `agreement`. Confirm intent." Author confirms; warning silenced for this Item. |

Two PHQ-9 / GAD-7 items can share the same Option entity (the 4-point frequency Likert) and the same Dimension (`frequency`) but load on *different Constructs* (`depression` vs. `anxiety`). The Option reuse pattern the legacy data demonstrates 207 times is preserved.

### 16.4 Reversed — semantics, scoring rule, edge cases

`reversed: true` means: when the participant's response on this Prompt is summed into the Construct score, **negate the answer's distance from the midpoint** of the answer scale. The standard psychometric convention is:

```
scored_value = (option.max + option.min) - response.value
```

**Worked examples** (with option scale values shown):

| Option | `min` | `max` | participant chose | `value` | reversed? | scored value | rationale |
|---|---|---|---|---|---|---|---|
| Symmetric 7-point agreement (−1 to +1) | −1 | +1 | "strongly agree" | +1 | no | +1 | participant strongly agrees → +1 toward construct |
| Symmetric 7-point agreement | −1 | +1 | "strongly agree" | +1 | yes | −1 | participant strongly agrees → −1 toward construct (the agreement runs *against* the construct) |
| Asymmetric 7-point (1 to 7) | 1 | 7 | "strongly agree" (value 7) | 7 | no | 7 | high response → high construct value |
| Asymmetric 7-point (1 to 7) | 1 | 7 | "strongly agree" (value 7) | 7 | yes | 1 | (1+7)−7 = 1 — high response → low construct value |
| PHQ-9 4-point (0 to 3) | 0 | 3 | "nearly every day" (value 3) | 3 | no | 3 | high frequency → high depression |
| PHQ-9 4-point (0 to 3) | 0 | 3 | "nearly every day" (value 3) | 3 | yes | 0 | (0+3)−3 = 0 — frequency reversed |

The formula works uniformly for symmetric and asymmetric scales. With symmetric scales centred on 0, `max + min = 0` and the formula collapses to `-value` (negation). With asymmetric scales it produces the proper mirror around the scale midpoint.

**Edge cases:**

- **`value: null` (e.g. "prefer not to say"):** unchanged regardless of `reversed`. Null doesn't contribute to scoring.
- **Option without explicit `min`/`max`:** scoring rule can't apply. The schema should require `min` and `max` to be present (or computable from `options[].value`) when any Prompt with `reversed: true` references the Option. Cross-document concern — enforce in the Library's static analysis, not the schema. Q5c.
- **`reversed` on a `choice / nominal` Option (no order to reverse):** ill-defined. The schema should warn or reject. Q5d.

### 16.5 Multi-construct prompts

A few real-world Prompts load on more than one Construct. Example: an item like "I often feel sad and have trouble sleeping" arguably loads on both `depression` (sadness) and `sleep_quality`. Each loading may have its own reversal direction.

The simple model in §16.2 (single `construct` and single `reversed` on Prompt) does **not** support this case. Options:

| Option | Shape | Pros / cons |
|---|---|---|
| (A) **Single construct per Prompt.** Multi-construct Prompts are forked into derived Prompts (one per construct). | `construct: string`, `reversed: boolean` | Simple schema; clean analytic semantics. Cost: forking inflates the Prompt count; the same wording appears N times. |
| (B) **Array of `loadings[]` on the Prompt**, each `{ construct, reversed, weight? }`. | `loadings: [{ construct, reversed, weight }]` | Handles multi-construct cleanly. Cost: schema and scoring engine grow; rare case complicates the common case. |
| (C) **`construct` + `reversed` on Prompt, plus an additional `additional_loadings[]`** for the rare second-construct case. | hybrid | Common case stays simple; rare case is bolted on. Cost: two ways to say the same thing for prompts that happen to load on exactly one construct. |

Recommendation: (A) — single construct per Prompt — as the v26.MMDD shipping target. The multi-construct case is rare (<5% of legacy prompts, per a quick scan). Migrate and ship. When a real multi-construct prompt arrives, schema bump to (B). Q5e.

### 16.6 Subscales after this split

OD-12 has Subscales as curated lists of `question_ids` with optional `weight_per_question`. With `construct` on every Prompt, that curation can become *automatic* for the common case (a "depression" subscale = all Prompts with `construct: depression` in the current questionnaire). Two alternatives:

| Option | Shape | Pros / cons |
|---|---|---|
| (A) **Derived subscales.** A Subscale entity references a `construct` value; membership is computed at evaluation time as "all Prompts with that Construct in this questionnaire". | `subscale: { id, name, construct }` | Zero curation per questionnaire; consistent with `construct` field. Cost: an explicit subscale entity becomes vestigial; can't express weighted subscales. |
| (B) **Explicit subscales (current OD-12).** Subscale references explicit `prompt_ids` (or `question_ids`) with optional per-prompt weights. | `subscale: { id, name, prompt_ids[], weight_per_prompt? }` | Full control; supports weighted subscales. Cost: redundant when membership matches `construct`. |
| (C) **Both via `oneOf`.** A subscale is either construct-derived or explicit. | hybrid | Simple common case + escape hatch. Cost: two shapes. |

Recommendation: (C). Q15a.

Reversed application: when a Subscale is scored (`mean(scl_depression)`, `sum(scl_depression)`), the scoring engine applies each Prompt's `reversed` flag automatically before aggregating. No need for the scoring formula to reference reversal explicitly. Q15b.

---

## 17. Headers — out of scope as a separate entity

The legacy `compositions.element_type = "header"` rows carry the questionnaire's own metadata (title, version, license). In our model that information lives in Schema 1 (Instrument), embedded at the questionnaire's `metadata` field. Header is not a separate entity; the legacy `header_id` round-trips into the questionnaire's `metadata.id`.

---

## 18. Resolution log — OD-15 sub-questions

All sub-questions resolved through the grilling sessions on 2026-05-29 / 2026-05-30 / 2026-05-31, except the **I — Subscales** group which is **deferred to a future Scoring OD** because it depends on scoring semantics that are out of OD-15's scope. The L group (Scoring) lists the deferred scoring sub-areas for traceability.

Decisions are grouped by area. The original grilling order walks A → B → C → D → E → F → G → H → I → J → K → L.

**A — Item and Question composition shape**

- **Q1a.** *(Resolved 2026-05-30.)* Item shape on Page elements: **`oneOf` between (a) saved Item ref + overrides and (b) inline Item composition**. See §14.
- **Q1a-followup.** *(Resolved 2026-05-30.)* Array name on Page: **`elements`** (matches legacy `element_type`).
- **Q1b.** *(Resolved 2026-05-30.)* Page-element `id` (the identifier used in response data, xAPI events, logic expressions, subscale member lists, cross-question validation): **defaults to the referenced Item's `id` verbatim (with `it_` prefix preserved).** Override via explicit `id` on the Page element when the same Item is used twice in one questionnaire (pre/post case). Uniform convention across Library entity, response data, and logic expressions — `it_phq9_1` everywhere. Legacy migration prepends `it_` to all legacy composition question_ids when generating new Item ids and response keys.
- **Q1c.** *(Resolved 2026-05-30.)* **Both Item and Question are saved Library entities** (refs-only). Item entity (`it_*`) bundles Question-ref + Option-ref. Question entity (`q_*`) bundles Prompt-ref + optional Context-ref + Instruction-ref. Inline forms allowed on Page elements for one-off use. See §8, §8a, §14.
- **Q1d.** *(Resolved 2026-05-30.)* Saved Item entity's `option` is **strict ref-only** (Option ref required). Inline Options remain allowed at the inline-Item-on-Page-element level. Preserves refs-only purity for saved entities; consistent with Question's saved-form being ref-only.

**B — Option (entity formerly OptionSet)**

- **Q2a.** *(Resolved 2026-05-29.)* Entity name **Option** (singular). Prefix `opt_`.
- **Q2b.** *(Resolved 2026-05-31, by Q8a generalisation.)* `placeholder`, `help`, `input_validation` all support **both inline and reference forms** (`oneOf`).
- **Q2c.** *(Resolved 2026-05-31.)* Nested array name inside choice-type Options: **`options`** — recursive naming kept for legacy continuity.

**C — Construct and Dimension semantics (§16)**

- **Q3a.** *(Resolved 2026-05-30.)* Schema does not enforce Prompt.dimension ↔ Option.dimension compatibility. Library warns when they differ.
- **Q3b.** *(Resolved 2026-05-30.)* `construct` vocabulary: open with Library-maintained registry. Initial preferred values listed in §7.
- **Q3c.** *(Resolved 2026-05-30.)* `dimension` vocabulary: open with registry. Preferred values: `agreement`, `frequency`, `intensity`, `duration`, `count`, `presence`, `similarity`, `confidence`, `preference`, `quality`, `quantity`, `time`, `binary`.
- **Q3d.** *(Resolved 2026-05-31, reframed.)* Legacy `Prompt.dimension` migrates **1:1 to the new `Prompt.dimension`** field (same concept, same name). Construct is a separate new field on Prompt, left blank by the importer for human curation. The earlier proposal to move legacy dimension into `topics[]` is superseded.

**D — Prompt fields**

- **Q4a.** *(Resolved 2026-05-31.)* `name`: **optional**. Authored where meaningful (analytic items); absent for items where `id` is self-describing.
- **Q4b.** *(Resolved 2026-05-31.)* Uniqueness of `name`: **not enforced by the schema** — Library may warn on collisions.
- **Q5a.** *(Resolved 2026-05-31, by Q5e.)* `reversed` shape: **single boolean per Prompt**. `loadings[]` array deferred.
- **Q5b.** *(Resolved 2026-05-31.)* Scoring rule for `reversed`: **`value' = max + min - value`** (standard psychometric convention; documented in §16.4).
- **Q5c.** *(Resolved 2026-05-31.)* Schema does **not require `min`/`max`** on the Option when a referencing Prompt has `reversed: true`. **Library static analysis** enforces this cross-document — when an `Item` binds a `reversed` Prompt to an Option lacking `min`/`max`, the Library rejects publication with an actionable error.
- **Q5d.** *(Resolved 2026-05-31.)* `reversed: true` on a `choice/nominal` Option (no order to reverse) is ill-defined. **Library rejects at publish time**. Schema cannot detect this cross-document.
- **Q5e.** *(Resolved 2026-05-31.)* Multi-construct Prompts: **defer**. v26.MMDD ships with `Prompt: { construct: string, reversed: boolean }`. Real multi-construct cases fork into derived Prompts. Future schema bump can promote to `loadings[]` if needed.
- **Q6.** *(Resolved 2026-05-31.)* `topics` (new) and `tags` (v26.0528): **merge under `topics[]`**. The v26.0528 `tags` field had no real usage in legacy data; one analytic-tag field is enough.

**E — Message**

- **Q7a.** *(Resolved 2026-05-30, by Q7 bundle.)* `type` vocabulary: **open with Library-maintained registry**. Initial preferred values: `welcome`, `purpose`, `instruction`, `information`, `consent`, `transition`, `privacy`, `thank_you`, `end`, `debriefing`, `job`.
- **Q7b.** *(Resolved 2026-05-31.)* Media payloads on Messages: **deferred to Phase 4** (Native Viewer). Text-only Messages in v26.MMDD. The Message schema can carry an open `extensions{}` field today; a future schema bump adds typed `media: { url, kind }` once viewer support lands.
- **Q7c.** *(Resolved 2026-05-30.)* `type` as **string-array** (`type: ["purpose", "instruction"]`) — cleanly models legacy compound values.

**F — Validation and per-Option metadata**

- **Q8a.** *(Resolved 2026-05-31.)* RegEx as **both** reusable entity (`rx_*`) and inline regex string. `Option.input_validation` uses a `oneOf` between the two. Same policy as Placeholder / Help.
- **Q8b.** *(Resolved 2026-05-31.)* Regex flavour: **ECMAScript** — matches JSON Schema's native `pattern` keyword. Browser-native; small adaptation in Godot. Legacy patterns all fit the ECMAScript subset.
- **Q9a.** *(Resolved 2026-05-31.)* Placeholder / Help live on **Option**, not on Item. Hint text describes the input mechanism (an Option-level concern), not the specific Item that uses the Option.

**G — UI input widget**

- **Q10a.** *(Resolved 2026-05-31.)* `(input_data_type, measurement_type, selection)` is the complete discriminator. **`style.layout`** refines presentationally (matches v26.0528 OD-12 convention) — e.g. radio with `style.layout: "dropdown"` or `style.layout: "buttons"`. Style cascades through Questionnaire → Block → Page → Section → Item; layout at the most-specific level wins.
- **Q10b.** *(Resolved 2026-05-30.)* Disambiguator: **`selection: "single" \| "multiple"`** enum on Option (full term, not abbreviation). `min_selected` / `max_selected` stay as separate validation fields when `selection: "multiple"`.

**H — Page composition**

- **Q11a.** *(Resolved 2026-05-31, implicitly by Q1c.)* Context attaches to a Question (which lives inside an Item). **Not a Page element on its own.** If an author wants a standalone framing paragraph, they write a Message.
- **Q11b.** *(Resolved 2026-05-31, implicitly by Q1c.)* Instruction attaches to a Question. **Not a Page element on its own.** Same rationale as Q11a.
- **Q11c.** *(Resolved 2026-05-31, implicitly by Q1c.)* **No** bare Context / Instruction refs as Page elements. Page `elements[]` accepts only: Section / Message ref / saved Item ref + overrides / inline Item composition.
- **Q11d.** *(Resolved 2026-05-30.)* **Section carries `shared_option`** for matrix layouts; inner Items omit their `option` and inherit. Saved Item refs inside matrix Sections are uncommon (saved Items require their own Option); inline Items dominate inside Sections.

**I — Subscales (scoring-deferred)**

These two questions are flagged here for traceability but **deferred to the future Scoring OD** (group L below). The Subscale entity shape and reversal-aggregation rule are scoring concerns; the v26.MMDD schema declares the question structure (Prompts, Items) but does not finalise how subscales aggregate.

- **Q15a.** *(Deferred.)* Construct-derived subscales vs. explicit-prompt-ids vs. `oneOf`. Pre-grill leaning: **`oneOf`** (§16.6 option C). To be settled when the Scoring OD opens.
- **Q15b.** *(Deferred.)* `reversed` auto-application by the scoring engine. Pre-grill leaning: **yes — automatic per-prompt reversal before aggregation**. To be settled in the Scoring OD.

**J — Migration**

- **Q16a.** *(Resolved 2026-05-31.)* Legacy `compositions.condition` (free text): **parse known patterns** into the new `show_if` Expression syntax; **flag unparseable** for human review at migration time. Cross-document concern; lives in the migration importer (per [13_importers.md](13_importers.md)), not in the schema.
- **Q16b.** *(Resolved 2026-05-31.)* Preserve legacy slugs with new prefixes: **`aiss_q_1` → `pr_aiss_q_1`**, **`agreement_7` → `opt_agreement_7`**, the legacy composition row becomes **`it_aiss_q_1`**. Response data keys also gain the `it_` prefix per Q1b resolution.
- **Q16c.** *(Resolved 2026-05-30.)* Legacy `Solution` table → **separate reusable entity `sol_*`** binding Prompt-ref + optional Option-ref + `expected_response`. See §12a for the entity definition and the glossary entry for the rationale.
- **Q16d.** *(Resolved 2026-05-31, per Q3d reframe.)* Migration importer migrates legacy `Prompt.dimension` **1:1 to the new `Prompt.dimension`** and leaves the new `Prompt.construct` blank for human curation.

**K — Schema versioning**

- **Q17.** *(Resolved 2026-05-31 by CalVer convention.)* v26.0528 archived under `versions/v26.0528/`; new schema lands as current at a fresh CalVer date with `breaking` severity. See [project_calver_versioning](../../) memory.

**M — Content shape for translatable entities**

- **QM.** *(Resolved 2026-05-31.)* All content-bearing entities (Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx, Solution) replace the v26.0528-style `text` + `translations` split with a **`content` language-keyed map**. Each `content.{lang}` carries a `status` plus the translatable fields for that language. The canonical language is whichever key matches the instrument's `metadata.language`. For Option (which has multiple translatable fields plus structural fields), **Variant α** applies: structural facts (`input_data_type`, `measurement_type`, `min`/`max`/`step`, per-choice `value` and `index`) stay at the Option's top level; translatable fields (`label`, `units`, per-choice `text` keyed by `index`) live inside `content.{lang}`. See §§4–12a for per-entity shapes; see §3 for the inventory's `content` column.

---

**L — Scoring (out of scope, but glossary-aware)**

Scoring (responses → scored values → Construct totals → bands & interpretation) is **deferred to a separate OD** beyond OD-15. The glossary in §1 defines Construct, Dimension, Reversed, Solution, and Scoring so the future scoring OD inherits consistent terminology. Open scoring sub-areas to flag for that future OD:

- **QL-1.** Item-level scoring (one response → one scored value, with `reversed` applied via the `max + min − value` rule from §16.4).
- **QL-2.** Questionnaire-level scoring (Item scores aggregated per Construct / subscale / total, with weighting per Q15).
- **QL-3.** Interpretation bands per scored Construct (cutoffs, severity labels — already in v26.0528 Schema 2's `ScoringDef`; survives the pivot).
- **QL-4.** Solution-based scoring for "correct answer" Items (Q16c): per-item correctness, optional partial credit, and aggregated "score" (count correct, percentage correct, time-weighted).

---

## 19. Summary diff vs. v26.0528

| v26.0528 (current implementation) | OD-15 target |
|---|---|
| 4 reusable entity types: Question (polymorphic widget), OptionSet (flat), Instruction, Prompt | **11 reusable entity types in two categories.** Content: Message, Context, Instruction, Prompt, Option, Placeholder, Help, RegEx. Ref-binding: Question, Item, Solution. |
| Question is the page-entry atom with 10 `QuestionXxx` polymorphic $defs by widget type | Item is the page-element atom: a refs-only saved entity (`it_*`) bundling Question-ref + Option-ref, OR an inline Item composition. Question is a refs-only saved entity (`q_*`) bundling Prompt + optional Context + Instruction. Use-specific fields (`required`, `show_if`) live on the Page element, not on the Item entity. |
| OptionSet is flat: `{ options: [{ value, text }] }` | Option carries set-level metadata (`label`, `dimension`, input/measurement type, min/max/step/units, refs to Placeholder / Help / RegEx) plus per-choice rows (index, value, text) for choice-type only. Renamed from OptionSet (user request). |
| Prompt has only `text` (and a separate `translations` block) | Prompt has `name`, `construct`, `dimension`, `topics[]`, `reversed`, and a `content` language-keyed map carrying `{ status, text }` per language. Legacy `Prompt.dimension` migrates 1:1 to new `Prompt.dimension`; new `construct` field left blank for human curation. |
| Content asymmetric: `text` at top level (canonical) + `translations` object (other languages) | **`content` language-keyed map** — all languages are peer entries. Each `content.{lang}` carries `{ status, ...translatable fields }`. The canonical language is whichever key matches the instrument's `metadata.language`. (Per Q-M resolved 2026-05-31.) |
| Instruction has only `text` | Instruction has optional `dimension`, `text`. |
| No Context (collapsed into Instruction) | Context is separate. |
| No Message, Placeholder, Help, RegEx entities | Four new reusable entity types. |
| UI input widget is declared via `Question.type` (`radio` / `slider` / …) | UI input widget is derived from Option's `input_data_type` × `measurement_type` (× `selection` for choice). |
| Page elements: Section / Question / QuestionReference / InstructionReference / PromptReference | Page elements: Section / Message ref / saved Item ref + overrides / inline Item composition. Array renamed from `entries` to `elements`. |

The v26.0528 schema is preserved as `schemas/questionnaire/versions/v26.0528/schema.json` once superseded; published instances under it remain valid until re-authored. The new schema is a clean break (`breaking` severity per CalVer policy), not a backward-compatible extension.

---

## 20. References

- [05_data_model.md](05_data_model.md) — Schema 2 in the v26.0528 form (to be updated when OD-15 resolves)
- [10_open_decisions.md](10_open_decisions.md) §"OD-15" — the open-decision entry
- [06_library.md](06_library.md) — Library content model (reusable-entity section needs update post-OD-15)
- [13_importers.md](13_importers.md) — migration importer; will need handlers per new entity type
- [survey_database/backend/models.py](../survey_database/backend/models.py) — the legacy SQLAlchemy models this pivot is aligned to
- [survey_database/data/survey_db.sqlite](../survey_database/data/survey_db.sqlite) — the legacy data (793 Prompts, 560 Option rows, 935 compositions across 64 questionnaires)
- [docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md](../docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md) — the design spec that produced the superseded v26.0528 schema

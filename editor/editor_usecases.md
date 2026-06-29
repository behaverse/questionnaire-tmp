# Editor use cases

What can you do with the Questionnaire Editor, why is each task useful, and how do you do it?

The Editor is a browser-based authoring tool for **canonical Schema-2 questionnaires**. It runs
fully in the browser (no backend); your draft is autosaved locally, and it reads from the
read-only **Library** to reuse existing content. Everything you build round-trips as valid
Schema-2 JSON.

> **The content model (important — used throughout):**
> - An **Item** is what a participant answers = a **Question** + an **Option** (the response).
> - A **Question** = a **Prompt** (the statement/question text) + *optionally* an **Instruction**
>   and/or a **Context**.
> - An **Option** is the response format (a Likert scale, multiple choice, a number, free text…).
> - A **Message** is a *separate element type* — standalone content (intro, section break,
>   debrief) that is **not** a question and has no response.
> - Prompts, Options, Instructions, Contexts, Messages are **reusable entities**: one entity can
>   be referenced (and translated) once and reused across many items/questionnaires.

> **Launching it (dev):** run `npm run dev` in `editor/` and open **http://localhost:5173**.
> The port matters — the live Library's CORS allowlist is `localhost:5173`, so "Pick from
> Library" / "Browse Library" only work on that origin (the dev server is pinned to it).

---

## 1. Open or create a questionnaire

**Why:** every session begins by loading something to work on — a fresh draft, a file, a
ready-made example, or an existing instrument from the Library.

**How — the start screen offers four entry points:**
- **Load a sample** — opens a self-contained example (BIS/BAS) that works offline. Best for
  exploring what the editor can do without touching the Library.
- **New questionnaire** — creates a new, empty questionnaire (one page) to build from scratch.
- **Open file** — loads a canonical Schema-2 `.json` from disk. This is the **Export JSON**
  output (a questionnaire that references entities by id). *Note:* opening a file loads the
  questionnaire itself; it does **not** re-hydrate the local draft entities that an
  **Export bundle** contains (a bundle is for the standalone preview, not re-import).
- **Open from Library** — **Browse Library…** opens a searchable picker of published
  instruments (search covers title + description); or type an exact `id` + `version` and click
  **Open**.

**Does any of this change the Library?** No. The Library is **read-only** from the editor —
everything you open, edit, and export stays local to your browser. Nothing you do here writes
back to the shared Library (publishing is a separate, not-yet-built workflow).

Your work autosaves continuously to the browser; the topbar **← Home** button returns to this
screen (it warns if you have unsaved changes, and keeps the autosaved draft).

---

## 2. Inspect / understand a questionnaire

**Why:** before editing (or to review someone else's instrument), you need to see its structure
and read its actual content.

**How:**
- The **structure tree** (left) shows the hierarchy — **Block ▸ Page ▸ Section ▸ Item / Message** —
  with each row labelled by its **readable text** (the question prompt), the entity id shown small
  underneath. Numbered, with icons per node kind.
- Click any node to select it; its details appear in the **Inspector** (right) and its
  editable content in the **Canvas** (center).
- Toggle **▢ Preview** (topbar) for a live rendered view (see §11 for what the preview is and
  isn't) — pick the **Language**, a **Device** frame, and the **Scope** (whole questionnaire /
  selected page).
- Green/amber dots in the tree show per-row translation status when you're editing a
  non-primary language.

---

## 3. Build and organize structure (blocks, pages, sections)

**Why:** questionnaires are paginated and grouped — **pages** are what participants advance
through, **sections** group items within a page, and **blocks** group pages across the instrument.

**How:**
- **+ Block** (top of the tree) adds a cross-page block; select a block in the Inspector to
  choose which pages it contains.
- With a page or section selected, the Canvas shows **+ Add section** to nest a section.
- **Drag rows** in the tree to reorder siblings.
- Select a page/section/block to edit its **title** and **id** in the Inspector, and toggle
  **Randomize element order** (or, on a block, randomize page order) for counterbalancing.
- **How content maps to pages:** items and messages live on a page (optionally nested in a
  section). Add a page from the structure tree, then add items to it; the page boundary is what
  separates one screen from the next in the deployed viewer (the preview shows pages stacked with
  a horizontal separator between them).

---

## 4. Author an item (Question + Option)

**Why:** an **Item** is the core unit a participant answers — a **Question** (a **Prompt**, plus
optional **Instruction**/**Context**) paired with an **Option** (the response format). This is
where most authoring happens.

**How:**
- With a page/section selected, click **+ Add item** — this creates a new item with a draft
  prompt and a default response, and opens the **Item editor** in the Canvas.
- **Prompt** (the question text): type it (per editing language); set optional metadata — name,
  construct, dimension, topics, and **reversed** (loads negatively on its construct).
- **Instruction / Context** (optional, part of the Question): add them in the Item editor — see §6.
- **Option (the response):** choose the response type via the data-type/measurement/selection
  triple (the editor derives the widget — radio, checkbox, dropdown, number, text…). For
  choice scales, add/edit/reorder **choice rows** (label + value), set **min/max selected**;
  for numeric/text, set the input constraints; attach an inline **placeholder** / **help**.
- Toggle **Required** on the item row. Delete an item with its row's trash button.
- The live Preview reflects every edit immediately.

> **Planned (from feedback):** when you create a new item/prompt/option, the editor will offer to
> **search the Library for similar existing entities** so you can reuse one instead of creating a
> near-duplicate. Today, reuse is a deliberate "Pick from Library" step (§5).

---

## 5. Reuse existing content from the Library (don't reinvent scales)

**Why:** standard scales (e.g. a 7-point agreement Likert) and validated prompts already exist
in the Library. Reusing them keeps instruments consistent and comparable, and avoids duplicates.

**How:**
- Each slot (prompt, option, context, instruction) and the Canvas (**Pick item**, **Pick
  message**) has a **Pick** button that opens the **Library picker** — it lists the available
  entities and the search box **filters** them. Select one to insert a **hard-pinned reference**
  (`@vYY.MMDD`) — pinned so the instrument never changes underneath you.
- **Keep references current (OD-06):** picked refs are pinned to a version. **Check for
  updates** (topbar) asks the Library whether any referenced entity has a **newer published
  version**; if so it shows a "newer: vX" badge on the ref + an **⬆ N updates** count. Click
  **Upgrade** to re-point to the new version — it never upgrades silently.
- **Edit a referenced entity (OD-05):** a picked Library entity is read-only. To change it,
  click **Edit** — the editor explains it must make a **local copy** (a `.devN` version) and
  re-points the reference, so you can edit the text/options locally without altering the shared
  Library entry.

---

## 6. Add a Question's Instruction / Context, and standalone Messages

**Why:** a Question often needs framing — a shared **Instruction** ("Over the last 2 weeks, how
often…") or a **Context** passage. Separately, a **Message** is a distinct element type for
standalone content (intros, section breaks, debriefs) that isn't a question.

**How:**
- **Instruction & Context are part of an item's Question:** in the Item editor, **add
  Instruction** and **add Context** (type them inline, or **Pick** from the Library); remove
  them to detach.
- **Messages are a separate element:** in the Canvas, **+ Add message** inserts a standalone
  message element (or **Pick message** from the Library); edit its text in the Message pane.
- All inline/edited content lives in the draft's local entity pool and rides along in the
  exported bundle.

---

## 7. Add logic: visibility, skip, branch, piping, randomization

**Why:** real instruments adapt — show a follow-up only if a prior answer warrants it, skip
pages, branch by score, or pipe a previous answer into a later prompt.

**How (questionnaire root → Inspector → Logic tab, and per-element):**
- **Show-if (visibility):** select any page/section/item and set **"Visible when…"** with a
  condition (e.g. `q_age >= 18 && q_consent == 'yes'`). The editor checks the expression syntax
  live and the Preview hides/shows elements as you change throwaway answers.
- **Logic rules:** add **skip / branch / visibility** rules with a condition and a target.
  Visibility rules execute live in the Preview; skip/branch are authored + validated here and
  run in the deployed viewer.
- **Piping:** insert a previous answer into a later prompt (pick the source question + target
  prompt); same-page piping previews live.
- **Randomization:** checkboxes to randomize page/section/element order (for counterbalancing).

---

## 8. Add validation (per-question and cross-question)

**Why:** catch bad input at response time — enforce a number range, a text length/format, a
required answer, or a rule that spans questions ("end date must be after start date").

**How:**
- **Per-question:** in the Option editor's **Validation** section, set type-appropriate rules
  (number → range; text → length + format) with custom messages. (Separate from the optional
  **Input mask (RegEx)**.) Errors show live on the offending item in the Preview.
- **Cross-question:** questionnaire root → Inspector → **Validation tab** → add a rule with a
  condition, a message, and the target question(s). Tripped rules surface their message on the
  targets in the Preview.

---

## 9. Declare scoring

**Why:** most instruments compute scores (a PHQ-9 total, subscale sums). Scoring is defined
externally (a reusable **Scorer**); the questionnaire just declares which scores it surfaces.

**How:** questionnaire root → Inspector → **Scoring tab** → **+ Add score**: give it an id, the
**Scorer** reference (type one or **Pick** from the Library), a **JSON-Pointer path** into the
Scorer's output (e.g. `/total`), and a name/description. Scores are computed by the deployed
viewer — they aren't shown live in this preview.

---

## 10. Translate a questionnaire (or specific elements)

**Why:** to administer an instrument in multiple languages while keeping one canonical source.

**The key idea — translations attach to the entity, and are reused everywhere it's referenced.**
Content is a **language-keyed map on each reusable entity**. So when you translate an **Option**
(or Prompt, Instruction, etc.), that translation is **added to that one entity** and is
**automatically used by every item/questionnaire that references it** — you do **not** re-translate
it per question. (If the entity is a pinned Library reference, your first translation **forks** it
into your local draft so your translation is stored without changing the shared Library entry.)

**How:**
- **Manage languages:** questionnaire root → Inspector → add languages (the primary is
  non-removable). Each translatable string carries a per-locale status (draft/complete/validated).
- **Edit one language at a time:** use the topbar **"Editing language"** switcher — the
  content editors then edit that language's text (a missing translation auto-creates on first
  edit). The editing language is independent of the Preview's language picker.
- **Side-by-side (the fast way):** toggle **Translate** (topbar) for a full-width panel listing
  every translatable string with **source → target** columns, **deduplicated by entity** (a
  shared option appears **once**), per-row status, a progress indicator, and an
  "untranslated only" filter.
- **Translate one element:** edit that entity's target text in either the inline editor or the
  Translate panel — because of the dedup above, translating a shared option once covers every
  item that uses it.

---

## 11. Preview the questionnaire

**Why:** see how the instrument reads and behaves before deploying.

**What the preview is (and isn't):** it renders your draft using the **same renderer** the
deployed viewer uses, so it's a faithful **proxy** of the participant experience — but it is
**not** a live deployed session (no real data capture, scoring, or server-side logic). To
actually *run* the questionnaire end-to-end you'd open it in the deployed **web-viewer**
(running a live viewer session from the editor is a planned feature).

**How:**
- **Inline preview:** toggle **▢ Preview**; choose Language / Device / Scope. Logic, show-if,
  piping, and validation execute against throwaway answers as you edit. The pages render stacked
  (scrollable) with a horizontal separator between pages.
- **Standalone preview:** **Export ▾ → Open preview** opens the **same rendered view full-screen
  in a new browser tab**, with no editor chrome and no backend (it uses a self-contained bundle).
  It's the same renderer as the inline preview — the difference is purely *where* it runs:
  in-editor split-pane vs a clean, shareable full-page tab. Use it to show the look/flow to
  someone without the editor around it.

---

## 12. Validate (Schema-2 conformance)

**What it does:** **Validate** (topbar) re-checks the whole questionnaire against the Schema-2
rules and reports whether it's structurally valid (the chip shows ✓ or a ⚠ with an error count).

**Why it's useful:** the canonical JSON is the source of truth and downstream tools (the Library,
the viewer, the denormaliser) require valid Schema-2. The editor also validates on load, and
**Export warns** if you try to export an invalid questionnaire — so the explicit **Validate**
button is mostly an on-demand re-check. *(Planned, from feedback: run validation automatically in
the background on edit/save so the button becomes optional.)*

---

## 13. Export and share

**What "Export" does + why it's useful:** the **Export ▾** menu produces shareable artifacts —
the canonical output other tools consume. The two export formats differ in **what they include**:

- **Export JSON** — the **questionnaire only**. Entities (prompts, options, …) are kept as
  **references** (`@vYY.MMDD`), *not* inlined. The file is small and is the canonical form the
  **Library / version control / any Schema-2 consumer** expects — but to *render* it you need
  access to the Library (or a bundle) to resolve those references. (Warns if invalid.)
- **Export bundle** — the questionnaire **plus every referenced/drafted entity inlined** as a
  `{questionnaire, entities}` package. It is **self-contained**: it renders **offline** with no
  Library (this is exactly what powers the standalone preview), and it's how you move a complete
  draft — including your local/edited entities — between machines. It's larger because it carries
  all the content.
  - *Rule of thumb:* **Export JSON** to contribute/store the instrument; **Export bundle** to
    preview offline or hand someone a fully self-contained copy.
- **Open preview** — opens the standalone full-screen preview described in §11 (it uses the same
  bundle under the hood).

---

## 14. Save, resume, and reset

**Why:** authoring is iterative; you shouldn't lose work or fear navigating away.

**How:**
- The draft **autosaves** to the browser (IndexedDB) as you edit and is restored on your next
  visit. The topbar shows a **"● unsaved"** marker while there are pending changes (it clears once
  saved). *(Planned, from feedback: an explicit "saved" confirmation.)*
- **← Home** returns to the start screen (dirty-guarded; the autosave is kept). Re-opening from a
  file or the Library replaces the current draft.
- **Reset / discard changes:** there is currently **no dedicated "discard" button** — to throw
  away test edits you reload the original (e.g. re-open the file/Library entry, or **Load a
  sample** again). *(Planned, from feedback: a proper reset/discard action.)*
- **Check for updates** (topbar): see §5 — it checks the Library for newer versions of your pinned
  references and offers to upgrade them.

---

## What's not in the editor (by design / yet)
- **Submitting to the Library** and **real "deploy to viewer"** are gated on the Identity
  service (not built) — the editor produces the canonical JSON/bundle; publishing happens
  elsewhere.
- **Live score values** aren't computed in the preview (scoring runs in the deployed viewer).
- A few translation surfaces (placeholder/help, page/section/block titles) are pending schema work.

> **Open feedback being worked on** (tracked separately in `editor_feedback.md`): merge
> "+ Add"/"Pick" into one add-with-dedup flow; show referenced-entity content (read-only) inside
> items; list an item's sub-elements (e.g. its option) in the structure tree; a dedicated
> "Translate" entry + translation helper; toggleable inspector; modal that closes only on
> explicit close; picker search that searches content, not just id.

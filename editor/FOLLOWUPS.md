# ED-A Follow-ups

Known limitations and open items carried out of ED-A, to surface in later stages.

## (a) Library unresolved-definition endpoint — unverified against the live API

The `fetchFromLibrary` client requests the **unresolved** definition (refs-intact JSON,
`…/definition?resolved=false`, spec §7). This is currently **assumed** — it has not been
tested against the live Library API. Verify that the live endpoint actually serves
refs-intact JSON (not the resolved/inlined form). If only the resolved form is available,
ED-A should fall back to file-import for refs-intact content and the route assumption must
be revisited.

## (b) Blocks — tree-grouping UI is minimal

Block create / delete / rename + membership editing is **not in ED-A's UI yet**. The
**model ops exist** (`createBlock` / `deleteBlock` / `setBlockPages` in `src/model/tree.ts`)
and are tested, but blocks are **not rendered as group headers** in the StructureTree, and
there is no UI to edit block→page membership. Surface this in a later pass.

## (c) `style` / `flow` inspector panels are stubs

The Inspector shows a "style / flow panels arrive with full coverage in later stages" note;
the panels are stubs (title + id editing only) until a later stage wires the full
inheritance-aware `style` / `flow` editing.

## (d) Item / message inspector + canvas chips are read-only

Selecting an Item or Message shows its refs + structural context **read-only**; canvas ref
chips are reorder / delete / move-only. Full item/message authoring (and `show_if`) is
deferred — read-only until **ED-C** (and **ED-D** for `show_if`).

## (e) Selection is not index-stable after deleting a middle sibling

Deleting a *middle sibling* shifts subsequent indices, so a stale path-based selection may
silently point at a *different* sibling than intended. This does **not** crash (that is
fixed), but selection is not index-stable. Consider moving to stable node ids for selection
+ DnD addressing rather than array-index paths.

## (f) Playwright screenshot is generated locally / in CI, not committed

`tests/e2e/screenshots/ed-a-workspace.png` is `.gitignore`d. It is produced by
`npm run e2e` (requires `npx playwright install chromium`). If Playwright cannot run in a
given environment, the screenshot must be (re)generated locally or in CI; the smoke spec +
config are committed so the test exists regardless. (ED-B adds a second gitignored
screenshot, `tests/e2e/screenshots/ed-b-preview.png`, on the same terms.)

# ED-B Follow-ups

Known limitations and open items carried out of ED-B (inline preview).

## (g) Library entity-body endpoint — unverified against the live API

`fetchEntityBody` assumes `GET /v1/entities/{type}/{id}?version=` returns the entity body.
Confirm this against the live API — the path shape, whether `version` is a query param vs a
path segment vs ignored — and adjust `parseRef` / `fetchEntityBody`
(`src/persistence/library.ts`) if the live contract differs.

## (h) Preview resolution cache is in-memory only

Resolved entity bodies are cached per `ref@version` in-memory for the session; they are
**not persisted**. Large questionnaires re-resolve every ref on the first preview after a
reload.

## (i) Logic / scoring / validation are ignored in the preview

`show_if` / logic / scoring / validation are **not evaluated** in the preview — every
element renders unconditionally. This stays until **ED-D** wires the expression evaluator +
logic engine into the preview.

## (j) Renderer library is consumed from `web-viewer/dist-lib`

The preview consumes the Web Viewer renderer from `web-viewer/dist-lib` via a Vite alias
(built by the `ensure-renderer` prepare step). At the repo split this becomes the published
`@behaverse/questionnaire-renderer` npm package.

## (k) PreviewPane minor cleanups (from code review)

Cosmetic / edge-case items deferred:
- redundant `as FetchEntity` cast on the `fetchEntity` default prop;
- a stale, out-of-range page selection renders an empty preview pane rather than falling
  back to page 0;
- the `resolving…` flag isn't reset on an ignored / unmounted resolve.

All cosmetic / edge.

# ED-C1 Follow-ups

Known limitations and open items carried out of ED-C1 (inline Option editor).

## (l) Primary-language content only

ED-C1 edits the **primary language** (`metadata.language`) content only; per-locale option
text / units beyond `metadata.language` is **ED-E** (translation interface).

## (m) Choice `value` is numeric (or null) in the UI

The choice `value` field accepts numbers (or null). String / boolean values exist in the
schema but aren't surfaced in the editor yet.

## (n) Referenced Options are read-only

Editing a referenced Option (`{ref}`) or a saved-Item-ref is read-only until **ED-C3/C4**;
the canvas shows a note for that case.

## (o) New items require the entity pool

Creating a brand-new item (and authoring its Prompt) requires the entity pool — **ED-C2**.

## (p) Shared-option creation may be limited

Section `shared_option` editing reuses the Option editor; creating a shared option where
none exists may be limited (confirm behavior in a later pass).

## (q) Shared-option section child-list hidden

When a Section that carries a `shared_option` is selected, the Canvas shows the Option
editor **alone** — the section's child item list (e.g. PHQ-9's 9 matrix items) is **not**
rendered below it, so those items can't be seen / deleted from the canvas while the section
is selected (they remain reachable + selectable via the structure tree). Convenience
regression only (no data loss). Fix in **ED-C2**: render `<ItemEditor>` followed by the
existing section element list for the shared-option-section branch.

## (r) Multi-select with non-nominal measurement renders as "Unsupported"

Choice `selection: multiple` with a non-`nominal` measurement type shows
"Renders as: Unsupported" (the widget table only defines `choice.nominal.multiple`);
the option is still Schema-2-valid. No inline guidance steers the author to `nominal`
for multi-select — UX polish for a later stage.

# ED-C2a Follow-ups

Known limitations and open items carried out of ED-C2a (entity pool + new items).

## (s) Pool-entity id rename isn't supported

Renaming a pool-entity id (it would re-key the pool + repoint the item's `ref`) is **not
supported** in C2a — minted `pr_new_<n>` ids stick. A rename affordance is a later nicety.

## (t) Draft version is a single `.dev1`

The draft version is derived from `metadata.version` (`+ .dev1`); **all** new entities in a
draft share one `.dev1` version. Multiple draft iterations (`.dev2`…) aren't surfaced.

## (u) Bundle export is the only carry-out; promotion needs OD-08

Bundle export (`{questionnaire, entities}`) is the **only** way to carry pool entities out of
the editor. Promoting pool drafts to real Library versions needs Identity / write — **OD-08**.

## (v) New items are invalid until the prompt text is typed

New items are intentionally **invalid** until the prompt text is typed (the minted prompt
starts with empty `content.<locale>.text`); this surfaces in the validation banner.

# ED-C2b Follow-ups

Known limitations and open items carried out of ED-C2b (Context / Instruction + Message authoring).

## (w) Remove drops the pool entity — assumes per-add ownership

Removing a Context / Instruction drops its pool entity; if the same entity were referenced
elsewhere this would orphan that reference. Not a C2b scenario (each is minted per-add and
referenced once); revisit if shared refs become possible.

## (x) Message `type` is an open comma-tag vocabulary

Message `type` is a free comma-tag input (open vocabulary); an empty tag list is **invalid**
(Schema-2 `minItems: 1`) and banner-surfaced, not silently re-defaulted.

## (y) Standalone Placeholder / Help / RegEx / Solution authoring isn't surfaced

Standalone Placeholder / Help / RegEx / Solution authoring isn't surfaced (Placeholder /
Help are inline-editable inside the Option editor); add if a need arises.

## (z) ED-C1 (q) shared-option-section child list — still open

ED-C1 FOLLOWUP (q) — the shared-option-section child list — is **still open**; not addressed
in C2b.

# ED-C3a Follow-ups

Known limitations and open items carried out of ED-C3a (pick from Library).

## (aa) ED-B (g) RESOLVED — Library entity-body endpoint now exists

ED-B FOLLOWUP (g) is **resolved**: the Library per-entity body endpoint now exists
(`GET /v1/entities/{etype}/{eid}/versions/{version}/definition`) and `fetchEntityBody` uses
it (the old `?version=` query path returned metadata). Library-pinned (`{ref}`) entities now
preview correctly.

## (bb) Live Library deploy — RESOLVED (auto-deployed)

The new entity-body endpoint (`/v1/entities/{etype}/{eid}/versions/{version}/definition`) is
**live** on questionnaire-library.vercel.app — verified 2026-06-15 returning real entity bodies.
The Vercel project **auto-deploys from pushes to `behaverse/questionnaire-tmp`'s `master`**, so the
ED-C3a merge shipped it automatically (no manual redeploy was needed). Future Library API changes
deploy on push. (The editor unit tests + Playwright smoke still stub the endpoint, so they don't
depend on the live API.)

## (cc) Picks pin the latest version — version selection is ED-C3b

C3a pins the **latest** version surfaced at pick time. Explicit version selection +
newer-version detection / upgrade is **ED-C3b** (OD-06).

## (dd) Picked refs are read-only; the picker is focused, not the catalogue

Picked refs are **read-only** in the editor (forking / editing a referenced entity is
**ED-C4**); the picker has no facets / instrument-grouping (it is a focused picker, not the
library-web catalogue browse).

## (ee) ItemEditor RefSlot refactor (forward-looking)

The prompt / context / instruction / option slots in `ItemEditor` are near-identical
Add / Pick / Remove + pool-editor-vs-fork-box blocks; a `<RefSlot>` sub-component would dedupe
them. Do this when **ED-C4**'s fork affordance grows these blocks.

# ED-C3b Follow-ups

Known limitations and open items carried out of ED-C3b (newer-version notification + upgrade).

## (ff) Staleness is checked on load + manual refresh, not per-edit

Staleness checks run on each model **load** and on the manual **`Check for updates`** button —
**not** on every edit, to avoid hammering the Library. If the Library is offline / unavailable,
nothing is flagged (no false positives), so a real update can be missed until the next check.

## (gg) No content diff — only the version + one-click upgrade

ED-C3b surfaces only the **newer version** and a one-click **Upgrade**; there is **no diff**
between the pinned and latest entity content. OD-06's pinned-vs-latest "diff" view is **deferred**.

## (hh) No transitive staleness

Refs nested **inside** a Library entity's body (e.g. a saved Item's nested prompt) are **not**
checked — only the top-level refs in the questionnaire. The Library owns its entities' internal
pinning; the editor does not walk into resolved entity bodies for staleness.

## (ii) `latestVersion` lookup runs against the live API

The `latestVersion` lookup (`GET /v1/entities/{etype}/{eid}`) runs against the same live API as
the rest of pick-from-Library. That API is live (see **(bb)** — auto-deployed), so real staleness
detection works against it. Tests + the Playwright smoke **stub** the endpoint, so they don't
depend on it.

# ED-C4 Follow-ups

Known limitations and open items carried out of ED-C4 (OD-05 override + fork).

## (jj) Derive-locally repoints all occurrences

Derive-locally repoints **all occurrences** of the ref (a study-scoped fork of the entity).
Per-occurrence forking (forking one occurrence while leaving others pinned to the Library) is a
possible later refinement.

## (kk) "Propose a new shared version" is disabled (OD-08)

The fork dialog's **"Propose a new shared version"** action is **disabled** — there is no Library
write / contribution API (**OD-08**, needs Identity). Only **Derive locally** is functional.

## (ll) `show_if` override is ED-D

`show_if` (the third OD-05 free override, alongside `required` + position) is **ED-D** (the logic
builder); only `required` (+ position via reorder) are surfaced in ED-C4.

## (mm) Forking a saved Item copies only the Item binding

Forking a saved **Item** copies the Item binding to the pool; its nested question / option stay
Library refs (each forkable separately). There is **no dedicated saved-Item editor** yet.

## (nn) ED-C is COMPLETE

ED-C is **COMPLETE** (C1 Option · C2a pool + Prompt + new-item · C2b Context / Instruction /
Message · C3a pick + body-endpoint · C3b OD-06 upgrade · C4 OD-05 fork). The **next editor stage
is ED-D** (logic / validation / scoring builders).

## (oo) Modal a11y (forward-looking)

`ForkDialog` + `LibraryPicker` modals lack `Escape`-to-close, `role="dialog"`, and a focus-trap.
This is **consistent across both** (not a regression introduced by ED-C4); it is worth a shared
a11y pass over the editor's modals.

# ED-D1 Follow-ups

Known limitations and open items carried out of ED-D1 (expression foundation + visibility).

## (pp) Visibility rules + key-based program map are ED-D2

D1 reads `show_if` directly off elements. LogicRule-based `visibility` (target_id / show)
and skip/branch/piping/randomization + the questionnaire `logic[]` panel are **ED-D2**.

## (qq) Id catalogue is a generous superset

`collectIdCatalogue` gathers every `id` in the model/pool + `scores[].id`. The precise
variable-id semantics (runtime element key vs question id vs item id) are refined when D2/D4
wire real bindings. Reference-checking is therefore a soft **warning**, never blocking.

## (rr) Preview score bindings are null

The preview's `makeBindings` uses `score: () => null` (no scores until ED-D4). A `show_if`
that references a score evaluates that score to null (→ condition false unless null-tolerant).

## (ss) ExpressionInput insert-helper is single-row

The "insert condition" helper appends one `id op value` snippet joined with `&&`. Nested
AND/OR groups, value pickers driven by option sets, and removing/editing inserted rows are a
later refinement; the escape hatch (free expression text) covers everything meanwhile.

## (tt) No debounce on check

`ExpressionInput` runs `evaluator.check` synchronously on every keystroke (cheap WASM call).
If profiling shows jank on large expressions, add debouncing.

# ED-D2a Follow-ups

Known limitations and open items carried out of ED-D2a (navigation & visibility logic rules).

## (uu) Skip/branch are author + validate only (no preview navigation)

The editor preview renders a page / all pages with throwaway answers; it has no page-to-page
navigation runtime, so `skip` and `branch` rules cannot be demonstrated in preview. They are
authored + semantically validated and labelled "runs in the deployed viewer". A mini
navigation preview is a possible later refinement.

## (vv) Piping + randomization are ED-D2b

Piping rule authoring (source + field_path picker + same-page piping preview) and the
randomization checkboxes (`Page/Section/Block.randomize`, `flow.randomize_pages`) are ED-D2b.
ED-D2a renders a piping rule's summary + a "editing arrives in D2b" note but does not author it.
Option-order randomization is not in Schema 2 v26.0602 (out of scope entirely).

## (ww) Branch has no explicit else-target

Schema `branch` uses `action.skip_to` for the true path; the false path falls through to the
next step (the viewer's `nextStepIndex` model). There is no second target field. The editor
authors `skip_to` only; the implicit else-to-next is documented, not configured.

## (xx) Logic-rule conditions are expression-first (no per-clause builder)

Rule conditions use the shared `ExpressionInput` (+ insert-condition helper). A structured
multi-clause AND/OR builder is deferred (same stance as ED-D1).

## (yy) Questionnaire-global panels not yet tabbed

Logic lives as a section in the questionnaire-root Inspector. When ED-D3 (validation) and
ED-D4 (scoring) add their own global panels, consolidate them into tabs.

## (zz) A freshly-added rule is transiently Schema-invalid

"+ Add rule" mints a rule with `condition: ''`, but Schema 2's `Expression` is `minLength: 1`,
so an unfinished rule makes the whole questionnaire Ajv-invalid (and blocks export) until a
condition is typed. This is surfaced both globally (validation banner) and per-rule
("N need attention" + the inline "Condition required" error) — never silently saved as valid.
Intended authoring behaviour; noted so it's not mistaken for a bug.

# ED-D2b Follow-ups

Known limitations and open items carried out of ED-D2b (piping + randomization). ED-D2 COMPLETE.

## (aaa) Piping targets are question prompts only

The field_path picker offers only top-level item question prompts
(`pages.{pageId}.elements.{idx}.prompt`) — the only target the Web Viewer currently applies
(its App layer builds exactly that path). Option labels, message text, section titles, and
section-child prompts are NOT wired in the viewer, so authoring them would silently not fire;
they are deferred until the viewer applies them.

## (bbb) Randomization is author-only (no preview shuffle)

`Page/Section/Block.randomize` + `flow.randomize_pages` are authored as checkboxes but the
preview does not shuffle (it has no seeded navigation runtime; the seed strategy is a
deployment concern). The preview ignores the flags (does not crash). Option-order
randomization is not in Schema 2 v26.0602 (out of scope entirely).

## (ccc) Piping preview is single-locale + same-render

`applyPiping` rewrites the active preview locale's prompt text (mirroring the viewer's App).
Cross-page piping previews only in "Whole questionnaire" scope (the source must be answerable);
in "Selected page" scope only same-page sources resolve. Both match the runtime.

## (ddd) ED-D2 is COMPLETE

ED-D2 (logic rules) is COMPLETE: D2a (skip/branch/visibility + live visibility preview) +
D2b (piping + live piping preview + randomization). The next editor stages are ED-D3
(validation builders) and ED-D4 (scoring builders), then ED-E (translation), ED-F
(preview-deploy + export).

# ED-D3a Follow-ups

Known limitations and open items carried out of ED-D3a (per-question validation).

## (eee) Two regex fields: `input_validation` vs `validation.format`

`OptionBase` has BOTH `input_validation` (a standalone RegEx/RegExRef, edited as "Input mask")
AND `validation.format` (the per-question format check the viewer validates + messages on).
ED-D3a edits `validation`; `input_validation` stays as the ED-C1 field. Whether the schema
should keep both regexes is a schema/domain question for the owner, not the editor's to resolve.

## (fff) Validation is display-only + live in the preview (no submit gate)

The editor preview computes per-question errors live and shows them via the renderer's
`requiredErrors`/`errorMessages`. There is no blocking "Validate"/submit gate (the deployed
viewer validates on Next; the editor preview is an authoring aid). Empty values never error
(that's the separate `required` flag from ED-C4).

## (ggg) No inline validator-linting

The editor does not lint the validators themselves (e.g. min>max, or a broken `format` regex —
which silently passes at runtime per the viewer). Author-facing linting is a later refinement.

## (hhh) Cross-question validation is ED-D3b

Cross-question rules (`Questionnaire.validation[]`: id + condition + message + targets) and their
panel + preview are ED-D3b, which extends `collectPerQuestionErrors` with cross-question rules.

## (iii) Per-question validation reads `el.option.validation` in the editor runtime

`collectPerQuestionErrors` reads validation from `el.option.validation` (where the editor's
faithful projection keeps it), with an `el.validation` fallback for parity with the viewer's
denormalised runtime (which hoists it). If the editor's projection ever hoists validation, the
fallback already covers it.

# ED-D3b Follow-ups

Known limitations and open items carried out of ED-D3b (cross-question validation). ED-D3 COMPLETE.

## (jjj) Duplicate-id is a warning, not a hard error

A duplicate cross-question rule `id` is flagged as a warning (the editor's permissive stance;
Schema 2 doesn't enforce uniqueness). Auto-`val_N` ids avoid collisions for added rules; manual
edits can still collide (warned, not blocked).

## (kkk) Validation is display-only + live (no submit gate)

Cross-question errors compute live over the throwaway answers and display via the renderer's
`requiredErrors`/`errorMessages` (merged with per-question). There is no blocking submit gate
(the deployed viewer validates on Next; the editor preview is an authoring aid).

## (lll) Scores are inert in cross-question conditions in preview

A cross-question condition that references a `score()` evaluates that score to null in the
preview (`score: () => null`, same as the Logic panel) until ED-D4 wires the Scorer. The
authored rule is correct; only the preview can't compute the score yet.

## (mmm) Duplicate-key error merge: cross-question wins display

If a per-question and a cross-question error target the same element key, the merged
`errorMessages` keeps the cross-question message (last-written). Both indicate a problem; the
single displayed message is acceptable.

## (nnn) ED-D3 is COMPLETE; questionnaire-global panels not yet tabbed

ED-D3 (validation) is COMPLETE: D3a (per-question) + D3b (cross-question), both displayed live.
Logic + Validation now both live as sections in the questionnaire-root Inspector; when ED-D4
(scoring) adds its panel, consolidate Logic / Validation / Scoring into tabs. NEXT = ED-D4.

## (ooo) Cross-question errors compute over all rules regardless of preview scope

In `scope: 'page'` the preview renders only the selected page, but `collectCrossQuestionErrors`
runs over the full `model.validation[]`. Errors keyed to off-page elements compute but don't
display (the key isn't in the rendered DOM) — harmless, and broadly consistent with the viewer
validating per-step. Noted for completeness.

# ED-D4 Follow-ups

Known limitations and open items carried out of ED-D4 (scoring builder, author-only).

## (ppp) Live score preview is deferred (D4b)

ED-D4 authors `scores[]` but does NOT run scorers in the preview — `score()` stays null, so
score-referencing logic/validation conditions remain inert in the preview. A live score preview
needs a bundled reference-scorer wasm + a ported executor (input-assembly + sha256-verify +
compile + JSON-Pointer + cache) + impl-pinning, and would only ever work for REFERENCE scorers
(custom author scorers have no wasm source in the editor). Deferred to a D4b follow-on.

## (qqq) Scorer picker is empty until the Library seeds scorers

The "Pick from Library" button opens the picker with `etype='scorer'` (parseRef now knows the
`scr_` prefix), but the live Library has ZERO Scorer entities seeded. Manual `scr_*@vYY.MMDD`
ref entry is the working path today; the picker lights up automatically once scorers exist.

## (rrr) No path autocomplete / unknown-scorer-or-path checks

`path` is a manually-entered JSON Pointer (pattern-validated). Autocomplete of paths from the
scorer's `output_schema`, and unknown-scorer / unknown-path warnings, need the resolved scorer
body — they pair with the D4b scorer-runtime work.

## (sss) A freshly-added score is transiently Schema-invalid

"+ Add score" mints `{id: score_N, scorer: '', path: ''}`; `scorer`/`path` are required by Schema 2,
so the questionnaire is Ajv-invalid (and blocks export) until they're filled — flagged both
globally (banner) and per-score ("N need attention" + inline errors). Same authoring behaviour as
the empty-condition logic rule (ED-D2 FOLLOWUP zz).

## (ttt) ED-D authoring surface COMPLETE; consolidate global panels into tabs

Logic + Validation + Scoring now all live as sections in the questionnaire-root Inspector. With
three global panels, consolidating them into Inspector tabs is now worthwhile (deferred). The
ED-D *authoring* surface is complete; remaining ED-D work is the D4b live score preview.

# ED-E Follow-ups

Known limitations and open items carried out of ED-E (translation interface).

## (uuu) Side-by-side translation matrix is deferred (E2)

ED-E translates via an editing-language switcher (reusing the per-locale editors). The richer
design §7 side-by-side source/target matrix (all translatable strings × locales + bulk status)
is a follow-on (E2).

## (vvv) Page/Section/Block + metadata title translations not covered

Page/Section/Block titles use a separate `translations: { <locale>: {status, title?} }` map (not
`content`), and `metadata.title`/`description` are plain strings — ED-E translates only the
`content`-based surface (prompts/options/contexts/instructions/messages/placeholders/help). Title
translation is deferred.

## (www) Validation-message + metadata-title localization is a schema gap

Per-question/cross-question validation `message`s and `metadata.title`/`description` are PLAIN
STRINGS in Schema 2 (not language-keyed), despite design §5 calling messages "translatable".
Making them per-locale is an upstream schema change (owner decision), out of editor scope.

## (xxx) Removing a language is non-destructive

Removing a locale from `available_languages` does NOT prune authored `content[locale]` entries
(avoids silent data loss). An orphaned translation stays in the data until manually cleared; the
deployed viewer ignores locales not in `available_languages`.

## (yyy) Translating a Library entity requires forking

Library-ref entities are read-only; the editing-language switcher only affects POOL entities +
inline options. To translate a Library entity, fork it first (ED-C4) — then its content is
editable per-locale.

## (zzz) Editing locale vs preview locale are independent

The topbar "Editing language" (which locale you edit) and the preview's "Preview language"
(which you view) are separate controls — you can edit `fr` while viewing `en`. By design.

## (e2e) e2e specs must re-run after panel/picker additions

Older Playwright specs rotted as later stages added more questionnaire-global panels: a second
"+ Add rule" button (Validation panel, ED-D3b) and the LibraryPicker's "Insert" button created
strict-mode selector ambiguities that broke logic-rule/piping/3 smoke specs on master (each stage
only ran its OWN new spec). Fixed in ED-E by scoping selectors to their panel/modal. Lesson: when
adding a global panel/modal, re-run the FULL `npm run e2e` suite, not just the new spec.

## (e2e-2) Minor ED-E review notes

- The Option **label** gets a per-locale status control but NO source-text hint (the "primary: <source>"
  hint is on Prompt/Context/Instruction/Message editors only). A translator editing an Option label
  doesn't see the source string — add the hint to OptionEditor's label if it proves useful.
- `setAvailableLanguages` EXCLUDES the primary from `metadata.available_languages` (primary is implicit
  via `metadata.language`), whereas some seed fixtures INCLUDE it (e.g. `["en","pt"]`). Both are
  Schema-2-valid (the preview/switcher prepend the primary regardless); noted so the convention
  difference isn't a surprise.

# ED-F Follow-ups

Known limitations and open items carried out of ED-F (standalone shareable preview).

## (ed-f-1) Real Viewer-Service deployment is deferred (OD-08)

The design's "Open in viewer" preset `preview` is NOT buildable: the VS rejects `preview`
(modes.py supports only anonymous_link/demo; `preview` → 422), OD-08 Identity (`editor_session`
auth) doesn't exist, and the VS mints runtimes from the LIBRARY (drafts with pool `.devN` entities
aren't there; the Library has no write API). ED-F ships a no-backend standalone preview instead;
real deployment waits for OD-08.

## (ed-f-2) Standalone preview is served from the editor build, not a single offline file

`preview.html` is a second entry in the editor's Vite build (renderer + wasm shared with the app).
"Shareable" = the recipient opens an exported `.bundle.json` in this page (served from the editor
app, or run locally). A truly hosting-free single-file HTML (renderer JS + wasm base64-inlined) is
a heavier follow-on.

## (ed-f-3) Library refs not in the bundle render as placeholders

The standalone has NO network (pool = the bundle's entities, Library fetcher returns null), so
hard-pinned Library refs not included in the bundle render as placeholders (the "N referenced
entities not loaded" banner). Fork Library entities into the pool to include them in the export.

## (ed-f-4) Scores are inert in the standalone preview

`score()` is null (no scorer runtime; ED-D4b deferred), so score-referencing logic/validation
conditions don't fire in the standalone preview — same as the in-app preview.

## (ed-f-5) sessionStorage handoff is same-browser

"Open preview" hands the bundle to preview.html via sessionStorage (same browser/origin). The
file-open path covers cross-machine sharing of an exported bundle.

# ED-G Follow-ups

Known limitations and open items carried out of ED-G (usability/onboarding pass).

## (ed-g-1) Server-side search indexes title + description only

The Library full-text index (`library/src/library/store/index.py`) covers each entity's
title + description, NOT its id or item/prompt body text. The pickers now say so. Extending
the index to body text (so authors can find a prompt by its wording) is a Library schema +
reseed change, deferred.

## (ed-g-2) The sample is a frozen snapshot

`src/samples/bisbas.bundle.json` is generated once from the live Library
(`scripts/build-sample.mjs`). If BIS/BAS is republished at a newer version, re-run the script
to refresh the asset. It is intentionally self-contained (no runtime network) so the sample
works offline.

## (ed-g-3) Back-to-home keeps the autosaved draft

"← Home" returns to the StartScreen but does not clear IndexedDB, so a browser reload still
resumes the last draft. A dedicated "discard draft" / draft manager is deferred.

## (ed-g-4) Browse picker is a flat latest-only list

The questionnaire browser lists the latest published version of each form (from the grouped
catalogue). Choosing an older version still uses the manual id+version fallback. A per-form
version dropdown is deferred.

# ED-E2 Follow-ups (translation panel)

## (ed-e2-1) Placeholder/Help text not in the panel
Option placeholder/help strings are translatable (same content map) but omitted from the
panel for now; add `setPlaceholderText`/`setHelpText` rows when needed.

## (ed-e2-2) Page/Section/Block titles
Title translations use a separate `translations[locale]` map (not the entity `content`); the
panel covers entity content only. Deferred (same as ED-E).

## (ed-e2-3) Translations are local
Translating a Library entity forks it into the local pool; the translation rides the bundle
export but is not written back to the shared Library (OD-08). A reused entity translated in
one questionnaire is not auto-shared to others until Library write exists.

## (ed-e2-4) Refs need the preview to have resolved them
The panel reads Library bodies from the shared `resolved` map (populated by the preview). If a
ref hasn't been resolved yet, its source/labels won't show until the preview has run once.

# ⏸ EDITOR PARKED (owner decision 2026-06-16)

The editor is feature-complete + polished and **further work is deferred** by the owner. The
items below (and the per-stage deferrals above) are the backlog if/when it resumes. See
HANDOFF.md "⏸ EDITOR — PARKED" for the full state summary.

## (ed-defer-1) Auto-translate button
A button to **machine-translate** content into the editing locale — e.g. translate one target
field, a whole entity, or the entire questionnaire in one click (calling a translation API /
LLM), filling the Translation panel's target column. Explicitly deferred 2026-06-16. Design
notes when it resumes: needs a translation provider + key (config/secret), a per-row/whole-doc
trigger, "machine-translated → set status=draft for review", and it must reuse the panel's
auto-fork-on-write path (translating a Library ref forks it locally first).

## (ed-defer-2) Other deferred editor work (consolidated)
ED-D4b live score preview; translate placeholder/help text + page/section/block + metadata
titles; validation-message/metadata-title localization (schema gap, upstream); Logic/Validation/
Scoring → Inspector tabs; single-file offline preview; broader visual restyle; and the OD-08-gated
"Open in viewer" real deployment + writing forked/translated entities back to the shared Library.

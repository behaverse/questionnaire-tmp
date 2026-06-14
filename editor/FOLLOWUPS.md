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

## (bb) Deploy needed — live Library must be redeployed

The live Vercel Library must be **redeployed** to expose the new entity-body endpoint before
pick-from-Library works against the live API. The editor unit tests and the Playwright smoke
**stub** the endpoint, so they pass regardless.

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

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

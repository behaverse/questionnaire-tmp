# web-viewer — deferred work / follow-ups

- Renderer types are hand-written against the faithful projection; add a type-conformance test against the canonical runtime examples once they are regenerated (denormaliser follow-up).
- `style.layout` refinements (dropdown / slider-like) unrendered until WV-D — base widgets shown meanwhile.
- Matrix on very narrow viewports relies on horizontal scroll (contract-compliant); author-defined breakpoints remain a schema-reserved future.
- Session token in memory only — refresh loses the session until WV-E resume lands.
- Manifest `viewer_version` bump check (CI: manifest diff ⇒ version bump) deferred to WV-F.
- ~~design/08_viewer.md presentation-modes note~~ — DONE at WV-A merge (design/08 §"Presentation modes").
- **Date questions are not expressible** (owner note 2026-06-12): Schema 2's `input_data_type` is `choice|number|text`, so a date item renders the UnsupportedElement card (see the `widgets` fixture). Workaround: author as `text` + RegEx validation or `number` (year). Native date support = breaking Schema 2 bump (new OD) + §13 derivation row + widget + manifest addition — decide if/when a real instrument needs it.
- **Visual design + behaviour polish pass** (owner, 2026-06-12): a dedicated owner-driven iteration on the viewer's look & feel is wanted after the functional stages — candidates: restyle the focus ring on step headings (raw black outline today), tighter optical centring on sparse steps (~5vh up-shift), transition tuning, choice-card hover/selected states, theme typography. Schedule alongside or after WV-B.
- Auto-advance a11y: revisit after first live use; the Godot Native Viewer must match `x_presentation` semantics or declare non-support in its manifest.
- `keyHints` letter shortcuts are intentionally suppressed inside Sections (App enables them only for single-item steps) — revisit if plain sections appear in focus mode.
- StepTransition uses an eslint-suppressed closure pattern — consider the useRef idiom if it grows.
- `applyTheme` does not clear vars set by a previously applied theme — irrelevant until themes can switch mid-session.
- Gating residual: a required choice item whose locale texts are missing (mergeOptions throw) still gates Next (needs locale-aware renderability check) — unreachable with denormaliser-produced runtimes, fix with WV-D validation work.
- First-render focus: the step-heading focus effect also fires on the initial step — review whether initial autofocus is wanted once real participants test it.

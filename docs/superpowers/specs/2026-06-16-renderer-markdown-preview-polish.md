# Renderer Markdown + Editor Preview Polish — Design Spec

**Date:** 2026-06-16
**Trigger:** Owner hands-on feedback on the editor's BIS/BAS preview: (1) preview content font is much larger than the editor UI (jarring); (2) no visual separation between items; (3) markdown/HTML in content (`*emphasis*`, `<br />`) renders literally instead of formatted.
**Approved approach (owner, 2026-06-16):** do all three; markdown rendered in the **renderer** (participant-facing, per schema), font + separation as **editor-preview-only** tweaks.

## Background

- Schema 2 states content `text` allows **Markdown** "subject to viewer support" ([design/05a_reusable_entities.md:90](../../design/05a_reusable_entities.md)). The Web Viewer renderer currently renders all text as plain `{text}` ([web-viewer/src/renderer/ItemRenderer.tsx:59](../../web-viewer/src/renderer/ItemRenderer.tsx)), so `<br />` and `*emphasis*` show literally — a participant-facing bug, not editor-only.
- The renderer is built to `web-viewer/dist-lib/` via `npm run build:lib` and consumed by the editor through a Vite alias. **Renderer changes require a `build:lib` rebuild** for the editor to pick them up.
- The prompt font is `--qv-prompt-size: 2.05rem` (~33px) by design for the viewer's focus mode ([web-viewer/src/renderer/lib.css:27](../../web-viewer/src/renderer/lib.css)); intentional for participants, oversized inside the editor's small preview pane.

## Changes

### A. Renderer — inline markdown + safe HTML (#3, participant-facing)

- **New `web-viewer/src/renderer/RichText.tsx`** — renders a content string as **inline markdown + sanitized HTML**:
  - `react-markdown` + `rehype-raw` (parse inline HTML like `<br />`) + `rehype-sanitize` (strip script/style/event handlers; community content is untrusted).
  - Paragraphs unwrapped (`components={{ p: ({children}) => <>{children}</> }}`) so output stays inline inside headings/labels.
- **Apply `RichText` to all visible content text**: prompt (`h2.qv-prompt`), context, instruction (ItemRenderer); message (MessageBlock); option labels (RadioGroup, CheckboxGroup); matrix prompt + column labels (MatrixGroup).
- **Keep accessible-name contexts plain**: `legend.sr-only`, `aria-label` keep the raw string (no nested markdown component) so screen-reader names stay clean.
- Deps added to `web-viewer/package.json`: `react-markdown`, `rehype-raw`, `rehype-sanitize` (bundled into `dist-lib`, not externalized).
- Tests: `RichText` renders `*x*`→`<em>`, `<br/>`→`<br>`, strips `<script>`; plain text stays a single text node. Existing web-viewer suite stays green (plain-text fixtures match `getByText`). Run `npm run build:lib` after.

### B. Editor preview — font scale (#1) + item separation (#2, editor-only)

- **Font**: in `editor/src/preview/PreviewView.tsx`, the `.qv-theme` preview container overrides `--qv-base-size` to a smaller value (~14px) so the focus-mode content scales down proportionally in the pane. Deployed viewer unchanged.
- **Separation**: scoped CSS in the editor (`editor/src/index.css`) adds a subtle top border + padding between stacked items in the preview (`section[aria-label="Preview"]` item boundaries), not affecting the participant viewer's minimalism.

## Non-goals
- Block markdown in prompts (headings/lists/images) — inline + line breaks only (sanitize still strips dangerous nodes; block elements may pass but realistic content is inline).
- Changing the deployed viewer's font size or adding item dividers there (its focus-mode design is owner-directed).

## Testing
- web-viewer: RichText unit tests + full suite green + `build:lib` succeeds.
- editor: preview tests + onboarding e2e green; live browser check that `<br/>`/`*emphasis*` render, font is proportionate, items are separated.

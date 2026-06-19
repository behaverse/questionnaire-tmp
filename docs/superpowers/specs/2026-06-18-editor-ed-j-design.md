# ED-J — Translation enhancements (design)

**Date:** 2026-06-18 · **Status:** approved (owner, 2026-06-18) · **Stage:** ED-J (editor, under `editor/`)

## Problem

Two owner-requested translation features on top of the ED-I translation surface:
- **(a) Auto-translate** — a machine-translate button next to each row when translating, so the
  target field can be filled from the source (then human-reviewed).
- **(b) Database-wide translation workbench** — the start-screen "Translate" entry should not only
  open the per-questionnaire translate view; it should also let you **translate Library entities by
  type** (option, prompt, …) *outside* any questionnaire — i.e. QC/enhancement of the shared
  database's translations.

Two realities shape the design (confirmed in brainstorming):
- The editor is a **static SPA with no backend** and no MT/LLM integration — auto-translate needs a
  server-side translation engine.
- The **Library is read-only** (no write API; writing back is OD-08/Identity-gated) — database-wide
  translations can't be persisted to the live Library yet.

## Decisions (from brainstorming, owner-approved)

1. **MT backend = a serverless proxy to Claude.** A Vercel function `editor/api/translate` calls
   Claude via the **Vercel AI Gateway** (model `anthropic/claude-haiku-4-5`), key server-side. The
   editor calls a configurable endpoint `VITE_TRANSLATE_URL ?? '/api/translate'`.
2. **Database-wide output = a contribution file.** The workbench exports a translation-contribution
   bundle (entity → version → locale → fields) for later ingestion into `questionnaire-library-content`
   (the same path harvester output takes). No live Library write.
3. **Find missing-translation entities client-side** by reusing the ED-I·F7 throttled body-fetch +
   per-etype cache (list the type, fetch bodies, keep those whose `content` lacks the target locale).
   No Library change; capped (≈300) for the large prompt set with a note.
4. **Machine output is provisional** — written with per-locale status `draft` (never `validated`); a
   human reviews/edits and bumps status.
5. **Build order: J1 then J2.** J1 (proxy + auto-translate in the existing panel) delivers feature (a)
   and the MT plumbing J2 reuses.

## Architecture

```
editor (browser, static)                    editor/api/translate  (Vercel function, server-side)
  translateText(text, src, tgt, kind) ─────▶ generateText({ model: 'anthropic/claude-haiku-4-5',
   (VITE_TRANSLATE_URL ?? /api/translate)      prompt: <questionnaire-aware> })  via AI Gateway
                                              └─ key/creds from env (never in the client)
```

- **MT proxy `editor/api/translate.ts`** — POST `{text, sourceLang, targetLang, kind?}` → `{translation}`.
  Uses the `ai` package + AI Gateway (`"anthropic/claude-haiku-4-5"`). System/prompt: "Translate this
  questionnaire **{kind}** field from {src} to {tgt}. Preserve `{placeholders}`, inline markdown, and a
  formal/clinical register. Return ONLY the translation, no quotes or commentary." Validates input
  (non-empty text, known langs), caps length, returns 4xx on bad input / 5xx on upstream failure.
- **Client `translateText()`** (`editor/src/translate/translateClient.ts`) — `fetch` the endpoint;
  returns the translation or throws; callers handle loading/error. Pure/injectable `fetchImpl` for tests.
- **Local dev**: `vercel dev` serves the function alongside Vite; or point `VITE_TRANSLATE_URL` at a
  deployed proxy. Auto-translate degrades gracefully (error toast inline; manual editing always works).
- **Deploy implication**: the editor's eventual Vercel deploy becomes *static SPA + one function*
  (Fluid Compute), needing the gateway key as an env var. (The editor isn't deployed today; this is the
  first backend surface — kept to a single isolated function.)

### Slice J1 — auto-translate in the Translate panel (feature a)

- In `editor/src/translate/TranslationPanel.tsx`, add a per-row **"Auto"** button: calls
  `translateText(row.source, primary, target, kind)` → writes the result to the row's target (the same
  `onEditText` path) and sets the row status to `draft`. Per-row spinner + inline error; the field stays
  editable after.
- Add a header **"Auto-translate untranslated"** action: runs the per-row translate over the *visible,
  untranslated* rows (throttled via the existing `mapLimit`), with progress.
- No change to the collect/apply or fork-on-edit logic — auto-translate just feeds text into the
  existing write path (so Library refs auto-fork on write, exactly as manual edits do).

### Slice J2 — database-wide Translation Workbench (feature b)

- **Start-screen Translate hub**: the existing "Translate a questionnaire" card opens a small chooser
  (or two cards): *Translate a questionnaire* (today's flow, ED-I·E2) **or** *Translate Library entities
  by type* (new workbench).
- **`TranslationWorkbench` view** (new, `editor/src/translate/workbench/`): pick an **entity type**
  (option / prompt / context / instruction / message) + a **target language**. It lists Library entities
  of that type **missing** `content[targetLang]` — reusing the F7 machinery (`listAllEntities` +
  throttled `fetchEntityBody` + per-etype cache + `searchableText`-style content read), capped at ≈300
  with a "covers first N" note. Each entity shows source (primary-locale) + an editable target +
  per-row/bulk **Auto** (the J1 plumbing).
- **Export**: a **"Download translations ({lang})"** button writes a contribution bundle:
  ```json
  { "target": "fr", "generated_at": "...", "entries": [
      { "id": "opt_agreement_7", "version": "v26.0606", "type": "option",
        "content": { "fr": { "label": "...", "options": [{ "index": 1, "text": "..." }, ...] } } }, ... ] }
  ```
  This is a partial-content patch keyed by entity id+version, suitable for a curator/PR to merge into
  `questionnaire-library-content`. (Schema shape mirrors how entity `content[locale]` is structured so
  ingestion is a shallow merge.)
- Translations here are **local + exported only** — nothing writes to the live Library.

## Non-goals
- **No Library write / live ingestion** — J2 exports a file; ingestion is a separate (owner) step.
- **No questionnaire structural-title translation** (page/section/block titles, validation messages) —
  those are a Schema-2 gap tracked elsewhere.
- **No translation memory / glossary** across runs (YAGNI for now).
- **No provider choice UI** — Claude via the gateway is the engine.

## Testing
- **Client** `translateClient.test.ts` — mocked `fetchImpl`: posts the right body, returns the
  translation, throws on non-OK.
- **J1** — TranslationPanel test: clicking "Auto" (with a stubbed `translateText`) fills the target +
  sets status draft; bulk runs over untranslated rows.
- **J2** — workbench tests: missing-entity listing (mock client returns entities; bodies missing the
  target locale are listed, present ones excluded); export builds the correct bundle shape; auto-fill
  writes into a row.
- **Function** `api/translate.test.ts` — handler unit test with a mocked gateway/`generateText`:
  validates input, shapes output, maps upstream errors. (No live API call in tests.)
- **E2e** — auto button + workbench flows with the `/api/translate` route stubbed (Playwright
  `page.route`); full `npm run e2e` stays green.
- All existing suites stay green; machine-translate is additive.

## Risks
- **Editor gains a backend** — first server surface; mitigated by one isolated function + graceful
  degradation when absent (manual editing unaffected) + configurable endpoint.
- **API key / cost** — server-side key via Vercel env; haiku is cheap; bulk auto-translate is throttled
  and user-initiated. Add a sane per-request length cap.
- **MT quality** — machine output is `draft`, never `validated`; the UI frames it as a suggestion to
  review. Prompt preserves placeholders/markdown/register.
- **Missing-entity scan cost** (J2, prompts ≈793) — bounded by the F7 cap + cache; note shown.

## Decomposition
- **ED-J1**: MT proxy (`api/translate`) + `translateClient` + per-row/bulk auto-translate in the
  Translate panel. (Delivers feature a.)
- **ED-J2**: start-screen Translate hub + `TranslationWorkbench` (type+language → missing list →
  fill/auto → export contribution bundle). (Delivers feature b; reuses J1's MT.)

Each slice: spec→plan→subagent-TDD→review→isolate-cherry-pick to master (per the multi-agent git
pattern; see `project_editor_ed_i`). 382 unit + 18 e2e currently green; keep them green.

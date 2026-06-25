# Schemas — Handoff

**Path:** `schemas/` · **Stack:** JSON Schema (Draft 2020-12) + JSON-LD contexts · **Status:** ✅ authored & validated · **Suggested branch:** `work/schemas`

> The eight canonical JSON Schemas — the data-model source of truth for the whole platform. Every other component (Library, Viewer Service, Web Viewer, Editor, denormaliser) conforms to these. They are essentially done; edits happen only at deliberate version-bump boundaries.
> For deep detail see [README.md](README.md) and [VERSIONING.md](VERSIONING.md). There is no `FOLLOWUPS.md` for this component; open items are curated below.

## What it is
- Eight schemas, each in its own folder with `schema.json` + `context.jsonld` + `examples/` + `CHANGELOG.md` + `versions/`:
  1. [`instrument/`](instrument/) — instrument metadata (bibliographic / psychometric / licensing). **v26.0609**.
  2. [`questionnaire/`](questionnaire/) — Schema 2, the structural definition (pages/blocks/sections/questions/logic/scoring); embeds Schema 1 at `metadata`. **v26.0618**.
  - [`runtime/`](runtime/) — Schema 3, denormalised render-ready form. **v26.0603**.
  - [`events/`](events/) — Schema 4a, BDM `bdm:` event data (OD-19). **v26.0605**.
  - [`recordings/`](recordings/) — Schema 4b behavioural capture, two-level: `mouse/` + `keyboard/`.
  - [`response/`](response/) — Schema 5, strict BDM Response rows (OD-17). **v26.0603**.
  - [`session/`](session/) — Schema 6, session metadata + scorer outputs. **v26.0603**.
  - [`viewer_conformance/`](viewer_conformance/) — Schema 7, viewer capability manifest (OD-18). **v26.0603**.
- `$id`/`$ref` URLs use `https://behaverse.org/schemas/{name}/v<YY.MMDD>/schema.json` as **canonical identifiers**; the validator resolves them to local files (public hosting is deferred — see below). Do not rewrite these URLs.
- Cross-schema reference: Schema 2 `metadata` `$ref`s Schema 1, hard-pinned `@vYY.MMDD` (OD-06). Bumping Schema 1 does NOT auto-flow into Schema 2.

## Run & test
The validator lives at repo root, not in `schemas/`:
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r tools/requirements.txt          # jsonschema, referencing, pytest
python tools/validate_schemas.py                # exit 0 = all examples valid
```
It walks every `{schema}/examples/*.json` (incl. the two-level `recordings/{mouse,keyboard}/`), validates `library_examples/<type>/` against the matching `$def`, and runs custom cross-checks (event vocabulary, `bdm:` extension-key prefixes, scorer-output entries). The README/docstring still say "instrument and questionnaire only" — that's stale; it covers all eight.

## What's left to do
This component is feature-complete. Remaining items are version-bump-gated and mostly owner decisions — **do not edit a published version in place** (OD-06: published versions are immutable; any change is a new CalVer `vYY.MMDD` and is treated as breaking → spec → plan → execute).

**Next (each is a deliberate CalVer bump)**
- **Promote `x_response_revises` / `x_response_revision` to first-class Schema 5 fields** — the Web Viewer already emits them as `x_`-prefixed extensions (`web-viewer/src/app/responses.ts:103`). First-class them at the next Schema 5 CalVer. 🔒 schema CalVer bump.
- **Native date questions** — Schema 2 `input_data_type` is `choice|number|text` only (`questionnaire/schema.json:357`). Date support is a breaking Schema-2 bump + a new OD. 🔒 schema CalVer bump + new OD.

**Deferred / blocked (owner decisions)**
- **Localize validation messages & metadata titles** — they are plain strings in Schema 2, not language-keyed maps. Making them per-locale is an upstream owner decision (touches renderer + Editor). 🔒 upstream owner decision.
- **Behavioural-capture channels beyond mouse+keyboard** — Schema 4b (`recordings/`) covers mouse + keyboard only; EEG / webcam / mic channels are future schema work. 🔒 future schema work.
- **Public hosting at `behaverse.org/schemas/`** — DEFERRED; schemas stay in-repo and the validator resolves `$id`/`$ref` locally. Don't change the URLs to "make them resolve." 🔒 owner-deferred.

> Note on Schema 4a (events): it **is** fully authored — `events/schema.json` (Draft 2020-12, root `oneOf` Event/EventBatch, locked 24-verb / 15-object / 5-actor enums), JSON-LD context, four examples, and two validator cross-checks. An old root-level note flagged it as "not yet authored"; that is now stale.

## Conventions & gotchas
- **Bump procedure** is in [VERSIONING.md](VERSIONING.md): archive the *old* version into `{schema}/versions/v<old>/`, restamp `version` + `$id` in `schema.json`, add a `CHANGELOG.md` entry with a `severity` tag (`breaking` / `additive` / `corrective`), update examples, re-run the validator green.
- A new CalVer is just a timestamp — `severity` is what tells consumers whether responses/scoring change. Even `corrective` requires explicit author opt-in downstream (OD-06 hard-pinning).
- After any schema change, **re-run `tools/validate_schemas.py` and confirm exit 0** before merging; downstream code (denormaliser, VS, Web Viewer, Editor) keys off these shapes.
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing — the harvester agent shares this checkout and pushes master.

## References
- [README.md](README.md) · [VERSIONING.md](VERSIONING.md)
- Spec: [docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md](../docs/superpowers/specs/2026-05-28-schemas-1-and-2-design.md)
- Authoritative design: [../design/](../design/) (Schema 4a events vocab: [design/05e_events_vocabulary.md](../design/05e_events_vocabulary.md); BDM alignment: [design/05c_bdm_alignment.md](../design/05c_bdm_alignment.md))
- Validator: [../tools/validate_schemas.py](../tools/validate_schemas.py)
- System-wide context: root [HANDOFF.md](../HANDOFF.md)

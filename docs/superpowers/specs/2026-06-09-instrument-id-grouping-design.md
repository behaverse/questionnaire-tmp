# Instrument-family grouping (`instrument_id`) — Design Spec

**Date drafted:** 2026-06-09
**Author:** instrument_id brainstorming session (2026-06-09)
**Component:** cross-cutting — Schema 1 + Schema 2 + survey_db importer + Library Core + library-web.
**Decision record:** new **OD-21** (this is a data-model decision; logged in `design/10_open_decisions.md`).
**Authoritative source documents:**

- [design/05_data_model.md](../../../design/05_data_model.md) — the metadata model this extends
- [design/10_open_decisions.md](../../../design/10_open_decisions.md) — OD-06 (immutable versions, CalVer severity), OD-15 (entity model)
- [schemas/instrument/schema.json](../../../schemas/instrument/schema.json) (live `v26.0605`) + `CHANGELOG.md`
- [schemas/questionnaire/schema.json](../../../schemas/questionnaire/schema.json) (live `v26.0602`, pins instrument `v26.0528`)
- the built Library Core ([library/](../../../library/)) + web UI ([library-web/](../../../library-web/))
- the survey_db importer ([library/src/library/importers/survey_db/](../../../library/src/library/importers/survey_db/))

**The problem.** The legacy `survey_db` models one *instrument* (e.g. ASRS) as a `survey` with several *forms* (the full 18‑item, the 6‑item Part‑A screener, the inattentive subset, …), each a distinct `compositions.questionnaire`. The importer flattens this: it produces one top‑level Questionnaire per form and attaches the shared survey title to each, so the catalogue shows **four identical "ASRS‑v1.1" rows**. The grouping key — the legacy `header_id` (all four ASRS forms share `header_id='asrs'`) — is computed during import but **discarded** (it was meant for `provenance.source_header_id`, which the instrument schema's closed `provenance` block rejects).

**The change.** Make the instrument family a **first‑class, optional** metadata field, `instrument_id`, plus an optional per‑form `variant` label; populate `instrument_id` from `header_id`; index it in the Library; and have the catalogue **collapse** same‑instrument forms into one expandable row. Drill‑down, version selection, language switching, and per‑form JSON export are **unchanged**.

---

## 1 — Scope

### 1.1 In scope
- **Schema 1 (Instrument Metadata) `v26.0609`**: add optional `instrument_id` + `variant`.
- **Schema 2 (Questionnaire Definition) `v26.0609`**: retarget its `metadata` `$ref` to Schema 1 `v26.0609` (bundling the **pending** `authors`→`author` rename).
- **Validator registry + examples + changelogs + git tags** for both bumps.
- **Importer**: emit `instrument_id` (from `header_id`) and `variant: "base"`.
- **Library Core**: index `instrument_id`; an `instrument` facet; the catalogue list returns **instrument‑grouped** results.
- **library-web**: catalogue collapses to one row per instrument, expandable to forms; instrument facet.
- **Design docs**: OD‑21 entry + `design/05_data_model.md` update.

### 1.2 Non-goals (deferred)
- **No structural "Instrument" entity** — `instrument_id` is a grouping *slug* on questionnaire metadata, not a new Library entity type with its own row/endpoints. (A future Instrument entity could adopt the slug as its id.)
- **No change to drill‑down** — the per‑id detail / versions / `definition` endpoints and the detail page (one version at a time, language switcher, per‑form resolved export carrying all that form's languages) are untouched.
- **No backfill of meaningful per‑form `variant` labels** — the legacy data has none (the form lives only in the questionnaire id), so imported forms all get `variant: "base"`; real labels arrive via hand‑authoring.
- **No required‑field migration** — `instrument_id`/`variant` are optional; instruments without them are valid and render as singletons.

---

## 2 — Schema changes

### 2.1 Schema 1 — Instrument Metadata `v26.0609` (severity `additive` over `v26.0605`)

Add two optional top‑level properties (the required floor `id/title/description/language` is unchanged):

```jsonc
"instrument_id": {
  "type": "string",
  "pattern": "^inst_[a-z0-9_]+$",
  "minLength": 3,
  "maxLength": 64,
  "description": "Family this instrument/form belongs to (groups variant forms, e.g. the ASRS full + screener share inst_asrs). Optional; absent means a standalone instrument."
},
"variant": {
  "type": "string",
  "minLength": 1,
  "maxLength": 64,
  "default": "base",
  "description": "Human-readable label distinguishing this form within its instrument family (e.g. 'Screener — Part A'). Defaults to 'base' for the primary/only form."
}
```

Mechanics (the established versioning pattern — `schema.json` is always the live version, past versions live under `versions/<ver>/`):
- Copy the current live `schemas/instrument/schema.json` (v26.0605) to `schemas/instrument/versions/v26.0605/schema.json` (+ its `examples/`, `context.jsonld`).
- Edit `schemas/instrument/schema.json`: bump `$id` to `…/instrument/v26.0609/schema.json`; add the two properties.
- `schemas/instrument/CHANGELOG.md`: new `## [v26.0609]` section (severity `additive`, the two new optional fields, property URIs stable).
- Add one example exercising the fields (e.g. an `asrs_screener.json` with `instrument_id: "inst_asrs"`, `variant: "Screener — Part A"`).
- `examples/` retargets `$schema`/refs to v26.0609 where applicable.

### 2.2 Schema 2 — Questionnaire Definition `v26.0609` (severity `breaking`)

The `metadata` composition currently is:

```jsonc
"metadata": { "allOf": [
  { "$ref": "https://behaverse.org/schemas/instrument/v26.0528/schema.json" },
  { "type": "object", "properties": { "id": { "pattern": "^qst_[a-z0-9_]+$" } } }
]}
```

Retarget the `$ref` from `instrument/v26.0528` → `instrument/v26.0609`. This pulls in **both** the new fields **and** the `authors`→`author` rename (the only other delta between v26.0528 and the v26.0605 line — confirmed via the Schema 1 changelog/diff).

- **`breaking`** because of the `author` rename. Migration is tiny: only the hand‑authored **`schemas/questionnaire/examples/phq9.json`** uses `authors` (imported content emits no author field, so the 64 questionnaires are unaffected). Fix: `authors`→`author` in that example.
- Versioning ceremony as in §2.1: archive current Schema 2 (`v26.0602`) under `versions/v26.0602/`; bump `schema.json` `$id` to `…/questionnaire/v26.0609/schema.json`; update `CHANGELOG.md`; retarget example `$schema` refs + `metadata.version` to `v26.0609`; add `instrument_id`/`variant` to the phq9 example to exercise the new field through Schema 2.

### 2.3 Validator registry

`tools/` builds an in‑memory registry mapping schema `$id` URLs → schema docs (it already serves both `v26.0528` and `v26.0605`). Register the new `instrument/v26.0609` and `questionnaire/v26.0609` URLs (keep `v26.0528` for old Schema 2 instances). The validator walks every example; all must pass. Target: the 308‑test schema suite stays green (with the new examples added).

### 2.4 Git tags

Per the CalVer policy: tag `instrument-v26.0609` and `v26.0609` (questionnaire) after the schemas validate.

---

## 3 — Importer

In `library/src/library/importers/survey_db/questionnaire.py::reconstruct()` the header row (and thus `header_id`) is already in hand (`header = next(... element_type == 'header' ...)`; `hid = header['header_id']`). Stop discarding it:

```python
hid = (header or {}).get("header_id")
if hid:
    meta["instrument_id"] = "inst_" + _sanitize_identifier(hid)   # 'asrs' -> 'inst_asrs'
meta["variant"] = "base"   # legacy data has no per-form labels; default per OD-21
```

- `_sanitize_identifier` already exists (lower‑cases, replaces non‑`[a-z0-9_]`, ensures a leading letter). `inst_` + a sanitized slug satisfies `^inst_[a-z0-9_]+$`.
- All four ASRS forms → `instrument_id: "inst_asrs"`; all imported forms → `variant: "base"`.
- The importer targets Schema 2 `v26.0609` now: it must emit `author` (it already emits none, so no change) and its output validates against the retargeted schema. The smoke test that validates every produced artifact must stay green.

---

## 4 — Library Core

### 4.1 Index
- Add `instrument_id text` to the `catalogue_entry` table (DDL in `store/schema.sql`); populate it in `store/index.py` from `content_json.metadata.instrument_id` (questionnaires only). Add an index on it.
- Add `instrument` to the **facet** surface: `GET /v1/facets?facet_type=instrument` aggregates distinct `instrument_id` + counts (from `catalogue_entry`, questionnaires, status published). Extend the facets allow‑list.

### 4.2 Grouped catalogue list (the one behavioural change)
`GET /v1/questionnaires?q=&domain=&population=&language=&license=&instrument=&min_items=&max_items=&sort=&limit=&offset=` returns **instrument‑grouped** results:

```jsonc
// PaginatedGroups
{
  "items": [ /* InstrumentGroup */ ],
  "total":  <number of groups matching>,
  "limit":  <n>,
  "offset": <n>
}
// InstrumentGroup
{
  "instrument_id": "inst_asrs" | null,   // null => singleton (no instrument_id)
  "title":         "ASRS-v1.1",          // representative (shared) title
  "form_count":    4,
  "languages":     ["en","fr"],          // union over the group's matching forms
  "domain":        ["adhd"],             // union over matching forms
  "forms":         [ /* CatalogueCard */ ]  // the matching forms (all forms when no filters)
}
```

Semantics:
- Group the latest‑published questionnaires by `instrument_id`. A questionnaire with `instrument_id IS NULL` is its **own singleton group** (`instrument_id: null`, one form).
- Search/filter (`q`, `domain`, `population`, `language`, `license`, `min/max_items`, `instrument`) apply at the **form** level; `forms[]` = the forms matching the active criteria; a group is returned **iff** it has ≥1 matching form. With no criteria, `forms[]` = all of the family's forms.
- `total` counts matching **groups**; `limit/offset/sort` operate over groups (sort key = representative title / recency).
- The per‑id endpoints (`/questionnaires/{id}`, `/versions`, `/definition[?resolved]`) are **unchanged** — drill‑down stays per‑form.

This **changes the list response shape** (from `PaginatedCards` to `PaginatedGroups`). The web UI is the only consumer; both change together. `query.list_cards` is refactored/extended into a grouped query (Postgres `GROUP BY instrument_id` with `json_agg` of per‑form cards over the filtered latest‑published set; singletons via `COALESCE(instrument_id, id)` as the group key so NULLs don't collapse together).

*(The separate `GET /v1/search` cross‑entity full‑text endpoint is **unchanged** and stays per‑card — it is not the catalogue path, and the web UI does not consume it. Grouping applies only to the `/v1/questionnaires` catalogue list.)*

---

## 5 — library-web

- **Types**: add `instrument_id`/`variant` to the card type; add an `InstrumentGroup` type + `PaginatedGroups`; `useQuestionnaires` returns groups.
- **Catalogue**: render **one row per `InstrumentGroup`**. A multi‑form group (`form_count > 1`) shows the instrument title + a "N forms" affordance and **expands** (accordion) to list its forms — each form showing its id + item count + languages (+ `variant` when not `"base"`), linking to its own `/q/{id}` detail page. A singleton group renders exactly like today's `ResultRow` (its single form). The result count reflects groups.
- **Facet sidebar**: add an **Instrument** group (from `/v1/facets?facet_type=instrument`), so you can filter to one family.
- **Detail page / export**: unchanged.

---

## 6 — Design-doc & decision record

- **`design/10_open_decisions.md`**: add **OD‑21** — "Instrument‑family grouping": first‑class optional `instrument_id` (+ `variant`), `inst_` prefix, sourced from legacy `header_id`, catalogue collapses by family; *not* a structural Instrument entity. Mark resolved 2026‑06‑09.
- **`design/05_data_model.md`**: document `instrument_id`/`variant` in the Schema 1 field list and the instrument→forms relationship; note the Schema 2 `v26.0609` retarget.
- Update the schema‑inventory table in `HANDOFF.md` (working file) when shipped.

---

## 7 — Testing strategy (TDD)

- **Schemas (`tools/tests/`)**: new examples validate against `v26.0609`; the registry resolves all URLs (v26.0528 + v26.0609 for both schemas); a `breaking`‑severity changelog entry exists; property‑URI stability check. Suite stays green.
- **Importer (`library/tests/unit/importers/`)**: `reconstruct()` emits `instrument_id: "inst_asrs"` for an ASRS‑form fixture and `variant: "base"`; absent `header_id` ⇒ no `instrument_id`. The full‑import smoke test re‑validates all artifacts against Schema 2 `v26.0609`.
- **Library Core (`library/tests/integration/`)**: `instrument_id` indexed; `/facets?facet_type=instrument` returns families; grouped list collapses same‑instrument forms into one group with `forms[]`; singletons (NULL instrument_id) are distinct groups; a filter that matches one form still returns the family (with only matching forms); pagination counts groups.
- **library-web (Vitest/RTL)**: catalogue renders a family row with `form_count`, expands to its forms; singleton renders as a plain row; instrument facet present. **Playwright** smoke updated: search → expand a family → open a form → (unchanged) see content + download.

---

## 8 — Sequencing (one spec, phased)

1. **Schema bump** — Schema 1 `v26.0609` + Schema 2 `v26.0609` + registry + examples + changelogs + tags (foundational; everything else depends on it).
2. **Importer** — emit `instrument_id` + `variant`; re‑validate.
3. **Library Core** — index + facet + grouped list.
4. **library-web** — collapse catalogue + instrument facet.
5. **Design docs** — OD‑21 + `05_data_model.md`.

Verified end‑to‑end against the live local stack (re‑import + re‑ingest; the catalogue shows one "ASRS" row expanding to four forms).

---

## 9 — Definition of done

1. Both schemas bump to `v26.0609`, validate, and are tagged; old `v26.0528`/`v26.0602` archived + still resolvable; schema suite green.
2. The importer emits `instrument_id` (`inst_<slug>` from `header_id`) + `variant: "base"`; the import smoke test re‑validates all artifacts against Schema 2 `v26.0609` with zero errors; the 4 ASRS forms share `inst_asrs`.
3. The Library catalogue list returns instrument‑grouped results; `instrument` facet works; per‑id drill‑down endpoints unchanged; Library suite green.
4. The web UI catalogue shows one expandable row per instrument; singletons unchanged; detail/version/language/export unchanged; frontend suite + Playwright green.
5. OD‑21 logged and `design/05_data_model.md` updated.

---

## 10 — Open questions to finalize in the plan

- **Grouped‑list query**: single `GROUP BY` query with `json_agg(form_card)` vs two‑step (group keys, then fetch forms) — default to the single aggregated query; confirm against Postgres ordering/limits in the plan.
- **`forms[]` under active filters**: include only matching forms (default) vs all family forms with a "matched" flag — default to matching‑only.
- **Schema 2 example coverage**: which example carries `instrument_id` (default: add to `phq9.json` as `inst_phq9` + a second form, or a dedicated `asrs_*` pair) — pick in the plan so grouping is exercised through Schema 2.
- **Old `v26.0605` instrument schema**: archive only (nothing pins it) vs also keep registered — default archive + register (cheap, keeps any v26.0605 instance resolvable).

# Handoff — server-side content search index

**Created:** 2026-06-18 · **Status:** §1–§3 IMPLEMENTED (2026-06-26); §4 live re-ingest still pending (owner) · §5 optional

> **Update 2026-06-26:** §1 (content indexed at weight B in `store/index.py`), §2 (`_q_filter` widened
> with an `id ILIKE` arm in `query.py`), and §3 (tests) are merged. Also added `query.search_questions`
> + `GET /v1/questions/search` (returns prompt hits **with their text snippet**) and a Questions search
> mode in `library-web`'s catalogue. **Still required:** §4 — a live re-ingest, so the Supabase index
> includes content (the live `GET /v1/questions/search?q=<word>` only matches id/title until then).
> §5 (switch the Editor picker to server-side search) remains optional.

## Goal

Make the Library's `q` search match entity **content** (a prompt's text, an option's scale
anchors, labels, etc.) — not just `title`/`description`. Today only the latter are indexed, so
searching reusable entities effectively only matches their **id**.

## Why (context)

The Editor's "Add / Pick from Library" flow (ED-I·A) is reuse-first: you search the Library and
only "Create new" when nothing matches — so search quality directly drives **deduplication**.
ED-I·F7 made the editor picker search content **client-side** as a stopgap: on first keystroke it
lazily fetches entity bodies (throttled+retried, **capped at 300**, cached per etype) and filters
on `id | title | content`. That works and fixes the reported "context search only matches id"
bug, but:
- it doesn't scale to large sets (the cap means ~793 prompts aren't fully content-searchable), and
- it fetches many bodies from the serverless Library.

This handoff is the **scalable server-side** version: index content once at ingest time, so the
existing `q` search matches it and the editor can query the server instead of fetching bodies.

## What exists today

- `catalogue_entry.search_tsv` (a Postgres `tsvector`, GIN-indexed) is the search column.
- It's built in **`library/src/library/store/index.py`** → `rebuild_index_for()`, currently from
  `title` (weight A) + `description` (weight C). For reusable entities `title = art.id` and
  `description = ''`, so **no content is indexed**.
- `q` search reads it: `library/src/library/query.py` `list_entries()` (the `/v1/entities/{etype}?q=`
  endpoint the editor would call) and `library/src/library/api/search.py` (`/v1/search`), both via
  `search_tsv @@ websearch_to_tsquery('english', q)`.
- The full entity body is stored in `entity.content_json` (already in the DB; not currently fed
  into the index).

## §1 — Index the content (the core change)

In **`library/src/library/store/index.py`**, add a helper and a third `setweight` term.

```python
def _content_text(art: Artifact) -> str:
    """All translatable text in a reusable entity's content map (every locale's
    text/label/units/description + option anchor texts), space-joined for the tsvector.
    Questionnaires have no top-level `content` map → returns '' (they index title/desc)."""
    parts: list[str] = []
    content = art.data.get("content")
    if isinstance(content, dict):
        for loc in content.values():
            if not isinstance(loc, dict):
                continue
            for k in ("text", "label", "units", "description"):
                v = loc.get(k)
                if isinstance(v, str):
                    parts.append(v)
            for opt in loc.get("options") or []:
                if isinstance(opt, dict) and isinstance(opt.get("text"), str):
                    parts.append(opt["text"])
    return " ".join(parts)
```

Then in `rebuild_index_for`, change the `search_tsv` expression to add a weight-B content term:

```python
        "VALUES (%s,%s,%s,'published',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, "
        "setweight(to_tsvector('english', coalesce(%s,'')), 'A') || "
        "setweight(to_tsvector('english', coalesce(%s,'')), 'B') || "   # <-- NEW: content
        "setweight(to_tsvector('english', coalesce(%s,'')), 'C'))",
        (art.id, art.version, art.entity_type, title, m.get("short_title"), desc,
         m.get("language"), m.get("available_languages"),
         psy.get("item_count"), psy.get("estimated_minutes"), effective_license,
         m.get("instrument_id"), m.get("variant"),
         title, _content_text(art), desc),   # <-- NEW param (between title and desc)
```

(Weight B keeps title > content > description in `ts_rank`. No schema change — `search_tsv` already
exists; the GIN index `catalogue_tsv_gin` covers it.)

## §2 — Keep id-substring matching (recommended)

`tsvector` tokenizes ids on `_` boundaries, so a partial like `opt_agr` won't full-text match well.
The editor's current client filter does `id.includes(q)`. Preserve that server-side by widening the
`q` clause in **`library/src/library/query.py`** `list_entries()`:

```python
    if q:
        where.append("(c.search_tsv @@ websearch_to_tsquery('english', %s) OR c.id ILIKE %s)")
        params.append(q)
        params.append(f"%{q}%")
```

(The `ORDER BY ts_rank(...)` stays; id-only matches rank 0 but are still returned. Optionally mirror
this in `api/search.py` if `/v1/search` should also match content+id — the editor only needs
`list_entries`.)

## §3 — Tests (in `library/tests/`)

- Unit: build an Artifact for an option whose `content.en.options[].text` includes "strongly agree"
  and assert `_content_text(art)` contains it; for a prompt assert its `content.*.text` is included.
- Integration (against the test Postgres harness — note `DOCKER_CONFIG=/tmp/lib_docker` per the
  Library memory): ingest a prompt whose text is "I crave excitement" with an id like `pr_x1`
  (no "excitement" in id/title), then `list_entries(conn, "prompt", q="excitement")` returns it.
  Add the symmetric negative (a different prompt is excluded).
- Confirm `q` by id-substring still works (`q="pr_x1"`).

## §4 — Re-ingest the live data (OWNER ACTION — the operational step)

The change only affects **newly-ingested** rows. The live Supabase Library is seeded **manually**
(see `scripts/seed-supabase.md`) — there is no auto re-ingest on deploy — so after merging §1/§2 the
**owner must re-seed** for the live index to include content:

```bash
# with DATABASE_URL = the Supabase Session-pooler URI (:5432), locally (never commit it):
python -m library.cli migrate
# TRUNCATE + re-ingest the CURRENT content set (survey_db + anything harvested), e.g.:
python3 -c "import psycopg,os; c=psycopg.connect(os.environ['DATABASE_URL']); c.execute('TRUNCATE entity, catalogue_entry, entity_ref, facet CASCADE'); c.commit()"
python -m library.cli ingest <content-dir> --release vYY.MMDD
```

⚠️ **Coordinate with the questionnaire-harvester agent** — it shares the live DB and may be
ingesting content. Re-ingest the full, current content set (don't drop harvested entities), and run
it when the harvester isn't mid-write. (A `rebuild-index` CLI subcommand doesn't exist yet — see
FOLLOWUPS "Doc/stack drift"; a targeted `UPDATE catalogue_entry SET search_tsv = …` recompute is an
alternative to a full TRUNCATE+ingest if preferred, but full re-ingest is simplest and proven.)

## §5 — Switch the editor to server-side search (optional second phase)

Once the live index has content, the editor picker can drop the client-side body-fetch:

- Add `searchEntities(etype, q)` in `editor/src/persistence/library.ts` calling
  `GET /v1/entities/{etype}?q=<q>&limit=…` (the q-aware `list_entries`).
- In `editor/src/library/LibraryPicker.tsx`, when `q` is non-empty, query the server (debounced)
  instead of the lazy body-fetch content index; keep the full-list browse for empty `q`.
- This removes the `CONTENT_INDEX_CAP=300` cap + the per-etype `CONTENT_CACHE` body fetching
  (`ED-I·F7`). Keeping the client path as an offline fallback is fine.
- Update `LibraryPicker.test.tsx` (the F7 content test) + the e2e picker stubs to the server `q`
  shape.

This phase is **optional** — the client-side F7 already gives working content search; the server
switch only removes the cap and the body-fetch load.

## Definition of done

- §1 + §2 merged; Library tests green (content + id-substring search).
- Owner has re-ingested the live DB (§4) and `GET /v1/entities/option?q=<anchor-word>` returns
  matches on the live API.
- (Optional §5) editor picker uses server search; F7 client cap removed.

## Pointers
- Index build: `library/src/library/store/index.py` · q query: `library/src/library/query.py`
- Live seed/re-ingest: `scripts/seed-supabase.md`
- Editor client-side F7 (the stopgap this replaces): `editor/src/library/LibraryPicker.tsx`
  + `editor/src/library/picker.ts` `searchableText()`; memory `project_editor_ed_i`.

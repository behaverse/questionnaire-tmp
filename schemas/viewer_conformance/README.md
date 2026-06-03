# Schema 7 — Viewer Conformance Manifest

Per OD-18c (resolved 2026-06-03), per-viewer JSON document declaring supported features. Each viewer release publishes a manifest at a stable URL; the Viewer Service stores it in a viewer-registry table and hashes it into the runtime cache key (per OD-18f).

**Current version:** v26.0603

## Files

| File | Purpose |
|---|---|
| `schema.json` | JSON Schema (Draft 2020-12) at v26.0603 |
| `context.jsonld` | JSON-LD context |
| `examples/minimal_manifest.json` | Smallest valid manifest |
| `examples/web_viewer_manifest.json` | Full Web Viewer manifest |
| `examples/native_viewer_manifest.json` | Native Godot Viewer manifest (kiosk-shaped) |
| `CHANGELOG.md` | Version history |

## Required fields

- **`viewer_id`** — stable identifier (e.g., `behaverse-web-viewer`).
- **`viewer_version`** — CalVer of the viewer release.
- **`schema_support`** — lists of supported Schema 1/2 (required), 3/5/6 (optional) CalVer versions.
- **`evaluator`** — WASM evaluator's language version + function names (per OD-11).
- **`widgets`** — supported `(input_data_type, measurement_type, selection)` triples (per OD-15).
- **`scorer_impl_kinds`** — subset of `wasm`, `http`, `python`, `r` the viewer can invoke (per OD-16e Z).

## Optional capability declarations

- `behavioural_channels` — captured streams (per OD-07).
- `logic_actions` — implemented LogicRule actions.
- `locale_switching`, `resume`, `max_session_duration_minutes`.

## See also

- [design/05d_runtime.md](../../design/05d_runtime.md) §6 — manifest shape
- [schemas/runtime/](../runtime/) — Schema 3 (sister schema; uses this manifest for trimming)

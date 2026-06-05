# Schema 4b — Keyboard Recording Sample

Per OD-20 (resolved 2026-06-05), Schema 4b family member for keyboard-channel recordings. Each sample is `{t, key, key_code, action, modifiers}`. See [design/05_data_model.md](../../../design/05_data_model.md) §"Schema 4b" and [design/05e_events_vocabulary.md](../../../design/05e_events_vocabulary.md) §2.5 (recording lifecycle).

**Current version:** v26.0605

## Files

| File | Purpose |
|---|---|
| `schema.json` | JSON Schema (Draft 2020-12) at v26.0605 — validates ONE sample |
| `context.jsonld` | JSON-LD context |
| `examples/` | Single-sample example files |
| `CHANGELOG.md` | Version history |

## Sample shape

```json
{
  "t": 1.234,
  "key": "ArrowLeft",
  "key_code": 37,
  "action": "down",
  "modifiers": ["shift"]
}
```

- `t` — seconds from recording start (float, full precision)
- `key` — canonical key name (e.g., `ArrowLeft`, `Enter`, `a`)
- `key_code` — OS/browser key code (integer)
- `action` — enum: `down` / `up`
- `modifiers` — subset of `["shift", "ctrl", "alt", "meta"]` (unique items)

## File-level format

The canonical wire format is `.jsonl.gz` (gzipped JSON Lines), one sample per line. The full file is referenced from a Schema 4a `bdm:recording_ended` event via `bdm:recording_url`. No sidecar manifest file; manifest data lives in event extensions (per OD-20e).

## See also

- [design/05e_events_vocabulary.md](../../../design/05e_events_vocabulary.md) — Recording lifecycle events
- [schemas/events/](../../events/) — Schema 4a (the event-stream linker)
- [schemas/recordings/mouse/](../mouse/) — Sibling: mouse recordings

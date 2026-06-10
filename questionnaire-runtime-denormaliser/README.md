# questionnaire-runtime-denormaliser

Pure Python library (per **OD-18**) that turns a **Schema 2 Questionnaire** into a
**Schema 3 Runtime**: references inlined, content trimmed to one locale, viewer
features reconciled, Scorer implementations pinned, scoring optionally stripped,
provenance attached. Shared by the Viewer Service (session-mint) and the Editor
(preview). I/O-free — entity resolution is an injected callable.

## Usage

```python
from pathlib import Path
from denormaliser import denormalise, RuntimePolicy

runtime = denormalise(
    questionnaire,                       # Schema 2 dict (may contain refs)
    locale="en",
    runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm", "http"], show_score=False),
    viewer_manifest=manifest,            # Schema 7 dict
    resolve_entity=lambda ref: store.get(ref),   # "pr_x@v26.0609" -> entity body | None
    generated_at="2026-06-10T12:00:00Z",
    schemas_dir=Path("schemas"),         # optional: validate input + output
)
```

`denormalise` raises `denormaliser.PreflightError` (carrying every collected
`Problem`) when the questionnaire × viewer × policy combination is invalid
(unresolved ref, missing locale, no scorer-impl intersection, unsupported widget,
unsupported logic action).

## Development

```bash
source ../.venv/bin/activate
pip install -e .[dev]
pytest -q
```

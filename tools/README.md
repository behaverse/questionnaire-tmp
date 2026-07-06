# tools/

Python utilities for the schemas project.

## validate_schemas.py

Validates every example under `schemas/<name>/examples/` (all eight schemas, incl. two-level recordings/{mouse,keyboard}) plus cross-schema consistency checks.

### Usage

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r tools/requirements.txt
python tools/validate_schemas.py
```

Exit code 0 if all examples pass; 1 if any fail.

## tests/

`pytest tools/tests/` runs the validator's own test suite (uses inline fixtures
in `tools/tests/fixtures/` plus the canonical examples).

from pathlib import Path

import pytest

# Repo root is three parents up from this file:
# <repo>/questionnaire-runtime-denormaliser/tests/conftest.py
REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMAS_DIR = REPO_ROOT / "schemas"


@pytest.fixture
def schemas_dir() -> Path:
    assert SCHEMAS_DIR.is_dir(), f"schemas dir not found at {SCHEMAS_DIR}"
    return SCHEMAS_DIR

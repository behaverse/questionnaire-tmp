from pathlib import Path
from library.config import get_settings
from library.loader import load_tree
from library.validation import build_registry, validate_artifact

FIXTURE = Path(__file__).parents[1] / "fixtures/content"

def test_every_fixture_artifact_is_schema_valid():
    S = get_settings()
    reg = build_registry(S.schemas_dir)
    for art in load_tree(FIXTURE, release="v26.0601"):
        validate_artifact(art, reg, S.schemas_dir)  # must not raise

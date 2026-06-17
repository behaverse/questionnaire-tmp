from pathlib import Path
from library.loader import load_tree
from library.validation import build_registry, validate_artifact

def validate_tree(out_dir: Path, schemas_dir: Path, release: str | None = None) -> list[str]:
    """Validate every entity in out_dir against the canonical schemas.
    Returns a list of error strings (empty = all valid)."""
    registry = build_registry(Path(schemas_dir))
    errors: list[str] = []
    for art in load_tree(Path(out_dir), release):
        try:
            validate_artifact(art, registry, Path(schemas_dir))
        except Exception as e:  # SchemaInvalidError or ref-resolution failure
            errors.append(f"{art.path.name}: {e}")
    return errors

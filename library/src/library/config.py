import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

@dataclass(frozen=True)
class Settings:
    database_url: str
    content_dir: Path
    schemas_dir: Path
    api_prefix: str = "/v1"

def get_settings() -> Settings:
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/library"),
        content_dir=Path(os.environ.get("CONTENT_DIR") or REPO_ROOT / "schemas/questionnaire/examples/library_examples"),
        schemas_dir=Path(os.environ.get("SCHEMAS_DIR") or REPO_ROOT / "schemas"),
        api_prefix=os.environ.get("API_PREFIX", "/v1"),
    )

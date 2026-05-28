"""pytest path setup so `from tools.validate_schemas import ...` works."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

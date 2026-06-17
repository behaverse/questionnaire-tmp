from pathlib import Path
from harvester.validate import validate_tree

REPO = Path(__file__).resolve().parents[3]
SCHEMAS = REPO / "schemas"
PILOT = REPO / "questionnaire-harvester" / "output"

def test_phq9_pilot_is_schema2_valid():
    errors = validate_tree(PILOT, SCHEMAS, release="v26.0617")
    assert errors == [], "PHQ-9 pilot must validate: " + "; ".join(errors)

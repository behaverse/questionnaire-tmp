import json
import pytest
from library.config import get_settings
from library.validation import build_registry, validate_artifact, SchemaInvalidError
from library.loader import identify, Artifact

S = get_settings()
EXP = S.schemas_dir / "questionnaire/examples/library_examples/prompts/pr_phq9_1.json"

def test_valid_prompt_passes():
    reg = build_registry(S.schemas_dir)
    art = identify(EXP, json.loads(EXP.read_text()), release="v26.0602")
    validate_artifact(art, reg, S.schemas_dir)  # must not raise

def test_invalid_prompt_fails():
    reg = build_registry(S.schemas_dir)
    bad = identify(EXP, {**json.loads(EXP.read_text()), "content": "not-an-object"}, release="v26.0602")
    with pytest.raises(SchemaInvalidError):
        validate_artifact(bad, reg, S.schemas_dir)

def test_valid_questionnaire_passes():
    reg = build_registry(S.schemas_dir)
    qpath = S.schemas_dir / "questionnaire/examples/phq9.json"
    data = json.loads(qpath.read_text())
    # the questionnaire example lives under examples/, not a questionnaires/ dir,
    # so construct the Artifact directly (id/version come from metadata)
    art = Artifact("questionnaire", data["metadata"]["id"], data["metadata"]["version"], data, qpath)
    validate_artifact(art, reg, S.schemas_dir)  # must not raise

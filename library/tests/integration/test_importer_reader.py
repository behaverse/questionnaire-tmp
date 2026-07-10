from pathlib import Path
import pytest
from library.importers.survey_db.reader import SurveyDB

DB = Path("survey_database/data/survey_db.sqlite")

# See test_importer_run.py: the legacy sqlite is archived/local-only (content already imported to
# Supabase). Run these importer-reader checks only when that sqlite is present — never a re-import.
pytestmark = pytest.mark.skipif(
    not DB.exists(), reason="survey_db.sqlite archived/local-only; content already imported (no re-import)")

def test_counts_match_known_catalogue():
    db = SurveyDB(DB)
    assert len(db.prompts()) == 793
    assert len(db.contexts()) == 30
    assert len(db.instructions()) == 22
    assert len(db.messages()) == 100
    assert len(db.placeholders()) == 11
    assert len(db.helps()) == 21
    assert len(db.regexes()) == 7
    assert len(db.solutions()) == 35

def test_options_grouped_by_option_id():
    db = SurveyDB(DB)
    groups = db.options_grouped()
    assert "agreement_7" in groups and len(groups["agreement_7"]) >= 2

def test_compositions_and_surveys():
    db = SurveyDB(DB)
    comps = db.compositions()
    assert any(c["element_type"] == "header" for c in comps)
    surveys = db.surveys()  # dict by survey_id
    assert "aiss" in surveys and surveys["aiss"]["title"]

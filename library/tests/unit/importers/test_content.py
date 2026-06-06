from library.importers.survey_db.content import simple_content
from library.importers.survey_db.ids import LANGS_FULL, LANGS_MIN

def test_builds_only_nonempty_langs():
    row = {"text_en": "Hello", "text_fr": "Bonjour", "text_de": "", "text_lu": None}
    out = simple_content(row, LANGS_MIN)
    assert out == {"en": {"status": "complete", "text": "Hello"},
                   "fr": {"status": "complete", "text": "Bonjour"}}

def test_full_langs_skips_missing():
    row = {"text_en": "x"}  # other langs absent
    out = simple_content(row, LANGS_FULL)
    assert list(out.keys()) == ["en"]

def test_custom_field_name():
    row = {"text_en": "desc"}
    assert simple_content(row, ["en"], field="description")["en"] == {"status": "complete", "description": "desc"}

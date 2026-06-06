import json, sqlite3
from pathlib import Path
import psycopg
from library.importers.survey_db.run import import_survey_db
from library.validation import build_registry, validate_artifact
from library.loader import load_tree
from library.ingest import ingest_tree
from library.config import get_settings

DB = Path("survey_database/data/survey_db.sqlite")
REL = "v26.0606"; AT = "2026-06-06T00:00:00Z"
S = get_settings()

def test_full_run_counts_validate_and_ingest(tmp_path):
    summary = import_survey_db(DB, tmp_path, release=REL, imported_at=AT)
    # expected counts (valid mappable entities from the legacy catalogue)
    # Note: rows with NULL entity ids or empty content are dropped and recorded in the loss report
    assert len(list((tmp_path / "prompts").glob("*.json"))) == 793
    assert len(list((tmp_path / "contexts").glob("*.json"))) == 21   # 9 junk rows have NULL context_id
    assert len(list((tmp_path / "instructions").glob("*.json"))) == 21  # 1 junk row has NULL instruction_id
    assert len(list((tmp_path / "messages").glob("*.json"))) == 98   # 1 null id + 1 no content = 2 dropped
    assert len(list((tmp_path / "placeholders").glob("*.json"))) == 11
    assert len(list((tmp_path / "helps").glob("*.json"))) == 21
    assert len(list((tmp_path / "regexes").glob("*.json"))) == 7
    assert len(list((tmp_path / "solutions").glob("*.json"))) == 35
    assert len(list((tmp_path / "questionnaires").glob("*.json"))) == 64
    # distinct option sets — exclude choice options with < 2 index-bearing rows (schema minItems: 2)
    # and options with NULL option_id (junk rows already excluded from the grouped query)
    con = sqlite3.connect(DB)
    n_opt_total = con.execute(
        "SELECT count(DISTINCT option_id) FROM options WHERE option_id IS NOT NULL").fetchone()[0]
    n_bad_choice = con.execute("""
        SELECT COUNT(DISTINCT option_id) FROM options
        WHERE option_id IS NOT NULL AND input_data_type = 'choice'
        GROUP BY option_id HAVING COUNT(*) < 2
    """).fetchone()
    # n_bad_choice is None if no such options exist; otherwise it's the count of bad choice groups
    # Re-compute properly: count distinct option_ids that are 'choice' with < 2 rows
    bad_choices = [r[0] for r in con.execute("""
        SELECT option_id FROM options
        WHERE option_id IS NOT NULL AND input_data_type = 'choice'
        GROUP BY option_id HAVING COUNT(*) < 2
    """).fetchall()]
    # Also options with NULL input_data_type that default to 'choice' but have < 2 index rows
    # (these have NULL input_data_type and are flagged by the mapper when choices < 2)
    bad_null_choices = [r[0] for r in con.execute("""
        SELECT option_id FROM options
        WHERE option_id IS NOT NULL AND input_data_type IS NULL AND [index] IS NOT NULL
        GROUP BY option_id HAVING COUNT(*) < 2
    """).fetchall()]
    n_dropped = len(set(bad_choices) | set(bad_null_choices))
    n_opt = n_opt_total - n_dropped
    assert len(list((tmp_path / "options").glob("*.json"))) == n_opt
    assert (tmp_path / "loss_report.json").exists()

    # every artifact validates against the schemas
    reg = build_registry(S.schemas_dir)
    for art in load_tree(tmp_path, release=REL):
        validate_artifact(art, reg, S.schemas_dir)

def test_full_run_ingests_into_library(pg_url, tmp_path):
    import_survey_db(DB, tmp_path, release=REL, imported_at=AT)
    reg = build_registry(S.schemas_dir)
    with psycopg.connect(pg_url) as c:
        report = ingest_tree(c, tmp_path, "import", registry=reg, schemas_dir=S.schemas_dir, release=REL)
        c.commit()
        assert report.errors == []
        n_qst = c.execute("SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'").fetchone()[0]
        assert n_qst == 64

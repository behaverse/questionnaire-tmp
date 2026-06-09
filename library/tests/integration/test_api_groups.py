from pathlib import Path
import psycopg, pytest
from library.query import list_instrument_groups
from library.ingest import ingest_tree
from library.validation import build_registry
from library.config import get_settings

FIXTURE = Path(__file__).parents[1] / "fixtures/content"
S = get_settings()

@pytest.fixture
def seeded(pg_url):
    with psycopg.connect(pg_url) as c:
        ingest_tree(c, FIXTURE, "c1", registry=build_registry(S.schemas_dir),
                    schemas_dir=S.schemas_dir, release="v26.0601")
        # two forms sharing an instrument + one singleton
        c.execute("UPDATE catalogue_entry SET instrument_id='inst_min' WHERE id='qst_min'")
        c.execute("INSERT INTO entity (id,version,entity_type,status,content_json) "
                  "VALUES ('qst_min2','v26.0601','questionnaire','published','{}')")
        c.execute("INSERT INTO catalogue_entry (id,version,entity_type,status,title,instrument_id) "
                  "VALUES ('qst_min2','v26.0601','questionnaire','published','Minimal example','inst_min')")
        c.commit()
    return pg_url

def test_groups_collapse_same_instrument(seeded):
    with psycopg.connect(seeded) as c:
        groups, total = list_instrument_groups(c, q=None, domain=None, population=None,
            language=None, license=None, instrument=None, min_items=None, max_items=None,
            sort=None, limit=20, offset=0)
    by_inst = {g["instrument_id"]: g for g in groups}
    assert "inst_min" in by_inst
    assert by_inst["inst_min"]["form_count"] == 2
    assert {f["id"] for f in by_inst["inst_min"]["forms"]} == {"qst_min", "qst_min2"}
    assert total == len(groups)

def test_singleton_when_no_instrument_id(seeded):
    with psycopg.connect(seeded) as c:
        c.execute("UPDATE catalogue_entry SET instrument_id=NULL")
        c.commit()
        groups, total = list_instrument_groups(c, q=None, domain=None, population=None,
            language=None, license=None, instrument=None, min_items=None, max_items=None,
            sort=None, limit=20, offset=0)
    assert all(g["form_count"] == 1 and g["instrument_id"] is None for g in groups)

from pathlib import Path
from library.loader import Artifact
from library.store.entities import upsert_entity
from library.store.index import rebuild_index_for

def _q():
    data = {"id": "qst_x", "version": "v26.0601", "license": "cc_by",
            "metadata": {"title": "Test Q", "short_title": "TQ", "description": "d",
                         "language": "en", "available_languages": ["en", "pt"],
                         "license": "cc_by",
                         "classification": {"domain": ["depression"], "population": ["adults"],
                                            "administration_mode": ["self_report"]},
                         "psychometrics": {"item_count": 9, "estimated_minutes": 5}},
            "pages": [{"elements": [{"option": {"ref": "opt_a@v26.0528"}}]}]}
    return Artifact("questionnaire", "qst_x", "v26.0601", data, Path("qst_x.json"))

def test_catalogue_row_derived(conn):
    art = _q(); upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    row = conn.execute("SELECT title, item_count, effective_license, language FROM catalogue_entry WHERE id='qst_x'").fetchone()
    assert row == ("Test Q", 9, "cc_by", "en")

def test_facets_and_refs(conn):
    art = _q(); upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    facets = {(r[0], r[1]) for r in conn.execute("SELECT facet_type, value FROM facet WHERE id='qst_x'").fetchall()}
    assert ("domain", "depression") in facets and ("population", "adults") in facets
    refs = [(r[0], r[1]) for r in conn.execute("SELECT to_id, ref_kind FROM entity_ref WHERE from_id='qst_x'").fetchall()]
    assert ("opt_a", "option") in refs

def test_tsv_populated(conn):
    art = _q(); upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    n = conn.execute("SELECT count(*) FROM catalogue_entry WHERE search_tsv @@ plainto_tsquery('english','Test')").fetchone()[0]
    assert n == 1

def test_rebuild_is_idempotent(conn):
    art = _q(); upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="cc_by")
    rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    assert conn.execute("SELECT count(*) FROM catalogue_entry WHERE id='qst_x'").fetchone()[0] == 1

def test_index_stores_instrument_id(conn):
    art = Artifact("questionnaire", "qst_x_asrs", "v26.0606",
                   {"metadata": {"id": "qst_x_asrs", "version": "v26.0606", "title": "ASRS-v1.1",
                                 "description": "d", "language": "en", "instrument_id": "inst_asrs"}},
                   Path("qst_x_asrs.json"))
    upsert_entity(conn, art, "c1")
    rebuild_index_for(conn, art, effective_license="unknown")
    conn.commit()
    row = conn.execute("SELECT instrument_id FROM catalogue_entry WHERE id='qst_x_asrs'").fetchone()
    assert row[0] == "inst_asrs"

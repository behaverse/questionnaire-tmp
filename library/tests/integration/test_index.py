from pathlib import Path
from library.loader import Artifact
from library.store.entities import upsert_entity
from library.store.index import rebuild_index_for, _content_text
from library.query import list_entries

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

def _prompt(pid: str, text: str, version="v26.0601") -> Artifact:
    data = {"id": pid, "content": {"en": {"text": text}}}
    return Artifact("prompt", pid, version, data, Path(f"{pid}.json"))

def _option(oid: str, anchors: list[str], version="v26.0601") -> Artifact:
    data = {"id": oid, "content": {"en": {"label": "scale",
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(anchors)]}}}
    return Artifact("option", oid, version, data, Path(f"{oid}.json"))

def test_content_text_extracts_prompt_and_option_anchors():
    assert "I crave excitement" in _content_text(_prompt("pr_x1", "I crave excitement"))
    txt = _content_text(_option("opt_a7", ["strongly disagree", "strongly agree"]))
    assert "strongly agree" in txt and "strongly disagree" in txt

def test_content_is_full_text_searchable(conn):
    # id/title carry no "excitement" — only the prompt TEXT does.
    hit = _prompt("pr_x1", "I crave excitement and thrills")
    miss = _prompt("pr_x2", "I prefer calm and routine")
    for art in (hit, miss):
        upsert_entity(conn, art, "c1"); rebuild_index_for(conn, art, effective_license="cc_by")
    conn.commit()
    rows, total = list_entries(conn, "prompt", q="excitement", limit=20, offset=0)
    ids = [r["id"] for r in rows]
    assert ids == ["pr_x1"] and total == 1

def test_option_anchor_is_searchable(conn):
    art = _option("opt_agreement_7", ["strongly disagree", "strongly agree"])
    upsert_entity(conn, art, "c1"); rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    rows, _ = list_entries(conn, "option", q="strongly agree", limit=20, offset=0)
    assert [r["id"] for r in rows] == ["opt_agreement_7"]

def test_id_substring_still_matches(conn):
    art = _prompt("pr_unique_xyz", "Some unrelated wording")
    upsert_entity(conn, art, "c1"); rebuild_index_for(conn, art, effective_license="cc_by"); conn.commit()
    rows, _ = list_entries(conn, "prompt", q="unique_xyz", limit=20, offset=0)
    assert [r["id"] for r in rows] == ["pr_unique_xyz"]

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

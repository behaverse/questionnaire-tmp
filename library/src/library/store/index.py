import psycopg
from ..loader import Artifact
from ..refs import extract_refs

def _meta(art: Artifact) -> dict:
    # questionnaires carry a Schema-1-shaped metadata block; reusable entities don't
    return art.data.get("metadata", {}) if art.entity_type == "questionnaire" else {}

def rebuild_index_for(conn: psycopg.Connection, art: Artifact, effective_license: str) -> None:
    conn.execute("DELETE FROM catalogue_entry WHERE id=%s AND version=%s", (art.id, art.version))
    conn.execute("DELETE FROM entity_ref WHERE from_id=%s AND from_version=%s", (art.id, art.version))
    conn.execute("DELETE FROM facet WHERE id=%s AND version=%s", (art.id, art.version))

    m = _meta(art)
    psy = m.get("psychometrics", {})
    title = m.get("title") or art.data.get("name") or art.id
    desc = m.get("description", "")
    conn.execute(
        "INSERT INTO catalogue_entry (id, version, entity_type, status, title, short_title, description, "
        "language, available_languages, item_count, estimated_minutes, effective_license, instrument_id, variant, search_tsv) "
        "VALUES (%s,%s,%s,'published',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s, "
        "setweight(to_tsvector('english', coalesce(%s,'')), 'A') || "
        "setweight(to_tsvector('english', coalesce(%s,'')), 'C'))",
        (art.id, art.version, art.entity_type, title, m.get("short_title"), desc,
         m.get("language"), m.get("available_languages"),
         psy.get("item_count"), psy.get("estimated_minutes"), effective_license,
         m.get("instrument_id"), m.get("variant"),
         title, desc),
    )

    for ref in extract_refs(art.data):
        conn.execute(
            "INSERT INTO entity_ref (from_id, from_version, to_id, to_version, ref_kind) "
            "VALUES (%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING",
            (art.id, art.version, ref.to_id, ref.to_version, ref.ref_kind),
        )

    cls = m.get("classification", {})
    for ftype in ("domain", "population", "administration_mode"):
        for value in cls.get(ftype, []) or []:
            conn.execute(
                "INSERT INTO facet (id, version, facet_type, value) VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING",
                (art.id, art.version, ftype, value),
            )

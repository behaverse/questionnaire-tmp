#!/usr/bin/env python3
"""Wire the scorer slice into the live Library: delete the 4 changed questionnaire entities
(cascades catalogue/facet/ref; community tables are FK-less and untouched) and re-ingest the
harvested tree — which re-inserts them WITH scores[] and inserts the 4 scr_* scorer entities.
Everything else is an idempotent no-op. One transaction. DATABASE_URL from env or .env.local.

  PYTHONPATH=library/src:questionnaire-harvester/src python scripts/wire_scores_live.py
"""
import os, re, sys
from pathlib import Path
import psycopg
from library.ingest import ingest_tree
from library.validation import build_registry

REPO = Path(__file__).resolve().parent.parent
QIDS = ["qst_gad7", "qst_swls", "qst_who5", "qst_dass21"]
VERSION = "v26.0618"
TREE = REPO / "questionnaire-harvester" / "output"


def _database_url():
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    for line in (REPO / ".env.local").read_text().splitlines():
        if line.strip().startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip("'\"")
    sys.exit("DATABASE_URL not found")


def _kwargs(url):
    m = re.match(r"postgres(?:ql)?://([^:]+):(.*)@([^@:/]+):(\d+)/([^?]+)", url)
    u, pw, host, port, db = m.groups()
    return dict(user=u, password=pw, host=host, port=int(port), dbname=db, connect_timeout=20)


def main():
    reg = build_registry(REPO / "schemas")
    with psycopg.connect(**_kwargs(_database_url())) as conn:
        before = conn.execute(
            "SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'").fetchone()[0]
        scr_before = conn.execute(
            "SELECT count(*) FROM entity WHERE entity_type='scorer'").fetchone()[0]
        deleted = conn.execute(
            "DELETE FROM entity WHERE entity_type='questionnaire' AND id = ANY(%s) AND version=%s",
            (QIDS, VERSION)).rowcount
        print(f"deleted {deleted} changed questionnaire rows")
        rep = ingest_tree(conn, TREE, None, registry=reg, schemas_dir=REPO / "schemas", release=VERSION)
        print(f"ingest: ingested={rep.ingested} skipped={rep.skipped} errors={len(rep.errors)}")
        if rep.errors:
            raise SystemExit(f"errors -> rollback: {rep.errors[:3]}")
    with psycopg.connect(**_kwargs(_database_url())) as conn:
        after = conn.execute(
            "SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'").fetchone()[0]
        scr_after = conn.execute(
            "SELECT count(*) FROM entity WHERE entity_type='scorer'").fetchone()[0]
        wired = conn.execute(
            "SELECT id FROM entity WHERE entity_type='questionnaire' AND id=ANY(%s) "
            "AND version=%s AND content_json ? 'scores' ORDER BY id", (QIDS, VERSION)).fetchall()
        print(f"questionnaires {before}->{after}; scorers {scr_before}->{scr_after}; "
              f"now carrying scores[]: {[r[0] for r in wired]}")


if __name__ == "__main__":
    main()

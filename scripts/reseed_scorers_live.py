#!/usr/bin/env python3
"""Live-wire ALL scorers into the Library: delete the harvested questionnaire + scorer entity rows
at v26.0618 (cascades catalogue/facet/ref; FK-less community tables untouched) and re-ingest the
harvested tree — re-inserting every questionnaire WITH its scores[] and all scr_* scorer entities.
Reusable entities are an idempotent no-op; survey_db (v26.0606) is untouched. One transaction.

Run AFTER the Viewer Service is redeployed (so it serves the new wasm). DATABASE_URL from env/.env.local.
  PYTHONPATH=library/src:questionnaire-harvester/src python scripts/reseed_scorers_live.py
"""
import os, re, sys
from pathlib import Path
import psycopg
from library.ingest import ingest_tree
from library.validation import build_registry

REPO = Path(__file__).resolve().parent.parent
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


def _c(conn, sql):
    return conn.execute(sql).fetchone()[0]


def main():
    reg = build_registry(REPO / "schemas")
    with psycopg.connect(**_kwargs(_database_url())) as conn:
        before_q = _c(conn, "SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'")
        before_s = _c(conn, "SELECT count(*) FROM entity WHERE entity_type='scorer'")
        d = conn.execute(
            "DELETE FROM entity WHERE entity_type IN ('questionnaire','scorer') AND version=%s",
            (VERSION,)).rowcount
        print(f"deleted {d} harvested questionnaire+scorer rows @ {VERSION}")
        rep = ingest_tree(conn, TREE, None, registry=reg, schemas_dir=REPO / "schemas", release=VERSION)
        print(f"ingest: ingested={rep.ingested} skipped={rep.skipped} errors={len(rep.errors)}")
        if rep.errors:
            raise SystemExit(f"errors -> rollback: {rep.errors[:3]}")
    with psycopg.connect(**_kwargs(_database_url())) as conn:
        after_q = _c(conn, "SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'")
        after_s = _c(conn, "SELECT count(*) FROM entity WHERE entity_type='scorer'")
        with_scores = _c(conn,
            "SELECT count(*) FROM entity WHERE entity_type='questionnaire' AND version='%s' "
            "AND content_json ? 'scores'" % VERSION)
        print(f"questionnaires {before_q}->{after_q}; scorers {before_s}->{after_s}; "
              f"harvested carrying scores[]: {with_scores}")


if __name__ == "__main__":
    main()

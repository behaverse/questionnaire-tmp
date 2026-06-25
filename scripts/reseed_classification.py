#!/usr/bin/env python3
"""Atomically refresh the Library catalogue questionnaires after a classification change.

Re-ingesting changed content at the same (id, version) raises ImmutabilityError, so this deletes
the questionnaire entity rows (cascading to their catalogue_entry / facet / entity_ref rows, but
NOT the FK-less community tables comment/rating) and re-ingests both trees in ONE transaction —
no public-facing downtime, rolls back on any error.

Secret handling: DATABASE_URL is read from the environment or a gitignored .env.local; it is never
printed or hardcoded. Run:  PYTHONPATH=library/src:questionnaire-harvester/src python scripts/reseed_classification.py
"""
import os
import re
import sys
from pathlib import Path

import psycopg

from library.ingest import ingest_tree
from library.validation import build_registry

REPO = Path(__file__).resolve().parent.parent


def _load_database_url():
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    envf = REPO / ".env.local"
    if envf.exists():
        for line in envf.read_text().splitlines():
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip().strip("'\"")
    sys.exit("DATABASE_URL not found (env or .env.local)")


def _conn_kwargs(url):
    # parse manually — the password can contain '#'/'@'-like chars that break URI parsers
    m = re.match(r"postgres(?:ql)?://([^:]+):(.*)@([^@:/]+):(\d+)/([^?]+)", url)
    if not m:
        sys.exit("DATABASE_URL not in expected postgresql://user:pass@host:port/db form")
    user, pw, host, port, db = m.groups()
    return dict(user=user, password=pw, host=host, port=int(port), dbname=db, connect_timeout=20)


def _count(conn, sql, args=()):
    return conn.execute(sql, args).fetchone()[0]


def _count_opt(conn, table):
    """Count rows in an optional table (community tables may not exist in every deployment).
    Runs in a savepoint so a missing table doesn't abort the surrounding transaction."""
    try:
        with conn.transaction():
            return conn.execute(f"SELECT count(*) FROM {table}").fetchone()[0]
    except psycopg.errors.UndefinedTable:
        return "n/a"


def main():
    # content_dir passed to ingest must exist; survey_db tree comes from /tmp/content (re-imported)
    tmp = Path("/tmp/content")
    if not tmp.exists():
        sys.exit("re-import survey_db to /tmp/content first (see HANDOFF)")
    trees = [(tmp, "v26.0606"), (REPO / "questionnaire-harvester/output", "v26.0618")]

    kwargs = _conn_kwargs(_load_database_url())
    reg = build_registry(REPO / "schemas")
    schemas = REPO / "schemas"
    with psycopg.connect(**kwargs) as conn:
        before_q = _count(conn, "SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'")
        before_dom = _count(conn, "SELECT count(distinct value) FROM facet WHERE facet_type='domain'")
        comments = _count_opt(conn, "comment")
        ratings = _count_opt(conn, "rating")
        print(f"BEFORE: questionnaires={before_q} distinct_domains={before_dom} "
              f"comments={comments} ratings={ratings}")

        # one transaction: delete + re-ingest both trees
        deleted = conn.execute("DELETE FROM entity WHERE entity_type='questionnaire'").rowcount
        print(f"deleted {deleted} questionnaire entity rows (cascades to catalogue/facet/ref)")
        for tree, release in trees:
            rep = ingest_tree(conn, tree, None, registry=reg, schemas_dir=schemas, release=release)
            print(f"ingested {tree.name} @ {release}: ingested={rep.ingested} "
                  f"skipped={rep.skipped} errors={len(rep.errors)}")
            if rep.errors:
                raise SystemExit(f"ingest errors -> rolling back: {rep.errors[:3]}")
        # committed on context exit

    with psycopg.connect(**kwargs) as conn:
        after_q = _count(conn, "SELECT count(*) FROM catalogue_entry WHERE entity_type='questionnaire'")
        after_dom = _count(conn, "SELECT count(distinct value) FROM facet WHERE facet_type='domain'")
        after_comments = _count_opt(conn, "comment")
        after_ratings = _count_opt(conn, "rating")
        domains = [r[0] for r in conn.execute(
            "SELECT value FROM facet WHERE facet_type='domain' GROUP BY value ORDER BY value").fetchall()]
        print(f"AFTER:  questionnaires={after_q} distinct_domains={after_dom} "
              f"comments={after_comments} ratings={after_ratings}")
        print("domain vocabulary now:", ", ".join(domains))


if __name__ == "__main__":
    main()

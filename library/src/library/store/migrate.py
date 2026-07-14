"""Lightweight forward-only migration runner.

Numbered `.sql` files in `migrations/` are applied in filename order; each applied file is recorded in
a `schema_migrations` table so it runs exactly once. `001_baseline.sql` is the whole prior schema
(all `IF NOT EXISTS`), so adopting this on an EXISTING database is a safe no-op that just records the
baseline; a fresh database gets the baseline created. Later changes go in `002_*.sql`, `003_*.sql`, …
and — unlike the old re-applied schema.sql — CAN alter existing columns/constraints, because each runs
once against a known state.

Does not commit — the caller owns the transaction (Postgres DDL is transactional, so a batch is atomic).
"""
from pathlib import Path
import psycopg

MIGRATIONS_DIR = Path(__file__).with_name("migrations")


def apply_migrations(conn: psycopg.Connection, migrations_dir: Path = MIGRATIONS_DIR) -> list[str]:
    """Run pending migrations in order; return the versions applied this call."""
    conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations ("
                 "version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())")
    applied = {r[0] for r in conn.execute("SELECT version FROM schema_migrations").fetchall()}
    ran: list[str] = []
    for f in sorted(migrations_dir.glob("*.sql")):
        if f.name in applied:
            continue
        conn.execute(f.read_text())
        conn.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (f.name,))
        ran.append(f.name)
    return ran


def apply_schema(conn: psycopg.Connection) -> None:
    """Back-compat entry point (cli `migrate`, tests, docker-compose all call this)."""
    apply_migrations(conn)

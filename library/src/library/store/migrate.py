from pathlib import Path
import psycopg

SCHEMA_SQL = Path(__file__).with_name("schema.sql")

def apply_schema(conn: psycopg.Connection) -> None:
    """Apply the DDL. Does not commit — the caller's transaction context owns the commit."""
    conn.execute(SCHEMA_SQL.read_text())

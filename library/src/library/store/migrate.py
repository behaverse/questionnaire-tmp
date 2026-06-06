from pathlib import Path
import psycopg

SCHEMA_SQL = Path(__file__).with_name("schema.sql")

def apply_schema(conn: psycopg.Connection) -> None:
    conn.execute(SCHEMA_SQL.read_text())
    conn.commit()

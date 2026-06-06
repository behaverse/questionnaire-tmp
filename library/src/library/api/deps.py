import psycopg
from ..config import get_settings

def get_conn():
    conn = psycopg.connect(get_settings().database_url)
    try:
        yield conn
    finally:
        conn.close()

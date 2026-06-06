from psycopg_pool import ConnectionPool
from ..config import get_settings

_pool: ConnectionPool | None = None

def get_pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(get_settings().database_url, open=True)
    return _pool

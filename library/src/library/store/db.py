import threading
from psycopg_pool import ConnectionPool
from ..config import get_settings

_pool: ConnectionPool | None = None
_lock = threading.Lock()

def get_pool() -> ConnectionPool:
    # NOTE: get_pool is not yet used; Task 9's API scaffold should initialise the
    # pool once in a FastAPI lifespan handler and store it on app.state instead.
    global _pool
    if _pool is None:
        with _lock:
            if _pool is None:
                _pool = ConnectionPool(get_settings().database_url, open=True)
    return _pool

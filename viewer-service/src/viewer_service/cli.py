import sys
import psycopg
from .config import get_settings
from .store.migrate import apply_schema


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv or argv[0] != "migrate":
        print("usage: viewer-service migrate")
        return 2
    with psycopg.connect(get_settings().database_url) as conn:
        apply_schema(conn)
        conn.commit()
    print("schema applied")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

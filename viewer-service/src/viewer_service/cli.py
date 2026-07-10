import sys
import time

import psycopg

from .config import get_settings
from .store.migrate import apply_schema
from .forwarding import process_outbox_batch
from .sinks import HTTPBehaverseSink


def _build_sink():
    s = get_settings()
    return HTTPBehaverseSink(s.behaverse_base_url, s.behaverse_bearer_token)


def _forward_once() -> dict:
    s = get_settings()
    sink = _build_sink()
    with psycopg.connect(s.database_url) as conn:
        return process_outbox_batch(conn, sink, batch_size=s.forward_batch_size,
                                    max_attempts=s.forward_max_attempts)


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print("usage: viewer-service {migrate | forward-worker [--once|--loop --interval N]}")
        return 2
    cmd = argv[0]
    if cmd == "migrate":
        from .themes import seed_builtin_themes
        with psycopg.connect(get_settings().database_url) as conn:
            apply_schema(conn)
            seed_builtin_themes(conn)
            conn.commit()
        print("schema applied")
        return 0
    if cmd == "forward-worker":
        if "--once" in argv or "--loop" not in argv:
            summary = _forward_once()
            print(summary)
            return 0
        interval = 5
        if "--interval" in argv:
            interval = int(argv[argv.index("--interval") + 1])
        while True:                                  # daemon loop
            print(_forward_once())
            time.sleep(interval)
    if cmd == "reap":
        from . import maintenance
        s = get_settings()
        with psycopg.connect(s.database_url) as conn:
            counts = maintenance.reap(conn, replay_link_ttl_seconds=s.replay_link_ttl_seconds,
                                      ephemeral_ttl_seconds=s.ephemeral_session_ttl_seconds)
            conn.commit()
        print(f"reaped {counts}")
        return 0
    if cmd == "requeue-failed":
        from . import maintenance
        with psycopg.connect(get_settings().database_url) as conn:
            n = maintenance.requeue_failed(conn)
            conn.commit()
        print(f"requeued {n} failed outbox row(s) to pending")
        return 0
    print("usage: viewer-service {migrate | forward-worker [--once|--loop --interval N] "
          "| reap | requeue-failed}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

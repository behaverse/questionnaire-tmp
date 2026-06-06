import argparse, sys
from pathlib import Path
import psycopg
from .config import get_settings
from .store.migrate import apply_schema
from .ingest import ingest_tree
from .validation import build_registry

def main(argv=None) -> int:
    s = get_settings()
    p = argparse.ArgumentParser(prog="library")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("migrate")
    ing = sub.add_parser("ingest")
    ing.add_argument("content_dir", nargs="?", default=str(s.content_dir))
    ing.add_argument("--release", default=None)
    ing.add_argument("--commit", default=None)
    args = p.parse_args(argv)
    with psycopg.connect(s.database_url) as conn:
        if args.cmd == "migrate":
            apply_schema(conn)
            print("schema applied")
        elif args.cmd == "ingest":
            rep = ingest_tree(conn, Path(args.content_dir), args.commit,
                              registry=build_registry(s.schemas_dir), schemas_dir=s.schemas_dir,
                              release=args.release)
            print(f"ingested={rep.ingested} skipped={rep.skipped} errors={len(rep.errors)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())

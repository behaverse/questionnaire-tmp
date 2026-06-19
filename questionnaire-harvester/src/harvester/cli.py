import argparse, sys
from pathlib import Path
from urllib.parse import urlparse
from harvester.sources.base import SourceAdapter
from harvester.sources.psytoolkit import PsyToolkitAdapter, PsyToolkitParseError
from harvester.sources.psychology_tools import PsychologyToolsAdapter, PsychologyToolsParseError
from harvester.dedup import load_scales_index, build_instruction_index
from harvester.draft import draft, write_draft, find_questionnaire_collision
from harvester.validate import validate_tree
from harvester.tracking import upsert_register_row, write_questions


_ADAPTERS = (PsyToolkitAdapter, PsychologyToolsAdapter)


def dispatch_adapter(url: str) -> SourceAdapter:
    """Pick the source adapter for `url` by host (exact or subdomain match on each
    adapter's `.site`). Raises ValueError when no adapter matches."""
    host = (urlparse(url).hostname or "").lower()
    for cls in _ADAPTERS:
        if host == cls.site or host.endswith("." + cls.site):
            return cls()
    raise ValueError(f"no adapter for host {host!r}")


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    ap = argparse.ArgumentParser(prog="harvest")
    sub = ap.add_subparsers(dest="cmd", required=True)
    h = sub.add_parser("harvest")
    h.add_argument("url")
    h.add_argument("--id", dest="qst_id", default=None,
                   help="override the derived qst_id (use to resolve a flagged collision)")
    h.add_argument("--out", default="questionnaire-harvester/output")
    h.add_argument("--scales-index", default="questionnaire-harvester/dedup/scales-index.json")
    h.add_argument("--register", default="questionnaire-harvester/register.md")
    h.add_argument("--questions", default="questionnaire-harvester/questions")
    h.add_argument("--schemas", default="schemas")
    h.add_argument("--version", default="v26.0618")
    a = ap.parse_args(argv)
    if a.cmd != "harvest":
        return 2

    try:
        adapter = dispatch_adapter(a.url)
    except ValueError as e:
        print(f"SKIP {a.url}: {e}")     # no adapter for this host — nothing written
        return 2
    try:
        rq = adapter.parse(adapter.fetch(a.url), a.url)
    except (PsyToolkitParseError, PsychologyToolsParseError) as e:
        print(f"SKIP {a.url}: {e}")     # unsupported page shape — nothing written
        return 2
    if a.qst_id:
        rq.qst_id = a.qst_id            # operator override to resolve a flagged collision
    clash = find_questionnaire_collision(Path(a.out), rq.qst_id, a.url)
    if clash:
        print(f"SKIP {a.url}: id {rq.qst_id} collides with already-harvested {clash} "
              f"— rename one (id-derivation clash); nothing written")
        return 2
    scales_index = load_scales_index(Path(a.scales_index))
    instr_index = build_instruction_index(Path(a.out))
    result = draft(rq, a.version, scales_index, instr_index)
    write_draft(result, Path(a.out))

    errors = validate_tree(Path(a.out), Path(a.schemas), release=a.version)
    if errors:
        print("VALIDATION ERRORS:", *errors, sep="\n  ")
        return 1
    qs = write_questions(Path(a.questions), rq, result, [])
    lic = rq.license.license_class
    upsert_register_row(Path(a.register), rq.qst_id, rq.source_site, "high",
                        "needs-review" if qs else "ready", len(qs), lic)
    print(f"harvested {rq.qst_id}: reused={result.reused} minted={result.minted} open_qs={len(qs)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

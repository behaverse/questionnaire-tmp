import argparse, sys
from pathlib import Path
from harvester.sources.psytoolkit import PsyToolkitAdapter
from harvester.dedup import load_scales_index, build_instruction_index
from harvester.draft import draft, write_draft
from harvester.validate import validate_tree
from harvester.tracking import upsert_register_row, write_questions


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    ap = argparse.ArgumentParser(prog="harvest")
    sub = ap.add_subparsers(dest="cmd", required=True)
    h = sub.add_parser("harvest")
    h.add_argument("url")
    h.add_argument("--out", default="questionnaire-harvester/output")
    h.add_argument("--scales-index", default="questionnaire-harvester/dedup/scales-index.json")
    h.add_argument("--register", default="questionnaire-harvester/register.md")
    h.add_argument("--questions", default="questionnaire-harvester/questions")
    h.add_argument("--schemas", default="schemas")
    h.add_argument("--version", default="v26.0617")
    a = ap.parse_args(argv)
    if a.cmd != "harvest":
        return 2

    rq = PsyToolkitAdapter().parse(PsyToolkitAdapter().fetch(a.url), a.url)
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

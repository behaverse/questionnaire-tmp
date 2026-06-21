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
    h.add_argument("--source-metadata", default="questionnaire-harvester/source_metadata")
    h.add_argument("--descriptions", default="questionnaire-harvester/descriptions")
    h.add_argument("--short-titles", default="questionnaire-harvester/short_titles.json")
    h.add_argument("--schemas", default="schemas")
    h.add_argument("--version", default="v26.0618")
    ds = sub.add_parser("document-scoring")
    ds.add_argument("--out", default="questionnaire-harvester/output")
    ds.add_argument("--scoring", default="questionnaire-harvester/scoring")
    ds.add_argument("--id", dest="qst_id", default=None, help="only this questionnaire id")
    rv = sub.add_parser("review-export")
    rv.add_argument("--out", default="questionnaire-harvester/output")
    rv.add_argument("--review-dir", default="questionnaire-harvester/import_review")
    rv.add_argument("--id", dest="qst_id", default=None, help="only this questionnaire id")
    ad = sub.add_parser("apply-descriptions")
    ad.add_argument("--out", default="questionnaire-harvester/output")
    ad.add_argument("--descriptions", default="questionnaire-harvester/descriptions")
    cd = sub.add_parser("check-descriptions")
    cd.add_argument("--out", default="questionnaire-harvester/output")
    cd.add_argument("--descriptions", default="questionnaire-harvester/descriptions")
    cd.add_argument("--source-metadata", default="questionnaire-harvester/source_metadata")
    ast = sub.add_parser("apply-short-titles")
    ast.add_argument("--out", default="questionnaire-harvester/output")
    ast.add_argument("--short-titles", default="questionnaire-harvester/short_titles.json")
    cst = sub.add_parser("check-short-titles")
    cst.add_argument("--out", default="questionnaire-harvester/output")
    nv = sub.add_parser("normalize-versions")
    nv.add_argument("--out", default="questionnaire-harvester/output")
    nv.add_argument("--release", default="v26.0618")
    a = ap.parse_args(argv)
    if a.cmd == "document-scoring":
        from harvester.scoring_doc import write_scoring_docs
        ids = write_scoring_docs(Path(a.out), Path(a.scoring), only_id=a.qst_id)
        print(f"wrote {len(ids)} scoring doc(s)")
        return 0
    if a.cmd == "review-export":
        from harvester.review_export import write_review_export
        ids = write_review_export(Path(a.out), Path(a.review_dir), only_id=a.qst_id)
        print(f"wrote {len(ids)} review doc(s) + README")
        return 0
    if a.cmd == "apply-descriptions":
        from harvester.descriptions import apply_descriptions_to_output
        ids = apply_descriptions_to_output(Path(a.out), Path(a.descriptions))
        print(f"applied {len(ids)} authored description(s)")
        return 0
    if a.cmd == "check-descriptions":
        from harvester.descriptions import check_descriptions
        flagged = check_descriptions(Path(a.out), Path(a.descriptions), Path(a.source_metadata))
        for f in flagged:
            print(f"FLAG {f['id']}: {'; '.join(f['issues'])}")
        print(f"{len(flagged)} flagged")
        return 1 if flagged else 0
    if a.cmd == "apply-short-titles":
        from harvester.short_titles import apply_short_titles_to_output
        ids = apply_short_titles_to_output(Path(a.out), Path(a.short_titles))
        print(f"applied {len(ids)} short_title override(s)")
        return 0
    if a.cmd == "check-short-titles":
        from harvester.short_titles import check_short_titles
        flagged = check_short_titles(Path(a.out))
        for f in flagged:
            print(f"FLAG {f['id']}: {f['short_title']!r}")
        print(f"{len(flagged)} flagged")
        return 1 if flagged else 0
    if a.cmd == "normalize-versions":
        from harvester.versions import normalize_versions
        ids = normalize_versions(Path(a.out), a.release)
        print(f"normalized {len(ids)} questionnaire(s)")
        return 0
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
    from harvester.descriptions import apply_authored_description
    apply_authored_description(rq, Path(a.descriptions))
    from harvester.short_titles import apply_short_title
    apply_short_title(rq, Path(a.short_titles))
    scales_index = load_scales_index(Path(a.scales_index))
    instr_index = build_instruction_index(Path(a.out))
    result = draft(rq, a.version, scales_index, instr_index)
    write_draft(result, Path(a.out))

    from harvester.source_meta import write_source_metadata
    write_source_metadata(rq, Path(a.source_metadata))

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

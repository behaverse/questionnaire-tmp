from pathlib import Path
from harvester.raw import RawQuestionnaire
from harvester.draft import DraftResult

_HEADER = ("# Harvest Register\n\n"
           "| Questionnaire | Sources | Importance | Status | Open Qs | License |\n"
           "|---|---|---|---|---|---|\n")


def upsert_register_row(register_path: Path, qst_id, sources, importance, status, n_open, license_status) -> None:
    p = Path(register_path)
    lines = p.read_text().splitlines() if p.exists() else _HEADER.splitlines()
    row = f"| {qst_id} | {sources} | {importance} | {status} | {n_open} | {license_status} |"
    out, replaced = [], False
    for ln in lines:
        if ln.startswith(f"| {qst_id} |"):
            out.append(row); replaced = True
        else:
            out.append(ln)
    if not replaced:
        out.append(row)
    p.write_text("\n".join(out) + "\n")


def write_questions(questions_dir: Path, rq: RawQuestionnaire, result: DraftResult, extra: list) -> list:
    qs: list = list(extra)
    if rq.license.license_class == "unknown" or rq.license.author_contact_needed:
        qs.append(f"License for **{rq.title}** is unclear ({rq.source_url}). Confirm class / contact author?")
    if not rq.citation:
        qs.append(f"No citation captured for **{rq.title}** — supply the source publication?")
    for reused in result.reused:
        qs.append(f"Confirm reuse of shared entity `{reused}` for **{rq.title}** (vs. minting a new one)?")
    d = Path(questions_dir); d.mkdir(parents=True, exist_ok=True)
    body = [f"# Open questions — {rq.title} (`{rq.qst_id}`)", "",
            f"Source: {rq.source_url}", "",
            "Answer inline under each item (replace the `> answer:` line).", ""]
    for i, q in enumerate(qs, 1):
        body += [f"### {i}. {q}", "> answer: ", ""]
    (d / f"{rq.qst_id}.md").write_text("\n".join(body) + "\n")
    return qs

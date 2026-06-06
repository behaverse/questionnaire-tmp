import re
from dataclasses import dataclass, field
from pathlib import Path
from .reader import SurveyDB
from . import mappers
from .questionnaire import reconstruct
from .writer import write_entity
from .loss import LossReport

@dataclass
class ImportSummary:
    counts: dict = field(default_factory=dict)
    loss: LossReport = None

def _pin_pending(obj: dict, version: str) -> dict:
    # replace the "@PENDING" placeholder refs emitted by entity mappers with the release version
    return _walk(obj, version)

def _walk(node, version):
    if isinstance(node, dict):
        return {k: (v.replace("@PENDING", "@" + version) if k == "ref" and isinstance(v, str) else _walk(v, version))
                for k, v in node.items()}
    if isinstance(node, list):
        return [_walk(x, version) for x in node]
    return node

def import_survey_db(sqlite_path, out_dir, release: str, imported_at: str) -> ImportSummary:
    db = SurveyDB(Path(sqlite_path))
    out = Path(out_dir)
    loss = LossReport()
    counts = {}

    def emit(entity_type, obj):
        write_entity(out, entity_type, _pin_pending(obj, release))
        counts[entity_type] = counts.get(entity_type, 0) + 1

    for row in db.prompts(): emit("prompt", mappers.map_prompt(row, loss))
    for row in db.contexts():
        result = mappers.map_context(row, loss)
        if result is not None:
            emit("context", result)
    for row in db.instructions():
        result = mappers.map_instruction(row, loss)
        if result is not None:
            emit("instruction", result)
    for row in db.messages():
        result = mappers.map_message(row, loss)
        if result is not None:
            emit("message", result)
    for row in db.placeholders(): emit("placeholder", mappers.map_placeholder(row))
    for row in db.helps(): emit("help", mappers.map_help(row))
    for row in db.regexes(): emit("regex", mappers.map_regex(row))
    for row in db.solutions(): emit("solution", mappers.map_solution(row))
    for option_id, rows in db.options_grouped().items():
        result = mappers.map_option(option_id, rows, loss)
        if result is not None:
            emit("option", result)

    comps = db.compositions()
    surveys = db.surveys()
    qids = sorted({c["questionnaire"] for c in comps if c.get("questionnaire")})
    for qid in qids:
        header = next((c for c in comps if c["questionnaire"] == qid and c["element_type"] == "header"), None)
        hid = (header or {}).get("header_id")
        survey = surveys.get(hid)
        if survey is None:
            loss.add("warning", f"questionnaire.{qid}", f"header_id {hid!r} has no survey metadata")
        q = reconstruct(qid, comps, survey, release, imported_at, loss)
        emit("questionnaire", q)

    used_headers = {(next((c for c in comps if c["questionnaire"] == q and c["element_type"] == "header"), {}) or {}).get("header_id") for q in qids}
    for sid in surveys:
        if sid not in used_headers:
            loss.add("dropped", f"surveys.{sid}", "orphan survey (no questionnaire references it)")
        if surveys[sid].get("scoring_code"):
            loss.add("dropped", f"surveys.{sid}.scoring_code", "scoring URL not convertible to a Scorer (OD-16)")

    for k, v in counts.items():
        loss.preserve(k, v)
    loss.write(out)
    return ImportSummary(counts=counts, loss=loss)

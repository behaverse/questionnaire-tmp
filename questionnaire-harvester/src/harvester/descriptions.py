import json
from pathlib import Path

from library.importers.survey_db.writer import write_entity


def load_authored(descriptions_dir):
    """Return {id: description text} from descriptions/<id>.md (stripped; empties skipped)."""
    out = {}
    d = Path(descriptions_dir)
    if d.is_dir():
        for f in sorted(d.glob("*.md")):
            text = f.read_text().strip()
            if text:
                out[f.stem] = text
    return out


def apply_authored_description(rq, descriptions_dir):
    """If an authored description exists for rq.qst_id, set rq.description to it and
    rq.description_source = 'authored'. Returns True iff applied."""
    text = load_authored(descriptions_dir).get(rq.qst_id)
    if text:
        rq.description = text
        rq.description_source = "authored"
        return True
    return False


def apply_descriptions_to_output(out_dir, descriptions_dir):
    """Bulk in-place patch: for each output/questionnaires/*.json whose id has an authored
    override, set metadata.description + metadata.x_description_source='authored' and rewrite
    via write_entity (identical serialization). Returns the ids patched."""
    authored = load_authored(descriptions_dir)
    qdir = Path(out_dir) / "questionnaires"
    patched = []
    for f in sorted(qdir.glob("*.json")):
        q = json.loads(f.read_text())
        qid = (q.get("metadata") or {}).get("id")
        if qid in authored:
            q["metadata"]["description"] = authored[qid]
            q["metadata"]["x_description_source"] = "authored"
            write_entity(out_dir, "questionnaire", q)
            patched.append(qid)
    return patched

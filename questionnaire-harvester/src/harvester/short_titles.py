import json
import re
from pathlib import Path

from library.importers.survey_db.writer import write_entity

_JUNK_RE = re.compile(
    r",|(?i:\bversion\b|\bform\b|\boriginal\b|^\s*(?:for|the)\b)|^[a-z]|\b(?:19|20)\d{2}\b|\d\.\d"
)


def load_short_titles(path):
    """Return {id: short_title} from the JSON store, dropping blank values and TODO
    placeholders (values starting with 'TODO', case-insensitive)."""
    p = Path(path)
    if not p.exists():
        return {}
    raw = json.loads(p.read_text())
    return {k: v.strip() for k, v in raw.items()
            if isinstance(v, str) and v.strip() and not v.strip().lower().startswith("todo")}


def apply_short_title(rq, store_path):
    """If a (non-TODO) override exists for rq.qst_id, set rq.short_title. Returns True iff applied."""
    st = load_short_titles(store_path).get(rq.qst_id)
    if st:
        rq.short_title = st
        return True
    return False


def apply_short_titles_to_output(out_dir, store_path):
    """Bulk in-place patch: set metadata.short_title from the store for each questionnaire whose
    id has a (non-TODO) override AND whose value differs; rewrite via write_entity (identical
    serialization). Returns the ids patched."""
    overrides = load_short_titles(store_path)
    qdir = Path(out_dir) / "questionnaires"
    patched = []
    for f in sorted(qdir.glob("*.json")):
        q = json.loads(f.read_text())
        m = q.get("metadata") or {}
        qid = m.get("id")
        if qid in overrides and m.get("short_title") != overrides[qid]:
            q["metadata"]["short_title"] = overrides[qid]
            write_entity(out_dir, "questionnaire", q)
            patched.append(qid)
    return patched


def check_short_titles(out_dir):
    """Flag canonical short_titles that look like junk (qualifier fragments / version cruft /
    sentence-like). Returns [{id, short_title}] for flagged ids."""
    qdir = Path(out_dir) / "questionnaires"
    flagged = []
    for f in sorted(qdir.glob("*.json")):
        m = json.loads(f.read_text()).get("metadata") or {}
        st = m.get("short_title") or ""
        if _JUNK_RE.search(st) or len(st.split()) > 2 or len(st) > 24:
            flagged.append({"id": m.get("id"), "short_title": st})
    return flagged

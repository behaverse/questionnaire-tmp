import json
import re
from pathlib import Path

from library.importers.survey_db.writer import write_entity


def _words(text):
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def _strip_title(text, title):
    """Remove the instrument title from text (case-insensitive) so the shared name isn't
    counted as verbatim overlap. Skips very short titles to avoid corrupting prose."""
    if title and len(title) >= 4:
        return re.sub(re.escape(title), " ", text or "", flags=re.I)
    return text or ""


def _ngrams(words, n):
    return [words[i:i + n] for i in range(len(words) - n + 1)] if len(words) >= n else []


def check_descriptions(out_dir, descriptions_dir, source_meta_dir, *, n=8, max_len=400):
    """Flag authored descriptions that (a) share a run of >= n consecutive words with the
    captured source introduction/meta_description (verbatim-overlap → copyright risk), or
    (b) fail shape checks (empty / > max_len / no sentence period / missing acronym).
    Returns [{id, issues:[...]}] for flagged ids only."""
    authored = load_authored(descriptions_dir)
    qdir, smdir = Path(out_dir) / "questionnaires", Path(source_meta_dir)
    flagged = []
    for qid, text in sorted(authored.items()):
        issues = []
        qf = qdir / f"{qid}.json"
        title = short = ""
        if qf.exists():
            md = json.loads(qf.read_text()).get("metadata") or {}
            title, short = md.get("title") or "", md.get("short_title") or ""
        if not text.strip():
            issues.append("empty")
        if len(text) > max_len:
            issues.append(f"too long ({len(text)} > {max_len})")
        if "." not in text:
            issues.append("no sentence period")
        # acronym: the description must contain one of the instrument's ALL-CAPS acronyms
        # (extracted from title/short_title). Skip when none exist — some short_titles are
        # descriptive junk ("revised version") with no acronym to enforce.
        acronyms = re.findall(r"[A-Z][A-Z0-9][A-Z0-9-]*", f"{title} {short}")
        if acronyms and not any(a.lower() in text.lower() for a in acronyms):
            issues.append(f"missing acronym (one of {acronyms})")
        smf = smdir / f"{qid}.json"
        if smf.exists():
            sm = json.loads(smf.read_text())
            src = " ".join(sm.get("introduction") or []) + " " + (sm.get("meta_description") or "")
            # ignore the shared instrument title — it legitimately appears in both the
            # description and the source, and is not copyrightable phrasing.
            src_grams = {tuple(g) for g in _ngrams(_words(_strip_title(src, title)), n)}
            if src_grams and any(tuple(g) in src_grams
                                 for g in _ngrams(_words(_strip_title(text, title)), n)):
                issues.append(f"verbatim overlap (>= {n} words) with source")
        if issues:
            flagged.append({"id": qid, "issues": issues})
    return flagged


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

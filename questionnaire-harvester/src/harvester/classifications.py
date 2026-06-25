import json
import re
from pathlib import Path

from library.importers.survey_db.writer import write_entity
from harvester.naming import derive_short_title

# Preferred (open) vocabularies — documented in schemas/instrument/README.md. The schema does
# NOT enforce these (the lists are intentionally open), so `check_classifications` only WARNS on
# off-vocab values. Keep the harvested corpus aligned to this clean vocabulary; the legacy
# survey_db free-text domains are a separate (messier) namespace not normalised here.
# schema-preferred (schemas/instrument/README.md) — the backbone vocabulary.
SCHEMA_DOMAIN = {
    "anxiety", "cognition", "depression", "executive_function", "implicit_cognition",
    "memory", "mood", "personality", "quality_of_life", "screening",
    "self_efficacy", "social_psychology", "stress", "trauma", "wellbeing",
}
# disciplined snake_case extension for the harvested corpus where no schema-preferred value fits
# (each used by several instruments). Kept here so `check_classifications` does not flag them.
EXTENDED_DOMAIN = {
    "addiction", "adhd", "aggression", "autism", "eating_disorders", "empathy",
    "impulsivity", "loneliness", "psychosis", "relationships", "resilience",
    "self_esteem", "sleep",
}
PREFERRED_DOMAIN = SCHEMA_DOMAIN | EXTENDED_DOMAIN
PREFERRED_POPULATION = {
    "adults", "adolescents", "children", "older_adults", "clinical",
    "primary_care", "community", "pregnant", "perinatal", "veterans",
}

_INSTRUMENT_ID_RE = re.compile(r"^inst_[a-z0-9_]+$")


def derive_instrument_id(short_title, qst_id):
    """Stable `inst_<slug>` family id for a single instrument (singleton family). Slug is the
    cleaned short_title acronym, lowercased with non-alphanumerics dropped (matching the
    survey_db convention: `inst_who5`, `inst_pcl22`); falls back to the qst_id slug."""
    base = derive_short_title(short_title) or ""
    slug = re.sub(r"[^a-z0-9]+", "", base.lower())
    if not slug:
        slug = re.sub(r"[^a-z0-9_]+", "", re.sub(r"^qst_", "", (qst_id or "").lower()))
    return f"inst_{slug}" if slug else None


def _clean_entry(raw):
    """Normalise one store entry to {domain:[...], population:[...], instrument_id:str|None},
    dropping blanks and TODO placeholders. Returns None when the entry carries nothing usable."""
    if not isinstance(raw, dict):
        return None
    def _list(key):
        vals = raw.get(key) or []
        if not isinstance(vals, list):
            return []
        return [v.strip() for v in vals
                if isinstance(v, str) and v.strip() and not v.strip().lower().startswith("todo")]
    iid = raw.get("instrument_id")
    iid = iid.strip() if isinstance(iid, str) and iid.strip() and not iid.strip().lower().startswith("todo") else None
    entry = {"domain": _list("domain"), "population": _list("population"), "instrument_id": iid}
    if not entry["domain"] and not entry["population"] and not entry["instrument_id"]:
        return None
    return entry


def load_classifications(path):
    """Return {id: {domain, population, instrument_id}} from the JSON store, dropping entries
    (and values) that are blank or TODO placeholders."""
    p = Path(path)
    if not p.exists():
        return {}
    raw = json.loads(p.read_text())
    out = {}
    for qid, entry in raw.items():
        cleaned = _clean_entry(entry)
        if cleaned:
            out[qid] = cleaned
    return out


def apply_classification(rq, store_path):
    """Harvest path: if an override exists for rq.qst_id, set rq.domain / rq.population /
    rq.instrument_id from it. Only non-empty fields overwrite. Returns True iff applied."""
    entry = load_classifications(store_path).get(rq.qst_id)
    if not entry:
        return False
    if entry["domain"]:
        rq.domain = entry["domain"]
    if entry["population"]:
        rq.population = entry["population"]
    if entry["instrument_id"]:
        rq.instrument_id = entry["instrument_id"]
    return True


def apply_classifications_to_output(out_dir, store_path):
    """Bulk in-place patch: for each output/questionnaires/*.json whose id has an override, set
    metadata.classification.{domain,population} and metadata.instrument_id (only from non-empty
    override fields), rewrite via write_entity. Returns the ids patched (changed)."""
    overrides = load_classifications(store_path)
    qdir = Path(out_dir) / "questionnaires"
    patched = []
    for f in sorted(qdir.glob("*.json")):
        q = json.loads(f.read_text())
        m = q.get("metadata") or {}
        qid = m.get("id")
        entry = overrides.get(qid)
        if not entry:
            continue
        cls = m.setdefault("classification", {})
        changed = False
        if entry["domain"] and cls.get("domain") != entry["domain"]:
            cls["domain"] = entry["domain"]; changed = True
        if entry["population"] and cls.get("population") != entry["population"]:
            cls["population"] = entry["population"]; changed = True
        if entry["instrument_id"] and m.get("instrument_id") != entry["instrument_id"]:
            m["instrument_id"] = entry["instrument_id"]; changed = True
        if changed:
            write_entity(out_dir, "questionnaire", q)
            patched.append(qid)
    return patched


def check_classifications(out_dir, store_path):
    """Flag classification gaps/issues across output/. Returns [{id, issues:[...]}] for:
      - questionnaires with no domain tag (invisible to the Domain filter);
      - questionnaires with no instrument_id (invisible to the Instrument filter);
      - store values outside the preferred vocabulary (warn — open list);
      - instrument_id not matching ^inst_[a-z0-9_]+$ (would fail schema validation)."""
    overrides = load_classifications(store_path)
    qdir = Path(out_dir) / "questionnaires"
    flagged = []
    for f in sorted(qdir.glob("*.json")):
        m = json.loads(f.read_text()).get("metadata") or {}
        qid = m.get("id")
        cls = m.get("classification") or {}
        issues = []
        if not (cls.get("domain") or []):
            issues.append("no domain")
        if not m.get("instrument_id"):
            issues.append("no instrument_id")
        entry = overrides.get(qid)
        if entry:
            off_d = [v for v in entry["domain"] if v not in PREFERRED_DOMAIN]
            off_p = [v for v in entry["population"] if v not in PREFERRED_POPULATION]
            if off_d:
                issues.append(f"off-vocab domain: {off_d}")
            if off_p:
                issues.append(f"off-vocab population: {off_p}")
            if entry["instrument_id"] and not _INSTRUMENT_ID_RE.match(entry["instrument_id"]):
                issues.append(f"bad instrument_id: {entry['instrument_id']!r}")
        if issues:
            flagged.append({"id": qid, "issues": issues})
    return flagged

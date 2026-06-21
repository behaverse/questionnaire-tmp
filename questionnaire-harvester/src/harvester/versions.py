import json
import re
from pathlib import Path

from library.importers.survey_db.writer import write_entity

_REF_SUFFIX = re.compile(r"@v\d{2}\.\d{4}$")


def _restamp_refs(obj, release):
    """Recursively rewrite any string ending in a @vYY.MMDD ref suffix to @<release>."""
    if isinstance(obj, dict):
        return {k: _restamp_refs(v, release) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_restamp_refs(v, release) for v in obj]
    if isinstance(obj, str) and _REF_SUFFIX.search(obj):
        return _REF_SUFFIX.sub("@" + release, obj)
    return obj


def normalize_versions(out_dir, release):
    """Re-stamp every questionnaire's metadata.version + all @version ref suffixes to
    `release` (entities are versionless and untouched). Idempotent — only rewrites files
    that change. Returns the ids changed."""
    qdir = Path(out_dir) / "questionnaires"
    changed = []
    for f in sorted(qdir.glob("*.json")):
        q = json.loads(f.read_text())
        new = _restamp_refs(q, release)
        new.setdefault("metadata", {})["version"] = release
        if new != q:
            write_entity(out_dir, "questionnaire", new)
            changed.append(new["metadata"]["id"])
    return changed

import json
from pathlib import Path

_NOTICE = ("Verbatim capture from {url}. Copyright of the source site. Internal reference "
           "for authoring original descriptions / an about page — NOT for redistribution.")


def write_source_metadata(rq, source_meta_dir):
    """Write source_metadata/<id>.json from rq.source_meta (verbatim source capture, flagged
    with a copyright _notice). Returns the path, or None when rq has no source_meta."""
    sm = getattr(rq, "source_meta", None)
    if not sm:
        return None
    source_meta_dir = Path(source_meta_dir)
    source_meta_dir.mkdir(parents=True, exist_ok=True)
    doc = {"_notice": _NOTICE.format(url=rq.source_url), "id": rq.qst_id,
           "source_url": rq.source_url, **sm}
    path = source_meta_dir / f"{rq.qst_id}.json"
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
    return path

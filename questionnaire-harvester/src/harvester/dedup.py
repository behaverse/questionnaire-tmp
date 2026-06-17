import json, hashlib
from pathlib import Path

def norm(s) -> str:
    return " ".join(str(s).strip().lower().split())

def option_fingerprint(o: dict) -> str:
    en = (o.get("content", {}).get("en") or {})
    anchors = [norm(a.get("text", "")) for a in (en.get("options") or [])]
    values = [a.get("value") for a in (o.get("options") or [])]
    base = [o.get("input_data_type"), o.get("measurement_type"), o.get("selection")]
    if anchors:
        payload = base + [values, anchors]
    else:
        payload = base + [o.get("dimension"), norm(en.get("units", ""))]
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]

def load_scales_index(path: Path) -> dict[str, list[str]]:
    p = Path(path)
    return json.loads(p.read_text()) if p.exists() else {}

def lookup_option(option: dict, index: dict[str, list[str]]) -> str | None:
    ids = index.get(option_fingerprint(option))
    return sorted(ids)[0] if ids else None

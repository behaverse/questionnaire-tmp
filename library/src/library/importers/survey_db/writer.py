import json
from pathlib import Path
from ...entity_types import DIR_BY_TYPE

def write_entity(out_dir, entity_type: str, obj: dict) -> Path:
    eid = obj["id"] if entity_type != "questionnaire" else obj["metadata"]["id"]
    d = Path(out_dir) / DIR_BY_TYPE[entity_type]
    d.mkdir(parents=True, exist_ok=True)
    p = d / f"{eid}.json"
    p.write_text(json.dumps(obj, indent=2, ensure_ascii=False, sort_keys=True))
    return p

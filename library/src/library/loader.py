import json
from dataclasses import dataclass
from pathlib import Path
from .entity_types import type_for_dir, type_for_id, TYPE_BY_DIR

@dataclass(frozen=True)
class Artifact:
    entity_type: str
    id: str
    version: str
    data: dict
    path: Path

def identify(path: Path, data: dict) -> Artifact:
    dir_type = type_for_dir(path.parent.name)
    id_type = type_for_id(data["id"])
    if dir_type != id_type:
        raise ValueError(f"{path}: dir implies {dir_type} but id implies {id_type}")
    return Artifact(dir_type, data["id"], data["version"], data, path)

def load_tree(root: Path) -> list[Artifact]:
    out: list[Artifact] = []
    for path in sorted(root.rglob("*.json")):
        if path.parent.name not in TYPE_BY_DIR:
            continue
        out.append(identify(path, json.loads(path.read_text())))
    return out

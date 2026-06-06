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

def _id_of(data: dict) -> str:
    # reusable entities carry top-level `id`; questionnaires nest it under `metadata`
    return data.get("id") or data["metadata"]["id"]

def _version_of(data: dict, release: str | None) -> str:
    explicit = data.get("version") or data.get("metadata", {}).get("version")
    if explicit:
        return explicit
    if release:
        return release
    raise ValueError("artifact has no explicit version and no release was provided")

def identify(path: Path, data: dict, release: str | None = None) -> Artifact:
    dir_type = type_for_dir(path.parent.name)
    entity_id = _id_of(data)
    id_type = type_for_id(entity_id)
    if dir_type != id_type:
        raise ValueError(f"{path}: dir implies {dir_type} but id implies {id_type}")
    return Artifact(dir_type, entity_id, _version_of(data, release), data, path)

def load_tree(root: Path, release: str | None = None) -> list[Artifact]:
    out: list[Artifact] = []
    for path in sorted(root.rglob("*.json")):
        if path.parent.name not in TYPE_BY_DIR:
            continue
        out.append(identify(path, json.loads(path.read_text()), release))
    return out

from dataclasses import dataclass

@dataclass(frozen=True)
class Ref:
    to_id: str
    to_version: str
    ref_kind: str

def parse_ref(s: str) -> tuple[str, str]:
    entity_id, _, version = s.partition("@")
    if not version:
        raise ValueError(f"unpinned ref: {s}")
    return entity_id, version

def extract_refs(data) -> list[Ref]:
    out: list[Ref] = []
    def walk(node, parent_key):
        if isinstance(node, dict):
            if "ref" in node and isinstance(node["ref"], str) and "@" in node["ref"]:
                tid, ver = parse_ref(node["ref"])
                out.append(Ref(tid, ver, parent_key or "ref"))
            for k, v in node.items():
                if k != "ref":
                    walk(v, k)
        elif isinstance(node, list):
            for item in node:
                walk(item, parent_key)
    walk(data, None)
    return out

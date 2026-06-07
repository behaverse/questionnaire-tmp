import psycopg
from ..refs import parse_ref


def _entity_content(conn: psycopg.Connection, ref_str: str) -> dict | None:
    """Stored content_json of the entity a hard-pinned ref points at, or None if the
    ref is unparseable / the entity is missing / the entity is withdrawn (content NULL)."""
    try:
        eid, ver = parse_ref(ref_str)
    except ValueError:
        return None
    row = conn.execute(
        "SELECT content_json FROM entity WHERE id=%s AND version=%s", (eid, ver)
    ).fetchone()
    if row is None or row[0] is None:
        return None
    return row[0]


def resolve_definition(conn: psycopg.Connection, definition: dict) -> dict:
    """Return a deep copy of a Schema-2 definition where every {"ref": "id@ver"} object
    is augmented in place with the referenced entity's stored fields (its `content` map,
    structural fields, etc.) so a viewer has the text locally. The original `ref` string
    is preserved; existing sibling keys win over merged-in ones (setdefault). Refs that do
    not resolve get `_unresolved: True`. Resolution recurses into merged content, so a
    saved Item ref's nested Prompt/Option refs resolve too. References are hard-pinned and
    acyclic (CalVer), so this terminates."""
    def walk(node):
        if isinstance(node, dict):
            merged = dict(node)
            ref = node.get("ref")
            if isinstance(ref, str) and "@" in ref:
                content = _entity_content(conn, ref)
                if content is None:
                    merged["_unresolved"] = True
                else:
                    for k, v in content.items():
                        merged.setdefault(k, v)
            return {k: walk(v) for k, v in merged.items()}
        if isinstance(node, list):
            return [walk(x) for x in node]
        return node
    return walk(definition)

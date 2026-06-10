import psycopg
from ..refs import parse_ref, extract_refs


def _entity_content(conn: psycopg.Connection, ref_str: str) -> dict | None:
    """Stored content_json of the entity a hard-pinned ref points at, or None if the
    ref is unparseable / the entity is missing / the entity is withdrawn (content NULL)."""
    try:
        eid, ver = parse_ref(ref_str)
    except ValueError:
        return None
    # one point-read per ref; fine for current questionnaire sizes — batch with WHERE (id,version) IN (...) if profiling shows a problem
    row = conn.execute(
        "SELECT content_json FROM entity WHERE id=%s AND version=%s", (eid, ver)
    ).fetchone()
    if row is None or row[0] is None:
        return None
    return row[0]


def _scorer_refs(node) -> list[str]:
    """Collect every scores[].scorer "id@version" string (bare strings, not {ref} objects)."""
    out: list[str] = []

    def walk(n):
        if isinstance(n, dict):
            scorer = n.get("scorer")
            if isinstance(scorer, str) and "@" in scorer:
                out.append(scorer)
            for v in n.values():
                walk(v)
        elif isinstance(n, list):
            for x in n:
                walk(x)

    walk(node)
    return out


def build_resolution_bundle(conn, definition: dict) -> dict:
    """Return {"definition": <un-resolved Schema 2>, "entities": {"id@ver": <raw body>}}.
    Transitively collects every {ref} target AND every scores[].scorer target. Withdrawn /
    missing entities are omitted (the consumer's resolve_entity returns None for them).
    Hard-pinned CalVer refs are acyclic, so the fixed-point loop terminates."""
    entities: dict = {}
    seen: set[str] = set()
    frontier: set[str] = set()
    for r in extract_refs(definition):
        frontier.add(f"{r.to_id}@{r.to_version}")
    frontier.update(_scorer_refs(definition))
    while frontier:
        ref = frontier.pop()
        if ref in seen:
            continue
        seen.add(ref)
        body = _entity_content(conn, ref)
        if body is None:
            continue
        entities[ref] = body
        for r in extract_refs(body):
            frontier.add(f"{r.to_id}@{r.to_version}")
        frontier.update(_scorer_refs(body))
    return {"definition": definition, "entities": entities}


def resolve_definition(conn: psycopg.Connection, definition: dict) -> dict:
    """Return a deep copy of a Schema-2 definition where every {"ref": "id@ver"} object
    is augmented in place with the referenced entity's stored fields (its `content` map,
    structural fields, etc.) so a viewer has the text locally. The original `ref` string
    is preserved; existing sibling keys win over merged-in ones (setdefault). Refs that do
    not resolve get `_unresolved: True`. Resolution recurses into merged content, so a
    saved Item ref's nested Prompt/Option refs resolve too. References are hard-pinned and
    acyclic (CalVer), so this terminates."""
    # no cycle guard: hard-pinned CalVer refs are acyclic (an entity can only reference
    # equal/earlier-dated entities, enforced at ingest)
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

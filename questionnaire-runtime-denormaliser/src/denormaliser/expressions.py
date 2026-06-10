import re

_SCORE_CALL = re.compile(r"""score\s*\(\s*['"]([a-z][a-z0-9_]*)['"]\s*\)""")


def extract_score_refs(expr: str | None, declared_ids: set[str]) -> set[str]:
    """Conservative STATIC analysis (never evaluation) of an expression string.

    Returns the subset of declared_ids referenced by `expr`, via either an
    explicit score("id") call or a bare whole-word mention of a declared id.
    Conservative per OD-18e: any mention counts. Intersected with declared_ids
    so only real, declared scores are ever returned.
    """
    if not expr:
        return set()
    found: set[str] = set(_SCORE_CALL.findall(expr))
    for sid in declared_ids:
        if re.search(rf"(?<![A-Za-z0-9_]){re.escape(sid)}(?![A-Za-z0-9_])", expr):
            found.add(sid)
    return found & declared_ids

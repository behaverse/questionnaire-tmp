from .context import Ctx
from .errors import Problem


def resolve_refs(node, ctx: Ctx):
    """Pass 1: recursively inline every {"ref": "<id>@<version>"} object with the
    referenced entity body. Sibling keys on the ref node win over the entity body;
    the 'ref' key is dropped after resolution. Recurses into resolved content so
    nested refs resolve transitively. Unresolved refs are recorded as problems and
    the node is left intact so later passes can continue (collect-all)."""
    if isinstance(node, dict):
        ref = node.get("ref")
        if isinstance(ref, str) and "@" in ref:
            body = ctx.resolve_entity(ref)
            if body is None:
                ctx.problems.append(
                    Problem(kind="unresolved_ref", detail=f"cannot resolve {ref}", where=ref)
                )
                return {k: resolve_refs(v, ctx) for k, v in node.items()}
            merged = dict(body)
            for k, v in node.items():
                if k != "ref":
                    merged[k] = v
            return {k: resolve_refs(v, ctx) for k, v in merged.items()}
        return {k: resolve_refs(v, ctx) for k, v in node.items()}
    if isinstance(node, list):
        return [resolve_refs(x, ctx) for x in node]
    return node

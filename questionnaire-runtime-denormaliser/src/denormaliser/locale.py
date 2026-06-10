import re

from .context import Ctx
from .errors import Problem

_LANG = re.compile(r"^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$")
_MAP_KEYS = {"content", "translations"}


def _is_language_map(value) -> bool:
    return (
        isinstance(value, dict)
        and len(value) > 0
        and all(isinstance(k, str) and _LANG.match(k) for k in value)
    )


def apply_locale(node, ctx: Ctx, where: str = "<root>"):
    """Pass 2: keep only ctx.locale in every content/translations language-map
    (or keep all if pre_fetch_all_locales). Records a missing_locale problem for
    any required map lacking ctx.locale. Accumulates ctx.available_locales."""
    if isinstance(node, dict):
        out = {}
        node_id = node.get("id", where)
        for key, value in node.items():
            if key in _MAP_KEYS and _is_language_map(value):
                ctx.available_locales.update(value.keys())
                if ctx.runtime_policy.pre_fetch_all_locales:
                    out[key] = {lang: apply_locale(v, ctx, node_id) for lang, v in value.items()}
                elif ctx.locale in value:
                    out[key] = {ctx.locale: apply_locale(value[ctx.locale], ctx, node_id)}
                else:
                    ctx.problems.append(
                        Problem(
                            kind="missing_locale",
                            detail=f"'{node_id}' {key} has no locale '{ctx.locale}' (has: {sorted(value)})",
                            where=str(node_id),
                        )
                    )
                    out[key] = value
            else:
                out[key] = apply_locale(value, ctx, node_id)
        return out
    if isinstance(node, list):
        return [apply_locale(x, ctx, where) for x in node]
    return node

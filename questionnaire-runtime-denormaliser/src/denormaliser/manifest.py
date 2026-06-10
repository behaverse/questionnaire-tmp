from .context import Ctx
from .errors import Problem


def _iter_options(node):
    """Yield every dict that looks like an inlined Option (has input_data_type)."""
    if isinstance(node, dict):
        if "input_data_type" in node and "measurement_type" in node:
            yield node
        for v in node.values():
            yield from _iter_options(v)
    elif isinstance(node, list):
        for x in node:
            yield from _iter_options(x)


def _widget_triple(option: dict) -> str:
    return ".".join(
        [
            str(option.get("input_data_type")),
            str(option.get("measurement_type")),
            str(option.get("selection", "single")),
        ]
    )


def reconcile_manifest(doc: dict, ctx: Ctx) -> None:
    """Pass 3: enforce viewer support. Unsupported widget triples and logic-action
    types are pre-flight errors (silently dropping a question or branch would change
    the instrument). Checks are skipped when the manifest omits the relevant key."""
    widgets = ctx.viewer_manifest.get("widgets")
    if widgets is not None:
        allowed = set(widgets)
        for option in _iter_options(doc):
            triple = _widget_triple(option)
            if triple not in allowed:
                ctx.problems.append(
                    Problem(
                        kind="unsupported_widget",
                        detail=f"widget '{triple}' not in viewer manifest",
                        where=triple,
                    )
                )

    logic_actions = ctx.viewer_manifest.get("logic_actions")
    if logic_actions is not None:
        allowed_actions = set(logic_actions)
        for rule in doc.get("logic", []):
            rtype = rule.get("type")
            if rtype not in allowed_actions:
                ctx.problems.append(
                    Problem(
                        kind="unsupported_logic_action",
                        detail=f"logic action '{rtype}' not in viewer manifest",
                        where=str(rule.get("id", rtype)),
                    )
                )

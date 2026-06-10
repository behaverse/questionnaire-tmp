from .context import Ctx
from .errors import Problem


def pin_scorers(doc: dict, ctx: Ctx) -> None:
    """Pass 4: for each scores[] entry, choose the implementation kind = first in
    runtime_policy.scorer_impl_preference present in BOTH the Scorer's impl kinds
    AND viewer_manifest.scorer_impl_kinds; embed it as entry['impl']. Empty
    intersection (or unresolvable scorer) -> no_scorer_impl problem (OD-18d)."""
    viewer_kinds = set(ctx.viewer_manifest.get("scorer_impl_kinds", []))
    for entry in doc.get("scores", []):
        scorer_ref = entry.get("scorer")
        scorer = ctx.resolve_entity(scorer_ref) if scorer_ref else None
        if scorer is None:
            ctx.problems.append(
                Problem(kind="no_scorer_impl", detail=f"cannot resolve scorer {scorer_ref}",
                        where=str(entry.get("id", scorer_ref)))
            )
            continue
        impls = {impl["kind"]: impl for impl in scorer.get("implementations", [])}
        chosen_kind = next(
            (k for k in ctx.runtime_policy.scorer_impl_preference if k in impls and k in viewer_kinds),
            None,
        )
        if chosen_kind is None:
            ctx.problems.append(
                Problem(
                    kind="no_scorer_impl",
                    detail=(
                        f"no impl kind in (preference={ctx.runtime_policy.scorer_impl_preference} "
                        f"∩ scorer={sorted(impls)} ∩ viewer={sorted(viewer_kinds)})"
                    ),
                    where=str(entry.get("id", scorer_ref)),
                )
            )
            continue
        entry["impl"] = dict(impls[chosen_kind])

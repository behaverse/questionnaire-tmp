from .context import Ctx
from .hashing import canonical_hash

# Schema-3-allowed top-level keys carried through verbatim from the working doc.
_CARRY_KEYS = ("style", "flow", "pages", "blocks", "scores", "logic", "validation", "extensions")


def assemble_runtime(work: dict, ctx: Ctx, *, generated_at: str, denormaliser_version: str) -> dict:
    """Pass 6: build the final Schema 3 runtime dict from the transformed working
    doc + the context. Picks only Schema-3-allowed keys; attaches provenance."""
    metadata = dict(work.get("metadata", {}))
    version = metadata.get("version")
    if not version:
        raise ValueError("questionnaire metadata is missing 'version' (required for provenance)")
    metadata["language"] = ctx.locale

    provenance = {
        "source_questionnaire_id": metadata["id"],
        "source_questionnaire_version": version,
        "locale": ctx.locale,
        "viewer_conformance_hash": canonical_hash(ctx.viewer_manifest),
        "deployment_runtime_policy_hash": canonical_hash(ctx.runtime_policy.to_canonical_dict()),
        "generated_at": generated_at,
        "denormaliser_version": denormaliser_version,
        "show_score": ctx.runtime_policy.show_score,
        "show_score_live": ctx.runtime_policy.show_score_live,
        "lock_show_score_timing": ctx.runtime_policy.lock_show_score_timing,
    }
    if ctx.stripped_scorer_refs:
        provenance["stripped_scorer_refs"] = sorted(set(ctx.stripped_scorer_refs))
    if ctx.stripped_logic_rule_ids:
        provenance["stripped_logic_rule_ids"] = list(ctx.stripped_logic_rule_ids)

    runtime = {
        "provenance": provenance,
        "metadata": metadata,
        "locale": ctx.locale,
        "available_locales": sorted(ctx.available_locales),
        "lock_show_score_timing": ctx.runtime_policy.lock_show_score_timing,
    }
    for key in _CARRY_KEYS:
        if key in work:
            runtime[key] = work[key]
    return runtime

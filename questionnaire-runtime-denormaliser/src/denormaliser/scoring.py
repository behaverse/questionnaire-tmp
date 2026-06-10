from .context import Ctx
from .expressions import extract_score_refs


def _action_strings(action) -> str:
    if not isinstance(action, dict):
        return ""
    return " ".join(str(v) for v in action.values() if isinstance(v, str))


def _rule_score_refs(rule: dict, declared_ids: set[str]) -> set[str]:
    refs = extract_score_refs(rule.get("condition"), declared_ids)
    refs |= extract_score_refs(_action_strings(rule.get("action")), declared_ids)
    return refs


def strip_scores(doc: dict, ctx: Ctx) -> None:
    """Pass 5: apply OD-18e scoring stripping. branching_required = every declared
    score id mentioned by any LogicRule condition/action. disable_in_session_scoring
    strips all scores + every score-dependent rule; show_score=false strips
    display-only scores; show_score=true keeps everything. Records stripped refs/ids."""
    scores = doc.get("scores")
    if not scores:
        return
    declared_ids = {s["id"] for s in scores}
    rules = doc.get("logic", []) or []

    branching_required: set[str] = set()
    for rule in rules:
        branching_required |= _rule_score_refs(rule, declared_ids)

    policy = ctx.runtime_policy

    if policy.disable_in_session_scoring:
        ctx.stripped_scorer_refs.extend(s["scorer"] for s in scores)
        doc["scores"] = []
        kept_rules = []
        for rule in rules:
            if _rule_score_refs(rule, declared_ids):
                if "id" in rule:
                    ctx.stripped_logic_rule_ids.append(rule["id"])
            else:
                kept_rules.append(rule)
        if "logic" in doc:
            doc["logic"] = kept_rules
        return

    if not policy.show_score:
        kept, stripped = [], []
        for s in scores:
            (kept if s["id"] in branching_required else stripped).append(s)
        doc["scores"] = kept
        ctx.stripped_scorer_refs.extend(s["scorer"] for s in stripped)
    # show_score True -> keep all scores untouched.

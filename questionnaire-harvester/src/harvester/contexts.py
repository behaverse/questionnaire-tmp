"""Split a leading temporal frame out of an instruction into a Context.

"Over the last 2 weeks, how often have you been bothered ...?" mixes a temporal *context*
with the *instruction* proper. The OD-15 entity model keeps these as separate entities
(Question = Prompt + optional Context + Instruction).

Faithfulness policy (owner, 2026-06-18): a base import keeps the source text exactly as
written. The Context is therefore minted verbatim from the source phrase — we do NOT
normalise "2" to "two" or "last" to "past" to reuse a near-but-not-identical Library
Context. Near-duplicates are acceptable; variant-consistency rules are defined later.
(Case/whitespace are treated as cosmetic by the dedup engine, so genuinely identical
phrases still share one minted entity.)
"""
import re

# Leading temporal frame, e.g. "Over the last 2 weeks," / "During the past two months,".
_TEMPORAL_RE = re.compile(
    r"^\s*((?:over|during|in|for|within)\s+the\s+(?:last|past|previous)\s+"
    r"(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|few|several)\s+"
    r"(?:day|week|month|year)s?)\s*,\s*",
    re.IGNORECASE,
)


def split_temporal_context(instruction_text: str):
    """Return ``(context_text | None, instruction_text)``.

    If a leading temporal frame is present, peel it off as the context (keeping a
    trailing comma) and capitalise the remaining instruction. Otherwise the context is
    None and the instruction is returned unchanged.
    """
    m = _TEMPORAL_RE.match(instruction_text)
    if not m:
        return None, instruction_text
    context_text = m.group(1).strip() + ","
    remainder = instruction_text[m.end():].strip()
    if remainder:
        remainder = remainder[0].upper() + remainder[1:]
    return context_text, remainder

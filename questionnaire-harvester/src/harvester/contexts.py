"""Split a leading temporal frame out of an instruction into a Context, and reuse a
known Library Context when the phrase matches one we already have.

Rationale: "Over the last 2 weeks, how often have you been bothered ...?" mixes a
temporal *context* with the *instruction* proper. The OD-15 entity model keeps these as
separate entities (Question = Prompt + optional Context + Instruction). The temporal
frame recurs across instruments (PHQ-9, GAD-7, ...) so it should be a single shared
Context, not minted per questionnaire.

Context dedup is not yet in the fingerprint engine (that generalisation is a follow-up);
for now a small curated KNOWN_CONTEXTS map points recognised temporal phrases at the
Context already published in the Library.
"""
import re

# Leading temporal frame, e.g. "Over the last 2 weeks," / "During the past two months,".
_TEMPORAL_RE = re.compile(
    r"^\s*((?:over|during|in|for|within)\s+the\s+(?:last|past|previous)\s+"
    r"(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|few|several)\s+"
    r"(?:day|week|month|year)s?)\s*,\s*",
    re.IGNORECASE,
)

_NUM_WORDS = {"1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
              "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten"}

# Normalised temporal phrase -> (context_id, version) for Contexts already in the Library.
# The normaliser folds last/past/previous -> "past" and digits -> words, so both
# "Over the last 2 weeks," (source) and "Over the last two weeks," (Library) map here.
KNOWN_CONTEXTS = {
    "over the past two weeks": ("ctx_past_2_weeks", "v26.0606"),
}


def _norm_temporal(phrase: str) -> str:
    s = " ".join(phrase.strip().lower().rstrip(",").split())
    toks = [_NUM_WORDS.get(t, t) for t in s.split()]
    toks = ["past" if t in ("last", "previous", "past") else t for t in toks]
    return " ".join(toks)


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


def resolve_known_context(context_text: str):
    """Return ``(context_id, version)`` if this temporal phrase matches a known Library
    Context, else ``None``."""
    return KNOWN_CONTEXTS.get(_norm_temporal(context_text))

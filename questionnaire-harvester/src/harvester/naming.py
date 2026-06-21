import re


def _acronymish(tok):
    """A token that looks like an acronym: 2-14 chars, no spaces, >= 2 uppercase letters
    (catches stylized ones like BITe, Grit-S, OCI-R, WHO-5, PCL-22)."""
    tok = tok.strip(" .,;:")
    return 2 <= len(tok) <= 14 and " " not in tok and sum(c.isupper() for c in tok) >= 2


def derive_short_title(title):
    """Best clean acronym / short name for a questionnaire title:
    1) an acronym in a parenthetical (right-most first — the real short form usually trails);
    2) else an acronym-style token elsewhere (skipping Titlecase words like 'Well-Being');
    3) else the title minus a trailing descriptive parenthetical; 4) else the title."""
    title = title or ""
    for paren in reversed(re.findall(r"\(([^)]+)\)", title)):
        for tok in re.split(r"[,\s]+", paren.strip()):
            if _acronymish(tok):
                return tok
    for tok in re.split(r"\s+", re.sub(r"[()]", " ", title)):
        if _acronymish(tok) and not tok.istitle():
            return tok
    name = re.sub(r"\s*\([^)]*\)\s*$", "", title).strip()
    return name or title

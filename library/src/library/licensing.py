# Least -> most restrictive (per design/11_content_licensing.md). Retained as the
# canonical ordering the Library uses when surfacing the strictest component in a
# mixed composite (a fast-follow); effective_license() below only needs homogeneity.
STRICTNESS = [
    "public_domain", "cc0", "cc_by", "cc_by_sa", "cc_by_nc",
    "proprietary_open_redistribution", "proprietary_restricted", "unknown",
]

def effective_license(licenses: list[str]) -> str:
    tags = [t for t in licenses if t]
    if not tags:
        return "unknown"
    if len(set(tags)) == 1:
        return tags[0]
    return "mixed_see_components"

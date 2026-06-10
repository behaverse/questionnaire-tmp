def resolve_locale(requested: str | None, *, available: list[str], default: str) -> str:
    """VS-A locale resolution: the requested locale if it is in the deployment's
    available_locales, otherwise the deployment default. Whether the chosen locale
    actually exists in the questionnaire is enforced downstream by the denormaliser's
    strict missing-locale check (surfaced as a 422 pre-flight error)."""
    if requested is not None and requested in available:
        return requested
    return default

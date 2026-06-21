ROLES = frozenset({"researcher", "participant", "reviewer", "contributor", "administrator"})


def is_valid(role: str) -> bool:
    return role in ROLES

from collections.abc import Callable
from dataclasses import dataclass, field

from .errors import Problem
from .policy import RuntimePolicy


@dataclass
class Ctx:
    """Mutable context threaded through every pass."""

    locale: str
    runtime_policy: RuntimePolicy
    viewer_manifest: dict
    resolve_entity: Callable[[str], dict | None]
    problems: list[Problem] = field(default_factory=list)
    stripped_scorer_refs: list[str] = field(default_factory=list)
    stripped_logic_rule_ids: list[str] = field(default_factory=list)
    available_locales: set[str] = field(default_factory=set)

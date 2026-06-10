from dataclasses import dataclass


@dataclass
class Problem:
    """A single pre-flight problem. kind is one of:
    'unresolved_ref' | 'missing_locale' | 'no_scorer_impl'
    | 'unsupported_widget' | 'unsupported_logic_action'.
    """

    kind: str
    detail: str
    where: str


class PreflightError(Exception):
    """Raised when one or more hard pre-flight problems make the
    (questionnaire x viewer x policy) combination invalid. Carries every
    problem found in a single denormalise() run (collect-all, not fail-fast)."""

    def __init__(self, problems: list[Problem]):
        self.problems = problems
        lines = [f"  [{p.kind}] {p.where}: {p.detail}" for p in problems]
        super().__init__("pre-flight failed:\n" + "\n".join(lines))

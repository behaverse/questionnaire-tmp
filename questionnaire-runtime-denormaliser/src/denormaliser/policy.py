from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimePolicy:
    """The OD-18f runtime_policy sub-object: only the fields the denormaliser
    consults. Hashed (via to_canonical_dict) into the runtime cache key."""

    scorer_impl_preference: list[str]
    show_score: bool = False
    lock_show_score_timing: bool = False
    show_score_live: bool = False
    pre_fetch_all_locales: bool = False
    disable_in_session_scoring: bool = False

    def to_canonical_dict(self) -> dict:
        return {
            "scorer_impl_preference": list(self.scorer_impl_preference),
            "show_score": self.show_score,
            "lock_show_score_timing": self.lock_show_score_timing,
            "show_score_live": self.show_score_live,
            "pre_fetch_all_locales": self.pre_fetch_all_locales,
            "disable_in_session_scoring": self.disable_in_session_scoring,
        }

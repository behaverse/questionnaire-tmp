import copy
from collections.abc import Callable
from pathlib import Path

from .context import Ctx
from .errors import PreflightError
from .locale import apply_locale
from .manifest import reconcile_manifest
from .policy import RuntimePolicy
from .provenance import assemble_runtime
from .resolve import resolve_refs
from .scorers import pin_scorers
from .scoring import strip_scores
from .validation import validate_input, validate_output


def denormalise(
    questionnaire: dict,
    *,
    locale: str,
    runtime_policy: RuntimePolicy,
    viewer_manifest: dict,
    resolve_entity: Callable[[str], dict | None],
    generated_at: str,
    denormaliser_version: str = "v26.0610",
    schemas_dir: Path | None = None,
) -> dict:
    """Turn a Schema 2 questionnaire into a Schema 3 runtime. Pure + I/O-free:
    entity resolution is the injected resolve_entity callable. Raises PreflightError
    (carrying every collected problem) when the questionnaire x viewer x policy
    combination is invalid."""
    if schemas_dir is not None:
        validate_input(questionnaire, schemas_dir)

    ctx = Ctx(
        locale=locale,
        runtime_policy=runtime_policy,
        viewer_manifest=viewer_manifest,
        resolve_entity=resolve_entity,
    )

    work = copy.deepcopy(questionnaire)
    work = resolve_refs(work, ctx)          # pass 1
    work = apply_locale(work, ctx)          # pass 2
    reconcile_manifest(work, ctx)           # pass 3 (read-only, records problems)
    pin_scorers(work, ctx)                  # pass 4

    if ctx.problems:
        raise PreflightError(ctx.problems)

    strip_scores(work, ctx)                 # pass 5
    runtime = assemble_runtime(             # pass 6
        work, ctx, generated_at=generated_at, denormaliser_version=denormaliser_version
    )

    if schemas_dir is not None:
        validate_output(runtime, schemas_dir)
    return runtime

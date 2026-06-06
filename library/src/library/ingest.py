from dataclasses import dataclass, field
from pathlib import Path
import psycopg
from .loader import load_tree
from .refs import extract_refs
from .validation import validate_artifact
from .licensing import effective_license
from .store.entities import upsert_entity, get_entity
from .store.index import rebuild_index_for

class UnresolvedRefError(Exception):
    pass

@dataclass
class IngestReport:
    ingested: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)
    source_commit: str = ""

def _license_for(conn, art) -> str:
    own = art.data.get("license") or (art.data.get("metadata", {}) or {}).get("license")
    if art.entity_type != "questionnaire":
        return own or "unknown"
    component_licenses = [own]
    for ref in extract_refs(art.data):
        row = get_entity(conn, ref.to_id, ref.to_version)
        if row and row.get("license"):
            component_licenses.append(row["license"])
    return effective_license(component_licenses)

def ingest_tree(conn: psycopg.Connection, root: Path, source_commit: str | None, *,
                registry, schemas_dir: Path, release: str | None = None,
                validate: bool = True) -> IngestReport:
    """Ingest a content tree. Fail-fast: raises SchemaInvalidError / UnresolvedRefError /
    ImmutabilityError on the first problem (IngestReport.errors stays empty; the caller's
    transaction rolls back). Does not commit — the caller owns the transaction."""
    arts = load_tree(root, release=release)
    report = IngestReport(source_commit=source_commit or "")
    present = {(a.id, a.version) for a in arts}

    if validate:
        for art in arts:
            validate_artifact(art, registry, schemas_dir)

    # every hard-pinned ref must resolve within this batch or in already-stored entities
    for art in arts:
        for ref in extract_refs(art.data):
            if (ref.to_id, ref.to_version) not in present and get_entity(conn, ref.to_id, ref.to_version) is None:
                raise UnresolvedRefError(f"{art.id}@{art.version} -> {ref.to_id}@{ref.to_version}")

    # upsert non-questionnaires first so questionnaire license composition can read them
    arts_sorted = sorted(arts, key=lambda a: a.entity_type == "questionnaire")
    for art in arts_sorted:
        if not upsert_entity(conn, art, source_commit):
            report.skipped += 1
            continue
        rebuild_index_for(conn, art, effective_license=_license_for(conn, art))
        report.ingested += 1
    return report

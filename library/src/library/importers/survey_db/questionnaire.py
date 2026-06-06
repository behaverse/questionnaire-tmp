import re
from .ids import canonical_id
from .mappers import _split
from .provenance import build_provenance

def _ref(entity_type, legacy_id, version):
    return {"ref": canonical_id(entity_type, legacy_id) + "@" + version}

def _extract_year(s: str) -> int | None:
    """Extract a 4-digit publication year (1800-2099) from a reference string."""
    if not s:
        return None
    years = re.findall(r'\b(1[89]\d\d|20[012]\d)\b', s)
    return int(years[0]) if years else None

_CALVER_PATTERN = re.compile(r'^v\d{2}\.\d{4}(\.dev\d+)?$')

_ALLOWED_LICENSES = {
    "public_domain", "cc0", "cc_by", "cc_by_nc", "cc_by_sa",
    "proprietary_open_redistribution", "proprietary_restricted",
    "unknown", "mixed_see_components",
}

_LICENSE_MAP = {
    "public domain": "public_domain",
    "cc0": "cc0",
    "cc by": "cc_by",
    "cc-by": "cc_by",
    "cc_by": "cc_by",
    "free to use": "unknown",
}

def _normalize_license(raw: str | None, loss, source: str) -> str:
    """Normalize a legacy license string to the allowed enum."""
    if not raw or not raw.strip():
        return "unknown"
    lower = raw.strip().lower()
    if lower in _ALLOWED_LICENSES:
        return lower
    mapped = _LICENSE_MAP.get(lower)
    if mapped:
        if loss:
            loss.add("approximated", source, f"license {raw!r} -> {mapped!r}")
        return mapped
    # Heuristics for common patterns — MIT first (its text contains "Copyright")
    if "mit" in lower:
        if loss:
            loss.add("warning", source, f"license {raw!r} appears MIT — mapped to 'unknown' pending curator review")
        return "unknown"
    if "copyright" in lower or "©" in lower or "all rights" in lower:
        if loss:
            loss.add("approximated", source, f"license {raw!r} -> 'proprietary_restricted' (copyright text)")
        return "proprietary_restricted"
    # Unknown / freeform text
    if loss:
        loss.add("approximated", source, f"license {raw!r} -> 'unknown' (unrecognized)")
    return "unknown"

def _coerce_version(v: str | None, release: str, loss, qid: str) -> str:
    """Return v if it matches CalVer pattern, otherwise fall back to release and warn."""
    if v and _CALVER_PATTERN.match(v):
        return v
    if v:
        # legacy version like v2021.03 has wrong format; use release
        if loss:
            loss.add("approximated", f"questionnaires.{qid}.version",
                     f"legacy version {v!r} doesn't match CalVer pattern — using release {release!r}")
    return release

def reconstruct(qid: str, comp_rows: list[dict], survey_row: dict, release: str,
                imported_at: str, loss=None) -> dict:
    rows = [c for c in comp_rows if c["questionnaire"] == qid]
    header = next((c for c in rows if c["element_type"] == "header"), None)
    raw_version = next((c.get("version") for c in rows if c.get("version")), None)
    version = _coerce_version(raw_version, release, loss, qid)
    s = survey_row or {}
    meta = {"id": canonical_id("questionnaire", qid), "version": version,
            "title": s.get("title") or qid, "language": "en"}
    if s.get("variant"):
        variant = str(s["variant"])
        if len(variant) > 64:
            if loss:
                loss.add("approximated", f"surveys.{s.get('survey_id') or qid}.variant",
                         f"variant truncated from {len(variant)} to 64 chars for short_title")
            variant = variant[:64]
        meta["short_title"] = variant

    # description is required by instrument schema; synthesize if missing
    desc = s.get("description")
    if not desc:
        desc = f"Imported from survey_db: {s.get('title') or qid}"
        if loss:
            loss.add("warning", f"surveys.{s.get('survey_id') or qid}.description",
                     f"NULL description -> synthesized: {desc!r}")
    meta["description"] = desc

    raw_license = s.get("license")
    meta["license"] = _normalize_license(
        raw_license, loss, f"surveys.{s.get('survey_id') or qid}.license"
    )

    def _split_tags(field_val, field_name):
        """Split a legacy tag/topic/population string on ';' or ',' and truncate each to 64 chars."""
        if not field_val:
            return []
        parts = [t.strip() for t in re.split(r"[;,]", field_val) if t.strip()]
        clean = []
        for p in parts:
            if len(p) > 64:
                if loss:
                    loss.add("approximated",
                             f"surveys.{s.get('survey_id') or qid}.{field_name}",
                             f"item truncated: {p!r} -> {p[:64]!r}")
                p = p[:64]
            clean.append(p)
        return clean

    classification = {}
    domains = _split_tags(s.get("topics"), "topics")
    if domains:
        classification["domain"] = domains
    population = _split_tags(s.get("target_population"), "target_population")
    if population:
        classification["population"] = population
    # tags go in classification.tags (not top-level metadata)
    tags = _split_tags(s.get("tags"), "tags")
    if tags:
        classification["tags"] = tags
    if classification:
        meta["classification"] = classification

    # publication requires year + citation; only emit if we can extract a year
    ref_str = (s.get("reference") or "").strip()
    if ref_str:
        year = _extract_year(ref_str)
        if year:
            meta["publication"] = {"year": year, "citation": ref_str}
        else:
            # Year not extractable: preserve the raw reference as an x_ extension key
            # (instrument schema allows ^x_-prefixed keys via patternProperties; year is
            # required by the publication block so we cannot emit that block without it)
            meta["x_source_reference"] = ref_str
            if loss:
                loss.add("warning", f"surveys.{s.get('survey_id') or qid}.reference",
                         f"year not extractable from {ref_str!r} — stored as x_source_reference; publication block omitted")

    langs = _split(s.get("validated_languages"))
    if langs:
        meta["available_languages"] = langs

    # provenance: use the instrument schema's allowed fields only
    # (additionalProperties: false — our custom fields go into the importer's x_ extension)
    meta["provenance"] = build_provenance(qid, (header or {}).get("header_id"), imported_at)

    elements = []
    for c in rows:
        et = c["element_type"]
        if et == "message" and c.get("message_id"):
            elements.append(_ref("message", c["message_id"], version))
        elif et == "question" and c.get("prompt_id"):
            question = {"prompt": _ref("prompt", c["prompt_id"], version)}
            if c.get("context_id"):
                question["context"] = _ref("context", c["context_id"], version)
            if c.get("instruction_id"):
                question["instruction"] = _ref("instruction", c["instruction_id"], version)
            item = {"question": question, "option": _ref("option", c["option_id"], version)}
            if c.get("is_required"):
                item["required"] = True
            if c.get("condition"):
                item["show_if"] = c["condition"]
            elements.append(item)

    return {"@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
            "metadata": meta, "pages": [{"id": "page_main", "elements": elements}]}

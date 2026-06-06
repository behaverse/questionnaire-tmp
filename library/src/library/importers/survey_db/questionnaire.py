from .ids import canonical_id
from .mappers import _split
from .provenance import build_provenance

def _ref(entity_type, legacy_id, version):
    return {"ref": canonical_id(entity_type, legacy_id) + "@" + version}

def reconstruct(qid: str, comp_rows: list[dict], survey_row: dict, release: str, imported_at: str) -> dict:
    rows = [c for c in comp_rows if c["questionnaire"] == qid]
    header = next((c for c in rows if c["element_type"] == "header"), None)
    version = next((c.get("version") for c in rows if c.get("version")), None) or release
    s = survey_row or {}
    meta = {"id": canonical_id("questionnaire", qid), "version": version,
            "title": s.get("title") or qid, "language": "en"}
    if s.get("variant"): meta["short_title"] = str(s["variant"])
    if s.get("description"): meta["description"] = s["description"]
    meta["license"] = s.get("license") or "unknown"
    classification = {}
    if _split(s.get("topics")): classification["domain"] = _split(s.get("topics"))
    if _split(s.get("target_population")): classification["population"] = _split(s.get("target_population"))
    if classification: meta["classification"] = classification
    if s.get("reference"): meta["publication"] = {"citation": s["reference"].strip()}
    langs = _split(s.get("validated_languages"))
    if langs: meta["available_languages"] = langs
    if _split(s.get("tags")): meta["tags"] = _split(s.get("tags"))
    meta["provenance"] = build_provenance(qid, (header or {}).get("header_id"), imported_at)

    elements = []
    for c in rows:
        et = c["element_type"]
        if et == "message" and c.get("message_id"):
            elements.append(_ref("message", c["message_id"], version))
        elif et == "question" and c.get("prompt_id"):
            question = {"prompt": _ref("prompt", c["prompt_id"], version)}
            if c.get("context_id"): question["context"] = _ref("context", c["context_id"], version)
            if c.get("instruction_id"): question["instruction"] = _ref("instruction", c["instruction_id"], version)
            item = {"question": question, "option": _ref("option", c["option_id"], version)}
            if c.get("is_required"): item["required"] = True
            if c.get("condition"): item["show_if"] = c["condition"]
            elements.append(item)
    return {"@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
            "metadata": meta, "pages": [{"id": "page_main", "elements": elements}]}

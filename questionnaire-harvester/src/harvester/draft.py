from dataclasses import dataclass, field
from pathlib import Path
from library.importers.survey_db.ids import sanitize
from library.importers.survey_db.writer import write_entity
from harvester.dedup import option_fingerprint, lookup_option, lookup_instruction
from harvester.raw import RawQuestionnaire

PROVENANCE = {"source": "web_harvest", "imported_at": "2026-06-17T00:00:00Z",
              "importer_version": "web-harvest-0.1.0"}


@dataclass
class DraftResult:
    entities: dict = field(default_factory=lambda: {})
    reused: list = field(default_factory=list)
    minted: list = field(default_factory=list)


def _slug(qst_id: str) -> str:
    return qst_id[4:] if qst_id.startswith("qst_") else qst_id


def _fmt_num(x):
    f = float(x)
    return int(f) if f.is_integer() else f


def _build_choice_option(spec, slug: str, short_title: str, n=None) -> dict:
    dim = sanitize(spec.dimension)
    oid = (f"opt_{sanitize(slug)}_{dim}_{n}" if n is not None
           else f"opt_{sanitize(slug)}_{dim}_{len(spec.anchors)}")
    opt = {
        "id": oid,
        "dimension": dim, "input_data_type": spec.input_data_type,
        "measurement_type": spec.measurement_type, "selection": spec.selection,
        "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(spec.values)],
        "content": {"en": {"status": "validated",
            "label": f"{short_title} {len(spec.anchors)}-point {spec.dimension}",
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(spec.anchors) if t]}},
    }
    if getattr(spec, "randomize", False):
        opt["randomize"] = True
    return opt


def _build_number_option(spec, slug: str, short_title: str, n: int) -> dict:
    dim = sanitize(spec.dimension)
    opt = {
        "id": f"opt_{sanitize(slug)}_{dim}_{n}",
        "dimension": dim, "input_data_type": "number", "measurement_type": spec.measurement_type,
        "min": float(spec.min), "max": float(spec.max),
        "content": {"en": {"status": "validated",
            "label": f"{short_title} {_fmt_num(spec.min)}–{_fmt_num(spec.max)}"}},
    }
    if spec.step is not None:
        opt["step"] = float(spec.step)
    if spec.min_label:
        opt["min_label"] = spec.min_label
    if spec.max_label:
        opt["max_label"] = spec.max_label
    if spec.center_label:
        opt["center_label"] = spec.center_label
    if spec.initial_value is not None:
        opt["initial_value"] = float(spec.initial_value)
    return opt


def _resolve_option(spec, slug, short_title, res, scales_index, mint_cache, per_item=False) -> str:
    """Build `spec`'s canonical Option, then reuse (global index, then this run) or mint it.
    Returns the opt_id to reference. `mint_cache` maps fingerprint -> minted id for this run.
    `per_item` options (slider/matrix) use the counter id scheme to avoid collisions."""
    if spec.input_data_type == "number":
        opt = _build_number_option(spec, slug, short_title, n=len(mint_cache) + 1)
    elif per_item:
        opt = _build_choice_option(spec, slug, short_title, n=len(mint_cache) + 1)
    else:
        opt = _build_choice_option(spec, slug, short_title)
    existing = lookup_option(opt, scales_index)
    if existing:
        if existing not in res.reused:
            res.reused.append(existing)
        return existing
    fp = option_fingerprint(opt)
    if fp in mint_cache:
        return mint_cache[fp]
    opt_id = opt["id"]
    res.entities["option"].append(opt)
    res.minted.append(opt_id)
    mint_cache[fp] = opt_id
    return opt_id


def draft(rq: RawQuestionnaire, version: str, scales_index: dict, instr_index: dict) -> "DraftResult":
    slug = _slug(rq.qst_id)
    res = DraftResult(entities={"option": [], "instruction": [], "context": [], "prompt": [], "questionnaire": []})

    # --- Instruction: reuse or mint (skipped when absent, e.g. matrix) ---
    ins_id = None
    if rq.instruction_text:
        ins = {"id": f"ins_{sanitize(slug)}_instruction",
               "content": {"en": {"status": "validated", "text": rq.instruction_text}}}
        existing_ins = lookup_instruction(ins, instr_index)
        if existing_ins:
            ins_id = existing_ins
            res.reused.append(ins_id)
        else:
            ins_id = ins["id"]
            res.entities["instruction"].append(ins)
            res.minted.append(ins_id)

    # --- Context (temporal frame): mint verbatim from the source phrase ---
    # Faithfulness policy: keep the base text exactly as written (no "2"->"two" or
    # "last"->"past" folding). The content-based id means questionnaires whose temporal
    # phrase is byte-identical (case/whitespace aside) share one minted Context.
    ctx_ref = None
    if rq.context_text:
        ctx_id = f"ctx_{sanitize(rq.context_text)}"
        res.entities["context"].append(
            {"id": ctx_id, "content": {"en": {"status": "validated", "text": rq.context_text}}})
        res.minted.append(ctx_id)
        ctx_ref = f"{ctx_id}@{version}"

    # --- Shared prompt (matrix): one prompt referenced by every item ---
    shared_prompt_id = None
    if rq.shared_prompt_text:
        shared_prompt_id = f"pr_{sanitize(slug)}_shared"
        res.entities["prompt"].append(
            {"id": shared_prompt_id,
             "content": {"en": {"status": "validated", "text": rq.shared_prompt_text}}})
        res.minted.append(shared_prompt_id)

    # --- Per-item options + prompts ---
    mint_cache: dict = {}
    elements = []
    for i, item in enumerate(rq.items, start=1):
        spec = item.option or rq.scale
        opt_id = _resolve_option(spec, slug, rq.short_title, res, scales_index,
                                 mint_cache, per_item=item.option is not None)
        if shared_prompt_id:
            pr_ref = shared_prompt_id
        else:
            pr_id = f"pr_{sanitize(slug)}_{i}"
            prompt = {"id": pr_id, "content": {"en": {"status": "validated", "text": item.text}}}
            if item.construct:
                prompt["construct"] = item.construct
            if getattr(item, "reversed", False):
                prompt["reversed"] = True
            res.entities["prompt"].append(prompt)
            res.minted.append(pr_id)
            pr_ref = pr_id
        question = {"prompt": {"ref": f"{pr_ref}@{version}"}}
        if ins_id:
            question["instruction"] = {"ref": f"{ins_id}@{version}"}
        if ctx_ref:
            question["context"] = {"ref": ctx_ref}
        elements.append({
            "option": {"ref": f"{opt_id}@{version}"},
            "question": question,
            "required": True,
        })

    # --- Questionnaire ---
    md = {"id": rq.qst_id, "version": version, "title": rq.title, "short_title": rq.short_title,
          "description": rq.description, "language": "en", "available_languages": ["en"],
          "license": rq.license.canonical_enum(),
          "classification": {"domain": rq.domain, "population": rq.population,
                             "administration_mode": ["self_report"]},
          "psychometrics": {"item_count": len(rq.items)},
          "provenance": dict(PROVENANCE),
          **({"instrument_id": rq.instrument_id} if getattr(rq, "instrument_id", None) else {}),
          "x_source_site": rq.source_site, "x_harvest_date": "2026-06-17",
          **rq.license.x_metadata()}
    # publication is optional; emit it only when both citation and year are present
    # (the schema requires both). Otherwise the reference often remains in the description.
    if rq.citation and rq.year:
        md["publication"] = {"citation": rq.citation, "year": rq.year}
    if rq.references:
        md["x_references"] = rq.references
    if getattr(rq, "keywords", None):
        md["x_keywords"] = rq.keywords
    if getattr(rq, "description_source", None):
        md["x_description_source"] = rq.description_source
    elif getattr(rq, "source_meta", None):
        md["x_description_source"] = "site_meta"
    qst = {"@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
           "metadata": md, "pages": [{"id": "page_main", "elements": elements}]}
    res.entities["questionnaire"].append(qst)
    return res


def find_questionnaire_collision(out_dir: Path, qst_id: str, source_url: str) -> str | None:
    """Return the source URL of an already-harvested questionnaire that shares this
    `qst_id` but came from a *different* page, else None.

    Guards against id-derivation clashes (e.g. two distinct "BES" instruments)
    silently overwriting each other. Re-harvesting the same URL is idempotent
    (returns None), so refreshes still work.
    """
    import json
    path = Path(out_dir) / "questionnaires" / f"{qst_id}.json"
    if not path.exists():
        return None
    existing = json.loads(path.read_text()).get("metadata", {}).get("x_source_url")
    return existing if existing and existing != source_url else None


def write_draft(result: DraftResult, out_dir: Path) -> None:
    for etype, objs in result.entities.items():
        for obj in objs:
            write_entity(Path(out_dir), etype, obj)

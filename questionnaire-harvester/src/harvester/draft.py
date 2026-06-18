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


def _build_option(rq: RawQuestionnaire, slug: str) -> dict:
    s = rq.scale
    return {
        "id": f"opt_{sanitize(slug)}_{sanitize(s.dimension)}_{len(s.anchors)}",
        "dimension": s.dimension, "input_data_type": s.input_data_type,
        "measurement_type": s.measurement_type, "selection": s.selection,
        "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(s.values)],
        "content": {"en": {"status": "validated",
            "label": f"{rq.short_title} {len(s.anchors)}-point {s.dimension}",
            "options": [{"index": i + 1, "text": t} for i, t in enumerate(s.anchors)]}},
    }


def draft(rq: RawQuestionnaire, version: str, scales_index: dict, instr_index: dict) -> "DraftResult":
    slug = _slug(rq.qst_id)
    res = DraftResult(entities={"option": [], "instruction": [], "context": [], "prompt": [], "questionnaire": []})

    # --- Option: reuse or mint ---
    opt = _build_option(rq, slug)
    existing_opt = lookup_option(opt, scales_index)
    if existing_opt:
        opt_id = existing_opt
        res.reused.append(opt_id)
    else:
        opt_id = opt["id"]
        res.entities["option"].append(opt)
        res.minted.append(opt_id)

    # --- Instruction: reuse or mint ---
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

    # --- Prompts ---
    elements = []
    for i, item in enumerate(rq.items, start=1):
        pr_id = f"pr_{sanitize(slug)}_{i}"
        prompt = {"id": pr_id, "content": {"en": {"status": "validated", "text": item.text}}}
        if item.construct:
            prompt["construct"] = item.construct
        res.entities["prompt"].append(prompt)
        res.minted.append(pr_id)
        question = {"prompt": {"ref": f"{pr_id}@{version}"},
                    "instruction": {"ref": f"{ins_id}@{version}"}}
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
          "publication": {"citation": rq.citation, **({"year": rq.year} if rq.year else {})},
          "provenance": dict(PROVENANCE),
          "x_source_site": rq.source_site, "x_harvest_date": "2026-06-17",
          **rq.license.x_metadata()}
    qst = {"@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
           "metadata": md, "pages": [{"id": "page_main", "elements": elements}]}
    res.entities["questionnaire"].append(qst)
    return res


def write_draft(result: DraftResult, out_dir: Path) -> None:
    for etype, objs in result.entities.items():
        for obj in objs:
            write_entity(Path(out_dir), etype, obj)

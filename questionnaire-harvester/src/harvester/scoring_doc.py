import json
from pathlib import Path


def load_entities(out_dir: Path) -> dict:
    """Return {'options': {id: json}, 'prompts': {id: json}} for the harvested tree."""
    ents = {}
    for sub in ("options", "prompts"):
        m = {}
        d = out_dir / sub
        if d.is_dir():
            for f in sorted(d.glob("*.json")):
                try:
                    o = json.loads(f.read_text())
                except json.JSONDecodeError:
                    continue
                if isinstance(o, dict) and "id" in o:
                    m[o["id"]] = o
        ents[sub] = m
    return ents


def _num(v):
    """Render a scale weight: whole-number floats become ints (0.0 -> 0)."""
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return v


def _ref_id(ref: str) -> str:
    return (ref or "").split("@", 1)[0]


def derive_scoring(qst: dict, options_by_id: dict, prompts_by_id: dict) -> dict:
    """Pure: a faithful scoring descriptor derived only from the canonical questionnaire
    and its referenced options/prompts. Interpretive fields (aggregation, subscale
    membership, cut-offs) stay null under `to_research`; `status` is always
    'needs-research'. Missing referenced entities are flagged in `to_research.notes`,
    never crashed on."""
    md = qst.get("metadata", {}) or {}
    pages = qst.get("pages") or []
    elements = (pages[0].get("elements", []) if pages else [])
    notes = []

    per_item, scale_order, scales = [], [], {}
    dimensions, reversed_items, subscales = set(), [], set()

    for i, el in enumerate(elements, start=1):
        oref = _ref_id(el.get("option", {}).get("ref", ""))
        pref = _ref_id(el.get("question", {}).get("prompt", {}).get("ref", ""))
        opt = options_by_id.get(oref)
        pr = prompts_by_id.get(pref)
        if oref and opt is None:
            notes.append(f"missing option {oref}")
        if pref and pr is None:
            notes.append(f"missing prompt {pref}")
        dim = (opt or {}).get("dimension")
        if dim:
            dimensions.add(dim)
        values = [_num(s.get("value")) for s in (opt or {}).get("options", [])]
        if oref and opt is not None and oref not in scales:
            anchors = [c.get("text", "") for c in
                       ((opt.get("content", {}) or {}).get("en", {}) or {}).get("options", [])]
            scales[oref] = {
                "ref": oref, "dimension": dim,
                "measurement_type": opt.get("measurement_type"),
                "levels": len(values), "values": values,
                "value_range": [min(values), max(values)] if values else [],
                "anchors": anchors,
            }
            scale_order.append(oref)
        text = (((pr or {}).get("content", {}) or {}).get("en", {}) or {}).get("text", "")
        is_rev = bool((pr or {}).get("reversed"))
        if is_rev and pref:
            reversed_items.append(pref)
        for s in ((pr or {}).get("subscales") or []):
            subscales.add(_ref_id(s))
        per_item.append({
            "index": i, "prompt_id": pref, "prompt_snippet": text[:80],
            "dimension": dim, "values": values, "reversed": is_rev,
        })

    return {
        "id": md.get("id"),
        "title": md.get("title"),
        "short_title": md.get("short_title"),
        "source_url": md.get("x_source_url"),
        "publication": md.get("publication"),
        "status": "needs-research",
        "item_count": len(elements),
        "dimensions": sorted(dimensions),
        "option_scales": [scales[r] for r in scale_order],
        "reversed_items": reversed_items,
        "subscales": sorted(subscales),
        "uniform_scale": len(scale_order) == 1,
        "per_item": per_item,
        "to_research": {
            "aggregation": None, "subscale_definitions": None, "cutoffs": None,
            "notes": "; ".join(notes) if notes else None,
        },
    }


def render_scoring_md(desc: dict) -> str:
    """fenced-json structured block + human prose + per-item table + research checklist."""
    title = desc.get("title") or desc.get("id") or ""
    out = [
        f"# Scoring — {title} (`{desc.get('id')}`)\n",
        "> **status: needs-research.** The structure below is faithful to the harvested "
        "data. The aggregation formula, subscale membership, and cut-offs are NOT in the "
        "source and must be sourced from the instrument manual/literature before authoring "
        "a `scr_*` Scorer.\n",
        "```json",
        json.dumps(desc, indent=2, ensure_ascii=False),
        "```\n",
        "## Known structure\n",
        f"- Items: {desc.get('item_count')}",
        f"- Dimensions: {', '.join(desc.get('dimensions', [])) or '—'}",
        f"- Distinct scales: {len(desc.get('option_scales', []))} "
        f"({'uniform' if desc.get('uniform_scale') else 'mixed'})",
        f"- Reverse-scored items: {', '.join(desc.get('reversed_items', [])) or 'none'}",
        f"- Subscale refs: {', '.join(desc.get('subscales', [])) or 'none'}\n",
        "## Per-item\n",
        "| # | item | dimension | weights | reversed |",
        "|---|------|-----------|---------|----------|",
    ]
    for it in desc.get("per_item", []):
        snippet = (it.get("prompt_snippet") or "").replace("|", "\\|").replace("\n", " ")
        weights = ",".join(str(v) for v in it.get("values", []))
        out.append(f"| {it['index']} | {snippet} | {it.get('dimension') or ''} | "
                   f"{weights} | {'yes' if it.get('reversed') else 'no'} |")
    src = desc.get("source_url") or "the instrument manual"
    out += [
        "",
        f"## To research (fill from {src})\n",
        "- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)",
        "- [ ] Subscales: item membership + names.",
        "- [ ] Cut-offs / severity bands / interpretation.",
        "",
    ]
    return "\n".join(out)


def write_scoring_docs(out_dir: Path, scoring_dir: Path, only_id: str | None = None) -> list:
    """Resolve + derive + render + write scoring/<id>.md for every questionnaire in
    out_dir (or just `only_id`). Returns the ids written."""
    ents = load_entities(out_dir)
    qdir = out_dir / "questionnaires"
    files = sorted(qdir.glob("*.json")) if qdir.is_dir() else []
    scoring_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for f in files:
        try:
            qst = json.loads(f.read_text())
        except json.JSONDecodeError:
            continue
        qid = (qst.get("metadata", {}) or {}).get("id")
        if not qid or (only_id and qid != only_id):
            continue
        desc = derive_scoring(qst, ents["options"], ents["prompts"])
        (scoring_dir / f"{qid}.md").write_text(render_scoring_md(desc))
        written.append(qid)
    return written

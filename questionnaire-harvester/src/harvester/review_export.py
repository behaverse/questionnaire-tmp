import json
from pathlib import Path


def load_entities(out_dir, subdirs=("options", "prompts", "instructions", "contexts")):
    """Return {subdir: {id: json}} for the harvested tree."""
    out = {}
    for sub in subdirs:
        m = {}
        d = Path(out_dir) / sub
        if d.is_dir():
            for f in sorted(d.glob("*.json")):
                try:
                    o = json.loads(f.read_text())
                except json.JSONDecodeError:
                    continue
                if isinstance(o, dict) and "id" in o:
                    m[o["id"]] = o
        out[sub] = m
    return out


def _ref_id(ref):
    return (ref or "").split("@", 1)[0]


def _num(v):
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return v


def _text(entity):
    return (((entity or {}).get("content", {}) or {}).get("en", {}) or {}).get("text", "")


def render_option(opt):
    """A readable one-line description of an option (choice anchors+values, or number/slider)."""
    if opt is None:
        return "‹missing option›"
    if opt.get("input_data_type") == "number":
        s = f"number {_num(opt.get('min'))}–{_num(opt.get('max'))}"
        if opt.get("step") not in (None, ""):
            s += f" (step {_num(opt.get('step'))})"
        labels = []
        if opt.get("min_label") or opt.get("max_label"):
            labels.append(f"\"{opt.get('min_label', '')}\" … \"{opt.get('max_label', '')}\"")
        if opt.get("center_label"):
            labels.append(f"center \"{opt['center_label']}\"")
        if opt.get("initial_value") is not None:
            labels.append(f"initial {_num(opt['initial_value'])}")
        return s + (": " + " · ".join(labels) if labels else "")
    anchors = {c.get("index"): c.get("text", "")
               for c in (((opt.get("content", {}) or {}).get("en", {}) or {}).get("options", []))}
    vals = {s.get("index"): s.get("value") for s in opt.get("options", [])}
    parts = []
    for i in sorted(set(anchors) | set(vals)):
        a = anchors.get(i, "")
        v = _num(vals.get(i))
        parts.append(f"{i}. {a} ({v})" if a else f"{i}. ({v})")
    return " · ".join(parts) if parts else "(no options)"


def render_questionnaire_md(qst, entities):
    """A human-readable render of an imported questionnaire: original link, metadata,
    resolved instruction/context, and each item's prompt text + option line."""
    md = qst.get("metadata", {}) or {}
    opts, prs = entities.get("options", {}), entities.get("prompts", {})
    inss, ctxs = entities.get("instructions", {}), entities.get("contexts", {})
    pages = qst.get("pages") or []
    elements = pages[0].get("elements", []) if pages else []

    out = [f"# {md.get('title', '')} (`{md.get('id', '')}`)\n",
           f"**Original:** {md.get('x_source_url', '—')}\n",
           f"- short_title: {md.get('short_title', '')}",
           f"- source: {md.get('x_source_site', '')}",
           f"- license: {md.get('license', '')}"]
    pub = md.get("publication")
    if pub:
        out.append(f"- publication: {pub.get('citation', '')} ({pub.get('year', '')})")
    out.append(f"- items: {len(elements)}\n")

    seen_i, instr_texts, seen_c, ctx_texts = set(), [], set(), []
    for el in elements:
        iref = _ref_id(el.get("question", {}).get("instruction", {}).get("ref", ""))
        if iref and iref not in seen_i:
            seen_i.add(iref)
            instr_texts.append(_text(inss.get(iref)) or f"‹missing {iref}›")
        cref = _ref_id(el.get("question", {}).get("context", {}).get("ref", ""))
        if cref and cref not in seen_c:
            seen_c.add(cref)
            ctx_texts.append(_text(ctxs.get(cref)) or f"‹missing {cref}›")
    if instr_texts:
        out.append("## Instructions\n")
        out += [t + "\n" for t in instr_texts]
    if ctx_texts:
        out.append("## Context\n")
        out += [t + "\n" for t in ctx_texts]

    out.append("## Items\n")
    for i, el in enumerate(elements, start=1):
        pref = _ref_id(el.get("question", {}).get("prompt", {}).get("ref", ""))
        oref = _ref_id(el.get("option", {}).get("ref", ""))
        pr = prs.get(pref)
        opt = opts.get(oref)
        ptext = _text(pr) if pr is not None else f"‹missing {pref}›"
        tags = []
        if opt is not None and opt.get("dimension"):
            tags.append(f"dimension: {opt['dimension']}")
        if (pr or {}).get("reversed"):
            tags.append("reversed")
        tagstr = f"  _({'; '.join(tags)})_" if tags else ""
        out.append(f"{i}. **{ptext}**{tagstr}")
        out.append(f"   - {render_option(opt)}")
    out.append("")
    return "\n".join(out)


def index_entry(qst):
    md = qst.get("metadata", {}) or {}
    return {"id": md.get("id"), "title": md.get("title"),
            "short_title": md.get("short_title"),
            "source_url": md.get("x_source_url"),
            "source_site": md.get("x_source_site") or "unknown"}


def render_index_md(entries):
    """A review checklist grouped by source site (sorted), one checkbox per questionnaire."""
    by_site = {}
    for e in entries:
        by_site.setdefault(e["source_site"], []).append(e)
    out = ["# Import review\n",
           "Tick each box after reviewing the imported questionnaire against its original.\n"]
    for site in sorted(by_site):
        rows = sorted(by_site[site], key=lambda e: e["id"] or "")
        out.append(f"## {site} ({len(rows)})\n")
        for e in rows:
            label = e["short_title"] or e["title"] or e["id"]
            out.append(f"- [ ] [{label} (`{e['id']}`)]({e['id']}.md) — "
                       f"[original]({e['source_url']})")
        out.append("")
    return "\n".join(out)


def write_review_export(out_dir, review_dir, only_id=None):
    """Scan all questionnaires; always (re)write README.md (full checklist) + a readable
    <id>.md for only_id (or every questionnaire). Returns the doc ids written."""
    out_dir, review_dir = Path(out_dir), Path(review_dir)
    entities = load_entities(out_dir)
    qdir = out_dir / "questionnaires"
    files = sorted(qdir.glob("*.json")) if qdir.is_dir() else []
    review_dir.mkdir(parents=True, exist_ok=True)
    entries, written = [], []
    for f in files:
        try:
            qst = json.loads(f.read_text())
        except json.JSONDecodeError:
            continue
        qid = (qst.get("metadata", {}) or {}).get("id")
        if not qid:
            continue
        entries.append(index_entry(qst))
        if only_id and qid != only_id:
            continue
        (review_dir / f"{qid}.md").write_text(render_questionnaire_md(qst, entities))
        written.append(qid)
    (review_dir / "README.md").write_text(render_index_md(entries))
    return written

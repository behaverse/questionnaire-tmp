import re
from .ids import canonical_id, LANGS_FULL, LANGS_MIN
from .content import simple_content

def _split(s, sep=";"):
    return [p.strip() for p in s.split(sep) if p.strip()] if s else []

def _sanitize_identifier(s: str) -> str:
    """Sanitize a string to match ^[a-z][a-z0-9_]+$ — replace hyphens and spaces with _,
    lowercase, strip leading/trailing underscores."""
    if not s:
        return s
    s = s.strip().lower()
    s = re.sub(r"[^a-z0-9_]+", "_", s)
    s = s.strip("_")
    # must start with a letter
    if s and not s[0].isalpha():
        s = "x_" + s
    return s

def map_prompt(row: dict, loss=None) -> dict:
    out = {"id": canonical_id("prompt", row["prompt_id"])}
    if row.get("name"):
        name = _sanitize_identifier(row["name"])
        if name and name != row["name"]:
            if loss:
                loss.add("approximated", f"prompts.{row['prompt_id']}.name",
                         f"sanitized {row['name']!r} -> {name!r} to match ^[a-z][a-z0-9_]+$")
        if name:
            out["name"] = name
    if row.get("dimension"):
        # dimension may contain "; " separators — take the first meaningful piece
        dim_raw = row["dimension"]
        dim = _sanitize_identifier(dim_raw.split(";")[0].strip())
        if dim and dim != dim_raw:
            if loss:
                loss.add("approximated", f"prompts.{row['prompt_id']}.dimension",
                         f"sanitized {dim_raw!r} -> {dim!r} to match ^[a-z][a-z0-9_]+$")
        if dim:
            out["dimension"] = dim
    topics = _split(row.get("topics"))
    if topics:
        out["topics"] = topics
    out["reversed"] = bool(row.get("reversed"))
    out["content"] = simple_content(row, LANGS_FULL)
    return out

def map_context(row: dict, loss=None) -> dict | None:
    if not row.get("context_id"):
        if loss:
            loss.add("dropped", "contexts.<null>", "context_id is NULL — skipping junk row")
        return None
    return {"id": canonical_id("context", row["context_id"]), "content": simple_content(row, LANGS_FULL)}

def map_instruction(row: dict, loss=None) -> dict | None:
    if not row.get("instruction_id"):
        if loss:
            loss.add("dropped", "instructions.<null>", "instruction_id is NULL — skipping junk row")
        return None
    out = {"id": canonical_id("instruction", row["instruction_id"]), "content": simple_content(row, LANGS_FULL)}
    if row.get("dimension"):
        dim_raw = row["dimension"]
        dim = _sanitize_identifier(dim_raw.split(";")[0].strip())
        if dim and dim != dim_raw:
            if loss:
                loss.add("approximated", f"instructions.{row['instruction_id']}.dimension",
                         f"sanitized {dim_raw!r} -> {dim!r} to match ^[a-z][a-z0-9_]+$")
        if dim:
            out["dimension"] = dim
    return out

def map_message(row: dict, loss=None) -> dict | None:
    """Return a canonical Message dict, or None if the row is junk (NULL id or NULL content)."""
    if not row.get("message_id"):
        if loss:
            loss.add("dropped", "messages.<null>", "message_id is NULL — skipping junk row")
        return None
    # type: schema requires array with minItems=1; legacy uses semicolon-separated string
    raw_type = row.get("type")
    if raw_type:
        # handle both "; " and ";" and "," separators
        type_list = [t.strip() for t in re.split(r"[;,]", raw_type) if t.strip()]
    else:
        # NULL type: default to ["information"] and warn
        type_list = ["information"]
        if loss:
            loss.add("warning", f"messages.{row['message_id']}.type",
                     "NULL type -> defaulted to ['information']")
    content = simple_content(row, LANGS_MIN)
    if not content:
        # message has no text in any language — skip it (can't satisfy MessageContent minProperties=1)
        if loss:
            loss.add("dropped", f"messages.{row['message_id']}",
                     "no content in any language — skipping empty message")
        return None
    return {"id": canonical_id("message", row["message_id"]),
            "type": type_list,
            "content": content}

def map_placeholder(row: dict) -> dict:
    return {"id": canonical_id("placeholder", row["placeholder_id"]), "content": simple_content(row, LANGS_MIN)}

def map_help(row: dict) -> dict:
    return {"id": canonical_id("help", row["help_id"]), "content": simple_content(row, LANGS_MIN)}

def map_regex(row: dict) -> dict:
    return {"id": canonical_id("regex", row["regex_id"]), "regex": row["regex"],
            "example_input": row.get("example_input") or ""}

def map_solution(row: dict) -> dict:
    return {"id": canonical_id("solution", row["question_id"]),
            "prompt": {"ref": canonical_id("prompt", row["question_id"]) + "@PENDING"},
            "expected_response": row["expected_response"]}

def _first(rows, key):
    for r in rows:
        if r.get(key) not in (None, ""):
            return r[key]
    return None

def map_option(option_id: str, rows: list[dict], loss=None) -> dict | None:
    """Return a canonical Option dict, or None if the option_id is None (skip junk rows)."""
    if option_id is None:
        if loss:
            loss.add("dropped", "options.<null>", "option_id is NULL — skipping junk row")
        return None

    head = rows[0]
    input_data_type = head.get("input_data_type")
    measurement_type = head.get("measurement_type")

    # Apply defaults for NULL input_data_type / measurement_type; warn in loss report
    if input_data_type is None:
        # Infer from context: if there are choice rows (index IS NOT NULL), it's a choice type
        has_choices = any(r.get("index") is not None for r in rows)
        input_data_type = "choice" if has_choices else "text"
        if loss:
            loss.add("warning", f"options.{option_id}.input_data_type",
                     f"NULL -> defaulted to {input_data_type!r} based on row structure")

    if measurement_type is None:
        # Default to ordinal for choice (most common), interval for text/number
        measurement_type = "ordinal" if input_data_type == "choice" else "interval"
        if loss:
            loss.add("warning", f"options.{option_id}.measurement_type",
                     f"NULL -> defaulted to {measurement_type!r}")

    out = {"id": canonical_id("option", option_id),
           "input_data_type": input_data_type,
           "measurement_type": measurement_type}

    if head.get("dimension"):
        dim_raw = head["dimension"]
        dim = _sanitize_identifier(dim_raw.split(";")[0].strip())
        if dim and dim != dim_raw:
            if loss:
                loss.add("approximated", f"options.{option_id}.dimension",
                         f"sanitized {dim_raw!r} -> {dim!r} to match ^[a-z][a-z0-9_]+$")
        if dim:
            out["dimension"] = dim

    for legacy, canon in (("min_value", "min"), ("max_value", "max"), ("step", "step")):
        v = _first(rows, legacy)
        if v is not None:
            try:
                num = float(v) if "." in str(v) else int(v)
            except (ValueError, TypeError):
                num = None
            if num is not None:
                # step must be > 0 (schema: exclusiveMinimum: 0); drop zero/negative steps
                if canon == "step" and num <= 0:
                    if loss:
                        loss.add("dropped", f"options.{option_id}.step",
                                 f"step={num!r} <= 0 violates exclusiveMinimum:0 — omitted")
                else:
                    out[canon] = num

    if _first(rows, "placeholder_id"):
        out["placeholder"] = {"ref": canonical_id("placeholder", _first(rows, "placeholder_id")) + "@PENDING"}
    if _first(rows, "help_id"):
        out["help"] = {"ref": canonical_id("help", _first(rows, "help_id")) + "@PENDING"}
    if _first(rows, "input_validation"):
        out["input_validation"] = {"ref": canonical_id("regex", _first(rows, "input_validation")) + "@PENDING"}

    is_choice = (input_data_type == "choice")
    units = _first(rows, "units")

    if is_choice:
        choices = [{"index": r["index"], "value": r.get("value")} for r in rows if r.get("index") is not None]
        if len(choices) < 2:
            # schema requires minItems: 2 for choice options; drop this option and warn
            if loss:
                loss.add("dropped", f"options.{option_id}",
                         f"choice option has only {len(choices)} choice row(s) — schema requires >= 2; dropped")
            return None
        out["selection"] = "single"
        out["options"] = choices

    # Build per-language content
    langs = LANGS_FULL
    content = {}
    for lang in langs:
        entry = {}
        if units and lang == "en":
            entry["units"] = units  # units stored once; legacy has a single units column
        if is_choice:
            opts = [{"index": r["index"], "text": r.get(f"text_{lang}")} for r in rows
                    if r.get("index") is not None and r.get(f"text_{lang}")]
            if opts:
                entry["options"] = opts
        if entry:
            entry["status"] = "complete"
            content[lang] = entry

    if not content:
        # Schema requires content with minProperties=1; produce a minimal draft entry
        content = {"en": {"status": "draft"}}
        if loss:
            loss.add("warning", f"options.{option_id}.content",
                     "no language content found — synthesized minimal {'en': {'status': 'draft'}}")

    out["content"] = content
    return out

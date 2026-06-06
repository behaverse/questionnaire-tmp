from .ids import canonical_id, LANGS_FULL, LANGS_MIN
from .content import simple_content

def _split(s, sep=";"):
    return [p.strip() for p in s.split(sep) if p.strip()] if s else []

def map_prompt(row: dict) -> dict:
    out = {"id": canonical_id("prompt", row["prompt_id"])}
    if row.get("name"): out["name"] = row["name"]
    if row.get("dimension"): out["dimension"] = row["dimension"]
    topics = _split(row.get("topics"))
    if topics: out["topics"] = topics
    out["reversed"] = bool(row.get("reversed"))
    out["content"] = simple_content(row, LANGS_FULL)
    return out

def map_context(row: dict) -> dict:
    return {"id": canonical_id("context", row["context_id"]), "content": simple_content(row, LANGS_FULL)}

def map_instruction(row: dict) -> dict:
    out = {"id": canonical_id("instruction", row["instruction_id"]), "content": simple_content(row, LANGS_FULL)}
    if row.get("dimension"): out["dimension"] = row["dimension"]
    return out

def map_message(row: dict) -> dict:
    return {"id": canonical_id("message", row["message_id"]),
            "type": _split(row.get("type"), sep=",") or [row["type"]] if row.get("type") else [],
            "content": simple_content(row, LANGS_MIN)}

def map_placeholder(row: dict) -> dict:
    return {"id": canonical_id("placeholder", row["placeholder_id"]), "content": simple_content(row, LANGS_MIN)}

def map_help(row: dict) -> dict:
    return {"id": canonical_id("help", row["help_id"]), "content": simple_content(row, LANGS_MIN)}

def map_regex(row: dict) -> dict:
    return {"id": canonical_id("regex", row["regex_id"]), "regex": row["regex"],
            "example_input": row.get("example_input")}

def map_solution(row: dict) -> dict:
    return {"id": canonical_id("solution", row["question_id"]),
            "prompt": {"ref": canonical_id("prompt", row["question_id"]) + "@PENDING"},
            "expected_response": row["expected_response"]}

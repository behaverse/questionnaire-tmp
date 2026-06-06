import re

LANGS_FULL = ["en", "fr", "de", "lu", "pt", "es", "it"]
LANGS_MIN = ["en", "fr"]

PREFIX = {
    "message": "msg_", "context": "ctx_", "instruction": "ins_", "prompt": "pr_",
    "option": "opt_", "placeholder": "ph_", "help": "help_", "regex": "rx_",
    "solution": "sol_", "questionnaire": "qst_",
}

def sanitize(s: str) -> str:
    s = re.sub(r"[^a-z0-9_]+", "_", s.strip().lower())
    return s.strip("_")

def canonical_id(entity_type: str, legacy_id: str) -> str:
    return PREFIX[entity_type] + sanitize(legacy_id)

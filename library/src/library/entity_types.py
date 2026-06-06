# (entity_type, plural_dir, id_prefix, schema_dir_name)
_ROWS = [
    ("message", "messages", "msg_", "questionnaire"),
    ("context", "contexts", "ctx_", "questionnaire"),
    ("instruction", "instructions", "ins_", "questionnaire"),
    ("prompt", "prompts", "pr_", "questionnaire"),
    ("option", "options", "opt_", "questionnaire"),
    ("placeholder", "placeholders", "ph_", "questionnaire"),
    ("help", "helps", "help_", "questionnaire"),
    ("regex", "regexes", "rx_", "questionnaire"),
    ("question", "questions", "q_", "questionnaire"),
    ("item", "items", "it_", "questionnaire"),
    ("solution", "solutions", "sol_", "questionnaire"),
    ("subscale", "subscales", "scl_", "questionnaire"),
    ("scorer", "scorers", "scr_", "questionnaire"),
    ("questionnaire", "questionnaires", "qst_", "questionnaire"),
]
ENTITY_TYPES = [r[0] for r in _ROWS]
DIR_BY_TYPE = {r[0]: r[1] for r in _ROWS}
TYPE_BY_DIR = {r[1]: r[0] for r in _ROWS}
_PREFIXES = sorted(((r[2], r[0]) for r in _ROWS), key=lambda p: -len(p[0]))

def type_for_dir(dirname: str) -> str:
    return TYPE_BY_DIR[dirname]

def type_for_id(entity_id: str) -> str:
    for prefix, etype in _PREFIXES:
        if entity_id.startswith(prefix):
            return etype
    raise ValueError(f"unknown id prefix: {entity_id}")

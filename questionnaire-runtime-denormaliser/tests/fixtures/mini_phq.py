"""Self-contained, fully-resolvable fixture for the golden end-to-end test."""

ENTITY_STORE = {
    "pr_mini_1@v26.0609": {
        "id": "pr_mini_1",
        "name": "interest",
        "content": {
            "en": {"status": "validated", "text": "Little interest or pleasure in doing things"},
            "pt": {"status": "validated", "text": "Pouco interesse ou prazer em fazer as coisas"},
        },
    },
    "pr_mini_2@v26.0609": {
        "id": "pr_mini_2",
        "name": "down",
        "content": {
            "en": {"status": "validated", "text": "Feeling down or hopeless"},
            "pt": {"status": "validated", "text": "Sentir-se em baixo ou sem esperança"},
        },
    },
    "opt_freq_4@v26.0609": {
        "id": "opt_freq_4",
        "input_data_type": "choice",
        "measurement_type": "ordinal",
        "selection": "single",
        "options": [
            {"index": 1, "value": 0},
            {"index": 2, "value": 1},
            {"index": 3, "value": 2},
            {"index": 4, "value": 3},
        ],
        "content": {
            "en": {"status": "validated", "label": "Frequency", "options": [
                {"index": 1, "text": "Not at all"}, {"index": 2, "text": "Several days"},
                {"index": 3, "text": "More than half the days"}, {"index": 4, "text": "Nearly every day"}]},
            "pt": {"status": "validated", "label": "Frequência", "options": [
                {"index": 1, "text": "Nunca"}, {"index": 2, "text": "Vários dias"},
                {"index": 3, "text": "Mais de metade dos dias"}, {"index": 4, "text": "Quase todos os dias"}]},
        },
    },
    "scr_mini@v26.0609": {
        "id": "scr_mini",
        "implementations": [
            {"kind": "wasm", "url": "https://behaverse.org/scorers/mini/v26.0609/scorer.wasm", "sha256": "a" * 64},
            {"kind": "http", "url": "https://scorer.behaverse.org/mini/v26.0609"},
        ],
    },
}


def resolve_entity(ref):
    return ENTITY_STORE.get(ref)


def questionnaire():
    return {
        "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
        "metadata": {"id": "qst_mini", "version": "v26.0609", "title": "Mini PHQ",
                     "description": "Two-item PHQ-style fixture.", "language": "en"},
        "pages": [
            {"id": "page_1", "elements": [
                {"id": "it_1",
                 "question": {"prompt": {"ref": "pr_mini_1@v26.0609"}},
                 "option": {"ref": "opt_freq_4@v26.0609"}},
            ]},
            {"id": "page_2", "elements": [
                {"id": "it_2",
                 "question": {"prompt": {"ref": "pr_mini_2@v26.0609"}},
                 "option": {"ref": "opt_freq_4@v26.0609"}},
            ]},
        ],
        "logic": [
            {"id": "branch_high", "type": "branch", "condition": 'score("mini_total") >= 4',
             "action": {"skip_to": "page_2"}},
        ],
        "scores": [
            {"id": "mini_total", "scorer": "scr_mini@v26.0609", "path": "/total"},
            {"id": "mini_label", "scorer": "scr_mini@v26.0609", "path": "/label"},
        ],
    }


VIEWER_MANIFEST = {
    "viewer_id": "behaverse-web-viewer",
    "viewer_version": "v26.0610",
    "widgets": ["choice.ordinal.single"],
    "logic_actions": ["skip", "visibility", "piping", "branch"],
    "scorer_impl_kinds": ["wasm", "http"],
}

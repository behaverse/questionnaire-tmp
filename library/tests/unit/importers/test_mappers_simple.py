from library.importers.survey_db import mappers

def test_map_prompt():
    row = {"prompt_id": "aiss_q_2", "name": "cold_water", "dimension": "similarity",
           "topics": "risk_taking; novelty_seeking", "reversed": 1,
           "text_en": "When the water is very cold...", "text_pt": "Quando a água..."}
    out = mappers.map_prompt(row)
    assert out["id"] == "pr_aiss_q_2"
    assert out["name"] == "cold_water" and out["dimension"] == "similarity"
    assert out["topics"] == ["risk_taking", "novelty_seeking"]
    assert out["reversed"] is True
    assert "construct" not in out
    assert out["content"]["en"]["text"].startswith("When the water")
    assert out["content"]["en"]["status"] == "complete" and "pt" in out["content"]

def test_map_prompt_no_topics_not_reversed():
    out = mappers.map_prompt({"prompt_id": "aiss_q_1", "name": "x", "dimension": "similarity",
                              "topics": None, "reversed": 0, "text_en": "hi"})
    assert "topics" not in out and out["reversed"] is False

def test_map_message_type_to_array():
    out = mappers.map_message({"message_id": "welcome", "type": "purpose", "text_en": "Hi", "text_fr": "Salut"})
    assert out["id"] == "msg_welcome" and out["type"] == ["purpose"]
    assert set(out["content"].keys()) == {"en", "fr"}

def test_map_regex_and_solution():
    rx = mappers.map_regex({"regex_id": "year_4digit", "regex": "^\\d{4}$", "example_input": "2026"})
    assert rx["id"] == "rx_year_4digit" and rx["regex"] == "^\\d{4}$"
    sol = mappers.map_solution({"question_id": "icar16_q_1", "expected_response": "X"})
    assert sol["id"] == "sol_icar16_q_1" and sol["prompt"]["ref"].startswith("pr_icar16_q_1@")

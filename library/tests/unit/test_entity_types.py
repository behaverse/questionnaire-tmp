from library.entity_types import type_for_dir, type_for_id, DIR_BY_TYPE

def test_dir_maps_to_type():
    assert type_for_dir("prompts") == "prompt"
    assert type_for_dir("questionnaires") == "questionnaire"

def test_id_prefix_maps_to_type():
    assert type_for_id("pr_phq9_1") == "prompt"
    assert type_for_id("qst_phq9") == "questionnaire"
    assert type_for_id("opt_x") == "option"

def test_every_type_has_a_dir():
    assert len(DIR_BY_TYPE) == 14

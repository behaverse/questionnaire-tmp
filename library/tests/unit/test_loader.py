import json
import pytest
from library.loader import identify, load_tree

def test_identify_uses_dir_and_id(tmp_path):
    p = tmp_path / "prompts" / "pr_x.json"
    p.parent.mkdir(parents=True)
    p.write_text(json.dumps({"id": "pr_x", "version": "v26.0528", "content": {}}))
    art = identify(p, json.loads(p.read_text()))
    assert art.entity_type == "prompt" and art.id == "pr_x" and art.version == "v26.0528"

def test_identify_questionnaire_reads_metadata(tmp_path):
    p = tmp_path / "questionnaires" / "qst_x.json"
    p.parent.mkdir(parents=True)
    data = {"metadata": {"id": "qst_x", "version": "v26.0602"}, "pages": []}
    art = identify(p, data)
    assert art.entity_type == "questionnaire" and art.id == "qst_x" and art.version == "v26.0602"

def test_identify_falls_back_to_release_version(tmp_path):
    p = tmp_path / "items" / "it_x.json"
    p.parent.mkdir(parents=True)
    art = identify(p, {"id": "it_x", "question": {}, "option": {}}, release="v26.0602")
    assert art.version == "v26.0602"

def test_identify_requires_version_or_release(tmp_path):
    p = tmp_path / "items" / "it_x.json"
    with pytest.raises(ValueError):
        identify(p, {"id": "it_x"})

def test_identify_rejects_prefix_mismatch(tmp_path):
    p = tmp_path / "prompts" / "opt_x.json"
    with pytest.raises(ValueError):
        identify(p, {"id": "opt_x", "version": "v26.0528"})

def test_load_tree_walks_with_release(tmp_path):
    d = tmp_path / "messages"; d.mkdir(parents=True)
    (d / "msg_a.json").write_text(json.dumps({"id": "msg_a", "content": {}}))
    arts = load_tree(tmp_path, release="v26.0602")
    assert [(a.id, a.version) for a in arts] == [("msg_a", "v26.0602")]

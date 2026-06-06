import json
from library.loader import identify, load_tree

def test_identify_uses_dir_and_id(tmp_path):
    p = tmp_path / "prompts" / "pr_x.json"
    p.parent.mkdir(parents=True)
    p.write_text(json.dumps({"id": "pr_x", "version": "v26.0528", "content": {}}))
    art = identify(p, json.loads(p.read_text()))
    assert art.entity_type == "prompt" and art.id == "pr_x" and art.version == "v26.0528"

def test_identify_rejects_prefix_mismatch(tmp_path):
    p = tmp_path / "prompts" / "opt_x.json"
    import pytest
    with pytest.raises(ValueError):
        identify(p, {"id": "opt_x", "version": "v26.0528"})

def test_load_tree_walks(tmp_path):
    d = tmp_path / "messages"; d.mkdir(parents=True)
    (d / "msg_a.json").write_text(json.dumps({"id": "msg_a", "version": "v26.0528", "content": {}}))
    arts = load_tree(tmp_path)
    assert [a.id for a in arts] == ["msg_a"]

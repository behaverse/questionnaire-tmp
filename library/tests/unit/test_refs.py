from library.refs import extract_refs, parse_ref, Ref

def test_parse_ref():
    assert parse_ref("pr_x@v26.0528") == ("pr_x", "v26.0528")

def test_extract_refs_infers_kind_from_key():
    data = {
        "id": "it_a", "version": "v1",
        "question": {"ref": "q_a@v26.0528"},
        "option": {"ref": "opt_a@v26.0528"},
    }
    refs = set(extract_refs(data))
    assert Ref("q_a", "v26.0528", "question") in refs
    assert Ref("opt_a", "v26.0528", "option") in refs

def test_extract_refs_handles_nested_and_arrays():
    data = {"id": "page", "version": "v1",
            "elements": [{"ref": "msg_a@v26.0528"}, {"option": {"ref": "opt_b@v26.0528"}}]}
    kinds = {r.ref_kind for r in extract_refs(data)}
    assert {"elements", "option"} <= kinds

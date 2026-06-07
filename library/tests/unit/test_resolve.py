# library/tests/unit/test_resolve.py
from library.api.resolve import resolve_definition


class FakeConn:
    """Minimal stand-in for a psycopg connection: maps (id, version) -> content dict
    (or None to simulate a withdrawn entity with NULL content)."""
    def __init__(self, store):
        self.store = store

    def execute(self, _sql, params):
        eid, ver = params
        present = (eid, ver) in self.store
        value = self.store.get((eid, ver))
        class _Result:
            def fetchone(self_inner):
                if not present:
                    return None
                return (value,)
        return _Result()


def test_nested_refs_resolve_through_merged_content():
    store = {
        ("it_x", "v1"): {"question": {"prompt": {"ref": "pr_x@v1"}}, "option": {"ref": "opt_x@v1"}},
        ("pr_x", "v1"): {"content": {"en": {"text": "STEM"}}},
        ("opt_x", "v1"): {"content": {"en": {"label": "SCALE"}}},
    }
    definition = {"pages": [{"elements": [{"ref": "it_x@v1"}]}]}
    out = resolve_definition(FakeConn(store), definition)
    el = out["pages"][0]["elements"][0]
    assert el["ref"] == "it_x@v1"
    assert el["question"]["prompt"]["content"]["en"]["text"] == "STEM"
    assert el["option"]["content"]["en"]["label"] == "SCALE"


def test_sibling_keys_win_over_merged_content():
    store = {("pr_x", "v1"): {"content": {"en": {"text": "FROM_STORE"}}, "name": "store_name"}}
    definition = {"prompt": {"ref": "pr_x@v1", "name": "local_name"}}
    out = resolve_definition(FakeConn(store), definition)
    assert out["prompt"]["name"] == "local_name"          # sibling wins
    assert out["prompt"]["content"]["en"]["text"] == "FROM_STORE"  # merged in


def test_unresolved_ref_is_flagged():
    definition = {"prompt": {"ref": "pr_missing@v1"}}
    out = resolve_definition(FakeConn({}), definition)
    assert out["prompt"]["_unresolved"] is True


def test_withdrawn_entity_null_content_is_unresolved():
    definition = {"prompt": {"ref": "pr_gone@v1"}}
    out = resolve_definition(FakeConn({("pr_gone", "v1"): None}), definition)
    assert out["prompt"]["_unresolved"] is True

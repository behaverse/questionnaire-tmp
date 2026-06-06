from pathlib import Path
from library.loader import load_tree
from library.refs import extract_refs

FIXTURE = Path(__file__).parents[1] / "fixtures/content"
RELEASE = "v26.0601"

def test_fixture_refs_are_closed():
    arts = load_tree(FIXTURE, release=RELEASE)
    present = {(a.id, a.version) for a in arts}
    for a in arts:
        for ref in extract_refs(a.data):
            assert (ref.to_id, ref.to_version) in present, f"{a.id} -> {ref.to_id}@{ref.to_version} missing"

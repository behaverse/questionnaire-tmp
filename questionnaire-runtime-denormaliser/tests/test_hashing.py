from denormaliser.hashing import canonical_hash


def test_hash_is_64_hex_lowercase():
    h = canonical_hash({"a": 1})
    assert len(h) == 64
    assert h == h.lower()
    assert all(c in "0123456789abcdef" for c in h)


def test_hash_is_key_order_independent():
    assert canonical_hash({"a": 1, "b": 2}) == canonical_hash({"b": 2, "a": 1})


def test_hash_distinguishes_different_values():
    assert canonical_hash({"a": 1}) != canonical_hash({"a": 2})


def test_hash_is_stable_for_known_input():
    # Locks the exact algorithm so the future Viewer Service matches.
    import hashlib
    obj = {"show_score": False, "scorer_impl_preference": ["wasm", "http"]}
    expected = hashlib.sha256(
        '{"scorer_impl_preference":["wasm","http"],"show_score":false}'.encode("utf-8")
    ).hexdigest()
    assert canonical_hash(obj) == expected

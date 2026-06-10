from viewer_service.tokens import mint_token, hash_token


def test_mint_token_is_long_and_unique():
    a, b = mint_token(), mint_token()
    assert a != b
    assert len(a) >= 32


def test_hash_token_is_stable_sha256_hex():
    import hashlib
    t = "abc"
    assert hash_token(t) == hashlib.sha256(b"abc").hexdigest()
    assert len(hash_token(t)) == 64

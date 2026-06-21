from identity_service.passwords import hash_password, verify_password


def test_hash_is_argon2id_and_verifies():
    h = hash_password("correct horse")
    assert h.startswith("$argon2id$")
    assert verify_password("correct horse", h) is True


def test_wrong_password_fails():
    h = hash_password("correct horse")
    assert verify_password("battery staple", h) is False


def test_hashes_are_salted_unique():
    assert hash_password("same") != hash_password("same")


def test_malformed_hash_returns_false():
    assert verify_password("x", "not-a-hash") is False

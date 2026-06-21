from identity_service.keys import generate_keypair
from identity_service.store import keys as kstore


def test_generate_keypair_shape():
    kid, jwk, pem = generate_keypair()
    assert isinstance(kid, str) and len(kid) >= 8
    assert jwk["kty"] == "OKP" and jwk["crv"] == "Ed25519"
    assert jwk["kid"] == kid and jwk["use"] == "sig" and jwk["alg"] == "EdDSA"
    assert "x" in jwk and "d" not in jwk          # public JWK only — no private scalar
    assert "BEGIN PRIVATE KEY" in pem


def test_insert_and_read_active_key(conn):
    kid, jwk, pem = generate_keypair()
    kstore.insert_key(conn, kid, "EdDSA", jwk, pem)
    active = kstore.active_keys(conn)
    assert [k["kid"] for k in active] == [kid]
    assert kstore.signing_key(conn)["kid"] == kid


def test_retire_others_leaves_one_active(conn):
    a = generate_keypair(); b = generate_keypair()
    kstore.insert_key(conn, a[0], "EdDSA", a[1], a[2])
    kstore.insert_key(conn, b[0], "EdDSA", b[1], b[2])
    kstore.retire_others(conn, keep_kid=b[0])
    assert [k["kid"] for k in kstore.active_keys(conn)] == [b[0]]

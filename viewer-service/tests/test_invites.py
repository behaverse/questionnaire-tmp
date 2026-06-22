import time
from viewer_service.invites import mint_invite, verify_invite

SECRET = "test-secret"


def _tok(**kw):
    kw.setdefault("participant_id", "P-1")
    kw.setdefault("deployment_id", "dep_1")
    kw.setdefault("ttl", 3600)
    return mint_invite(SECRET, **kw)


def test_mint_verify_roundtrip():
    tok = _tok()
    payload = verify_invite(SECRET, tok, deployment_id="dep_1")
    assert payload is not None
    assert payload["participant_id"] == "P-1" and payload["deployment_id"] == "dep_1"
    assert payload["exp"] > int(time.time())


def test_wrong_deployment_rejected():
    assert verify_invite(SECRET, _tok(), deployment_id="dep_OTHER") is None


def test_expired_rejected():
    tok = _tok(ttl=1, now=int(time.time()) - 10)
    assert verify_invite(SECRET, tok, deployment_id="dep_1") is None


def test_tampered_payload_rejected():
    tok = _tok()
    payload_b64, _, sig = tok.partition(".")
    flipped = payload_b64[:-1] + ("A" if payload_b64[-1] != "A" else "B")
    assert verify_invite(SECRET, f"{flipped}.{sig}", deployment_id="dep_1") is None


def test_tampered_signature_rejected():
    tok = _tok()
    payload_b64, _, sig = tok.partition(".")
    bad = sig[:-1] + ("A" if sig[-1] != "A" else "B")
    assert verify_invite(SECRET, f"{payload_b64}.{bad}", deployment_id="dep_1") is None


def test_wrong_secret_rejected():
    assert verify_invite("other-secret", _tok(), deployment_id="dep_1") is None


def test_garbage_and_empty():
    assert verify_invite(SECRET, "not-a-token", deployment_id="dep_1") is None
    assert verify_invite(SECRET, "", deployment_id="dep_1") is None
    assert verify_invite(SECRET, None, deployment_id="dep_1") is None


def test_empty_secret_fails_closed():
    tok = _tok()
    assert verify_invite("", tok, deployment_id="dep_1") is None

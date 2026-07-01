from viewer_service.replay_links import mint_replay, verify_replay

SECRET = "s3cr3t"


def test_round_trip():
    tok = mint_replay(SECRET, deployment_id="dep_1", session_id="sess_1", ttl=100, now=1000)
    p = verify_replay(SECRET, tok, now=1050)
    assert p is not None
    assert p["deployment_id"] == "dep_1" and p["session_id"] == "sess_1" and p["exp"] == 1100


def test_expired_returns_none():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=10, now=1000)
    assert verify_replay(SECRET, tok, now=1011) is None


def test_tampered_returns_none():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=100, now=1000)
    payload_b64, _, _sig = tok.partition(".")
    assert verify_replay(SECRET, payload_b64 + ".deadbeef", now=1000) is None


def test_wrong_secret_returns_none():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=100, now=1000)
    assert verify_replay("other", tok, now=1000) is None


def test_empty_secret_fails_closed():
    assert verify_replay("", "anything", now=1000) is None
    # minting with an empty secret still produces a string, but it can never verify
    tok = mint_replay("", deployment_id="d", session_id="s", ttl=100, now=1000)
    assert verify_replay("", tok, now=1000) is None


def test_garbage_token_returns_none():
    assert verify_replay(SECRET, None) is None
    assert verify_replay(SECRET, "no-dot") is None

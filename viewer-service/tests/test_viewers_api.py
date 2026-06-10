MANIFEST = {
    "viewer_id": "behaverse-web-viewer",
    "viewer_version": "v26.0610",
    "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
    "evaluator": {"language_version": "v1.0", "functions": ["if", "score"]},
    "widgets": ["choice.ordinal.single"],
    "scorer_impl_kinds": ["wasm", "http"],
}


def test_register_then_get_viewer(client):
    r = client.post("/v1/viewers", json=MANIFEST)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["viewer_id"] == "behaverse-web-viewer"
    assert body["viewer_version"] == "v26.0610"
    assert len(body["manifest_hash"]) == 64

    g = client.get("/v1/viewers/behaverse-web-viewer/v26.0610")
    assert g.status_code == 200
    assert g.json()["manifest"] == MANIFEST


def test_register_invalid_manifest_422(client):
    bad = {k: v for k, v in MANIFEST.items() if k != "scorer_impl_kinds"}
    r = client.post("/v1/viewers", json=bad)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_manifest"


def test_get_unknown_viewer_404(client):
    r = client.get("/v1/viewers/nope/v1")
    assert r.status_code == 404

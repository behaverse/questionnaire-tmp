_BODY = {
    "questionnaire_ref": "qst_x@v26.0101",
    "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
    "default_locale": "en", "available_locales": ["en"],
}


def _create(client, *, listed, preset="anonymous_link", title=None, active_until=None):
    body = {**_BODY, "mode_preset": preset, "listed": listed, "title": title}
    if active_until is not None:
        body["active_until"] = active_until
    return client.post("/v1/deployments", json=body).json()["deployment_id"]


def test_catalogue_lists_listed_open(client):
    dep_id = _create(client, listed=True, title="Open survey")
    client.headers.pop("authorization", None)            # public — no token needed
    r = client.get("/v1/catalogue")
    assert r.status_code == 200
    items = {i["deployment_id"]: i for i in r.json()["items"]}
    assert dep_id in items
    assert items[dep_id]["title"] == "Open survey" and items[dep_id]["auth"] == "none"


def test_catalogue_excludes_unlisted_and_invite(client):
    listed_id = _create(client, listed=True, title="A")
    unlisted_id = _create(client, listed=False)
    invite_id = _create(client, listed=True, preset="invite_link", title="B")
    items = {i["deployment_id"] for i in client.get("/v1/catalogue").json()["items"]}
    assert listed_id in items and unlisted_id not in items and invite_id not in items


def test_catalogue_excludes_closed(client):
    closed_id = _create(client, listed=True, title="Closed", active_until="2020-01-01T00:00:00Z")
    items = {i["deployment_id"] for i in client.get("/v1/catalogue").json()["items"]}
    assert closed_id not in items


def test_catalogue_title_falls_back_to_ref(client):
    dep_id = _create(client, listed=True, title=None)
    item = next(i for i in client.get("/v1/catalogue").json()["items"] if i["deployment_id"] == dep_id)
    assert item["title"] == "qst_x@v26.0101"

from viewer_service.store import deployments as dstore

_BODY = {
    "questionnaire_ref": "qst_x@v26.0101",
    "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
    "default_locale": "en", "available_locales": ["en"],
}


def _create(client, *, listed, preset="anonymous_link", title=None, description=None):
    return client.post("/v1/deployments", json={
        **_BODY, "mode_preset": preset, "listed": listed, "title": title,
        "description": description}).json()["deployment_id"]


def test_create_persists_listed_title_description(client, conn):
    dep_id = _create(client, listed=True, title="Wellbeing survey", description="A short check-in.")
    dep = dstore.get_deployment(conn, dep_id)
    assert dep["listed"] is True
    assert dep["title"] == "Wellbeing survey" and dep["description"] == "A short check-in."


def test_create_defaults_listed_false(client, conn):
    dep_id = _create(client, listed=False)
    assert dstore.get_deployment(conn, dep_id)["listed"] is False


def test_catalogue_candidates_filters_listed_and_auth(client, conn):
    listed_id = _create(client, listed=True, title="Listed")
    unlisted_id = _create(client, listed=False)
    invite_id = _create(client, listed=True, preset="invite_link", title="Invite-only")
    cands = dstore.list_catalogue_candidates(conn)
    ids = {c["deployment_id"] for c in cands}
    assert listed_id in ids
    assert unlisted_id not in ids                       # unlisted excluded
    assert invite_id not in ids                          # invite_link not browse-startable
    assert all((c["dimensions"] or {}).get("auth") in ("none", "identity") for c in cands)

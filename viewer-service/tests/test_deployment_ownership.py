"""Per-owner authorization: a researcher must not read/manage another researcher's deployment.

Before this, `require_researcher` proved role but not ownership, so any researcher token could list
and export EVERY deployment's participant data (cross-tenant IDOR). Every `{deployment_id}` researcher
route must resolve through `require_owned_deployment` — non-owners get 404 (existence not confirmable),
administrators get an override.
"""

_DEP_BODY = {"questionnaire_ref": "qst_mini@v26.0609",
             "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
             "default_locale": "en", "available_locales": ["en"]}


def _noauth(client):
    client.headers.pop("authorization", None)
    return client


def _create_as(client, auth_header, sub):
    r = client.post("/v1/deployments", json=_DEP_BODY,
                    headers=auth_header(["researcher"], sub=sub))
    assert r.status_code == 201, r.text
    return r.json()["deployment_id"]


def test_non_owner_researcher_gets_404_on_every_deployment_route(client, auth_header):
    c = _noauth(client)
    dep_id = _create_as(c, auth_header, sub="owner-A")
    other = auth_header(["researcher"], sub="intruder-B")

    # every researcher-gated, deployment-addressed route must hide A's deployment from B
    assert c.get(f"/v1/deployments/{dep_id}", headers=other).status_code == 404
    assert c.get(f"/v1/deployments/{dep_id}/export.csv", headers=other).status_code == 404
    assert c.get(f"/v1/deployments/{dep_id}/metrics", headers=other).status_code == 404
    assert c.get(f"/v1/deployments/{dep_id}/sessions", headers=other).status_code == 404
    assert c.get(f"/v1/deployments/{dep_id}/comments", headers=other).status_code == 404
    assert c.get(f"/v1/deployments/{dep_id}/comments.csv", headers=other).status_code == 404
    assert c.get(f"/v1/deployments/{dep_id}/recordings", headers=other).status_code == 404
    assert c.patch(f"/v1/deployments/{dep_id}", json={"quota": {"max_sessions": 1}},
                   headers=other).status_code == 404
    assert c.post(f"/v1/deployments/{dep_id}/invites", json={"participant_id": "p1"},
                  headers=other).status_code == 404
    assert c.post(f"/v1/deployments/{dep_id}/runtime",
                  json={"viewer_id": "web", "viewer_version": "v26.0610"},
                  headers=other).status_code == 404
    assert c.post(f"/v1/deployments/{dep_id}/sessions/s-x/replay-link",
                  headers=other).status_code == 404


def test_owner_still_has_access(client, auth_header):
    c = _noauth(client)
    dep_id = _create_as(c, auth_header, sub="owner-A")
    owner = auth_header(["researcher"], sub="owner-A")
    assert c.get(f"/v1/deployments/{dep_id}", headers=owner).status_code == 200
    assert c.get(f"/v1/deployments/{dep_id}/metrics", headers=owner).status_code == 200
    assert c.get(f"/v1/deployments/{dep_id}/export.csv", headers=owner).status_code == 200


def test_list_is_scoped_to_owner_admin_sees_all(client, auth_header):
    c = _noauth(client)
    dep_a = _create_as(c, auth_header, sub="owner-A")
    dep_b = _create_as(c, auth_header, sub="owner-B")

    a_items = c.get("/v1/deployments", headers=auth_header(["researcher"], sub="owner-A")).json()["items"]
    a_ids = {d["deployment_id"] for d in a_items}
    assert dep_a in a_ids and dep_b not in a_ids

    all_ids = {d["deployment_id"] for d in
               c.get("/v1/deployments", headers=auth_header(["administrator"], sub="root")).json()["items"]}
    assert {dep_a, dep_b} <= all_ids


def test_administrator_override_reads_any_deployment(client, auth_header):
    c = _noauth(client)
    dep_id = _create_as(c, auth_header, sub="owner-A")
    admin = auth_header(["administrator"], sub="root")
    assert c.get(f"/v1/deployments/{dep_id}", headers=admin).status_code == 200
    assert c.get(f"/v1/deployments/{dep_id}/export.csv", headers=admin).status_code == 200

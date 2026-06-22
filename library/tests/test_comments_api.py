import pytest


@pytest.fixture
def qid(conn):
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_c','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_c','v26.0101','questionnaire','published','C')")
    conn.commit()
    return "qst_c"


def test_post_requires_token(client, qid):
    assert client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "hi"}).status_code == 401


def test_post_unknown_qid_404(client, auth_header):
    r = client.post("/v1/questionnaires/qst_missing/comments", json={"body": "hi"},
                    headers=auth_header(["participant"]))
    assert r.status_code == 404


def test_post_and_list_threaded(client, qid, auth_header):
    h = auth_header(["participant"], sub="alice")
    top = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "top"}, headers=h)
    assert top.status_code == 201, top.text
    top_id = top.json()["id"]
    reply = client.post(f"/v1/questionnaires/{qid}/comments",
                        json={"body": "reply", "parent_id": top_id}, headers=h)
    assert reply.status_code == 201
    listing = client.get(f"/v1/questionnaires/{qid}/comments").json()
    assert len(listing["comments"]) == 1
    assert listing["comments"][0]["body"] == "top"
    assert listing["comments"][0]["author_name"] == "alice"
    assert [r["body"] for r in listing["comments"][0]["replies"]] == ["reply"]


def test_empty_body_422(client, qid, auth_header):
    r = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "  "},
                    headers=auth_header(["participant"]))
    assert r.status_code == 422


def test_reply_to_reply_rejected(client, qid, auth_header):
    h = auth_header(["participant"])
    top_id = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "t"}, headers=h).json()["id"]
    reply_id = client.post(f"/v1/questionnaires/{qid}/comments",
                           json={"body": "r", "parent_id": top_id}, headers=h).json()["id"]
    bad = client.post(f"/v1/questionnaires/{qid}/comments",
                      json={"body": "rr", "parent_id": reply_id}, headers=h)
    assert bad.status_code == 422


def test_delete_by_author_then_admin_then_stranger(client, qid, auth_header):
    owner = auth_header(["participant"], sub="alice")
    cid = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "mine"}, headers=owner).json()["id"]
    # stranger cannot delete
    assert client.delete(f"/v1/comments/{cid}", headers=auth_header(["participant"], sub="bob")).status_code == 403
    # author can (soft-delete → tombstone in listing)
    assert client.delete(f"/v1/comments/{cid}", headers=owner).status_code == 204
    listing = client.get(f"/v1/questionnaires/{qid}/comments").json()
    assert listing["comments"][0]["deleted"] is True
    assert listing["comments"][0]["body"] is None and listing["comments"][0]["author_name"] is None
    # admin can delete anyone's
    cid2 = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "x"},
                       headers=auth_header(["participant"], sub="carol")).json()["id"]
    assert client.delete(f"/v1/comments/{cid2}", headers=auth_header(["administrator"], sub="admin")).status_code == 204


def test_tombstone_preserves_replies(client, qid, auth_header):
    h = auth_header(["participant"], sub="alice")
    top_id = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "t"}, headers=h).json()["id"]
    client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "r", "parent_id": top_id}, headers=h)
    client.delete(f"/v1/comments/{top_id}", headers=h)
    top = client.get(f"/v1/questionnaires/{qid}/comments").json()["comments"][0]
    assert top["deleted"] is True and [r["body"] for r in top["replies"]] == ["r"]


def test_delete_malformed_comment_id_404(client, auth_header):
    r = client.delete("/v1/comments/not-a-uuid", headers=auth_header(["participant"]))
    assert r.status_code == 404


def test_post_malformed_parent_id_422(client, qid, auth_header):
    h = auth_header(["participant"])
    r = client.post(f"/v1/questionnaires/{qid}/comments",
                    json={"body": "x", "parent_id": "not-a-uuid"}, headers=h)
    assert r.status_code == 422

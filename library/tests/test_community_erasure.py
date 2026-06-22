import pytest


@pytest.fixture
def qid(conn):
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_e','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_e','v26.0101','questionnaire','published','E')")
    conn.commit()
    return "qst_e"


def test_erasure_requires_token(client):
    assert client.delete("/v1/me/community-data").status_code == 401


def test_erasure_removes_user_data_preserves_threads(client, qid, auth_header):
    alice = auth_header(["participant"], sub="alice")
    bob = auth_header(["participant"], sub="bob")
    top = client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "alice-top"}, headers=alice).json()["id"]
    # bob replies to alice's comment
    client.post(f"/v1/questionnaires/{qid}/comments", json={"body": "bob-reply", "parent_id": top}, headers=bob)
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 5}, headers=alice)

    res = client.delete("/v1/me/community-data", headers=alice).json()
    assert res["comments_tombstoned"] == 1 and res["ratings_deleted"] == 1

    listing = client.get(f"/v1/questionnaires/{qid}/comments").json()["comments"]
    assert listing[0]["deleted"] is True and listing[0]["body"] is None       # alice's comment tombstoned
    assert [r["body"] for r in listing[0]["replies"]] == ["bob-reply"]        # bob's reply preserved
    assert client.get(f"/v1/questionnaires/{qid}/rating").json()["count"] == 0  # alice's rating gone

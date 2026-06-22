import pytest


@pytest.fixture
def qid(conn):
    conn.execute("INSERT INTO entity (id, version, entity_type) VALUES "
                 "('qst_r','v26.0101','questionnaire')")
    conn.execute("INSERT INTO catalogue_entry (id, version, entity_type, status, title) VALUES "
                 "('qst_r','v26.0101','questionnaire','published','R')")
    conn.commit()
    return "qst_r"


def test_put_requires_token(client, qid):
    assert client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 4}).status_code == 401


def test_put_unknown_qid_404(client, auth_header):
    assert client.put("/v1/questionnaires/none/rating", json={"score": 4},
                      headers=auth_header(["participant"])).status_code == 404


def test_score_out_of_range_422(client, qid, auth_header):
    h = auth_header(["participant"])
    assert client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 0}, headers=h).status_code == 422
    assert client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 6}, headers=h).status_code == 422


def test_upsert_and_summary(client, qid, auth_header):
    a = auth_header(["participant"], sub="alice")
    b = auth_header(["participant"], sub="bob")
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 5}, headers=a)
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 3}, headers=a)   # re-rate upserts
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 1}, headers=b)
    s = client.get(f"/v1/questionnaires/{qid}/rating").json()
    assert s["count"] == 2 and s["mean"] == 2.0
    assert s["histogram"]["3"] == 1 and s["histogram"]["1"] == 1
    assert "my_score" not in s or s.get("my_score") is None            # no token → no my_score
    mine = client.get(f"/v1/questionnaires/{qid}/rating", headers=a).json()
    assert mine["my_score"] == 3


def test_delete_own_rating(client, qid, auth_header):
    a = auth_header(["participant"], sub="alice")
    client.put(f"/v1/questionnaires/{qid}/rating", json={"score": 5}, headers=a)
    assert client.delete(f"/v1/questionnaires/{qid}/rating", headers=a).status_code == 200
    assert client.get(f"/v1/questionnaires/{qid}/rating").json()["count"] == 0
    # idempotent
    assert client.delete(f"/v1/questionnaires/{qid}/rating", headers=a).status_code == 200

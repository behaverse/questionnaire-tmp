from pathlib import Path
from viewer_service.export_csv import response_columns, to_csv, _cell

SCHEMAS = str(Path(__file__).resolve().parents[2] / "schemas")


def test_response_columns_order_and_count():
    cols = response_columns(SCHEMAS)
    assert len(cols) == 72
    assert cols[0] == "response_id"
    assert cols[-1] == "extensions"
    assert "session_id" in cols and "stimulus_type" in cols


def test_cell_rendering():
    assert _cell(None) == ""
    assert _cell(5) == "5"
    assert _cell("x") == "x"
    assert _cell(True) == "True"
    assert _cell({"a": 1}) == '{"a":1}'
    assert _cell([1, 2]) == "[1,2]"


def test_to_csv_header_then_rows():
    cols = ("response_id", "agent_id", "extensions")
    rows = [{"response_id": 1, "agent_id": "a1", "extensions": {"k": "v"}},
            {"response_id": 2, "agent_id": "a2"}]  # missing 'extensions' -> empty cell
    lines = "".join(to_csv(rows, cols)).splitlines()
    assert lines[0] == "response_id,agent_id,extensions"
    assert lines[1] == '1,a1,"{""k"":""v""}"'   # csv quotes the JSON cell (contains ")
    assert lines[2] == "2,a2,"                    # absent extensions -> trailing empty


def test_to_csv_is_streaming_generator():
    import types
    assert isinstance(to_csv([], ("response_id",)), types.GeneratorType)

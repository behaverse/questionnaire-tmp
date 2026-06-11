import csv
import io
import json
from collections.abc import Iterable, Iterator
from functools import lru_cache
from pathlib import Path


@lru_cache(maxsize=4)
def response_columns(schemas_dir_str: str) -> tuple[str, ...]:
    """The fixed CSV column set: every Schema 5 Response property, in declared order.
    Derived from the schema so it stays in sync with Schema 5 / BDM."""
    schema = json.loads((Path(schemas_dir_str) / "response" / "schema.json").read_text())
    return tuple(schema["$defs"]["Response"]["properties"].keys())


def _cell(v) -> str:
    """Render one CSV cell: None -> empty; object/array -> compact JSON string; scalar -> str."""
    if v is None:
        return ""
    if isinstance(v, (dict, list)):
        return json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    return str(v)


def _flush(buf: io.StringIO) -> str:
    line = buf.getvalue()
    buf.seek(0)
    buf.truncate(0)
    return line


def to_csv(rows: Iterable[dict], columns) -> Iterator[str]:
    """Stream a BDM-native CSV: a header line of `columns`, then one line per row (cells
    pulled by column name; absent fields render empty). Constant-memory (one reused buffer)."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(columns)
    yield _flush(buf)
    for row in rows:
        writer.writerow([_cell(row.get(c)) for c in columns])
        yield _flush(buf)

def simple_content(row: dict, langs: list[str], field: str = "text") -> dict:
    out = {}
    for lang in langs:
        val = row.get(f"text_{lang}")
        if val:
            out[lang] = {"status": "complete", field: val}
    return out

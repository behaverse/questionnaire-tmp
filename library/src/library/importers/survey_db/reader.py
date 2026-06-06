import sqlite3
from collections import defaultdict
from pathlib import Path

class SurveyDB:
    def __init__(self, path: Path):
        self._con = sqlite3.connect(str(path))
        self._con.row_factory = sqlite3.Row

    def _rows(self, sql: str) -> list[dict]:
        return [dict(r) for r in self._con.execute(sql)]

    def prompts(self): return self._rows("SELECT * FROM prompts")
    def contexts(self): return self._rows("SELECT * FROM contexts")
    def instructions(self): return self._rows("SELECT * FROM instructions")
    def messages(self): return self._rows("SELECT * FROM messages")
    def placeholders(self): return self._rows("SELECT * FROM placeholders")
    def helps(self): return self._rows("SELECT * FROM help_texts")
    def regexes(self): return self._rows("SELECT * FROM regex_patterns")
    def solutions(self): return self._rows("SELECT * FROM solutions")
    def compositions(self): return self._rows("SELECT * FROM compositions ORDER BY id")

    def surveys(self) -> dict:
        return {r["survey_id"]: r for r in self._rows("SELECT * FROM surveys")}

    def options_grouped(self) -> dict:
        groups = defaultdict(list)
        for r in self._rows("SELECT * FROM options ORDER BY option_id, [index]"):
            if r.get("option_id"):
                groups[r["option_id"]].append(r)
        return dict(groups)

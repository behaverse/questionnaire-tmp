import json
from dataclasses import dataclass, field, asdict
from pathlib import Path

@dataclass
class LossReport:
    entries: list = field(default_factory=list)
    preserved: dict = field(default_factory=dict)

    def add(self, category: str, source: str, detail: str) -> None:
        assert category in {"dropped", "approximated", "preserved", "warning"}
        self.entries.append({"category": category, "source": source, "detail": detail})

    def preserve(self, kind: str, n: int) -> None:
        self.preserved[kind] = n

    def write(self, out_dir: Path) -> None:
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "loss_report.json").write_text(json.dumps(asdict(self), indent=2, sort_keys=True))
        lines = ["# Import loss report", "", "## Preserved"]
        lines += [f"- {k}: {v}" for k, v in sorted(self.preserved.items())]
        for cat in ("dropped", "approximated", "warning"):
            rows = [e for e in self.entries if e["category"] == cat]
            lines += ["", f"## {cat} ({len(rows)})"] + [f"- `{e['source']}` — {e['detail']}" for e in rows]
        (out_dir / "loss_report.md").write_text("\n".join(lines) + "\n")

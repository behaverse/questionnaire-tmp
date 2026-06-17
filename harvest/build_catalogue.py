#!/usr/bin/env python3
"""Build the shared-scales dedup catalogue + fingerprint index from a content corpus.

Usage:
    python3 harvest/build_catalogue.py [CORPUS_DIR]   # default: harvest/_corpus

Reads every Option (`<corpus>/options/*.json`), computes a stable fingerprint over
(input_data_type, measurement_type, selection, values, normalized en anchor texts),
and writes:
  - harvest/scales-index.json   machine-readable {fingerprint: {id, points, ...}}
  - harvest/scales-catalogue.md human-readable table, sorted by dimension then points

Regenerate the corpus first with the survey_db importer (see harvest/open-questions.md Q3):
    PYTHONPATH=library/src python3 -c "from library.importers.survey_db.run import \
        import_survey_db; import_survey_db('survey_database/data/survey_db.sqlite', \
        'harvest/_corpus', 'v26.0606', '2026-06-06T00:00:00Z')"

Fingerprint collisions across DIFFERENT ids reveal duplicate scales — reuse one ref.
"""
import json, hashlib, glob, sys, os
from collections import Counter

# Scan the regenerable survey_db baseline AND the tracked hand-curated harvest output,
# so harvested scales are dedup-visible to later instruments. Override dirs via argv.
CORPORA = sys.argv[1:] if len(sys.argv) > 1 else ["harvest/_corpus", "harvest/output"]
HERE = os.path.dirname(__file__)

def norm(s): return " ".join(str(s).strip().lower().split())

def fingerprint(o: dict) -> str:
    en = (o.get("content", {}).get("en") or {})
    anchors = [norm(a.get("text", "")) for a in (en.get("options") or [])]
    values = [a.get("value") for a in (o.get("options") or [])]
    base = [o.get("input_data_type"), o.get("measurement_type"), o.get("selection")]
    # Anchored choice scales (the Likert case) dedup on values + anchor wording, so
    # wording-identical scales merge regardless of dimension label. Choice-less inputs
    # (free text / number) have no anchors to compare → fall back to dimension + units
    # so distinct fields (minutes vs weight vs years) don't collapse together.
    if anchors:
        payload = base + [values, anchors]
    else:
        payload = base + [o.get("dimension"), norm(en.get("units", ""))]
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]

def main():
    rows, index = [], {}
    files = []
    for c in CORPORA:
        files += sorted(glob.glob(os.path.join(c, "options", "*.json")))
    for fp in files:
        o = json.load(open(fp))
        en = (o.get("content", {}).get("en") or {})
        anchors = [a.get("text", "") for a in (en.get("options") or [])]
        f = fingerprint(o)
        index.setdefault(f, []).append(o["id"])
        rows.append((o["id"], len(o.get("options") or []),
                     f'{o.get("input_data_type")}/{o.get("measurement_type")}',
                     o.get("selection") or "", o.get("dimension") or "",
                     " · ".join(anchors[:8]) + (" …" if len(anchors) > 8 else ""), f))

    # index keyed by fingerprint; lists expose duplicates
    json.dump({k: sorted(v) for k, v in sorted(index.items())},
              open(os.path.join(HERE, "scales-index.json"), "w"),
              indent=2, ensure_ascii=False)

    dups = {k: v for k, v in index.items() if len(v) > 1}
    rows.sort(key=lambda r: (r[4] or "~", r[1]))
    out = ["# Shared Scales Catalogue (dedup aid)", "",
           f"Auto-generated from `{', '.join(CORPORA)}` by `harvest/build_catalogue.py`. Check here (or the",
           "fingerprint in `scales-index.json`) before minting a new Option. Exact normalized",
           "match → reuse the ref; difference → new scale (flag borderline for owner review).", "",
           f"**{len(rows)} Options indexed · {len(dups)} fingerprint collisions (existing duplicates).**",
           "Fingerprint = sha256 of (input_data_type, measurement_type, selection, values, normalized en anchors).", ""]
    if dups:
        out += ["## Existing duplicates (same scale, multiple ids — reuse one)", ""]
        for k, v in sorted(dups.items()):
            out.append(f"- `{k}` → {', '.join('`%s`' % i for i in sorted(v))}")
        out.append("")
    out += ["## All scales", "",
            "| Option id | Pts | Type/meas. | Sel. | Dimension | Anchors (en) | fp |",
            "|-----------|-----|-----------|------|-----------|--------------|----|"]
    for r in rows:
        out.append("| `%s` | %s | %s | %s | %s | %s | `%s` |" % r)
    open(os.path.join(HERE, "scales-catalogue.md"), "w").write("\n".join(out) + "\n")
    print(f"indexed {len(rows)} options; {len(dups)} duplicate fingerprints")
    print("by points:", dict(sorted(Counter(r[1] for r in rows).items())))

if __name__ == "__main__":
    main()

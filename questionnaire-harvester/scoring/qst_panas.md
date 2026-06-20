# Scoring — Positive and Negative Affect Schedule (PANAS) (`qst_panas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_panas",
  "title": "Positive and Negative Affect Schedule (PANAS)",
  "short_title": "PANAS",
  "source_url": "https://us.psytoolkit.org/survey-library/panas.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "howmuch"
  ],
  "option_scales": [
    {
      "ref": "opt_panas_howmuch_5",
      "dimension": "howmuch",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Very slightly<br>or not at all",
        "A little",
        "Moderately",
        "Quite a bit",
        "Extremely"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_panas_1",
      "prompt_snippet": "Interested",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_panas_2",
      "prompt_snippet": "Distressed",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_panas_3",
      "prompt_snippet": "Excited",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_panas_4",
      "prompt_snippet": "Upset",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_panas_5",
      "prompt_snippet": "Strong",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_panas_6",
      "prompt_snippet": "Guilty",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_panas_7",
      "prompt_snippet": "Scared",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_panas_8",
      "prompt_snippet": "Hostile",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_panas_9",
      "prompt_snippet": "Ethusiastic",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_panas_10",
      "prompt_snippet": "Proud",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_panas_11",
      "prompt_snippet": "Irritable",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_panas_12",
      "prompt_snippet": "Alert",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_panas_13",
      "prompt_snippet": "Ashamed",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_panas_14",
      "prompt_snippet": "Inspired",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_panas_15",
      "prompt_snippet": "Nervous",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_panas_16",
      "prompt_snippet": "Determined",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_panas_17",
      "prompt_snippet": "Attentive",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_panas_18",
      "prompt_snippet": "Jittery",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_panas_19",
      "prompt_snippet": "Active",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_panas_20",
      "prompt_snippet": "Afraid",
      "dimension": "howmuch",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": false
    }
  ],
  "to_research": {
    "aggregation": null,
    "subscale_definitions": null,
    "cutoffs": null,
    "notes": null
  }
}
```

## Known structure

- Items: 20
- Dimensions: howmuch
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Interested | howmuch | 1,2,3,4,5 | no |
| 2 | Distressed | howmuch | 1,2,3,4,5 | no |
| 3 | Excited | howmuch | 1,2,3,4,5 | no |
| 4 | Upset | howmuch | 1,2,3,4,5 | no |
| 5 | Strong | howmuch | 1,2,3,4,5 | no |
| 6 | Guilty | howmuch | 1,2,3,4,5 | no |
| 7 | Scared | howmuch | 1,2,3,4,5 | no |
| 8 | Hostile | howmuch | 1,2,3,4,5 | no |
| 9 | Ethusiastic | howmuch | 1,2,3,4,5 | no |
| 10 | Proud | howmuch | 1,2,3,4,5 | no |
| 11 | Irritable | howmuch | 1,2,3,4,5 | no |
| 12 | Alert | howmuch | 1,2,3,4,5 | no |
| 13 | Ashamed | howmuch | 1,2,3,4,5 | no |
| 14 | Inspired | howmuch | 1,2,3,4,5 | no |
| 15 | Nervous | howmuch | 1,2,3,4,5 | no |
| 16 | Determined | howmuch | 1,2,3,4,5 | no |
| 17 | Attentive | howmuch | 1,2,3,4,5 | no |
| 18 | Jittery | howmuch | 1,2,3,4,5 | no |
| 19 | Active | howmuch | 1,2,3,4,5 | no |
| 20 | Afraid | howmuch | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/panas.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

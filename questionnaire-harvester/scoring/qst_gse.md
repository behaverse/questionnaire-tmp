# Scoring — Generalized Self Efficacy scale (GSE) (`qst_gse`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gse",
  "title": "Generalized Self Efficacy scale (GSE)",
  "short_title": "GSE",
  "source_url": "https://us.psytoolkit.org/survey-library/generalized-self-efficacy-gse.html",
  "publication": {
    "citation": "Bandura, A. (1986). Social foundations of thought and action: A social cognitive theory.\nEnglewood Cliffs, NJ: Prentice Hall.",
    "year": 1986
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "true"
  ],
  "option_scales": [
    {
      "ref": "opt_gse_true_4",
      "dimension": "true",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "not at all true",
        "hardly true",
        "moderately true",
        "exactly true"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gse_1",
      "prompt_snippet": "I can always manage to solve difficult problems if I try hard enough.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_gse_2",
      "prompt_snippet": "If someone opposes me, I can find the means and ways to get what I want.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_gse_3",
      "prompt_snippet": "I am certain that I can accomplish my goals.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_gse_4",
      "prompt_snippet": "I am confident that I could deal efficiently with unexpected events.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_gse_5",
      "prompt_snippet": "Thanks to my resourcefulness, I can handle unforeseen situations.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_gse_6",
      "prompt_snippet": "I can solve most problems if I invest the necessary effort.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_gse_7",
      "prompt_snippet": "I can remain calm when facing difficulties because I can rely on my coping abili",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_gse_8",
      "prompt_snippet": "When I am confronted with a problem, I can find several solutions.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_gse_9",
      "prompt_snippet": "If I am in trouble, I can think of a good solution.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_gse_10",
      "prompt_snippet": "I can handle whatever comes my way.",
      "dimension": "true",
      "values": [
        1,
        2,
        3,
        4
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

- Items: 10
- Dimensions: true
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I can always manage to solve difficult problems if I try hard enough. | true | 1,2,3,4 | no |
| 2 | If someone opposes me, I can find the means and ways to get what I want. | true | 1,2,3,4 | no |
| 3 | I am certain that I can accomplish my goals. | true | 1,2,3,4 | no |
| 4 | I am confident that I could deal efficiently with unexpected events. | true | 1,2,3,4 | no |
| 5 | Thanks to my resourcefulness, I can handle unforeseen situations. | true | 1,2,3,4 | no |
| 6 | I can solve most problems if I invest the necessary effort. | true | 1,2,3,4 | no |
| 7 | I can remain calm when facing difficulties because I can rely on my coping abili | true | 1,2,3,4 | no |
| 8 | When I am confronted with a problem, I can find several solutions. | true | 1,2,3,4 | no |
| 9 | If I am in trouble, I can think of a good solution. | true | 1,2,3,4 | no |
| 10 | I can handle whatever comes my way. | true | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/generalized-self-efficacy-gse.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

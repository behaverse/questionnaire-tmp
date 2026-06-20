# Scoring — BIG5 Ten Item Personality Inventory (TIPI) (`qst_tipi`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_tipi",
  "title": "BIG5 Ten Item Personality Inventory (TIPI)",
  "short_title": "TIPI",
  "source_url": "https://us.psytoolkit.org/survey-library/big5-tipi.html",
  "publication": {
    "citation": "S. D. Gosling, P. J. Rentfrow, and W. B. Swann Jr. (2003). A very\nbrief measure of the Big-Five personality domains. Journal of Research\nin Personality, 37 , 504-528.",
    "year": 2003
  },
  "status": "needs-research",
  "item_count": 10,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_tipi_agree_7",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "value_range": [
        1,
        7
      ],
      "anchors": [
        "Disagree strongly",
        "Disagree moderately",
        "Disagree a little",
        "Neither agree nor disagree",
        "Agree a little",
        "Agree moderately",
        "Agree strongly"
      ]
    }
  ],
  "reversed_items": [
    "pr_tipi_2",
    "pr_tipi_4",
    "pr_tipi_6",
    "pr_tipi_8",
    "pr_tipi_10"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_tipi_1",
      "prompt_snippet": "Extroverted, enthusiastic",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_tipi_2",
      "prompt_snippet": "Critical, quarrelsome",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_tipi_3",
      "prompt_snippet": "Dependable, self-disciplined",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_tipi_4",
      "prompt_snippet": "Anxious, easily upset",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_tipi_5",
      "prompt_snippet": "Open to new experiences, complex",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_tipi_6",
      "prompt_snippet": "Reserved, quiet",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_tipi_7",
      "prompt_snippet": "Sympathetic, warm",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_tipi_8",
      "prompt_snippet": "Disorganized, careless",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 9,
      "prompt_id": "pr_tipi_9",
      "prompt_snippet": "Calm, emotionally stable",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_tipi_10",
      "prompt_snippet": "Conventional, uncreative",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
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
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_tipi_2, pr_tipi_4, pr_tipi_6, pr_tipi_8, pr_tipi_10
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Extroverted, enthusiastic | agree | 1,2,3,4,5,6,7 | no |
| 2 | Critical, quarrelsome | agree | 1,2,3,4,5,6,7 | yes |
| 3 | Dependable, self-disciplined | agree | 1,2,3,4,5,6,7 | no |
| 4 | Anxious, easily upset | agree | 1,2,3,4,5,6,7 | yes |
| 5 | Open to new experiences, complex | agree | 1,2,3,4,5,6,7 | no |
| 6 | Reserved, quiet | agree | 1,2,3,4,5,6,7 | yes |
| 7 | Sympathetic, warm | agree | 1,2,3,4,5,6,7 | no |
| 8 | Disorganized, careless | agree | 1,2,3,4,5,6,7 | yes |
| 9 | Calm, emotionally stable | agree | 1,2,3,4,5,6,7 | no |
| 10 | Conventional, uncreative | agree | 1,2,3,4,5,6,7 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/big5-tipi.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

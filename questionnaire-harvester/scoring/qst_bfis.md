# Scoring — Short 15-item Big Five Inventory (BFI-S) (`qst_bfis`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bfis",
  "title": "Short 15-item Big Five Inventory (BFI-S)",
  "short_title": "BFI-S",
  "source_url": "https://us.psytoolkit.org/survey-library/big5-bfi-s.html",
  "publication": {
    "citation": "Lang, F. R., John, D., Ludtke, O., Schupp, J., & Wagner, G. G. (2011). Short assessment of the Big Five: robust accros survey methods except telephone interviewing. Behavior Research Methods, 43 , 548-567.",
    "year": 2011
  },
  "status": "needs-research",
  "item_count": 15,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_bfis_agree_7",
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
        "strongly disagree",
        "disagree",
        "somewhat disagree",
        "neither agree nor disagree",
        "somewhat agree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_bfis_3",
    "pr_bfis_6",
    "pr_bfis_10",
    "pr_bfis_14"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bfis_1",
      "prompt_snippet": "worries a lot",
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
      "prompt_id": "pr_bfis_2",
      "prompt_snippet": "gets nervous easily",
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
      "index": 3,
      "prompt_id": "pr_bfis_3",
      "prompt_snippet": "remains calm in tense situations",
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
      "index": 4,
      "prompt_id": "pr_bfis_4",
      "prompt_snippet": "is talkative",
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
      "index": 5,
      "prompt_id": "pr_bfis_5",
      "prompt_snippet": "is outgoing, sociable",
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
      "prompt_id": "pr_bfis_6",
      "prompt_snippet": "is reserved",
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
      "prompt_id": "pr_bfis_7",
      "prompt_snippet": "is original, comes up with new ideas",
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
      "prompt_id": "pr_bfis_8",
      "prompt_snippet": "values artistic, aesthetic experiences",
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
      "index": 9,
      "prompt_id": "pr_bfis_9",
      "prompt_snippet": "has an active imagination",
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
      "prompt_id": "pr_bfis_10",
      "prompt_snippet": "is sometimes rude to others",
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
      "index": 11,
      "prompt_id": "pr_bfis_11",
      "prompt_snippet": "has a forgiving nature",
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
      "index": 12,
      "prompt_id": "pr_bfis_12",
      "prompt_snippet": "is considerate and kind to almost everyone",
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
      "index": 13,
      "prompt_id": "pr_bfis_13",
      "prompt_snippet": "does a thorough job",
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
      "index": 14,
      "prompt_id": "pr_bfis_14",
      "prompt_snippet": "tends to be lazy",
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
      "index": 15,
      "prompt_id": "pr_bfis_15",
      "prompt_snippet": "does things efficiently",
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

- Items: 15
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_bfis_3, pr_bfis_6, pr_bfis_10, pr_bfis_14
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | worries a lot | agree | 1,2,3,4,5,6,7 | no |
| 2 | gets nervous easily | agree | 1,2,3,4,5,6,7 | no |
| 3 | remains calm in tense situations | agree | 1,2,3,4,5,6,7 | yes |
| 4 | is talkative | agree | 1,2,3,4,5,6,7 | no |
| 5 | is outgoing, sociable | agree | 1,2,3,4,5,6,7 | no |
| 6 | is reserved | agree | 1,2,3,4,5,6,7 | yes |
| 7 | is original, comes up with new ideas | agree | 1,2,3,4,5,6,7 | no |
| 8 | values artistic, aesthetic experiences | agree | 1,2,3,4,5,6,7 | no |
| 9 | has an active imagination | agree | 1,2,3,4,5,6,7 | no |
| 10 | is sometimes rude to others | agree | 1,2,3,4,5,6,7 | yes |
| 11 | has a forgiving nature | agree | 1,2,3,4,5,6,7 | no |
| 12 | is considerate and kind to almost everyone | agree | 1,2,3,4,5,6,7 | no |
| 13 | does a thorough job | agree | 1,2,3,4,5,6,7 | no |
| 14 | tends to be lazy | agree | 1,2,3,4,5,6,7 | yes |
| 15 | does things efficiently | agree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/big5-bfi-s.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

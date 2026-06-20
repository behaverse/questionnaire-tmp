# Scoring — Gratitude (GQ-6) (`qst_gq6`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gq6",
  "title": "Gratitude (GQ-6)",
  "short_title": "GQ-6",
  "source_url": "https://us.psytoolkit.org/survey-library/gratitude-gq6.html",
  "publication": {
    "citation": "McCullough, M. E., Emmons, R. A., & Tsang, J. (2002). The grateful\ndisposition: A conceptual and empirical topography. Journal of\nPersonality and Social Psychology, 82 , 112- 127.",
    "year": 2002
  },
  "status": "needs-research",
  "item_count": 6,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_gq6_agree_7",
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
        "slightly disagree",
        "neutral",
        "slightly agree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_gq6_3",
    "pr_gq6_6"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gq6_1",
      "prompt_snippet": "I have so much in life to be thankful for.",
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
      "prompt_id": "pr_gq6_2",
      "prompt_snippet": "If I had to list everything that I felt grateful for, it would be a very long li",
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
      "prompt_id": "pr_gq6_3",
      "prompt_snippet": "When I look at the world, I don’t see much to be grateful for.",
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
      "prompt_id": "pr_gq6_4",
      "prompt_snippet": "I am grateful to a wide variety of people.",
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
      "prompt_id": "pr_gq6_5",
      "prompt_snippet": "As I get older I find myself more able to appreciate the people, events, and sit",
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
      "prompt_id": "pr_gq6_6",
      "prompt_snippet": "Long amounts of time can go by before I feel grateful to something or someone.",
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

- Items: 6
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_gq6_3, pr_gq6_6
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I have so much in life to be thankful for. | agree | 1,2,3,4,5,6,7 | no |
| 2 | If I had to list everything that I felt grateful for, it would be a very long li | agree | 1,2,3,4,5,6,7 | no |
| 3 | When I look at the world, I don’t see much to be grateful for. | agree | 1,2,3,4,5,6,7 | yes |
| 4 | I am grateful to a wide variety of people. | agree | 1,2,3,4,5,6,7 | no |
| 5 | As I get older I find myself more able to appreciate the people, events, and sit | agree | 1,2,3,4,5,6,7 | no |
| 6 | Long amounts of time can go by before I feel grateful to something or someone. | agree | 1,2,3,4,5,6,7 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/gratitude-gq6.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

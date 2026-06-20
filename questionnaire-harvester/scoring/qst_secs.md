# Scoring — Political conservatism scale (SECS) (`qst_secs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_secs",
  "title": "Political conservatism scale (SECS)",
  "short_title": "SECS",
  "source_url": "https://us.psytoolkit.org/survey-library/political-conservatism.html",
  "publication": {
    "citation": "Everett, J.E. (2013). The 12 Item Social and Economic Conservatism\nScale\n(SECS). Open\naccess link here",
    "year": 2013
  },
  "status": "needs-research",
  "item_count": 12,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_secs_rating_1",
      "dimension": "rating",
      "measurement_type": "interval",
      "levels": 0,
      "values": [],
      "value_range": [],
      "anchors": []
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_secs_1",
      "prompt_snippet": "Abortion",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_secs_2",
      "prompt_snippet": "Limited government",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_secs_3",
      "prompt_snippet": "Military and national security",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_secs_4",
      "prompt_snippet": "Religion",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_secs_5",
      "prompt_snippet": "Welfare benefits",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_secs_6",
      "prompt_snippet": "Gun ownership",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_secs_7",
      "prompt_snippet": "Traditional marriage",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_secs_8",
      "prompt_snippet": "Traditional values",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_secs_9",
      "prompt_snippet": "Fiscal responsibility",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_secs_10",
      "prompt_snippet": "Business",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_secs_11",
      "prompt_snippet": "The family unit",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_secs_12",
      "prompt_snippet": "Patriotism",
      "dimension": "rating",
      "values": [],
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

- Items: 12
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Abortion | rating |  | no |
| 2 | Limited government | rating |  | no |
| 3 | Military and national security | rating |  | no |
| 4 | Religion | rating |  | no |
| 5 | Welfare benefits | rating |  | no |
| 6 | Gun ownership | rating |  | no |
| 7 | Traditional marriage | rating |  | no |
| 8 | Traditional values | rating |  | no |
| 9 | Fiscal responsibility | rating |  | no |
| 10 | Business | rating |  | no |
| 11 | The family unit | rating |  | no |
| 12 | Patriotism | rating |  | no |

## To research (fill from https://us.psytoolkit.org/survey-library/political-conservatism.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

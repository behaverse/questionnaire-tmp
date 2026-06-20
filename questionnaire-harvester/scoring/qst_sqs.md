# Scoring — Single-Item Sleep Quality Scale (SQS) (`qst_sqs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sqs",
  "title": "Single-Item Sleep Quality Scale (SQS)",
  "short_title": "SQS",
  "source_url": "https://us.psytoolkit.org/survey-library/single-item-sleep-quality-scale.html",
  "publication": {
    "citation": "Snyder, E., Cai, B., DeMuro, C., Morrison, M. F., & Ball, W. (2018). A new single-item sleep quality scale: results of psychometric evaluation in patients with chronic primary insomnia and depression. Journal of Clinical Sleep Medicine, 14(11), 1849-1857. Read full article for free here",
    "year": 2018
  },
  "status": "needs-research",
  "item_count": 1,
  "dimensions": [
    "sqsitems"
  ],
  "option_scales": [
    {
      "ref": "opt_sqs_sqsitems_11",
      "dimension": "sqsitems",
      "measurement_type": "ordinal",
      "levels": 11,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11
      ],
      "value_range": [
        1,
        11
      ],
      "anchors": [
        "<B>Terrible</B><BR>0",
        "<B>Poor</B><BR>1",
        "<B>Poor</B><BR>2",
        "<B>Poor</B><BR>3",
        "<B>Fair</B><BR>4",
        "<B>Fair</B><BR>5",
        "<B>Fair</B><BR>6",
        "<B>Good</B><BR>7",
        "<B>Good</B><BR>8",
        "<B>Good</B><BR>9",
        "<B>Excellent</B><BR>10"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sqs_1",
      "prompt_snippet": "During the <b>past 7 days</b>, how would you rate your sleep quality overall?",
      "dimension": "sqsitems",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11
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

- Items: 1
- Dimensions: sqsitems
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | During the <b>past 7 days</b>, how would you rate your sleep quality overall? | sqsitems | 1,2,3,4,5,6,7,8,9,10,11 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/single-item-sleep-quality-scale.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

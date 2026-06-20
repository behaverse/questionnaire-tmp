# Scoring — Subjective Happiness Scale (SHS) (`qst_shs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_shs",
  "title": "Subjective Happiness Scale (SHS)",
  "short_title": "SHS",
  "source_url": "https://us.psytoolkit.org/survey-library/happiness-shs.html",
  "publication": {
    "citation": "Lyubomirsky, S. & Lepper, H. S. (1999). A measure of subjective happines: Preliminary reliability and construct validation. Social indicators research, 46 , 137-155.",
    "year": 1999
  },
  "status": "needs-research",
  "item_count": 4,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_shs_rating_1",
      "dimension": "rating",
      "measurement_type": "interval",
      "levels": 0,
      "values": [],
      "value_range": [],
      "anchors": []
    },
    {
      "ref": "opt_shs_rating_2",
      "dimension": "rating",
      "measurement_type": "interval",
      "levels": 0,
      "values": [],
      "value_range": [],
      "anchors": []
    },
    {
      "ref": "opt_shs_rating_3",
      "dimension": "rating",
      "measurement_type": "interval",
      "levels": 0,
      "values": [],
      "value_range": [],
      "anchors": []
    }
  ],
  "reversed_items": [
    "pr_shs_4"
  ],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_shs_1",
      "prompt_snippet": "In general, I consider myself:",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_shs_2",
      "prompt_snippet": "Compared to most of my peers, I consider myself:",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_shs_3",
      "prompt_snippet": "Some people are generally very happy. They enjoy life regardless of what is goin",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_shs_4",
      "prompt_snippet": "Some people are generally not very happy. Although they are not depressed, they ",
      "dimension": "rating",
      "values": [],
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

- Items: 4
- Dimensions: rating
- Distinct scales: 3 (mixed)
- Reverse-scored items: pr_shs_4
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | In general, I consider myself: | rating |  | no |
| 2 | Compared to most of my peers, I consider myself: | rating |  | no |
| 3 | Some people are generally very happy. They enjoy life regardless of what is goin | rating |  | no |
| 4 | Some people are generally not very happy. Although they are not depressed, they  | rating |  | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/happiness-shs.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

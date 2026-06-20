# Scoring — Risk Propensity Scale (RPS) (`qst_rps`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_rps",
  "title": "Risk Propensity Scale (RPS)",
  "short_title": "RPS",
  "source_url": "https://us.psytoolkit.org/survey-library/risk-rps.html",
  "publication": {
    "citation": "Meertens, R. M. & Lion, R. (2008). Measuring an Individual’s\nTendency to Take Risks: The Risk Propensity Scale. Journal of Applied\nSocial Psychology, 38 (6) , 1506-1520.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 7,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_rps_rating_1",
      "dimension": "rating",
      "measurement_type": "interval",
      "levels": 0,
      "values": [],
      "value_range": [],
      "anchors": []
    },
    {
      "ref": "opt_rps_rating_2",
      "dimension": "rating",
      "measurement_type": "interval",
      "levels": 0,
      "values": [],
      "value_range": [],
      "anchors": []
    }
  ],
  "reversed_items": [
    "pr_rps_1",
    "pr_rps_2",
    "pr_rps_3",
    "pr_rps_5"
  ],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_rps_1",
      "prompt_snippet": "Safety first",
      "dimension": "rating",
      "values": [],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_rps_2",
      "prompt_snippet": "I do not take risks with my health",
      "dimension": "rating",
      "values": [],
      "reversed": true
    },
    {
      "index": 3,
      "prompt_id": "pr_rps_3",
      "prompt_snippet": "I prefer to avoid risks",
      "dimension": "rating",
      "values": [],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_rps_4",
      "prompt_snippet": "I take risks regularly",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_rps_5",
      "prompt_snippet": "I really dislike not knowing what is going to happen",
      "dimension": "rating",
      "values": [],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_rps_6",
      "prompt_snippet": "I usually view risks as a challenge",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_rps_7",
      "prompt_snippet": "I see myself as a ...",
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

- Items: 7
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: pr_rps_1, pr_rps_2, pr_rps_3, pr_rps_5
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Safety first | rating |  | yes |
| 2 | I do not take risks with my health | rating |  | yes |
| 3 | I prefer to avoid risks | rating |  | yes |
| 4 | I take risks regularly | rating |  | no |
| 5 | I really dislike not knowing what is going to happen | rating |  | yes |
| 6 | I usually view risks as a challenge | rating |  | no |
| 7 | I see myself as a ... | rating |  | no |

## To research (fill from https://us.psytoolkit.org/survey-library/risk-rps.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

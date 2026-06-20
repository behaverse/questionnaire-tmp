# Scoring — Loneliness (TILS) (`qst_tils`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_tils",
  "title": "Loneliness (TILS)",
  "short_title": "TILS",
  "source_url": "https://us.psytoolkit.org/survey-library/loneliness-tils.html",
  "publication": {
    "citation": "Ernst, J.M. & Cacioppo, J.T. (1999). Lonely hearts: Psychological perspectives on loneliness. Applied & Preventative Psychology, 8 (1) , 1-22.",
    "year": 1999
  },
  "status": "needs-research",
  "item_count": 3,
  "dimensions": [
    "tilsscale"
  ],
  "option_scales": [
    {
      "ref": "opt_tils_tilsscale_3",
      "dimension": "tilsscale",
      "measurement_type": "ordinal",
      "levels": 3,
      "values": [
        1,
        2,
        3
      ],
      "value_range": [
        1,
        3
      ],
      "anchors": [
        "Hardly ever",
        "Some of the time",
        "Often"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_tils_1",
      "prompt_snippet": "How often do you feel that you lack companionship?",
      "dimension": "tilsscale",
      "values": [
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_tils_2",
      "prompt_snippet": "How often do you feel left out?",
      "dimension": "tilsscale",
      "values": [
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_tils_3",
      "prompt_snippet": "How often do you feel isolated from others?",
      "dimension": "tilsscale",
      "values": [
        1,
        2,
        3
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

- Items: 3
- Dimensions: tilsscale
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | How often do you feel that you lack companionship? | tilsscale | 1,2,3 | no |
| 2 | How often do you feel left out? | tilsscale | 1,2,3 | no |
| 3 | How often do you feel isolated from others? | tilsscale | 1,2,3 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/loneliness-tils.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

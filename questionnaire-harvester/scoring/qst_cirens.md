# Scoring — Chronotype: Circadian Energy Scale (CIRENS) (`qst_cirens`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cirens",
  "title": "Chronotype: Circadian Energy Scale (CIRENS)",
  "short_title": "CIRENS",
  "source_url": "https://us.psytoolkit.org/survey-library/chronotype-cirens.html",
  "publication": {
    "citation": "Reference to the original MEQ: Horne and Ostberg (1976). A\nself-assessment questionnaire to determine morningness-eveningness in\nhuman circadian rhythms. International Journal of Chronobiology, 4 ,\n97–110.",
    "year": 1976
  },
  "status": "needs-research",
  "item_count": 2,
  "dimensions": [
    "energy"
  ],
  "option_scales": [
    {
      "ref": "opt_cirens_energy_5",
      "dimension": "energy",
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
        "very low",
        "low",
        "moderate",
        "high",
        "very high"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cirens_1",
      "prompt_snippet": "In the <b>morning</b>",
      "dimension": "energy",
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
      "prompt_id": "pr_cirens_2",
      "prompt_snippet": "In the <b>evening</b>",
      "dimension": "energy",
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

- Items: 2
- Dimensions: energy
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | In the <b>morning</b> | energy | 1,2,3,4,5 | no |
| 2 | In the <b>evening</b> | energy | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/chronotype-cirens.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

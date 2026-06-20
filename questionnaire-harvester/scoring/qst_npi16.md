# Scoring — Narcissism (16-item version) (`qst_npi16`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_npi16",
  "title": "Narcissism (16-item version)",
  "short_title": "16-item version",
  "source_url": "https://us.psytoolkit.org/survey-library/narcism-npi16.html",
  "publication": {
    "citation": "Ames, D.R., Rose, P., Anderson, C.P. (2006).The NPI-16 as a short\nmeasure of narcissism. Journal of Research in Personality, 40 ,\n440-450.",
    "year": 2006
  },
  "status": "needs-research",
  "item_count": 8,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_npi16_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "When people compliment me I sometimes get embarrassed",
        "I know that I am good because everybody keeps telling me so"
      ]
    },
    {
      "ref": "opt_npi16_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "I am no better or worse than most people",
        "I think I am a special person"
      ]
    },
    {
      "ref": "opt_npi16_rating_3",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "I don’t like it when I find myself manipulating people",
        "I find it easy to manipulate people"
      ]
    },
    {
      "ref": "opt_npi16_rating_4",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "I try not to be a show off",
        "I am apt to show off if I get the chance"
      ]
    },
    {
      "ref": "opt_npi16_rating_5",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Sometimes I tell good stories",
        "Everybody likes to hear my stories"
      ]
    },
    {
      "ref": "opt_npi16_rating_6",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "It makes me uncomfortable to be the center of attention",
        "I really like to be the center of attention"
      ]
    },
    {
      "ref": "opt_npi16_rating_7",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "I hope I am going to be successful",
        "I am going to be a great person"
      ]
    },
    {
      "ref": "opt_npi16_rating_8",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        0,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "There is a lot that I can learn from other people",
        "I am more capable than other people"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_npi16_shared",
      "prompt_snippet": "For each pair of statements, choose the one you identify with most.<br> If you d",
      "dimension": "rating",
      "values": [
        0,
        1
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

- Items: 8
- Dimensions: rating
- Distinct scales: 8 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |
| 2 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |
| 3 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |
| 4 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |
| 5 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |
| 6 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |
| 7 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |
| 8 | For each pair of statements, choose the one you identify with most.<br> If you d | rating | 0,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/narcism-npi16.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

# Scoring — Facebook Addition Scale (BFAS) (`qst_bfas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bfas",
  "title": "Facebook Addition Scale (BFAS)",
  "short_title": "BFAS",
  "source_url": "https://us.psytoolkit.org/survey-library/addiction-bergen-facebook.html",
  "publication": {
    "citation": "Andreassen, C.S., Torsheim, T., Brunborg, G.S., & Pallesen, S. (2010). Development of a Facebook addiction scale. Psychological Reports, 110 , 2, 501-517.",
    "year": 2010
  },
  "status": "needs-research",
  "item_count": 6,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_bfas_frequency_5",
      "dimension": "frequency",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "very rarely",
        "rarely",
        "sometimes",
        "often",
        "very often"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bfas_1",
      "prompt_snippet": "spent a lot of time thinking about Facebook or planned use of Facebook?",
      "dimension": "frequency",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_bfas_2",
      "prompt_snippet": "felt an urge to use Facebook more and more?",
      "dimension": "frequency",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_bfas_3",
      "prompt_snippet": "used Facebook in order to forget about personal problems?",
      "dimension": "frequency",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_bfas_4",
      "prompt_snippet": "tried to cut down on the use of Facebook without success?",
      "dimension": "frequency",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_bfas_5",
      "prompt_snippet": "become restless or troubled if you have been prohibited from using Facebook?",
      "dimension": "frequency",
      "values": [
        0,
        0,
        1,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_bfas_6",
      "prompt_snippet": "used Facebook so much that it has had a negative impact on your job/studies?",
      "dimension": "frequency",
      "values": [
        0,
        0,
        1,
        1,
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

- Items: 6
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | spent a lot of time thinking about Facebook or planned use of Facebook? | frequency | 0,0,1,1,1 | no |
| 2 | felt an urge to use Facebook more and more? | frequency | 0,0,1,1,1 | no |
| 3 | used Facebook in order to forget about personal problems? | frequency | 0,0,1,1,1 | no |
| 4 | tried to cut down on the use of Facebook without success? | frequency | 0,0,1,1,1 | no |
| 5 | become restless or troubled if you have been prohibited from using Facebook? | frequency | 0,0,1,1,1 | no |
| 6 | used Facebook so much that it has had a negative impact on your job/studies? | frequency | 0,0,1,1,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/addiction-bergen-facebook.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

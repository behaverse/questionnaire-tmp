# Scoring — Need for Cognition (NCS-6) (`qst_ncs6`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ncs6",
  "title": "Need for Cognition (NCS-6)",
  "short_title": "NCS-6",
  "source_url": "https://us.psytoolkit.org/survey-library/need-for-cognition-ncs6.html",
  "publication": {
    "citation": "Coelho, G.L.D.H., Hanel, P.H.P, & Wolf, L.J. (2018). The\nVery Efficient Assessment of Need for Cognition: Developing a Six-Item\nVersion. Assessment, online first , 1-16. Download here .",
    "year": 2018
  },
  "status": "needs-research",
  "item_count": 6,
  "dimensions": [
    "characteristic"
  ],
  "option_scales": [
    {
      "ref": "opt_ncs6_characteristic_5",
      "dimension": "characteristic",
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
        "extremely uncharacteristic",
        ".",
        ".",
        ".",
        "extremely characteristic"
      ]
    }
  ],
  "reversed_items": [
    "pr_ncs6_3",
    "pr_ncs6_4"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ncs6_1",
      "prompt_snippet": "I would prefer complex to simple problems.",
      "dimension": "characteristic",
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
      "prompt_id": "pr_ncs6_2",
      "prompt_snippet": "I like to have the responsibility of handling a situation that requires a lot of",
      "dimension": "characteristic",
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
      "index": 3,
      "prompt_id": "pr_ncs6_3",
      "prompt_snippet": "Thinking is not my idea of fun.",
      "dimension": "characteristic",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 4,
      "prompt_id": "pr_ncs6_4",
      "prompt_snippet": "I would rather do something that requires little thought than something that is ",
      "dimension": "characteristic",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_ncs6_5",
      "prompt_snippet": "I really enjoy a task that involves coming up with new solutions to problems.",
      "dimension": "characteristic",
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
      "index": 6,
      "prompt_id": "pr_ncs6_6",
      "prompt_snippet": "I would prefer a task that is intellectual, difficult, and important to one that",
      "dimension": "characteristic",
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

- Items: 6
- Dimensions: characteristic
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_ncs6_3, pr_ncs6_4
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I would prefer complex to simple problems. | characteristic | 1,2,3,4,5 | no |
| 2 | I like to have the responsibility of handling a situation that requires a lot of | characteristic | 1,2,3,4,5 | no |
| 3 | Thinking is not my idea of fun. | characteristic | 1,2,3,4,5 | yes |
| 4 | I would rather do something that requires little thought than something that is  | characteristic | 1,2,3,4,5 | yes |
| 5 | I really enjoy a task that involves coming up with new solutions to problems. | characteristic | 1,2,3,4,5 | no |
| 6 | I would prefer a task that is intellectual, difficult, and important to one that | characteristic | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/need-for-cognition-ncs6.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

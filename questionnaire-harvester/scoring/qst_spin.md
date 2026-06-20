# Scoring — Social Phobia Inventory (SPIN) (`qst_spin`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_spin",
  "title": "Social Phobia Inventory (SPIN)",
  "short_title": "SPIN",
  "source_url": "https://psychology-tools.com/test/spin",
  "publication": null,
  "status": "needs-research",
  "item_count": 17,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_spin_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Not At All",
        "A Little Bit",
        "Somewhat",
        "Very Much",
        "Extremely"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_spin_1",
      "prompt_snippet": "I am afraid of people in authority.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_spin_2",
      "prompt_snippet": "I am bothered by blushing in front of people.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_spin_3",
      "prompt_snippet": "Parties and social events scare me.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_spin_4",
      "prompt_snippet": "I avoid talking to people I don’t know.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_spin_5",
      "prompt_snippet": "Being criticized scares me a lot.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_spin_6",
      "prompt_snippet": "I avoid doing things or speaking to people for fear of embarrassment.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_spin_7",
      "prompt_snippet": "Sweating in front of people causes me distress.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_spin_8",
      "prompt_snippet": "I avoid going to parties.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_spin_9",
      "prompt_snippet": "I avoid activities in which I am the center of attention.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_spin_10",
      "prompt_snippet": "Talking to strangers scares me.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_spin_11",
      "prompt_snippet": "I avoid having to give speeches.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_spin_12",
      "prompt_snippet": "I would do anything to avoid being criticized.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_spin_13",
      "prompt_snippet": "Heart palpitations bother me when I am around people.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_spin_14",
      "prompt_snippet": "I am afraid of doing things when people might be watching.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_spin_15",
      "prompt_snippet": "Being embarrassed or looking stupid are among my worst fears.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_spin_16",
      "prompt_snippet": "I avoid speaking to anyone in authority.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_spin_17",
      "prompt_snippet": "Trembling or shaking in front of others is distressing to me.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
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

- Items: 17
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I am afraid of people in authority. | rating | 0,1,2,3,4 | no |
| 2 | I am bothered by blushing in front of people. | rating | 0,1,2,3,4 | no |
| 3 | Parties and social events scare me. | rating | 0,1,2,3,4 | no |
| 4 | I avoid talking to people I don’t know. | rating | 0,1,2,3,4 | no |
| 5 | Being criticized scares me a lot. | rating | 0,1,2,3,4 | no |
| 6 | I avoid doing things or speaking to people for fear of embarrassment. | rating | 0,1,2,3,4 | no |
| 7 | Sweating in front of people causes me distress. | rating | 0,1,2,3,4 | no |
| 8 | I avoid going to parties. | rating | 0,1,2,3,4 | no |
| 9 | I avoid activities in which I am the center of attention. | rating | 0,1,2,3,4 | no |
| 10 | Talking to strangers scares me. | rating | 0,1,2,3,4 | no |
| 11 | I avoid having to give speeches. | rating | 0,1,2,3,4 | no |
| 12 | I would do anything to avoid being criticized. | rating | 0,1,2,3,4 | no |
| 13 | Heart palpitations bother me when I am around people. | rating | 0,1,2,3,4 | no |
| 14 | I am afraid of doing things when people might be watching. | rating | 0,1,2,3,4 | no |
| 15 | Being embarrassed or looking stupid are among my worst fears. | rating | 0,1,2,3,4 | no |
| 16 | I avoid speaking to anyone in authority. | rating | 0,1,2,3,4 | no |
| 17 | Trembling or shaking in front of others is distressing to me. | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/spin)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

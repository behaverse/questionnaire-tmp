# Scoring — Connectedness to Nature Scale (CNS) (`qst_cns`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cns",
  "title": "Connectedness to Nature Scale (CNS)",
  "short_title": "CNS",
  "source_url": "https://us.psytoolkit.org/survey-library/connectedness-nature.html",
  "publication": {
    "citation": "Mayer, F.S. & McPherson Frantz, C. (2004). The connectedness to nature scale: A measure of individuals’ feeling in community with nature. Journal of Environmental Psychology, 24 , 503-515.",
    "year": 2004
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "cns_scale"
  ],
  "option_scales": [
    {
      "ref": "opt_cns_cns_scale_5",
      "dimension": "cns_scale",
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
        "strongly disagree",
        "disagree",
        "neutral",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_cns_4",
    "pr_cns_12",
    "pr_cns_14"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cns_1",
      "prompt_snippet": "I often feel a sense of oneness with the natural world around me.",
      "dimension": "cns_scale",
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
      "prompt_id": "pr_cns_2",
      "prompt_snippet": "I think of the natural world as a community to which I belong.",
      "dimension": "cns_scale",
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
      "prompt_id": "pr_cns_3",
      "prompt_snippet": "I recognize and appreciate the intelligence of other living organisms.",
      "dimension": "cns_scale",
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
      "index": 4,
      "prompt_id": "pr_cns_4",
      "prompt_snippet": "I often feel disconnected from nature.",
      "dimension": "cns_scale",
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
      "prompt_id": "pr_cns_5",
      "prompt_snippet": "When I think of my life, I imagine myself to be part of a larger cyclical proces",
      "dimension": "cns_scale",
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
      "prompt_id": "pr_cns_6",
      "prompt_snippet": "I often feel a kinship with animals and plants.",
      "dimension": "cns_scale",
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
      "index": 7,
      "prompt_id": "pr_cns_7",
      "prompt_snippet": "I feel as though I belong to the Earth as equally as it belongs to me.",
      "dimension": "cns_scale",
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
      "index": 8,
      "prompt_id": "pr_cns_8",
      "prompt_snippet": "I have a deep understanding of how my actions affect the natural world.",
      "dimension": "cns_scale",
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
      "index": 9,
      "prompt_id": "pr_cns_9",
      "prompt_snippet": "I often feel part of the web of life.",
      "dimension": "cns_scale",
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
      "index": 10,
      "prompt_id": "pr_cns_10",
      "prompt_snippet": "I feel that all inhabitants of Earth, human, and nonhuman, share a common ‘life ",
      "dimension": "cns_scale",
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
      "index": 11,
      "prompt_id": "pr_cns_11",
      "prompt_snippet": "Like a tree can be part of a forest, I feel embedded within the broader natural ",
      "dimension": "cns_scale",
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
      "index": 12,
      "prompt_id": "pr_cns_12",
      "prompt_snippet": "When I think of my place on Earth, I consider myself to be a top member of a hie",
      "dimension": "cns_scale",
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
      "index": 13,
      "prompt_id": "pr_cns_13",
      "prompt_snippet": "I often feel like I am only a small part of the natural world around me, and tha",
      "dimension": "cns_scale",
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
      "index": 14,
      "prompt_id": "pr_cns_14",
      "prompt_snippet": "My personal welfare is independent of the welfare of the natural world.",
      "dimension": "cns_scale",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
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

- Items: 14
- Dimensions: cns_scale
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_cns_4, pr_cns_12, pr_cns_14
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I often feel a sense of oneness with the natural world around me. | cns_scale | 1,2,3,4,5 | no |
| 2 | I think of the natural world as a community to which I belong. | cns_scale | 1,2,3,4,5 | no |
| 3 | I recognize and appreciate the intelligence of other living organisms. | cns_scale | 1,2,3,4,5 | no |
| 4 | I often feel disconnected from nature. | cns_scale | 1,2,3,4,5 | yes |
| 5 | When I think of my life, I imagine myself to be part of a larger cyclical proces | cns_scale | 1,2,3,4,5 | no |
| 6 | I often feel a kinship with animals and plants. | cns_scale | 1,2,3,4,5 | no |
| 7 | I feel as though I belong to the Earth as equally as it belongs to me. | cns_scale | 1,2,3,4,5 | no |
| 8 | I have a deep understanding of how my actions affect the natural world. | cns_scale | 1,2,3,4,5 | no |
| 9 | I often feel part of the web of life. | cns_scale | 1,2,3,4,5 | no |
| 10 | I feel that all inhabitants of Earth, human, and nonhuman, share a common ‘life  | cns_scale | 1,2,3,4,5 | no |
| 11 | Like a tree can be part of a forest, I feel embedded within the broader natural  | cns_scale | 1,2,3,4,5 | no |
| 12 | When I think of my place on Earth, I consider myself to be a top member of a hie | cns_scale | 1,2,3,4,5 | yes |
| 13 | I often feel like I am only a small part of the natural world around me, and tha | cns_scale | 1,2,3,4,5 | no |
| 14 | My personal welfare is independent of the welfare of the natural world. | cns_scale | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/connectedness-nature.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

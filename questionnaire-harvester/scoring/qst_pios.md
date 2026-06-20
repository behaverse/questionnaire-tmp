# Scoring — The Penn Inventory of Scrupulosity (PIOS) (`qst_pios`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pios",
  "title": "The Penn Inventory of Scrupulosity (PIOS)",
  "short_title": "PIOS",
  "source_url": "https://us.psytoolkit.org/survey-library/scrupulosity-pios.html",
  "publication": {
    "citation": "Abramowitz, J.S., Hupper, J.D., Cohen, A.B., Tolin, D.F. & Cahill,\nS.P. (2002). Religious obsessions and compulsions in a non-clinical\nsample: the Penn Inventory of Scrupulosity (PIOS). Behaviour Research\nand Therapy, 40 , 825-838.",
    "year": 2002
  },
  "status": "needs-research",
  "item_count": 19,
  "dimensions": [
    "pios_frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_pios_pios_frequency_5",
      "dimension": "pios_frequency",
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
        "never",
        "rarely/<br>almost never",
        "sometimes",
        "often",
        "constantly"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pios_1",
      "prompt_snippet": "I worry I must act morally at all times or I will be punished",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_2",
      "prompt_snippet": "I feel guilty about immoral thoughts I have had",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_3",
      "prompt_snippet": "I feel urges to confess sins over and over again",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_4",
      "prompt_snippet": "I fear I have acted inappropriately without realizing it",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_5",
      "prompt_snippet": "I fear I will act immorally",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_6",
      "prompt_snippet": "I am afraid of having sexual thoughts",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_7",
      "prompt_snippet": "Feeling guilty interferes with my ability to enjoy things I would like to enjoy",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_8",
      "prompt_snippet": "Immoral thoughts come into my head and I can’t get rid of them",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_9",
      "prompt_snippet": "I must try hard to avoid having certain immoral thoughts",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_10",
      "prompt_snippet": "I worry that I might have dishonest thoughts",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_11",
      "prompt_snippet": "I am afraid of having immoral thoughts",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_12",
      "prompt_snippet": "I am very worried that things I did may have been dishonest",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_13",
      "prompt_snippet": "I am afraid my behavior is unacceptable to God",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_14",
      "prompt_snippet": "I worry about Heaven and Hell",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_15",
      "prompt_snippet": "I am afraid my thoughts are unacceptable to God",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_16",
      "prompt_snippet": "I worry I will never have a good relationship with God",
      "dimension": "pios_frequency",
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
      "prompt_id": "pr_pios_17",
      "prompt_snippet": "I am afraid that I will disobey God’s rules/laws",
      "dimension": "pios_frequency",
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
      "index": 18,
      "prompt_id": "pr_pios_18",
      "prompt_snippet": "I worry that God is upset with me",
      "dimension": "pios_frequency",
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
      "index": 19,
      "prompt_id": "pr_pios_19",
      "prompt_snippet": "I fear that I might be an evil person",
      "dimension": "pios_frequency",
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

- Items: 19
- Dimensions: pios_frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I worry I must act morally at all times or I will be punished | pios_frequency | 0,1,2,3,4 | no |
| 2 | I feel guilty about immoral thoughts I have had | pios_frequency | 0,1,2,3,4 | no |
| 3 | I feel urges to confess sins over and over again | pios_frequency | 0,1,2,3,4 | no |
| 4 | I fear I have acted inappropriately without realizing it | pios_frequency | 0,1,2,3,4 | no |
| 5 | I fear I will act immorally | pios_frequency | 0,1,2,3,4 | no |
| 6 | I am afraid of having sexual thoughts | pios_frequency | 0,1,2,3,4 | no |
| 7 | Feeling guilty interferes with my ability to enjoy things I would like to enjoy | pios_frequency | 0,1,2,3,4 | no |
| 8 | Immoral thoughts come into my head and I can’t get rid of them | pios_frequency | 0,1,2,3,4 | no |
| 9 | I must try hard to avoid having certain immoral thoughts | pios_frequency | 0,1,2,3,4 | no |
| 10 | I worry that I might have dishonest thoughts | pios_frequency | 0,1,2,3,4 | no |
| 11 | I am afraid of having immoral thoughts | pios_frequency | 0,1,2,3,4 | no |
| 12 | I am very worried that things I did may have been dishonest | pios_frequency | 0,1,2,3,4 | no |
| 13 | I am afraid my behavior is unacceptable to God | pios_frequency | 0,1,2,3,4 | no |
| 14 | I worry about Heaven and Hell | pios_frequency | 0,1,2,3,4 | no |
| 15 | I am afraid my thoughts are unacceptable to God | pios_frequency | 0,1,2,3,4 | no |
| 16 | I worry I will never have a good relationship with God | pios_frequency | 0,1,2,3,4 | no |
| 17 | I am afraid that I will disobey God’s rules/laws | pios_frequency | 0,1,2,3,4 | no |
| 18 | I worry that God is upset with me | pios_frequency | 0,1,2,3,4 | no |
| 19 | I fear that I might be an evil person | pios_frequency | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/scrupulosity-pios.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

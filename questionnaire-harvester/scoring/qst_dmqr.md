# Scoring — Drinking Motives Questionnaire, Revised (DMQ-R) (`qst_dmqr`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_dmqr",
  "title": "Drinking Motives Questionnaire, Revised (DMQ-R)",
  "short_title": "DMQ-R",
  "source_url": "https://us.psytoolkit.org/survey-library/alcohol-dmq-r.html",
  "publication": {
    "citation": "Cooper, M. L. (1994). Motivations for Alcohol Use Among Adolescents: Development and Validation of a Four-Factor Model. Psychological Assessment, 6(2) , 117-128.",
    "year": 1994
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_dmqr_frequency_5",
      "dimension": "frequency",
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
        "almost never/never",
        "some of the time",
        "half of the time",
        "most of the time",
        "almost always/always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_dmqr_1",
      "prompt_snippet": "To forget your worries.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_2",
      "prompt_snippet": "Because your friends pressure you to drink.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_3",
      "prompt_snippet": "Because it helps you enjoy a party.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_4",
      "prompt_snippet": "Because it helps you when you feel depressed or nervous.",
      "dimension": "frequency",
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
      "index": 5,
      "prompt_id": "pr_dmqr_5",
      "prompt_snippet": "To be sociable.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_6",
      "prompt_snippet": "To cheer up when you are in a bad mood.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_7",
      "prompt_snippet": "Because you like the feeling.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_8",
      "prompt_snippet": "So that others won’t kid you about not drinking",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_9",
      "prompt_snippet": "Because it’s exciting.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_10",
      "prompt_snippet": "To get high.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_11",
      "prompt_snippet": "Because it makes social gatherings more fun.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_12",
      "prompt_snippet": "To fit in with a group you like.",
      "dimension": "frequency",
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
      "index": 13,
      "prompt_id": "pr_dmqr_13",
      "prompt_snippet": "Because it gives you a pleasant feeling.",
      "dimension": "frequency",
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
      "prompt_id": "pr_dmqr_14",
      "prompt_snippet": "Because it improves parties and celebrations.",
      "dimension": "frequency",
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
      "index": 15,
      "prompt_id": "pr_dmqr_15",
      "prompt_snippet": "Because you feel more self-confident and sure of yourself.",
      "dimension": "frequency",
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
      "index": 16,
      "prompt_id": "pr_dmqr_16",
      "prompt_snippet": "To celebrate a special occasion with friends.",
      "dimension": "frequency",
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
      "index": 17,
      "prompt_id": "pr_dmqr_17",
      "prompt_snippet": "To forget about your problems.",
      "dimension": "frequency",
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
      "index": 18,
      "prompt_id": "pr_dmqr_18",
      "prompt_snippet": "Because it’s fun.",
      "dimension": "frequency",
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
      "index": 19,
      "prompt_id": "pr_dmqr_19",
      "prompt_snippet": "To be liked.",
      "dimension": "frequency",
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
      "index": 20,
      "prompt_id": "pr_dmqr_20",
      "prompt_snippet": "So you won’t feel left out.",
      "dimension": "frequency",
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

- Items: 20
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | To forget your worries. | frequency | 1,2,3,4,5 | no |
| 2 | Because your friends pressure you to drink. | frequency | 1,2,3,4,5 | no |
| 3 | Because it helps you enjoy a party. | frequency | 1,2,3,4,5 | no |
| 4 | Because it helps you when you feel depressed or nervous. | frequency | 1,2,3,4,5 | no |
| 5 | To be sociable. | frequency | 1,2,3,4,5 | no |
| 6 | To cheer up when you are in a bad mood. | frequency | 1,2,3,4,5 | no |
| 7 | Because you like the feeling. | frequency | 1,2,3,4,5 | no |
| 8 | So that others won’t kid you about not drinking | frequency | 1,2,3,4,5 | no |
| 9 | Because it’s exciting. | frequency | 1,2,3,4,5 | no |
| 10 | To get high. | frequency | 1,2,3,4,5 | no |
| 11 | Because it makes social gatherings more fun. | frequency | 1,2,3,4,5 | no |
| 12 | To fit in with a group you like. | frequency | 1,2,3,4,5 | no |
| 13 | Because it gives you a pleasant feeling. | frequency | 1,2,3,4,5 | no |
| 14 | Because it improves parties and celebrations. | frequency | 1,2,3,4,5 | no |
| 15 | Because you feel more self-confident and sure of yourself. | frequency | 1,2,3,4,5 | no |
| 16 | To celebrate a special occasion with friends. | frequency | 1,2,3,4,5 | no |
| 17 | To forget about your problems. | frequency | 1,2,3,4,5 | no |
| 18 | Because it’s fun. | frequency | 1,2,3,4,5 | no |
| 19 | To be liked. | frequency | 1,2,3,4,5 | no |
| 20 | So you won’t feel left out. | frequency | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/alcohol-dmq-r.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

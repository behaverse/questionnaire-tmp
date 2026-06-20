# Scoring — Varieties of Sadistic Tendencies (VAST) (`qst_vast`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_vast",
  "title": "Varieties of Sadistic Tendencies (VAST)",
  "short_title": "VAST",
  "source_url": "https://us.psytoolkit.org/survey-library/vast.html",
  "publication": {
    "citation": "D. L. Paulhus & D. N. Jones (2015).  Measuring dark personalities via questionnaire.  In G. J. Boyle, D. H. Saklofske & G. Matthews (Eds.), Measures of personality and social psychological constructs (pp.562-594).  San Diego, CA: Academic Press.",
    "year": 2015
  },
  "status": "needs-research",
  "item_count": 27,
  "dimensions": [
    "agree_vast"
  ],
  "option_scales": [
    {
      "ref": "opt_vast_agree_vast_5",
      "dimension": "agree_vast",
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
        "neither agree nor disagree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_vast_4",
    "pr_vast_6",
    "pr_vast_9",
    "pr_vast_15"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_vast_1",
      "prompt_snippet": "In video games, I like the realistic blood spurts.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_2",
      "prompt_snippet": "I sometimes replay my favorite scenes from gory slasher films.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_3",
      "prompt_snippet": "I enjoy watching cage fighting (or mixed martial arts), where there is no escape",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_4",
      "prompt_snippet": "I sometimes look away in horror movies.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_5",
      "prompt_snippet": "In car-racing, it’s the accidents that I enjoy most.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_6",
      "prompt_snippet": "There’s way too much violence in sports.",
      "dimension": "agree_vast",
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
      "index": 7,
      "prompt_id": "pr_vast_7",
      "prompt_snippet": "I love the YouTube clips of people fighting.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_8",
      "prompt_snippet": "I enjoy physically hurting people.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_9",
      "prompt_snippet": "I would never purposely humiliate someone.",
      "dimension": "agree_vast",
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
      "index": 10,
      "prompt_id": "pr_vast_10",
      "prompt_snippet": "I was purposely cruel to someone in high school.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_11",
      "prompt_snippet": "I enjoy hurting my partner during sex (or pretending to).",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_12",
      "prompt_snippet": "I can dominate others using fear.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_13",
      "prompt_snippet": "I enjoy making people suffer.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_14",
      "prompt_snippet": "I enjoy mocking losers to their face.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_15",
      "prompt_snippet": "I never said mean things to my parents.",
      "dimension": "agree_vast",
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
      "index": 16,
      "prompt_id": "pr_vast_16",
      "prompt_snippet": "I enjoy tormenting animals – especially the nasty ones.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_17",
      "prompt_snippet": "I’m considered to be a kind person.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_18",
      "prompt_snippet": "By staying strong, one can better help others.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_19",
      "prompt_snippet": "I’d do anything – even break the law – for those I love.",
      "dimension": "agree_vast",
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
      "prompt_id": "pr_vast_20",
      "prompt_snippet": "I go out of my way to help family members.",
      "dimension": "agree_vast",
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
      "index": 21,
      "prompt_id": "pr_vast_21",
      "prompt_snippet": "I have ambitions to make the world a better place.",
      "dimension": "agree_vast",
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
      "index": 22,
      "prompt_id": "pr_vast_22",
      "prompt_snippet": "My goal is to be a missionary and help others.",
      "dimension": "agree_vast",
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
      "index": 23,
      "prompt_id": "pr_vast_23",
      "prompt_snippet": "I give money to poor people on the street.",
      "dimension": "agree_vast",
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
      "index": 24,
      "prompt_id": "pr_vast_24",
      "prompt_snippet": "I’m worried that we have already seriously damaged the Earth.",
      "dimension": "agree_vast",
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
      "index": 25,
      "prompt_id": "pr_vast_25",
      "prompt_snippet": "I want to spend my life helping sick children.",
      "dimension": "agree_vast",
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
      "index": 26,
      "prompt_id": "pr_vast_26",
      "prompt_snippet": "I have had some really good friends.",
      "dimension": "agree_vast",
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
      "index": 27,
      "prompt_id": "pr_vast_27",
      "prompt_snippet": "I am a religious person.",
      "dimension": "agree_vast",
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

- Items: 27
- Dimensions: agree_vast
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_vast_4, pr_vast_6, pr_vast_9, pr_vast_15
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | In video games, I like the realistic blood spurts. | agree_vast | 1,2,3,4,5 | no |
| 2 | I sometimes replay my favorite scenes from gory slasher films. | agree_vast | 1,2,3,4,5 | no |
| 3 | I enjoy watching cage fighting (or mixed martial arts), where there is no escape | agree_vast | 1,2,3,4,5 | no |
| 4 | I sometimes look away in horror movies. | agree_vast | 1,2,3,4,5 | yes |
| 5 | In car-racing, it’s the accidents that I enjoy most. | agree_vast | 1,2,3,4,5 | no |
| 6 | There’s way too much violence in sports. | agree_vast | 1,2,3,4,5 | yes |
| 7 | I love the YouTube clips of people fighting. | agree_vast | 1,2,3,4,5 | no |
| 8 | I enjoy physically hurting people. | agree_vast | 1,2,3,4,5 | no |
| 9 | I would never purposely humiliate someone. | agree_vast | 1,2,3,4,5 | yes |
| 10 | I was purposely cruel to someone in high school. | agree_vast | 1,2,3,4,5 | no |
| 11 | I enjoy hurting my partner during sex (or pretending to). | agree_vast | 1,2,3,4,5 | no |
| 12 | I can dominate others using fear. | agree_vast | 1,2,3,4,5 | no |
| 13 | I enjoy making people suffer. | agree_vast | 1,2,3,4,5 | no |
| 14 | I enjoy mocking losers to their face. | agree_vast | 1,2,3,4,5 | no |
| 15 | I never said mean things to my parents. | agree_vast | 1,2,3,4,5 | yes |
| 16 | I enjoy tormenting animals – especially the nasty ones. | agree_vast | 1,2,3,4,5 | no |
| 17 | I’m considered to be a kind person. | agree_vast | 1,2,3,4,5 | no |
| 18 | By staying strong, one can better help others. | agree_vast | 1,2,3,4,5 | no |
| 19 | I’d do anything – even break the law – for those I love. | agree_vast | 1,2,3,4,5 | no |
| 20 | I go out of my way to help family members. | agree_vast | 1,2,3,4,5 | no |
| 21 | I have ambitions to make the world a better place. | agree_vast | 1,2,3,4,5 | no |
| 22 | My goal is to be a missionary and help others. | agree_vast | 1,2,3,4,5 | no |
| 23 | I give money to poor people on the street. | agree_vast | 1,2,3,4,5 | no |
| 24 | I’m worried that we have already seriously damaged the Earth. | agree_vast | 1,2,3,4,5 | no |
| 25 | I want to spend my life helping sick children. | agree_vast | 1,2,3,4,5 | no |
| 26 | I have had some really good friends. | agree_vast | 1,2,3,4,5 | no |
| 27 | I am a religious person. | agree_vast | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/vast.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

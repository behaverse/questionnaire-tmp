# Scoring — Buss-Perry Aggression Questionnaire (BPAQ) (`qst_bpaq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_bpaq",
  "title": "Buss-Perry Aggression Questionnaire (BPAQ)",
  "short_title": "BPAQ",
  "source_url": "https://us.psytoolkit.org/survey-library/aggression-buss-perry.html",
  "publication": {
    "citation": "Buss, A.H. and Perry, M.P. (1992). The Aggression\nQuestionnaire. Journal of Personality and Social Psychology, 63 ,\n452-459.",
    "year": 1992
  },
  "status": "needs-research",
  "item_count": 29,
  "dimensions": [
    "characteristic"
  ],
  "option_scales": [
    {
      "ref": "opt_bpaq_characteristic_5",
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
        "extremely uncharacteristic<br>of me",
        "uncharacteristic of me",
        "neither characteristic<br>nor uncharacteristic of me",
        "characteristic of me",
        "extremely characteristic<br>of me"
      ]
    }
  ],
  "reversed_items": [
    "pr_bpaq_7",
    "pr_bpaq_18"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_bpaq_1",
      "prompt_snippet": "Once in a while I can't control the urge to strike another person.",
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
      "prompt_id": "pr_bpaq_2",
      "prompt_snippet": "Given enough provocation, I may hit another person.",
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
      "prompt_id": "pr_bpaq_3",
      "prompt_snippet": "If somebody hits me, I hit back.",
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
      "index": 4,
      "prompt_id": "pr_bpaq_4",
      "prompt_snippet": "I get into fights a little more than the average person.",
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
      "index": 5,
      "prompt_id": "pr_bpaq_5",
      "prompt_snippet": "If I have to resort to violence to protect my rights, I will.",
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
      "prompt_id": "pr_bpaq_6",
      "prompt_snippet": "There are people who pushed me so far that we came to blows.",
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
      "index": 7,
      "prompt_id": "pr_bpaq_7",
      "prompt_snippet": "I can think of no good reason for ever hitting a person.",
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
      "index": 8,
      "prompt_id": "pr_bpaq_8",
      "prompt_snippet": "I have threatened people I know.",
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
      "index": 9,
      "prompt_id": "pr_bpaq_9",
      "prompt_snippet": "I have become so mad that I have broken things.",
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
      "index": 10,
      "prompt_id": "pr_bpaq_10",
      "prompt_snippet": "I tell my friends openly when I disagree with them.",
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
      "index": 11,
      "prompt_id": "pr_bpaq_11",
      "prompt_snippet": "I often find myself disagreeing with people.",
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
      "index": 12,
      "prompt_id": "pr_bpaq_12",
      "prompt_snippet": "When people annoy me, I may tell them what I think of them.",
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
      "index": 13,
      "prompt_id": "pr_bpaq_13",
      "prompt_snippet": "I can't help getting into arguments when people disagree with me.",
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
      "index": 14,
      "prompt_id": "pr_bpaq_14",
      "prompt_snippet": "My friends say that I'm somewhat argumentative.",
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
      "index": 15,
      "prompt_id": "pr_bpaq_15",
      "prompt_snippet": "I flare up quickly but get over it quickly.",
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
      "index": 16,
      "prompt_id": "pr_bpaq_16",
      "prompt_snippet": "When frustrated, I let my irritation show.",
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
      "index": 17,
      "prompt_id": "pr_bpaq_17",
      "prompt_snippet": "I sometimes feel like a powder keg ready to explode.",
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
      "index": 18,
      "prompt_id": "pr_bpaq_18",
      "prompt_snippet": "I am an even-tempered person.",
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
      "index": 19,
      "prompt_id": "pr_bpaq_19",
      "prompt_snippet": "Some of my friends think I'm a hothead.",
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
      "index": 20,
      "prompt_id": "pr_bpaq_20",
      "prompt_snippet": "Sometimes I fly off the handle for no good reason.",
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
      "index": 21,
      "prompt_id": "pr_bpaq_21",
      "prompt_snippet": "I have trouble controlling my temper.",
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
      "index": 22,
      "prompt_id": "pr_bpaq_22",
      "prompt_snippet": "I am sometimes eaten up with jealousy.",
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
      "index": 23,
      "prompt_id": "pr_bpaq_23",
      "prompt_snippet": "At times I feel I have gotten a raw deal out of life.",
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
      "index": 24,
      "prompt_id": "pr_bpaq_24",
      "prompt_snippet": "Other people always seem to get the breaks.",
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
      "index": 25,
      "prompt_id": "pr_bpaq_25",
      "prompt_snippet": "I wonder why sometimes I feel so bitter about things.",
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
      "index": 26,
      "prompt_id": "pr_bpaq_26",
      "prompt_snippet": "I know that \"friends\" talk about me behind my back.",
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
      "index": 27,
      "prompt_id": "pr_bpaq_27",
      "prompt_snippet": "I am suspicious of overly friendly strangers.",
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
      "index": 28,
      "prompt_id": "pr_bpaq_28",
      "prompt_snippet": "I sometimes feel that people are laughing at me behind my back.",
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
      "index": 29,
      "prompt_id": "pr_bpaq_29",
      "prompt_snippet": "When people are especially nice, I wonder what they want.",
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

- Items: 29
- Dimensions: characteristic
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_bpaq_7, pr_bpaq_18
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Once in a while I can't control the urge to strike another person. | characteristic | 1,2,3,4,5 | no |
| 2 | Given enough provocation, I may hit another person. | characteristic | 1,2,3,4,5 | no |
| 3 | If somebody hits me, I hit back. | characteristic | 1,2,3,4,5 | no |
| 4 | I get into fights a little more than the average person. | characteristic | 1,2,3,4,5 | no |
| 5 | If I have to resort to violence to protect my rights, I will. | characteristic | 1,2,3,4,5 | no |
| 6 | There are people who pushed me so far that we came to blows. | characteristic | 1,2,3,4,5 | no |
| 7 | I can think of no good reason for ever hitting a person. | characteristic | 1,2,3,4,5 | yes |
| 8 | I have threatened people I know. | characteristic | 1,2,3,4,5 | no |
| 9 | I have become so mad that I have broken things. | characteristic | 1,2,3,4,5 | no |
| 10 | I tell my friends openly when I disagree with them. | characteristic | 1,2,3,4,5 | no |
| 11 | I often find myself disagreeing with people. | characteristic | 1,2,3,4,5 | no |
| 12 | When people annoy me, I may tell them what I think of them. | characteristic | 1,2,3,4,5 | no |
| 13 | I can't help getting into arguments when people disagree with me. | characteristic | 1,2,3,4,5 | no |
| 14 | My friends say that I'm somewhat argumentative. | characteristic | 1,2,3,4,5 | no |
| 15 | I flare up quickly but get over it quickly. | characteristic | 1,2,3,4,5 | no |
| 16 | When frustrated, I let my irritation show. | characteristic | 1,2,3,4,5 | no |
| 17 | I sometimes feel like a powder keg ready to explode. | characteristic | 1,2,3,4,5 | no |
| 18 | I am an even-tempered person. | characteristic | 1,2,3,4,5 | yes |
| 19 | Some of my friends think I'm a hothead. | characteristic | 1,2,3,4,5 | no |
| 20 | Sometimes I fly off the handle for no good reason. | characteristic | 1,2,3,4,5 | no |
| 21 | I have trouble controlling my temper. | characteristic | 1,2,3,4,5 | no |
| 22 | I am sometimes eaten up with jealousy. | characteristic | 1,2,3,4,5 | no |
| 23 | At times I feel I have gotten a raw deal out of life. | characteristic | 1,2,3,4,5 | no |
| 24 | Other people always seem to get the breaks. | characteristic | 1,2,3,4,5 | no |
| 25 | I wonder why sometimes I feel so bitter about things. | characteristic | 1,2,3,4,5 | no |
| 26 | I know that "friends" talk about me behind my back. | characteristic | 1,2,3,4,5 | no |
| 27 | I am suspicious of overly friendly strangers. | characteristic | 1,2,3,4,5 | no |
| 28 | I sometimes feel that people are laughing at me behind my back. | characteristic | 1,2,3,4,5 | no |
| 29 | When people are especially nice, I wonder what they want. | characteristic | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/aggression-buss-perry.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

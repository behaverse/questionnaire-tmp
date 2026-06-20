# Scoring — A brief measure of dark personality traits (SD3) (`qst_sd3`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sd3",
  "title": "A brief measure of dark personality traits (SD3)",
  "short_title": "SD3",
  "source_url": "https://us.psytoolkit.org/survey-library/short-dark-triad.html",
  "publication": {
    "citation": "Jones, D. N., & Paulhus, D. L. (2014).  Introducing the Short Dark Triad (SD3): A brief measure of dark personality traits.  Assessment, 21,  28-41.",
    "year": 2014
  },
  "status": "needs-research",
  "item_count": 27,
  "dimensions": [
    "agree_sd3"
  ],
  "option_scales": [
    {
      "ref": "opt_sd3_agree_sd3_5",
      "dimension": "agree_sd3",
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
    "pr_sd3_11",
    "pr_sd3_15",
    "pr_sd3_17",
    "pr_sd3_20",
    "pr_sd3_25"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sd3_1",
      "prompt_snippet": "It's not wise to tell your secrets.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_2",
      "prompt_snippet": "I like to use clever manipulation to get my way.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_3",
      "prompt_snippet": "Whatever it takes, you must get the important people on your side.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_4",
      "prompt_snippet": "Avoid direct conflict with others because they may be useful in the future.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_5",
      "prompt_snippet": "It’s wise to keep track of information that you can use against people later.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_6",
      "prompt_snippet": "You should wait for the right time to get back at people.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_7",
      "prompt_snippet": "There are things you should hide from other people because they don’t need to kn",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_8",
      "prompt_snippet": "Make sure your plans benefit you, not others.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_9",
      "prompt_snippet": "Most people can be manipulated.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_10",
      "prompt_snippet": "People see me as a natural leader.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_11",
      "prompt_snippet": "I hate being the center of attention.",
      "dimension": "agree_sd3",
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
      "index": 12,
      "prompt_id": "pr_sd3_12",
      "prompt_snippet": "Many group activities tend to be dull without me.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_13",
      "prompt_snippet": "I know that I am special because everyone keeps telling me so.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_14",
      "prompt_snippet": "I like to get acquainted with important people.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_15",
      "prompt_snippet": "I feel embarrassed if someone compliments me.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_16",
      "prompt_snippet": "I have been compared to famous people.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_17",
      "prompt_snippet": "I am an average person.",
      "dimension": "agree_sd3",
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
      "index": 18,
      "prompt_id": "pr_sd3_18",
      "prompt_snippet": "I insist on getting the respect I deserve.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_19",
      "prompt_snippet": "I like to get revenge on authorities.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_20",
      "prompt_snippet": "I avoid dangerous situations.",
      "dimension": "agree_sd3",
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
      "index": 21,
      "prompt_id": "pr_sd3_21",
      "prompt_snippet": "Payback needs to be quick and nasty.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_22",
      "prompt_snippet": "People often say I’m out of control.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_23",
      "prompt_snippet": "It’s true that I can be mean to others.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_24",
      "prompt_snippet": "People who mess with me always regret it.",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_25",
      "prompt_snippet": "I have never gotten into trouble with the law.",
      "dimension": "agree_sd3",
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
      "index": 26,
      "prompt_id": "pr_sd3_26",
      "prompt_snippet": "I enjoy having sex with people I hardly know",
      "dimension": "agree_sd3",
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
      "prompt_id": "pr_sd3_27",
      "prompt_snippet": "I’ll say anything to get what I want.",
      "dimension": "agree_sd3",
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
- Dimensions: agree_sd3
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_sd3_11, pr_sd3_15, pr_sd3_17, pr_sd3_20, pr_sd3_25
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | It's not wise to tell your secrets. | agree_sd3 | 1,2,3,4,5 | no |
| 2 | I like to use clever manipulation to get my way. | agree_sd3 | 1,2,3,4,5 | no |
| 3 | Whatever it takes, you must get the important people on your side. | agree_sd3 | 1,2,3,4,5 | no |
| 4 | Avoid direct conflict with others because they may be useful in the future. | agree_sd3 | 1,2,3,4,5 | no |
| 5 | It’s wise to keep track of information that you can use against people later. | agree_sd3 | 1,2,3,4,5 | no |
| 6 | You should wait for the right time to get back at people. | agree_sd3 | 1,2,3,4,5 | no |
| 7 | There are things you should hide from other people because they don’t need to kn | agree_sd3 | 1,2,3,4,5 | no |
| 8 | Make sure your plans benefit you, not others. | agree_sd3 | 1,2,3,4,5 | no |
| 9 | Most people can be manipulated. | agree_sd3 | 1,2,3,4,5 | no |
| 10 | People see me as a natural leader. | agree_sd3 | 1,2,3,4,5 | no |
| 11 | I hate being the center of attention. | agree_sd3 | 1,2,3,4,5 | yes |
| 12 | Many group activities tend to be dull without me. | agree_sd3 | 1,2,3,4,5 | no |
| 13 | I know that I am special because everyone keeps telling me so. | agree_sd3 | 1,2,3,4,5 | no |
| 14 | I like to get acquainted with important people. | agree_sd3 | 1,2,3,4,5 | no |
| 15 | I feel embarrassed if someone compliments me. | agree_sd3 | 1,2,3,4,5 | yes |
| 16 | I have been compared to famous people. | agree_sd3 | 1,2,3,4,5 | no |
| 17 | I am an average person. | agree_sd3 | 1,2,3,4,5 | yes |
| 18 | I insist on getting the respect I deserve. | agree_sd3 | 1,2,3,4,5 | no |
| 19 | I like to get revenge on authorities. | agree_sd3 | 1,2,3,4,5 | no |
| 20 | I avoid dangerous situations. | agree_sd3 | 1,2,3,4,5 | yes |
| 21 | Payback needs to be quick and nasty. | agree_sd3 | 1,2,3,4,5 | no |
| 22 | People often say I’m out of control. | agree_sd3 | 1,2,3,4,5 | no |
| 23 | It’s true that I can be mean to others. | agree_sd3 | 1,2,3,4,5 | no |
| 24 | People who mess with me always regret it. | agree_sd3 | 1,2,3,4,5 | no |
| 25 | I have never gotten into trouble with the law. | agree_sd3 | 1,2,3,4,5 | yes |
| 26 | I enjoy having sex with people I hardly know | agree_sd3 | 1,2,3,4,5 | no |
| 27 | I’ll say anything to get what I want. | agree_sd3 | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/short-dark-triad.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

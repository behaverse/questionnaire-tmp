# Scoring — Psychopathy (LSRP) (`qst_lsrp`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_lsrp",
  "title": "Psychopathy (LSRP)",
  "short_title": "LSRP",
  "source_url": "https://us.psytoolkit.org/survey-library/psychopathy-lsrps.html",
  "publication": {
    "citation": "Levenson, M.R., Kiehl, K.A, Fitzpatrick, C.M. (1995). Assessing\npsychopathic attributes in a noninstitutionalized population. Journal\nof Personality and Social Psychology, 68 , 151-158.",
    "year": 1995
  },
  "status": "needs-research",
  "item_count": 26,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_lsrp_agree_4",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "disagree strongly",
        "disagree somewhat",
        "agree somewhat",
        "agree strongly"
      ]
    }
  ],
  "reversed_items": [
    "pr_lsrp_10",
    "pr_lsrp_12",
    "pr_lsrp_14",
    "pr_lsrp_15",
    "pr_lsrp_16",
    "pr_lsrp_19",
    "pr_lsrp_23"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_lsrp_1",
      "prompt_snippet": "Success is based on survival of the fittest; I am not concerned about the losers",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_lsrp_2",
      "prompt_snippet": "For me, what's right is whatever I can get away with",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_lsrp_3",
      "prompt_snippet": "In today's world, I feel justified in doing anything I can get away with to succ",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_lsrp_4",
      "prompt_snippet": "My main purpose in life is getting as many goodies as I can",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_lsrp_5",
      "prompt_snippet": "Making a lot of money is my most important goal",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_lsrp_6",
      "prompt_snippet": "I let others worry about higher values; my main concern is with the bottom line",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_lsrp_7",
      "prompt_snippet": "People who are stupid enough to get ripped off usually deserve it",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_lsrp_8",
      "prompt_snippet": "Looking out for myself is my top priority",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_lsrp_9",
      "prompt_snippet": "I tell other people what they want to hear so that they will do what I want them",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_lsrp_10",
      "prompt_snippet": "I would be upset if my success came at someone else's expense",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 11,
      "prompt_id": "pr_lsrp_11",
      "prompt_snippet": "I often admire a really clever scam",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_lsrp_12",
      "prompt_snippet": "I make a point of trying not to hurt others in pursuit of my goals",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 13,
      "prompt_id": "pr_lsrp_13",
      "prompt_snippet": "I enjoy manipulating other people's feelings",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_lsrp_14",
      "prompt_snippet": "I feel bad if my words or actions cause someone else to feel emotional pain",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 15,
      "prompt_id": "pr_lsrp_15",
      "prompt_snippet": "Even if I were trying very hard to sell something, I wouldn't lie about it",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_lsrp_16",
      "prompt_snippet": "Cheating is not justified because it is unfair to others",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 17,
      "prompt_id": "pr_lsrp_17",
      "prompt_snippet": "I find myself in the same kinds of trouble, time after time",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_lsrp_18",
      "prompt_snippet": "I am often bored",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_lsrp_19",
      "prompt_snippet": "I find that I am able to pursue one goal for a long time",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 20,
      "prompt_id": "pr_lsrp_20",
      "prompt_snippet": "I don't plan anything very far in advance",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_lsrp_21",
      "prompt_snippet": "I quickly lose interest in tasks I start",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_lsrp_22",
      "prompt_snippet": "Most of my problems are due to the fact that other people just don't understand ",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_lsrp_23",
      "prompt_snippet": "Before I do anything, I carefully consider the possible consequences.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": true
    },
    {
      "index": 24,
      "prompt_id": "pr_lsrp_24",
      "prompt_snippet": "I have been in a lot of shouting matches with other people",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_lsrp_25",
      "prompt_snippet": "When I get frustrated, I often \"let off steam\" by blowing my top",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_lsrp_26",
      "prompt_snippet": "Love is overrated",
      "dimension": "agree",
      "values": [
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

- Items: 26
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_lsrp_10, pr_lsrp_12, pr_lsrp_14, pr_lsrp_15, pr_lsrp_16, pr_lsrp_19, pr_lsrp_23
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Success is based on survival of the fittest; I am not concerned about the losers | agree | 1,2,3,4 | no |
| 2 | For me, what's right is whatever I can get away with | agree | 1,2,3,4 | no |
| 3 | In today's world, I feel justified in doing anything I can get away with to succ | agree | 1,2,3,4 | no |
| 4 | My main purpose in life is getting as many goodies as I can | agree | 1,2,3,4 | no |
| 5 | Making a lot of money is my most important goal | agree | 1,2,3,4 | no |
| 6 | I let others worry about higher values; my main concern is with the bottom line | agree | 1,2,3,4 | no |
| 7 | People who are stupid enough to get ripped off usually deserve it | agree | 1,2,3,4 | no |
| 8 | Looking out for myself is my top priority | agree | 1,2,3,4 | no |
| 9 | I tell other people what they want to hear so that they will do what I want them | agree | 1,2,3,4 | no |
| 10 | I would be upset if my success came at someone else's expense | agree | 1,2,3,4 | yes |
| 11 | I often admire a really clever scam | agree | 1,2,3,4 | no |
| 12 | I make a point of trying not to hurt others in pursuit of my goals | agree | 1,2,3,4 | yes |
| 13 | I enjoy manipulating other people's feelings | agree | 1,2,3,4 | no |
| 14 | I feel bad if my words or actions cause someone else to feel emotional pain | agree | 1,2,3,4 | yes |
| 15 | Even if I were trying very hard to sell something, I wouldn't lie about it | agree | 1,2,3,4 | yes |
| 16 | Cheating is not justified because it is unfair to others | agree | 1,2,3,4 | yes |
| 17 | I find myself in the same kinds of trouble, time after time | agree | 1,2,3,4 | no |
| 18 | I am often bored | agree | 1,2,3,4 | no |
| 19 | I find that I am able to pursue one goal for a long time | agree | 1,2,3,4 | yes |
| 20 | I don't plan anything very far in advance | agree | 1,2,3,4 | no |
| 21 | I quickly lose interest in tasks I start | agree | 1,2,3,4 | no |
| 22 | Most of my problems are due to the fact that other people just don't understand  | agree | 1,2,3,4 | no |
| 23 | Before I do anything, I carefully consider the possible consequences. | agree | 1,2,3,4 | yes |
| 24 | I have been in a lot of shouting matches with other people | agree | 1,2,3,4 | no |
| 25 | When I get frustrated, I often "let off steam" by blowing my top | agree | 1,2,3,4 | no |
| 26 | Love is overrated | agree | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/psychopathy-lsrps.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

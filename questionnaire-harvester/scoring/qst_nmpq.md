# Scoring — Nomophobia Questionnaire (NMP-Q) (`qst_nmpq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_nmpq",
  "title": "Nomophobia Questionnaire (NMP-Q)",
  "short_title": "NMP-Q",
  "source_url": "https://us.psytoolkit.org/survey-library/nmp-q.html",
  "publication": {
    "citation": "Yildirim, C. & Correia, A. (2015). Exploring the dimensions of nomophobia: Development and validation\nof a self-reported questionnaire. Computers in Human Behavior, 49 , 130-137.",
    "year": 2015
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_nmpq_agree_7",
      "dimension": "agree",
      "measurement_type": "ordinal",
      "levels": 7,
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "value_range": [
        1,
        7
      ],
      "anchors": [
        "strongly disagree",
        "disagree",
        "somewhat disagree",
        "neutral",
        "somehwat agree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_nmpq_1",
      "prompt_snippet": "I would feel uncomfortable without constant access to information through my sma",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_nmpq_2",
      "prompt_snippet": "I would be annoyed if I could not look information up on my smartphone when I wa",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_nmpq_3",
      "prompt_snippet": "Being unable to get the news (e.g., happenings, weather, etc.) on my smartphone ",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_nmpq_4",
      "prompt_snippet": "I would be annoyed if I could not use my smartphone and/or its capabilities when",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_nmpq_5",
      "prompt_snippet": "Running out of battery in my smartphone would scare me",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_nmpq_6",
      "prompt_snippet": "If I were to run out of credits or hit my monthly data limit, I would panic",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_nmpq_7",
      "prompt_snippet": "If I did not have a data signal or could not connect to Wi-Fi, then I would cons",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_nmpq_8",
      "prompt_snippet": "If I could not use my smartphone, I would be afraid of getting stranded somewher",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_nmpq_9",
      "prompt_snippet": "If I could not check my smartphone for a while, I would feel a desire to check i",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_nmpq_10",
      "prompt_snippet": "I would feel anxious because I could not instantly communicate with my family an",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_nmpq_11",
      "prompt_snippet": "I would be worried because my family and/or friends could not reach me",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_nmpq_12",
      "prompt_snippet": "I would feel nervous because I would not be able to receive text messages and ca",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_nmpq_13",
      "prompt_snippet": "I would be anxious because I could not keep in touch with my family and/or frien",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_nmpq_14",
      "prompt_snippet": "I would be nervous because I could not know if someone had tried to get a hold o",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_nmpq_15",
      "prompt_snippet": "I would feel anxious because my constant connection to my family and friends wou",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_nmpq_16",
      "prompt_snippet": "I would be nervous because I would be disconnected from my online identity",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_nmpq_17",
      "prompt_snippet": "I would be uncomfortable because I could not stay up-to-date with social media a",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_nmpq_18",
      "prompt_snippet": "I would feel awkward because I could not check my notifications for updates from",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_nmpq_19",
      "prompt_snippet": "I would feel anxious because I could not check my email messages",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_nmpq_20",
      "prompt_snippet": "I would feel weird because I would not know what to do",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
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
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I would feel uncomfortable without constant access to information through my sma | agree | 1,2,3,4,5,6,7 | no |
| 2 | I would be annoyed if I could not look information up on my smartphone when I wa | agree | 1,2,3,4,5,6,7 | no |
| 3 | Being unable to get the news (e.g., happenings, weather, etc.) on my smartphone  | agree | 1,2,3,4,5,6,7 | no |
| 4 | I would be annoyed if I could not use my smartphone and/or its capabilities when | agree | 1,2,3,4,5,6,7 | no |
| 5 | Running out of battery in my smartphone would scare me | agree | 1,2,3,4,5,6,7 | no |
| 6 | If I were to run out of credits or hit my monthly data limit, I would panic | agree | 1,2,3,4,5,6,7 | no |
| 7 | If I did not have a data signal or could not connect to Wi-Fi, then I would cons | agree | 1,2,3,4,5,6,7 | no |
| 8 | If I could not use my smartphone, I would be afraid of getting stranded somewher | agree | 1,2,3,4,5,6,7 | no |
| 9 | If I could not check my smartphone for a while, I would feel a desire to check i | agree | 1,2,3,4,5,6,7 | no |
| 10 | I would feel anxious because I could not instantly communicate with my family an | agree | 1,2,3,4,5,6,7 | no |
| 11 | I would be worried because my family and/or friends could not reach me | agree | 1,2,3,4,5,6,7 | no |
| 12 | I would feel nervous because I would not be able to receive text messages and ca | agree | 1,2,3,4,5,6,7 | no |
| 13 | I would be anxious because I could not keep in touch with my family and/or frien | agree | 1,2,3,4,5,6,7 | no |
| 14 | I would be nervous because I could not know if someone had tried to get a hold o | agree | 1,2,3,4,5,6,7 | no |
| 15 | I would feel anxious because my constant connection to my family and friends wou | agree | 1,2,3,4,5,6,7 | no |
| 16 | I would be nervous because I would be disconnected from my online identity | agree | 1,2,3,4,5,6,7 | no |
| 17 | I would be uncomfortable because I could not stay up-to-date with social media a | agree | 1,2,3,4,5,6,7 | no |
| 18 | I would feel awkward because I could not check my notifications for updates from | agree | 1,2,3,4,5,6,7 | no |
| 19 | I would feel anxious because I could not check my email messages | agree | 1,2,3,4,5,6,7 | no |
| 20 | I would feel weird because I would not know what to do | agree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/nmp-q.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

# Scoring — Problematic Internet Use Questionnaire (PIUQ) (`qst_piuq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_piuq",
  "title": "Problematic Internet Use Questionnaire (PIUQ)",
  "short_title": "PIUQ",
  "source_url": "https://us.psytoolkit.org/survey-library/addiction-internet-piuq.html",
  "publication": {
    "citation": "Demetrovics, Z., Szeredi, B., & Rózsa, S. (2008). The three-factor model of Internet addiction: The development of the Problematic Internet Use Questionnaire. Behavior Research Methods, 40 , 563-574.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_piuq_frequency_5",
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
        "never",
        "rarely",
        "sometimes",
        "often",
        "always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_piuq_1",
      "prompt_snippet": "How often do you fantasize about the Internet, or think about what it would be l",
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
      "prompt_id": "pr_piuq_2",
      "prompt_snippet": "How often do you neglect household chores to spend more time online?",
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
      "prompt_id": "pr_piuq_3",
      "prompt_snippet": "How often do you feel that you should decrease the amount of time spent online?",
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
      "prompt_id": "pr_piuq_4",
      "prompt_snippet": "How often do you daydream about the Internet?",
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
      "prompt_id": "pr_piuq_5",
      "prompt_snippet": "How often do you spend time online when you’d rather sleep?",
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
      "prompt_id": "pr_piuq_6",
      "prompt_snippet": "How often does it happen to you that you wish to decrease the amount of time spe",
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
      "prompt_id": "pr_piuq_7",
      "prompt_snippet": "How often do you feel tense, irritated, or stressed if you cannot use the Intern",
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
      "prompt_id": "pr_piuq_8",
      "prompt_snippet": "How often do you choose the Internet rather than being with your partner?",
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
      "prompt_id": "pr_piuq_9",
      "prompt_snippet": "How often do you try to conceal the amount of time spent online?",
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
      "prompt_id": "pr_piuq_10",
      "prompt_snippet": "How often do you feel tense, irritated, or stressed if you cannot use the Intern",
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
      "prompt_id": "pr_piuq_11",
      "prompt_snippet": "How often does the use of Internet impair your work or your efficacy?",
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
      "prompt_id": "pr_piuq_12",
      "prompt_snippet": "How often do you feel that your Internet usage causes problems for you?",
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
      "prompt_id": "pr_piuq_13",
      "prompt_snippet": "How often does it happen to you that you feel depressed, moody, or nervous when ",
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
      "prompt_id": "pr_piuq_14",
      "prompt_snippet": "How often do people in your life complain about spending too much time online?",
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
      "prompt_id": "pr_piuq_15",
      "prompt_snippet": "How often do you realize saying when you are online, “just a couple of more minu",
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
      "prompt_id": "pr_piuq_16",
      "prompt_snippet": "How often do you dream about the Internet?",
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
      "prompt_id": "pr_piuq_17",
      "prompt_snippet": "How often do you choose the Internet rather than going out with somebody to have",
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
      "prompt_id": "pr_piuq_18",
      "prompt_snippet": "How often do you think that you should ask for help in relation to your Internet",
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

- Items: 18
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | How often do you fantasize about the Internet, or think about what it would be l | frequency | 1,2,3,4,5 | no |
| 2 | How often do you neglect household chores to spend more time online? | frequency | 1,2,3,4,5 | no |
| 3 | How often do you feel that you should decrease the amount of time spent online? | frequency | 1,2,3,4,5 | no |
| 4 | How often do you daydream about the Internet? | frequency | 1,2,3,4,5 | no |
| 5 | How often do you spend time online when you’d rather sleep? | frequency | 1,2,3,4,5 | no |
| 6 | How often does it happen to you that you wish to decrease the amount of time spe | frequency | 1,2,3,4,5 | no |
| 7 | How often do you feel tense, irritated, or stressed if you cannot use the Intern | frequency | 1,2,3,4,5 | no |
| 8 | How often do you choose the Internet rather than being with your partner? | frequency | 1,2,3,4,5 | no |
| 9 | How often do you try to conceal the amount of time spent online? | frequency | 1,2,3,4,5 | no |
| 10 | How often do you feel tense, irritated, or stressed if you cannot use the Intern | frequency | 1,2,3,4,5 | no |
| 11 | How often does the use of Internet impair your work or your efficacy? | frequency | 1,2,3,4,5 | no |
| 12 | How often do you feel that your Internet usage causes problems for you? | frequency | 1,2,3,4,5 | no |
| 13 | How often does it happen to you that you feel depressed, moody, or nervous when  | frequency | 1,2,3,4,5 | no |
| 14 | How often do people in your life complain about spending too much time online? | frequency | 1,2,3,4,5 | no |
| 15 | How often do you realize saying when you are online, “just a couple of more minu | frequency | 1,2,3,4,5 | no |
| 16 | How often do you dream about the Internet? | frequency | 1,2,3,4,5 | no |
| 17 | How often do you choose the Internet rather than going out with somebody to have | frequency | 1,2,3,4,5 | no |
| 18 | How often do you think that you should ask for help in relation to your Internet | frequency | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/addiction-internet-piuq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

# Scoring — Dominance Scale (for relationship research) (`qst_ard`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ard",
  "title": "Dominance Scale (for relationship research)",
  "short_title": "for relationship research",
  "source_url": "https://us.psytoolkit.org/survey-library/dominance-ard.html",
  "publication": {
    "citation": "Hamby, S. L., (1996). The dominance scale: Preliminary Psychometric Properties. Violence and Victims, 11 , 199-212. Link to paper online .",
    "year": 1996
  },
  "status": "needs-research",
  "item_count": 32,
  "dimensions": [
    "agree_ard"
  ],
  "option_scales": [
    {
      "ref": "opt_ard_agree_ard_4",
      "dimension": "agree_ard",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "Strongly agree",
        "Agree",
        "Disagree",
        "Strongly disagree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ard_1",
      "prompt_snippet": "My partner often has good ideas.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_ard_2",
      "prompt_snippet": "I try to keep my partner from spending time with opposite sex friends.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_ard_3",
      "prompt_snippet": "If my partner and I can't agree, I usually have the final say.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_ard_4",
      "prompt_snippet": "It bothers me when my partner makes plans without talking to me first.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_ard_5",
      "prompt_snippet": "My partner doesn't have enough sense to make important decisions.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_ard_6",
      "prompt_snippet": "I hate losing arguments with my partner.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_ard_7",
      "prompt_snippet": "My partner should not keep any secrets from me.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_ard_8",
      "prompt_snippet": "I insist on knowing where my partner is at all times.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_ard_9",
      "prompt_snippet": "When my partner and I watch TV I hold the remote control.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_ard_10",
      "prompt_snippet": "My partner and I generally have equal say about decisions.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_ard_11",
      "prompt_snippet": "It would bother me if my partner made more money than I did.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_ard_12",
      "prompt_snippet": "I generally consider my partner's interests as much as mine.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_ard_13",
      "prompt_snippet": "I tend to be jealous.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_ard_14",
      "prompt_snippet": "Things are easier in my relationship if I am in charge.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_ard_15",
      "prompt_snippet": "Sometimes I have to remind my partner of who's boss.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_ard_16",
      "prompt_snippet": "I have a right to know everything my partner does.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_ard_17",
      "prompt_snippet": "It would make me mad if my partner did something I had said not to do.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_ard_18",
      "prompt_snippet": "Both partners in a relationship should have equal say about decisions.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_ard_19",
      "prompt_snippet": "If my partner and I can't agree, I should have the final say.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_ard_20",
      "prompt_snippet": "I understand there are some things my partner may not want to talk about with me",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_ard_21",
      "prompt_snippet": "My partner needs to remember that I am in charge.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_ard_22",
      "prompt_snippet": "My partner is a talented person.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_ard_23",
      "prompt_snippet": "It's hard for my partner to learn new things.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_ard_24",
      "prompt_snippet": "People usually like my partner.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_ard_25",
      "prompt_snippet": "My partner makes a lot of mistakes.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_ard_26",
      "prompt_snippet": "My partner can handle most things that happen.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_ard_27",
      "prompt_snippet": "I sometimes think my partner is unattractive.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_ard_28",
      "prompt_snippet": "My partner is basically a good person.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_ard_29",
      "prompt_snippet": "My partner doesn't know how to act in public.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_ard_30",
      "prompt_snippet": "I often tell my partner how to do something.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_ard_31",
      "prompt_snippet": "I dominate my partner.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_ard_32",
      "prompt_snippet": "I have a right to be involved with anything my partner does.",
      "dimension": "agree_ard",
      "values": [
        4,
        3,
        2,
        1
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

- Items: 32
- Dimensions: agree_ard
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | My partner often has good ideas. | agree_ard | 4,3,2,1 | no |
| 2 | I try to keep my partner from spending time with opposite sex friends. | agree_ard | 4,3,2,1 | no |
| 3 | If my partner and I can't agree, I usually have the final say. | agree_ard | 4,3,2,1 | no |
| 4 | It bothers me when my partner makes plans without talking to me first. | agree_ard | 4,3,2,1 | no |
| 5 | My partner doesn't have enough sense to make important decisions. | agree_ard | 4,3,2,1 | no |
| 6 | I hate losing arguments with my partner. | agree_ard | 4,3,2,1 | no |
| 7 | My partner should not keep any secrets from me. | agree_ard | 4,3,2,1 | no |
| 8 | I insist on knowing where my partner is at all times. | agree_ard | 4,3,2,1 | no |
| 9 | When my partner and I watch TV I hold the remote control. | agree_ard | 4,3,2,1 | no |
| 10 | My partner and I generally have equal say about decisions. | agree_ard | 4,3,2,1 | no |
| 11 | It would bother me if my partner made more money than I did. | agree_ard | 4,3,2,1 | no |
| 12 | I generally consider my partner's interests as much as mine. | agree_ard | 4,3,2,1 | no |
| 13 | I tend to be jealous. | agree_ard | 4,3,2,1 | no |
| 14 | Things are easier in my relationship if I am in charge. | agree_ard | 4,3,2,1 | no |
| 15 | Sometimes I have to remind my partner of who's boss. | agree_ard | 4,3,2,1 | no |
| 16 | I have a right to know everything my partner does. | agree_ard | 4,3,2,1 | no |
| 17 | It would make me mad if my partner did something I had said not to do. | agree_ard | 4,3,2,1 | no |
| 18 | Both partners in a relationship should have equal say about decisions. | agree_ard | 4,3,2,1 | no |
| 19 | If my partner and I can't agree, I should have the final say. | agree_ard | 4,3,2,1 | no |
| 20 | I understand there are some things my partner may not want to talk about with me | agree_ard | 4,3,2,1 | no |
| 21 | My partner needs to remember that I am in charge. | agree_ard | 4,3,2,1 | no |
| 22 | My partner is a talented person. | agree_ard | 4,3,2,1 | no |
| 23 | It's hard for my partner to learn new things. | agree_ard | 4,3,2,1 | no |
| 24 | People usually like my partner. | agree_ard | 4,3,2,1 | no |
| 25 | My partner makes a lot of mistakes. | agree_ard | 4,3,2,1 | no |
| 26 | My partner can handle most things that happen. | agree_ard | 4,3,2,1 | no |
| 27 | I sometimes think my partner is unattractive. | agree_ard | 4,3,2,1 | no |
| 28 | My partner is basically a good person. | agree_ard | 4,3,2,1 | no |
| 29 | My partner doesn't know how to act in public. | agree_ard | 4,3,2,1 | no |
| 30 | I often tell my partner how to do something. | agree_ard | 4,3,2,1 | no |
| 31 | I dominate my partner. | agree_ard | 4,3,2,1 | no |
| 32 | I have a right to be involved with anything my partner does. | agree_ard | 4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/dominance-ard.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

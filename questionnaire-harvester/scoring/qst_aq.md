# Scoring — Autism Spectrum Quotient (AQ) (`qst_aq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_aq",
  "title": "Autism Spectrum Quotient (AQ)",
  "short_title": "AQ",
  "source_url": "https://psychology-tools.com/test/autism-spectrum-quotient",
  "publication": {
    "citation": "Simon Baron-Cohen, et al. The Autism-Spectrum Quotient (AQ): Evidence from Asperger Syndrome/High-Functioning Autism, Males and Females, Scientists and Mathematicians. 31: Journal of Autism and Developmental Disorders 5-17. 2001.",
    "year": 2001
  },
  "status": "needs-research",
  "item_count": 50,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_aq_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        0,
        1,
        1
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Definitely Agree",
        "Slightly Agree",
        "Slightly Disagree",
        "Definitely Disagree"
      ]
    },
    {
      "ref": "opt_aq_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        1,
        0,
        0
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "Definitely Agree",
        "Slightly Agree",
        "Slightly Disagree",
        "Definitely Disagree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_aq_1",
      "prompt_snippet": "I prefer to do things with others rather than on my own.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_aq_2",
      "prompt_snippet": "I prefer to do things the same way over and over again.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_aq_3",
      "prompt_snippet": "If I try to imagine something, I find it very easy to create a picture in my min",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_aq_4",
      "prompt_snippet": "I frequently get so strongly absorbed in one thing that I lose sight of other th",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_aq_5",
      "prompt_snippet": "I often notice small sounds when others do not.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_aq_6",
      "prompt_snippet": "I usually notice car number plates or similar strings of information.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_aq_7",
      "prompt_snippet": "Other people frequently tell me that what I’ve said is impolite, even though I t",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_aq_8",
      "prompt_snippet": "When I’m reading a story, I can easily imagine what the characters might look li",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_aq_9",
      "prompt_snippet": "I am fascinated by dates.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_aq_10",
      "prompt_snippet": "In a social group, I can easily keep track of several different people’s convers",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_aq_11",
      "prompt_snippet": "I find social situations easy.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_aq_12",
      "prompt_snippet": "I tend to notice details that others do not.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_aq_13",
      "prompt_snippet": "I would rather go to a library than to a party.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_aq_14",
      "prompt_snippet": "I find making up stories easy.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_aq_15",
      "prompt_snippet": "I find myself drawn more strongly to people than to things.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_aq_16",
      "prompt_snippet": "I tend to have very strong interests, which I get upset about if I can’t pursue.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_aq_17",
      "prompt_snippet": "I enjoy social chitchat.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_aq_18",
      "prompt_snippet": "When I talk, it isn’t always easy for others to get a word in edgewise.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_aq_19",
      "prompt_snippet": "I am fascinated by numbers.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_aq_20",
      "prompt_snippet": "When I’m reading a story, I find it difficult to work out the characters’ intent",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_aq_21",
      "prompt_snippet": "I don’t particularly enjoy reading fiction.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_aq_22",
      "prompt_snippet": "I find it hard to make new friends.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_aq_23",
      "prompt_snippet": "I notice patterns in things all the time.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_aq_24",
      "prompt_snippet": "I would rather go to the theater than to a museum.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_aq_25",
      "prompt_snippet": "It does not upset me if my daily routine is disturbed.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_aq_26",
      "prompt_snippet": "I frequently find that I don’t know how to keep a conversation going.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_aq_27",
      "prompt_snippet": "I find it easy to “read between the lines” when someone is talking to me.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_aq_28",
      "prompt_snippet": "I usually concentrate more on the whole picture, rather than on the small detail",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_aq_29",
      "prompt_snippet": "I am not very good at remembering phone numbers.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_aq_30",
      "prompt_snippet": "I don’t usually notice small changes in a situation or a person’s appearance.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_aq_31",
      "prompt_snippet": "I know how to tell if someone listening to me is getting bored.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_aq_32",
      "prompt_snippet": "I find it easy to do more than one thing at once.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_aq_33",
      "prompt_snippet": "When I talk on the phone, I’m not sure when it’s my turn to speak.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_aq_34",
      "prompt_snippet": "I enjoy doing things spontaneously.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_aq_35",
      "prompt_snippet": "I am often the last to understand the point of a joke.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_aq_36",
      "prompt_snippet": "I find it easy to work out what someone is thinking or feeling just by looking a",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_aq_37",
      "prompt_snippet": "If there is an interruption, I can switch back to what I was doing very quickly.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_aq_38",
      "prompt_snippet": "I am good at social chitchat.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_aq_39",
      "prompt_snippet": "People often tell me that I keep going on and on about the same thing.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 40,
      "prompt_id": "pr_aq_40",
      "prompt_snippet": "When I was young, I used to enjoy playing games involving pretending with other ",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 41,
      "prompt_id": "pr_aq_41",
      "prompt_snippet": "I like to collect information about categories of things (e.g., types of cars, b",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 42,
      "prompt_id": "pr_aq_42",
      "prompt_snippet": "I find it difficult to imagine what it would be like to be someone else.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 43,
      "prompt_id": "pr_aq_43",
      "prompt_snippet": "I like to carefully plan any activities I participate in.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 44,
      "prompt_id": "pr_aq_44",
      "prompt_snippet": "I enjoy social occasions.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 45,
      "prompt_id": "pr_aq_45",
      "prompt_snippet": "I find it difficult to work out people’s intentions.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 46,
      "prompt_id": "pr_aq_46",
      "prompt_snippet": "New situations make me anxious.",
      "dimension": "rating",
      "values": [
        1,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 47,
      "prompt_id": "pr_aq_47",
      "prompt_snippet": "I enjoy meeting new people.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 48,
      "prompt_id": "pr_aq_48",
      "prompt_snippet": "I am a good diplomat.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 49,
      "prompt_id": "pr_aq_49",
      "prompt_snippet": "I am not very good at remembering people’s date of birth.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        1
      ],
      "reversed": false
    },
    {
      "index": 50,
      "prompt_id": "pr_aq_50",
      "prompt_snippet": "I find it very easy to play games with children that involve pretending.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
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

- Items: 50
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I prefer to do things with others rather than on my own. | rating | 0,0,1,1 | no |
| 2 | I prefer to do things the same way over and over again. | rating | 1,1,0,0 | no |
| 3 | If I try to imagine something, I find it very easy to create a picture in my min | rating | 0,0,1,1 | no |
| 4 | I frequently get so strongly absorbed in one thing that I lose sight of other th | rating | 1,1,0,0 | no |
| 5 | I often notice small sounds when others do not. | rating | 1,1,0,0 | no |
| 6 | I usually notice car number plates or similar strings of information. | rating | 1,1,0,0 | no |
| 7 | Other people frequently tell me that what I’ve said is impolite, even though I t | rating | 1,1,0,0 | no |
| 8 | When I’m reading a story, I can easily imagine what the characters might look li | rating | 0,0,1,1 | no |
| 9 | I am fascinated by dates. | rating | 1,1,0,0 | no |
| 10 | In a social group, I can easily keep track of several different people’s convers | rating | 0,0,1,1 | no |
| 11 | I find social situations easy. | rating | 0,0,1,1 | no |
| 12 | I tend to notice details that others do not. | rating | 1,1,0,0 | no |
| 13 | I would rather go to a library than to a party. | rating | 1,1,0,0 | no |
| 14 | I find making up stories easy. | rating | 0,0,1,1 | no |
| 15 | I find myself drawn more strongly to people than to things. | rating | 0,0,1,1 | no |
| 16 | I tend to have very strong interests, which I get upset about if I can’t pursue. | rating | 1,1,0,0 | no |
| 17 | I enjoy social chitchat. | rating | 0,0,1,1 | no |
| 18 | When I talk, it isn’t always easy for others to get a word in edgewise. | rating | 1,1,0,0 | no |
| 19 | I am fascinated by numbers. | rating | 1,1,0,0 | no |
| 20 | When I’m reading a story, I find it difficult to work out the characters’ intent | rating | 1,1,0,0 | no |
| 21 | I don’t particularly enjoy reading fiction. | rating | 1,1,0,0 | no |
| 22 | I find it hard to make new friends. | rating | 1,1,0,0 | no |
| 23 | I notice patterns in things all the time. | rating | 1,1,0,0 | no |
| 24 | I would rather go to the theater than to a museum. | rating | 0,0,1,1 | no |
| 25 | It does not upset me if my daily routine is disturbed. | rating | 0,0,1,1 | no |
| 26 | I frequently find that I don’t know how to keep a conversation going. | rating | 1,1,0,0 | no |
| 27 | I find it easy to “read between the lines” when someone is talking to me. | rating | 0,0,1,1 | no |
| 28 | I usually concentrate more on the whole picture, rather than on the small detail | rating | 0,0,1,1 | no |
| 29 | I am not very good at remembering phone numbers. | rating | 0,0,1,1 | no |
| 30 | I don’t usually notice small changes in a situation or a person’s appearance. | rating | 0,0,1,1 | no |
| 31 | I know how to tell if someone listening to me is getting bored. | rating | 0,0,1,1 | no |
| 32 | I find it easy to do more than one thing at once. | rating | 0,0,1,1 | no |
| 33 | When I talk on the phone, I’m not sure when it’s my turn to speak. | rating | 1,1,0,0 | no |
| 34 | I enjoy doing things spontaneously. | rating | 0,0,1,1 | no |
| 35 | I am often the last to understand the point of a joke. | rating | 1,1,0,0 | no |
| 36 | I find it easy to work out what someone is thinking or feeling just by looking a | rating | 0,0,1,1 | no |
| 37 | If there is an interruption, I can switch back to what I was doing very quickly. | rating | 0,0,1,1 | no |
| 38 | I am good at social chitchat. | rating | 0,0,1,1 | no |
| 39 | People often tell me that I keep going on and on about the same thing. | rating | 1,1,0,0 | no |
| 40 | When I was young, I used to enjoy playing games involving pretending with other  | rating | 0,0,1,1 | no |
| 41 | I like to collect information about categories of things (e.g., types of cars, b | rating | 1,1,0,0 | no |
| 42 | I find it difficult to imagine what it would be like to be someone else. | rating | 1,1,0,0 | no |
| 43 | I like to carefully plan any activities I participate in. | rating | 1,1,0,0 | no |
| 44 | I enjoy social occasions. | rating | 0,0,1,1 | no |
| 45 | I find it difficult to work out people’s intentions. | rating | 1,1,0,0 | no |
| 46 | New situations make me anxious. | rating | 1,1,0,0 | no |
| 47 | I enjoy meeting new people. | rating | 0,0,1,1 | no |
| 48 | I am a good diplomat. | rating | 0,0,1,1 | no |
| 49 | I am not very good at remembering people’s date of birth. | rating | 0,0,1,1 | no |
| 50 | I find it very easy to play games with children that involve pretending. | rating | 0,0,1,1 | no |

## To research (fill from https://psychology-tools.com/test/autism-spectrum-quotient)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

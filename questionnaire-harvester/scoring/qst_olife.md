# Scoring — Short Oxford-Liverpool Inventory of Feelings and Experiences (O-LIFE). (`qst_olife`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_olife",
  "title": "Short Oxford-Liverpool Inventory of Feelings and Experiences (O-LIFE).",
  "short_title": "O-LIFE",
  "source_url": "https://us.psytoolkit.org/survey-library/schizotypy-short-olife.html",
  "publication": {
    "citation": "Mason, O., Linney, Y., & Claridge, G. (2005). Short scales for\nmeasuring schizotypy. Schizophrenia Research, 78 , 293-296.",
    "year": 2005
  },
  "status": "needs-research",
  "item_count": 43,
  "dimensions": [
    "yesno"
  ],
  "option_scales": [
    {
      "ref": "opt_olife_yesno_2",
      "dimension": "yesno",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        1,
        0
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "yes",
        "no"
      ]
    }
  ],
  "reversed_items": [
    "pr_olife_26",
    "pr_olife_27",
    "pr_olife_28",
    "pr_olife_30",
    "pr_olife_31",
    "pr_olife_34",
    "pr_olife_37",
    "pr_olife_39"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_olife_1",
      "prompt_snippet": "When in the dark do you often see shapes and forms even though there is nothing ",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_olife_2",
      "prompt_snippet": "Are your thoughts sometimes so strong that you can almost hear them?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_olife_3",
      "prompt_snippet": "Have you ever thought that you had special, almost magical powers?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_olife_4",
      "prompt_snippet": "Have you sometimes sensed an evil presence around you, even though you could not",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_olife_5",
      "prompt_snippet": "Do you think that you could learn to read other’s minds if you wanted to?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_olife_6",
      "prompt_snippet": "When you look in the mirror does your face sometimes seem quite different from u",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_olife_7",
      "prompt_snippet": "Do ideas and insights sometimes come to you so fast that you cannot express them",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_olife_8",
      "prompt_snippet": "Can some people make you aware of them just by thinking about you?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_olife_9",
      "prompt_snippet": "Does a passing thought ever seem so real it frightens you?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_olife_10",
      "prompt_snippet": "Do you feel that your accidents are caused by mysterious forces?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_olife_11",
      "prompt_snippet": "Do you ever have a sense of vague danger or sudden dread for reasons that you do",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_olife_12",
      "prompt_snippet": "Does your sense of smell sometimes become unusually strong?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_olife_13",
      "prompt_snippet": "Are you easily confused if too much happens at the same time?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_olife_14",
      "prompt_snippet": "Do you frequently have difficulty in starting to do things?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_olife_15",
      "prompt_snippet": "Are you a person whose mood goes up and down easily?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_olife_16",
      "prompt_snippet": "Do you dread going into a room by yourself where other people have already gathe",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_olife_17",
      "prompt_snippet": "Do you find it difficult to keep interested in the same thing for a long time?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_olife_18",
      "prompt_snippet": "Do you often have difficulties in controlling your thoughts?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_olife_19",
      "prompt_snippet": "Are you easily distracted from work by daydreams?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_olife_20",
      "prompt_snippet": "Do you ever feel that your speech is difficult to understand because the words a",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_olife_21",
      "prompt_snippet": "Are you easily distracted when you read or talk to someone?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_olife_22",
      "prompt_snippet": "Is it hard for you to make decisions?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_olife_23",
      "prompt_snippet": "When in a crowded room, do you often have difficulty in following a conversation",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_olife_24",
      "prompt_snippet": "Are there very few things that you have ever enjoyed doing?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_olife_25",
      "prompt_snippet": "Are you much too independent to get involved with other people?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_olife_26",
      "prompt_snippet": "Do you love having your back massaged?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 27,
      "prompt_id": "pr_olife_27",
      "prompt_snippet": "Do you find the bright lights of a city exciting to look at?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 28,
      "prompt_id": "pr_olife_28",
      "prompt_snippet": "Do you feel very close to your friends?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 29,
      "prompt_id": "pr_olife_29",
      "prompt_snippet": "Has dancing or the idea of it always seemed dull to you?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_olife_30",
      "prompt_snippet": "Do you like mixing with people?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 31,
      "prompt_id": "pr_olife_31",
      "prompt_snippet": "Is trying new foods something you have always enjoyed?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 32,
      "prompt_id": "pr_olife_32",
      "prompt_snippet": "Have you often felt uncomfortable when your friends touch you?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_olife_33",
      "prompt_snippet": "Do you prefer watching television to going out with people?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_olife_34",
      "prompt_snippet": "Do you consider yourself to be pretty much an average sort of person?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 35,
      "prompt_id": "pr_olife_35",
      "prompt_snippet": "Would you like other people to be afraid of you?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_olife_36",
      "prompt_snippet": "Do you often feel the impulse to spend money which you know you can’t afford?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_olife_37",
      "prompt_snippet": "Are you usually in an average kind of mood, not too high and not too low?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 38,
      "prompt_id": "pr_olife_38",
      "prompt_snippet": "Do you at times have an urge to do something harmful or shocking?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_olife_39",
      "prompt_snippet": "Do you stop to think things over before doing anything?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 40,
      "prompt_id": "pr_olife_40",
      "prompt_snippet": "Do you often overindulge in alcohol or food?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 41,
      "prompt_id": "pr_olife_41",
      "prompt_snippet": "Do you ever have the urge to break or smash things?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 42,
      "prompt_id": "pr_olife_42",
      "prompt_snippet": "Have you ever felt the urge to injure yourself?",
      "dimension": "yesno",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 43,
      "prompt_id": "pr_olife_43",
      "prompt_snippet": "Do you often feel like doing the opposite of what other people suggest even thou",
      "dimension": "yesno",
      "values": [
        1,
        0
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

- Items: 43
- Dimensions: yesno
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_olife_26, pr_olife_27, pr_olife_28, pr_olife_30, pr_olife_31, pr_olife_34, pr_olife_37, pr_olife_39
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | When in the dark do you often see shapes and forms even though there is nothing  | yesno | 1,0 | no |
| 2 | Are your thoughts sometimes so strong that you can almost hear them? | yesno | 1,0 | no |
| 3 | Have you ever thought that you had special, almost magical powers? | yesno | 1,0 | no |
| 4 | Have you sometimes sensed an evil presence around you, even though you could not | yesno | 1,0 | no |
| 5 | Do you think that you could learn to read other’s minds if you wanted to? | yesno | 1,0 | no |
| 6 | When you look in the mirror does your face sometimes seem quite different from u | yesno | 1,0 | no |
| 7 | Do ideas and insights sometimes come to you so fast that you cannot express them | yesno | 1,0 | no |
| 8 | Can some people make you aware of them just by thinking about you? | yesno | 1,0 | no |
| 9 | Does a passing thought ever seem so real it frightens you? | yesno | 1,0 | no |
| 10 | Do you feel that your accidents are caused by mysterious forces? | yesno | 1,0 | no |
| 11 | Do you ever have a sense of vague danger or sudden dread for reasons that you do | yesno | 1,0 | no |
| 12 | Does your sense of smell sometimes become unusually strong? | yesno | 1,0 | no |
| 13 | Are you easily confused if too much happens at the same time? | yesno | 1,0 | no |
| 14 | Do you frequently have difficulty in starting to do things? | yesno | 1,0 | no |
| 15 | Are you a person whose mood goes up and down easily? | yesno | 1,0 | no |
| 16 | Do you dread going into a room by yourself where other people have already gathe | yesno | 1,0 | no |
| 17 | Do you find it difficult to keep interested in the same thing for a long time? | yesno | 1,0 | no |
| 18 | Do you often have difficulties in controlling your thoughts? | yesno | 1,0 | no |
| 19 | Are you easily distracted from work by daydreams? | yesno | 1,0 | no |
| 20 | Do you ever feel that your speech is difficult to understand because the words a | yesno | 1,0 | no |
| 21 | Are you easily distracted when you read or talk to someone? | yesno | 1,0 | no |
| 22 | Is it hard for you to make decisions? | yesno | 1,0 | no |
| 23 | When in a crowded room, do you often have difficulty in following a conversation | yesno | 1,0 | no |
| 24 | Are there very few things that you have ever enjoyed doing? | yesno | 1,0 | no |
| 25 | Are you much too independent to get involved with other people? | yesno | 1,0 | no |
| 26 | Do you love having your back massaged? | yesno | 1,0 | yes |
| 27 | Do you find the bright lights of a city exciting to look at? | yesno | 1,0 | yes |
| 28 | Do you feel very close to your friends? | yesno | 1,0 | yes |
| 29 | Has dancing or the idea of it always seemed dull to you? | yesno | 1,0 | no |
| 30 | Do you like mixing with people? | yesno | 1,0 | yes |
| 31 | Is trying new foods something you have always enjoyed? | yesno | 1,0 | yes |
| 32 | Have you often felt uncomfortable when your friends touch you? | yesno | 1,0 | no |
| 33 | Do you prefer watching television to going out with people? | yesno | 1,0 | no |
| 34 | Do you consider yourself to be pretty much an average sort of person? | yesno | 1,0 | yes |
| 35 | Would you like other people to be afraid of you? | yesno | 1,0 | no |
| 36 | Do you often feel the impulse to spend money which you know you can’t afford? | yesno | 1,0 | no |
| 37 | Are you usually in an average kind of mood, not too high and not too low? | yesno | 1,0 | yes |
| 38 | Do you at times have an urge to do something harmful or shocking? | yesno | 1,0 | no |
| 39 | Do you stop to think things over before doing anything? | yesno | 1,0 | yes |
| 40 | Do you often overindulge in alcohol or food? | yesno | 1,0 | no |
| 41 | Do you ever have the urge to break or smash things? | yesno | 1,0 | no |
| 42 | Have you ever felt the urge to injure yourself? | yesno | 1,0 | no |
| 43 | Do you often feel like doing the opposite of what other people suggest even thou | yesno | 1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/schizotypy-short-olife.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

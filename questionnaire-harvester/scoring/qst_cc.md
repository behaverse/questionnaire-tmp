# Scoring — Zuckerman–Kuhlman Personality Questionnaire (Shortened, ZKPQ-50-CC) (`qst_cc`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cc",
  "title": "Zuckerman–Kuhlman Personality Questionnaire (Shortened, ZKPQ-50-CC)",
  "short_title": "Shortened, ZKPQ-50-CC",
  "source_url": "https://us.psytoolkit.org/survey-library/zkpq-50-cc.html",
  "publication": {
    "citation": "Aluja, A., Rossier, J., García, L. F., Angleitner, A., Kuhlman, M., & Zuckerman, M. (2006). A cros-cultural shortened form of the ZKPQ (ZKPQ-50-c) adapted to English, French, German, and Spanish languages. Personality and Individual Differences, 41 , 619-628.",
    "year": 2006
  },
  "status": "needs-research",
  "item_count": 50,
  "dimensions": [
    "truefalse"
  ],
  "option_scales": [
    {
      "ref": "opt_cc_truefalse_2",
      "dimension": "truefalse",
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
        "True",
        "False"
      ]
    }
  ],
  "reversed_items": [
    "pr_cc_4",
    "pr_cc_5",
    "pr_cc_13",
    "pr_cc_14",
    "pr_cc_19",
    "pr_cc_39",
    "pr_cc_41",
    "pr_cc_43",
    "pr_cc_44",
    "pr_cc_46",
    "pr_cc_47",
    "pr_cc_49"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cc_1",
      "prompt_snippet": "I do not like to waste time just sitting around and relaxing.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_cc_2",
      "prompt_snippet": "I lead a busier life than most people.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_cc_3",
      "prompt_snippet": "I like to be doing things all of the time.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_cc_4",
      "prompt_snippet": "I can enjoy myself just lying around and not doing anything active.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_cc_5",
      "prompt_snippet": "I do not feel the need to be doing things all of the time.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 6,
      "prompt_id": "pr_cc_6",
      "prompt_snippet": "When on vacation I like to engage in active sports rather than just lie around.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_cc_7",
      "prompt_snippet": "I like to wear myself out with hard work or exercise.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_cc_8",
      "prompt_snippet": "I like to be active as soon as I wake up in the morning.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_cc_9",
      "prompt_snippet": "I like to keep busy all the time.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_cc_10",
      "prompt_snippet": "When I do things, I do them with lots of energy.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_cc_11",
      "prompt_snippet": "When I get mad, I say ugly things.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_cc_12",
      "prompt_snippet": "It's natural for me to curse when I am mad.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_cc_13",
      "prompt_snippet": "I almost never feel like I would like to hit someone.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_cc_14",
      "prompt_snippet": "If someone offends me, I just try not to think about it.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 15,
      "prompt_id": "pr_cc_15",
      "prompt_snippet": "If people annoy me I do not hesitate to tell them so.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_cc_16",
      "prompt_snippet": "When people disagree with me I cannot help getting into an argument with them.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_cc_17",
      "prompt_snippet": "I have a very strong temper.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_cc_18",
      "prompt_snippet": "I can't help being a little rude to people I do not like.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_cc_19",
      "prompt_snippet": "I am always patient with others even when they are irritating.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 20,
      "prompt_id": "pr_cc_20",
      "prompt_snippet": "When people shout at me, I shout back.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_cc_21",
      "prompt_snippet": "I often do things on impulse.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_cc_22",
      "prompt_snippet": "I would like to take off on a trip with no preplanned or definite routes or time",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_cc_23",
      "prompt_snippet": "I enjoy getting into new situations where you can't predict how things will turn",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_cc_24",
      "prompt_snippet": "I sometimes like to do things that are a little frightening.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_cc_25",
      "prompt_snippet": "I'll try anything once.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_cc_26",
      "prompt_snippet": "I would like the kind of life where one is on the move and travelling a lot, wit",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_cc_27",
      "prompt_snippet": "I sometimes do \"crazy\" things just for fun.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_cc_28",
      "prompt_snippet": "I prefer friends who are excitingly unpredictable.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_cc_29",
      "prompt_snippet": "I often get so carried away by new and exciting things and ideas that I never th",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_cc_30",
      "prompt_snippet": "I like \"wild\" uninhibited parties.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_cc_31",
      "prompt_snippet": "My body often feels all tightened up for no apparent reason.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_cc_32",
      "prompt_snippet": "I frequently get emotionally upset.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_cc_33",
      "prompt_snippet": "I tend to be oversensitive and easily hurt by thoughtless remarks and actions of",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_cc_34",
      "prompt_snippet": "I am easily frightened.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_cc_35",
      "prompt_snippet": "I sometimes feel panicky.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_cc_36",
      "prompt_snippet": "I often feel unsure of myself.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_cc_37",
      "prompt_snippet": "I often worry about things that other people think are unimportant.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_cc_38",
      "prompt_snippet": "I often feel like crying sometimes without a reason.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_cc_39",
      "prompt_snippet": "I don't let a lot of trivial things irritate me.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 40,
      "prompt_id": "pr_cc_40",
      "prompt_snippet": "I often feel uncomfortable and ill at ease for no real reason.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 41,
      "prompt_id": "pr_cc_41",
      "prompt_snippet": "I do not mind going out alone and usually prefer it to being out in a large grou",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 42,
      "prompt_id": "pr_cc_42",
      "prompt_snippet": "I spend as much time with my friends as I can.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 43,
      "prompt_id": "pr_cc_43",
      "prompt_snippet": "I do not need a large number of casual friends.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 44,
      "prompt_id": "pr_cc_44",
      "prompt_snippet": "I tend to be uncomfortable at big parties.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 45,
      "prompt_id": "pr_cc_45",
      "prompt_snippet": "At parties, I enjoy mingling with many people whether I already know them or not",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 46,
      "prompt_id": "pr_cc_46",
      "prompt_snippet": "I would not mind being socially isolated in some place for some period of time.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 47,
      "prompt_id": "pr_cc_47",
      "prompt_snippet": "Generally, I like to be alone so I can do things I want to do without social dis",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 48,
      "prompt_id": "pr_cc_48",
      "prompt_snippet": "I am a very sociable person.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 49,
      "prompt_id": "pr_cc_49",
      "prompt_snippet": "I usually prefer to do things alone.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 50,
      "prompt_id": "pr_cc_50",
      "prompt_snippet": "I probably spend more time than I should socializing with friends.",
      "dimension": "truefalse",
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

- Items: 50
- Dimensions: truefalse
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_cc_4, pr_cc_5, pr_cc_13, pr_cc_14, pr_cc_19, pr_cc_39, pr_cc_41, pr_cc_43, pr_cc_44, pr_cc_46, pr_cc_47, pr_cc_49
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I do not like to waste time just sitting around and relaxing. | truefalse | 1,0 | no |
| 2 | I lead a busier life than most people. | truefalse | 1,0 | no |
| 3 | I like to be doing things all of the time. | truefalse | 1,0 | no |
| 4 | I can enjoy myself just lying around and not doing anything active. | truefalse | 1,0 | yes |
| 5 | I do not feel the need to be doing things all of the time. | truefalse | 1,0 | yes |
| 6 | When on vacation I like to engage in active sports rather than just lie around. | truefalse | 1,0 | no |
| 7 | I like to wear myself out with hard work or exercise. | truefalse | 1,0 | no |
| 8 | I like to be active as soon as I wake up in the morning. | truefalse | 1,0 | no |
| 9 | I like to keep busy all the time. | truefalse | 1,0 | no |
| 10 | When I do things, I do them with lots of energy. | truefalse | 1,0 | no |
| 11 | When I get mad, I say ugly things. | truefalse | 1,0 | no |
| 12 | It's natural for me to curse when I am mad. | truefalse | 1,0 | no |
| 13 | I almost never feel like I would like to hit someone. | truefalse | 1,0 | yes |
| 14 | If someone offends me, I just try not to think about it. | truefalse | 1,0 | yes |
| 15 | If people annoy me I do not hesitate to tell them so. | truefalse | 1,0 | no |
| 16 | When people disagree with me I cannot help getting into an argument with them. | truefalse | 1,0 | no |
| 17 | I have a very strong temper. | truefalse | 1,0 | no |
| 18 | I can't help being a little rude to people I do not like. | truefalse | 1,0 | no |
| 19 | I am always patient with others even when they are irritating. | truefalse | 1,0 | yes |
| 20 | When people shout at me, I shout back. | truefalse | 1,0 | no |
| 21 | I often do things on impulse. | truefalse | 1,0 | no |
| 22 | I would like to take off on a trip with no preplanned or definite routes or time | truefalse | 1,0 | no |
| 23 | I enjoy getting into new situations where you can't predict how things will turn | truefalse | 1,0 | no |
| 24 | I sometimes like to do things that are a little frightening. | truefalse | 1,0 | no |
| 25 | I'll try anything once. | truefalse | 1,0 | no |
| 26 | I would like the kind of life where one is on the move and travelling a lot, wit | truefalse | 1,0 | no |
| 27 | I sometimes do "crazy" things just for fun. | truefalse | 1,0 | no |
| 28 | I prefer friends who are excitingly unpredictable. | truefalse | 1,0 | no |
| 29 | I often get so carried away by new and exciting things and ideas that I never th | truefalse | 1,0 | no |
| 30 | I like "wild" uninhibited parties. | truefalse | 1,0 | no |
| 31 | My body often feels all tightened up for no apparent reason. | truefalse | 1,0 | no |
| 32 | I frequently get emotionally upset. | truefalse | 1,0 | no |
| 33 | I tend to be oversensitive and easily hurt by thoughtless remarks and actions of | truefalse | 1,0 | no |
| 34 | I am easily frightened. | truefalse | 1,0 | no |
| 35 | I sometimes feel panicky. | truefalse | 1,0 | no |
| 36 | I often feel unsure of myself. | truefalse | 1,0 | no |
| 37 | I often worry about things that other people think are unimportant. | truefalse | 1,0 | no |
| 38 | I often feel like crying sometimes without a reason. | truefalse | 1,0 | no |
| 39 | I don't let a lot of trivial things irritate me. | truefalse | 1,0 | yes |
| 40 | I often feel uncomfortable and ill at ease for no real reason. | truefalse | 1,0 | no |
| 41 | I do not mind going out alone and usually prefer it to being out in a large grou | truefalse | 1,0 | yes |
| 42 | I spend as much time with my friends as I can. | truefalse | 1,0 | no |
| 43 | I do not need a large number of casual friends. | truefalse | 1,0 | yes |
| 44 | I tend to be uncomfortable at big parties. | truefalse | 1,0 | yes |
| 45 | At parties, I enjoy mingling with many people whether I already know them or not | truefalse | 1,0 | no |
| 46 | I would not mind being socially isolated in some place for some period of time. | truefalse | 1,0 | yes |
| 47 | Generally, I like to be alone so I can do things I want to do without social dis | truefalse | 1,0 | yes |
| 48 | I am a very sociable person. | truefalse | 1,0 | no |
| 49 | I usually prefer to do things alone. | truefalse | 1,0 | yes |
| 50 | I probably spend more time than I should socializing with friends. | truefalse | 1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/zkpq-50-cc.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

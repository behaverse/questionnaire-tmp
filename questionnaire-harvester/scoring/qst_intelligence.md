# Scoring — Emotional Intelligence (`qst_intelligence`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_intelligence",
  "title": "Emotional Intelligence",
  "short_title": "Emotional Intelligence",
  "source_url": "https://us.psytoolkit.org/survey-library/emotional-intelligence.html",
  "publication": {
    "citation": "Schutte, N. S., Malouff, J. M., Hall, L. E., Haggerty, D. J.,\nCooper, J. T., Golden, C. J., & Dornheim, L. (1998). Development and\nvalidation of a measure of emotional intelligence. Personality and\nIndividual Differences, 25 , 167–177.",
    "year": 1998
  },
  "status": "needs-research",
  "item_count": 33,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_intelligence_agree_5",
      "dimension": "agree",
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
        "neither disagree nor agree",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_intelligence_5",
    "pr_intelligence_28",
    "pr_intelligence_33"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_intelligence_1",
      "prompt_snippet": "I know when to speak about my personal problems to others.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_2",
      "prompt_snippet": "When I am faced with obstacles, I remember times I faced similar obstacles and o",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_3",
      "prompt_snippet": "I expect that I will do well on most things I try.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_4",
      "prompt_snippet": "Other people find it easy to confide in me.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_5",
      "prompt_snippet": "I find it hard to understand the nonverbal messages of other people.",
      "dimension": "agree",
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
      "index": 6,
      "prompt_id": "pr_intelligence_6",
      "prompt_snippet": "Some of the major events of my life have led me to re-evaluate what is important",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_7",
      "prompt_snippet": "When my mood changes, I see new possibilities.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_8",
      "prompt_snippet": "Emotions are some of the things that make my life worth living.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_9",
      "prompt_snippet": "I am aware of my emotions as I experience them.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_10",
      "prompt_snippet": "I expect good things to happen.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_11",
      "prompt_snippet": "I like to share my emotions with others.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_12",
      "prompt_snippet": "When I experience a positive emotion, I know how to make it last.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_13",
      "prompt_snippet": "I arrange events others enjoy.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_14",
      "prompt_snippet": "I seek out activities that make me happy.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_15",
      "prompt_snippet": "I am aware of the nonverbal messages I send to others.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_16",
      "prompt_snippet": "I present myself in a way that makes a good impression on others.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_17",
      "prompt_snippet": "When I am in a positive mood, solving problems is easy for me.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_18",
      "prompt_snippet": "By looking at their facial expressions, I recognize the emotions people are expe",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_19",
      "prompt_snippet": "I know why my emotions change.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_20",
      "prompt_snippet": "When I am in a positive mood, I am able to come up with new ideas.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_21",
      "prompt_snippet": "I have control over my emotions.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_22",
      "prompt_snippet": "I easily recognize my emotions as I experience them.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_23",
      "prompt_snippet": "I motivate myself by imagining a good outcome to tasks I take on.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_24",
      "prompt_snippet": "I compliment others when they have done something well.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_25",
      "prompt_snippet": "I am aware of the nonverbal messages other people send.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_26",
      "prompt_snippet": "When another person tells me about an important event in his or her life, I almo",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_27",
      "prompt_snippet": "When I feel a change in emotions, I tend to come up with new ideas.",
      "dimension": "agree",
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
      "prompt_id": "pr_intelligence_28",
      "prompt_snippet": "When I am faced with a challenge, I give up because I believe I will fail.",
      "dimension": "agree",
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
      "index": 29,
      "prompt_id": "pr_intelligence_29",
      "prompt_snippet": "I know what other people are feeling just by looking at them.",
      "dimension": "agree",
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
      "index": 30,
      "prompt_id": "pr_intelligence_30",
      "prompt_snippet": "I help other people feel better when they are down.",
      "dimension": "agree",
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
      "index": 31,
      "prompt_id": "pr_intelligence_31",
      "prompt_snippet": "I use good moods to help myself keep trying in the face of obstacles.",
      "dimension": "agree",
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
      "index": 32,
      "prompt_id": "pr_intelligence_32",
      "prompt_snippet": "I can tell how people are feeling by listening to the tone of their voice.",
      "dimension": "agree",
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
      "index": 33,
      "prompt_id": "pr_intelligence_33",
      "prompt_snippet": "It is difficult for me to understand why people feel the way they do.",
      "dimension": "agree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
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

- Items: 33
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_intelligence_5, pr_intelligence_28, pr_intelligence_33
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I know when to speak about my personal problems to others. | agree | 1,2,3,4,5 | no |
| 2 | When I am faced with obstacles, I remember times I faced similar obstacles and o | agree | 1,2,3,4,5 | no |
| 3 | I expect that I will do well on most things I try. | agree | 1,2,3,4,5 | no |
| 4 | Other people find it easy to confide in me. | agree | 1,2,3,4,5 | no |
| 5 | I find it hard to understand the nonverbal messages of other people. | agree | 1,2,3,4,5 | yes |
| 6 | Some of the major events of my life have led me to re-evaluate what is important | agree | 1,2,3,4,5 | no |
| 7 | When my mood changes, I see new possibilities. | agree | 1,2,3,4,5 | no |
| 8 | Emotions are some of the things that make my life worth living. | agree | 1,2,3,4,5 | no |
| 9 | I am aware of my emotions as I experience them. | agree | 1,2,3,4,5 | no |
| 10 | I expect good things to happen. | agree | 1,2,3,4,5 | no |
| 11 | I like to share my emotions with others. | agree | 1,2,3,4,5 | no |
| 12 | When I experience a positive emotion, I know how to make it last. | agree | 1,2,3,4,5 | no |
| 13 | I arrange events others enjoy. | agree | 1,2,3,4,5 | no |
| 14 | I seek out activities that make me happy. | agree | 1,2,3,4,5 | no |
| 15 | I am aware of the nonverbal messages I send to others. | agree | 1,2,3,4,5 | no |
| 16 | I present myself in a way that makes a good impression on others. | agree | 1,2,3,4,5 | no |
| 17 | When I am in a positive mood, solving problems is easy for me. | agree | 1,2,3,4,5 | no |
| 18 | By looking at their facial expressions, I recognize the emotions people are expe | agree | 1,2,3,4,5 | no |
| 19 | I know why my emotions change. | agree | 1,2,3,4,5 | no |
| 20 | When I am in a positive mood, I am able to come up with new ideas. | agree | 1,2,3,4,5 | no |
| 21 | I have control over my emotions. | agree | 1,2,3,4,5 | no |
| 22 | I easily recognize my emotions as I experience them. | agree | 1,2,3,4,5 | no |
| 23 | I motivate myself by imagining a good outcome to tasks I take on. | agree | 1,2,3,4,5 | no |
| 24 | I compliment others when they have done something well. | agree | 1,2,3,4,5 | no |
| 25 | I am aware of the nonverbal messages other people send. | agree | 1,2,3,4,5 | no |
| 26 | When another person tells me about an important event in his or her life, I almo | agree | 1,2,3,4,5 | no |
| 27 | When I feel a change in emotions, I tend to come up with new ideas. | agree | 1,2,3,4,5 | no |
| 28 | When I am faced with a challenge, I give up because I believe I will fail. | agree | 1,2,3,4,5 | yes |
| 29 | I know what other people are feeling just by looking at them. | agree | 1,2,3,4,5 | no |
| 30 | I help other people feel better when they are down. | agree | 1,2,3,4,5 | no |
| 31 | I use good moods to help myself keep trying in the face of obstacles. | agree | 1,2,3,4,5 | no |
| 32 | I can tell how people are feeling by listening to the tone of their voice. | agree | 1,2,3,4,5 | no |
| 33 | It is difficult for me to understand why people feel the way they do. | agree | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/emotional-intelligence.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

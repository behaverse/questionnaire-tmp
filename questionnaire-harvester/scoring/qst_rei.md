# Scoring — Rational Experiental Inventory (REI) (`qst_rei`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_rei",
  "title": "Rational Experiental Inventory (REI)",
  "short_title": "REI",
  "source_url": "https://us.psytoolkit.org/survey-library/thinking-style-rei.html",
  "publication": {
    "citation": "Pacini, R. and Epstein, S. (1999). The Relation of Rational and\nExperiential Information Processing Styles to Personality, Basic\nBeliefs, and the Ratio-Bias Phenomenon. Personality and Individual\nDifferences, 76 , 972-987.",
    "year": 1999
  },
  "status": "needs-research",
  "item_count": 40,
  "dimensions": [
    "rei_agree"
  ],
  "option_scales": [
    {
      "ref": "opt_rei_rei_agree_5",
      "dimension": "rei_agree",
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
        "definitely not true of myself",
        "somewhat not true of myself",
        "neither true nor untrue of myself",
        "somewhat true of myself",
        "definitely true of myself"
      ]
    }
  ],
  "reversed_items": [
    "pr_rei_1",
    "pr_rei_2",
    "pr_rei_4",
    "pr_rei_5",
    "pr_rei_7",
    "pr_rei_8",
    "pr_rei_9",
    "pr_rei_11",
    "pr_rei_12",
    "pr_rei_18",
    "pr_rei_22",
    "pr_rei_29",
    "pr_rei_30",
    "pr_rei_32",
    "pr_rei_33",
    "pr_rei_34",
    "pr_rei_36",
    "pr_rei_37",
    "pr_rei_40"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_rei_1",
      "prompt_snippet": "I try to avoid situations that require thinking in depth about something",
      "dimension": "rei_agree",
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
      "index": 2,
      "prompt_id": "pr_rei_2",
      "prompt_snippet": "I'm not that good at figuring out complicated problems",
      "dimension": "rei_agree",
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
      "index": 3,
      "prompt_id": "pr_rei_3",
      "prompt_snippet": "I enjoy intellectual challenges",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_4",
      "prompt_snippet": "I am not very good at solving problems that require careful logical analysis",
      "dimension": "rei_agree",
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
      "index": 5,
      "prompt_id": "pr_rei_5",
      "prompt_snippet": "I don't like to have to do a lot of thinking",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_6",
      "prompt_snippet": "I enjoy solving problems that require hard thinking",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_7",
      "prompt_snippet": "Thinking is not my idea of an enjoyable activity",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_8",
      "prompt_snippet": "I am not a very analytical thinker",
      "dimension": "rei_agree",
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
      "index": 9,
      "prompt_id": "pr_rei_9",
      "prompt_snippet": "Reasoning things out carefully is not one of my strong points",
      "dimension": "rei_agree",
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
      "index": 10,
      "prompt_id": "pr_rei_10",
      "prompt_snippet": "I prefer complex problems to simple problems",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_11",
      "prompt_snippet": "Thinking hard and for a long time about something gives me little satisfaction",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_12",
      "prompt_snippet": "I don't reason well under pressure",
      "dimension": "rei_agree",
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
      "index": 13,
      "prompt_id": "pr_rei_13",
      "prompt_snippet": "I am much better at figuring things out logically than most people",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_14",
      "prompt_snippet": "I have a logical mind",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_15",
      "prompt_snippet": "I enjoy thinking in abstract terms",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_16",
      "prompt_snippet": "I have no problem thinking things through carefully",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_17",
      "prompt_snippet": "Using logic usually works well for me in figuring out problems in my life",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_18",
      "prompt_snippet": "Knowing the answer without having to understand the reasoning behind it is good ",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_19",
      "prompt_snippet": "I usually have clear, explainable reasons for my decisions",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_20",
      "prompt_snippet": "Learning new ways to think would be very appealing to me",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_21",
      "prompt_snippet": "I like to rely on my intuitive impressions",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_22",
      "prompt_snippet": "I don't have a very good sense of intuition",
      "dimension": "rei_agree",
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
      "index": 23,
      "prompt_id": "pr_rei_23",
      "prompt_snippet": "Using my gut feelings usually works well for me in figuring out problems in my l",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_24",
      "prompt_snippet": "I believe in trusting my hunches",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_25",
      "prompt_snippet": "Intuition can be a very useful way to solve problems",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_26",
      "prompt_snippet": "I often go by my instincts when deciding on a course of action",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_27",
      "prompt_snippet": "I trust my initial feelings about people",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_28",
      "prompt_snippet": "When it comes to trusting people, I can usually rely on my gut feelings",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_29",
      "prompt_snippet": "If I were to rely on my gut feelings, I would often make mistakes",
      "dimension": "rei_agree",
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
      "index": 30,
      "prompt_id": "pr_rei_30",
      "prompt_snippet": "I don't like situations in which I have to rely on intuition",
      "dimension": "rei_agree",
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
      "index": 31,
      "prompt_id": "pr_rei_31",
      "prompt_snippet": "I think there are times when one should rely on one's intuition",
      "dimension": "rei_agree",
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
      "prompt_id": "pr_rei_32",
      "prompt_snippet": "I think it is foolish to make important decisions based on feelings",
      "dimension": "rei_agree",
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
      "index": 33,
      "prompt_id": "pr_rei_33",
      "prompt_snippet": "I don't think it is a good idea to rely on one's intuition for important decisio",
      "dimension": "rei_agree",
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
      "index": 34,
      "prompt_id": "pr_rei_34",
      "prompt_snippet": "I generally don't depend on my feelings to help me make decisions",
      "dimension": "rei_agree",
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
      "index": 35,
      "prompt_id": "pr_rei_35",
      "prompt_snippet": "I hardly ever go wrong when I listen to my deepest gut feelings to find an answe",
      "dimension": "rei_agree",
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
      "index": 36,
      "prompt_id": "pr_rei_36",
      "prompt_snippet": "I would not want to depend on anyone who described himself or herself as intuiti",
      "dimension": "rei_agree",
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
      "index": 37,
      "prompt_id": "pr_rei_37",
      "prompt_snippet": "My snap judgments are probably not as good as most people's",
      "dimension": "rei_agree",
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
      "index": 38,
      "prompt_id": "pr_rei_38",
      "prompt_snippet": "I tend to use my heart as a guide for my actions",
      "dimension": "rei_agree",
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
      "index": 39,
      "prompt_id": "pr_rei_39",
      "prompt_snippet": "I can usually feel when a person is right or wrong, even if I can't explain how ",
      "dimension": "rei_agree",
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
      "index": 40,
      "prompt_id": "pr_rei_40",
      "prompt_snippet": "I suspect my hunches are inaccurate as often as they are accurate",
      "dimension": "rei_agree",
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

- Items: 40
- Dimensions: rei_agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_rei_1, pr_rei_2, pr_rei_4, pr_rei_5, pr_rei_7, pr_rei_8, pr_rei_9, pr_rei_11, pr_rei_12, pr_rei_18, pr_rei_22, pr_rei_29, pr_rei_30, pr_rei_32, pr_rei_33, pr_rei_34, pr_rei_36, pr_rei_37, pr_rei_40
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I try to avoid situations that require thinking in depth about something | rei_agree | 1,2,3,4,5 | yes |
| 2 | I'm not that good at figuring out complicated problems | rei_agree | 1,2,3,4,5 | yes |
| 3 | I enjoy intellectual challenges | rei_agree | 1,2,3,4,5 | no |
| 4 | I am not very good at solving problems that require careful logical analysis | rei_agree | 1,2,3,4,5 | yes |
| 5 | I don't like to have to do a lot of thinking | rei_agree | 1,2,3,4,5 | yes |
| 6 | I enjoy solving problems that require hard thinking | rei_agree | 1,2,3,4,5 | no |
| 7 | Thinking is not my idea of an enjoyable activity | rei_agree | 1,2,3,4,5 | yes |
| 8 | I am not a very analytical thinker | rei_agree | 1,2,3,4,5 | yes |
| 9 | Reasoning things out carefully is not one of my strong points | rei_agree | 1,2,3,4,5 | yes |
| 10 | I prefer complex problems to simple problems | rei_agree | 1,2,3,4,5 | no |
| 11 | Thinking hard and for a long time about something gives me little satisfaction | rei_agree | 1,2,3,4,5 | yes |
| 12 | I don't reason well under pressure | rei_agree | 1,2,3,4,5 | yes |
| 13 | I am much better at figuring things out logically than most people | rei_agree | 1,2,3,4,5 | no |
| 14 | I have a logical mind | rei_agree | 1,2,3,4,5 | no |
| 15 | I enjoy thinking in abstract terms | rei_agree | 1,2,3,4,5 | no |
| 16 | I have no problem thinking things through carefully | rei_agree | 1,2,3,4,5 | no |
| 17 | Using logic usually works well for me in figuring out problems in my life | rei_agree | 1,2,3,4,5 | no |
| 18 | Knowing the answer without having to understand the reasoning behind it is good  | rei_agree | 1,2,3,4,5 | yes |
| 19 | I usually have clear, explainable reasons for my decisions | rei_agree | 1,2,3,4,5 | no |
| 20 | Learning new ways to think would be very appealing to me | rei_agree | 1,2,3,4,5 | no |
| 21 | I like to rely on my intuitive impressions | rei_agree | 1,2,3,4,5 | no |
| 22 | I don't have a very good sense of intuition | rei_agree | 1,2,3,4,5 | yes |
| 23 | Using my gut feelings usually works well for me in figuring out problems in my l | rei_agree | 1,2,3,4,5 | no |
| 24 | I believe in trusting my hunches | rei_agree | 1,2,3,4,5 | no |
| 25 | Intuition can be a very useful way to solve problems | rei_agree | 1,2,3,4,5 | no |
| 26 | I often go by my instincts when deciding on a course of action | rei_agree | 1,2,3,4,5 | no |
| 27 | I trust my initial feelings about people | rei_agree | 1,2,3,4,5 | no |
| 28 | When it comes to trusting people, I can usually rely on my gut feelings | rei_agree | 1,2,3,4,5 | no |
| 29 | If I were to rely on my gut feelings, I would often make mistakes | rei_agree | 1,2,3,4,5 | yes |
| 30 | I don't like situations in which I have to rely on intuition | rei_agree | 1,2,3,4,5 | yes |
| 31 | I think there are times when one should rely on one's intuition | rei_agree | 1,2,3,4,5 | no |
| 32 | I think it is foolish to make important decisions based on feelings | rei_agree | 1,2,3,4,5 | yes |
| 33 | I don't think it is a good idea to rely on one's intuition for important decisio | rei_agree | 1,2,3,4,5 | yes |
| 34 | I generally don't depend on my feelings to help me make decisions | rei_agree | 1,2,3,4,5 | yes |
| 35 | I hardly ever go wrong when I listen to my deepest gut feelings to find an answe | rei_agree | 1,2,3,4,5 | no |
| 36 | I would not want to depend on anyone who described himself or herself as intuiti | rei_agree | 1,2,3,4,5 | yes |
| 37 | My snap judgments are probably not as good as most people's | rei_agree | 1,2,3,4,5 | yes |
| 38 | I tend to use my heart as a guide for my actions | rei_agree | 1,2,3,4,5 | no |
| 39 | I can usually feel when a person is right or wrong, even if I can't explain how  | rei_agree | 1,2,3,4,5 | no |
| 40 | I suspect my hunches are inaccurate as often as they are accurate | rei_agree | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/thinking-style-rei.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

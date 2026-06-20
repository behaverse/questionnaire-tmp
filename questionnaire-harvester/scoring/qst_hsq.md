# Scoring — Humor Styles Questionnaire (HSQ) (`qst_hsq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_hsq",
  "title": "Humor Styles Questionnaire (HSQ)",
  "short_title": "HSQ",
  "source_url": "https://us.psytoolkit.org/survey-library/humor-hsq.html",
  "publication": {
    "citation": "Martin, R.A., Puhlik-Doris, P., Larsen, G., Gray, J., and Weir, K. (2003). Individual differences in uses of humor and their relation to psychological well-being: Development of the Humor Styles Questionnaire. Journal of Research in Personality, 37 , 48-75.",
    "year": 2003
  },
  "status": "needs-research",
  "item_count": 32,
  "dimensions": [
    "hsq_agree"
  ],
  "option_scales": [
    {
      "ref": "opt_hsq_hsq_agree_7",
      "dimension": "hsq_agree",
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
        "totally disagree",
        "moderately disagree",
        "slightly disagree",
        "neither agree nor disagree",
        "slightly agree",
        "moderately agree",
        "totally agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_hsq_1",
    "pr_hsq_7",
    "pr_hsq_9",
    "pr_hsq_15",
    "pr_hsq_16",
    "pr_hsq_17",
    "pr_hsq_22",
    "pr_hsq_23",
    "pr_hsq_25",
    "pr_hsq_29",
    "pr_hsq_31"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_hsq_1",
      "prompt_snippet": "I usually don’t laugh or joke around much with other people.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 2,
      "prompt_id": "pr_hsq_2",
      "prompt_snippet": "If I am feeling depressed, I can usually cheer myself up with humor.",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_3",
      "prompt_snippet": "If someone makes a mistake, I will often tease them about it.",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_4",
      "prompt_snippet": "I let people laugh at me or make fun at my expense more than I should.",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_5",
      "prompt_snippet": "I don't have to work very hard at making other people laugh -- I seem to be a na",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_6",
      "prompt_snippet": "Even when I’m by myself, I’m often amused by the absurdities of life.",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_7",
      "prompt_snippet": "People are never offended or hurt by my sense of humor.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_hsq_8",
      "prompt_snippet": "I will often get carried away in putting myself down if it makes my family or fr",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_9",
      "prompt_snippet": "I rarely make other people laugh by telling funny stories about myself.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 10,
      "prompt_id": "pr_hsq_10",
      "prompt_snippet": "If I am feeling upset or unhappy I usually try to think of something funny about",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_11",
      "prompt_snippet": "When telling jokes or saying funny things, I am usually not very concerned about",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_12",
      "prompt_snippet": "I often try to make people like or accept me more by saying something funny abou",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_13",
      "prompt_snippet": "I laugh and joke a lot with my friends.",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_14",
      "prompt_snippet": "My humorous outlook on life keeps me from getting overly upset or depressed abou",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_15",
      "prompt_snippet": "I do not like it when people use humor as a way of criticizing or putting someon",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_hsq_16",
      "prompt_snippet": "I don’t often say funny things to put myself down.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 17,
      "prompt_id": "pr_hsq_17",
      "prompt_snippet": "I usually don’t like to tell jokes or amuse people.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 18,
      "prompt_id": "pr_hsq_18",
      "prompt_snippet": "If I’m by myself and I’m feeling unhappy, I make an effort to think of something",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_19",
      "prompt_snippet": "Sometimes I think of something that is so funny that I can’t stop myself from sa",
      "dimension": "hsq_agree",
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
      "prompt_id": "pr_hsq_20",
      "prompt_snippet": "I often go overboard in putting myself down when I am making jokes or trying to ",
      "dimension": "hsq_agree",
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
      "index": 21,
      "prompt_id": "pr_hsq_21",
      "prompt_snippet": "I enjoy making people laugh.",
      "dimension": "hsq_agree",
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
      "index": 22,
      "prompt_id": "pr_hsq_22",
      "prompt_snippet": "If I am feeling sad or upset, I usually lose my sense of humor.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 23,
      "prompt_id": "pr_hsq_23",
      "prompt_snippet": "I never participate in laughing at others even if all my friends are doing it.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 24,
      "prompt_id": "pr_hsq_24",
      "prompt_snippet": "When I am with friends or family, I often seem to be the one that other people m",
      "dimension": "hsq_agree",
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
      "index": 25,
      "prompt_id": "pr_hsq_25",
      "prompt_snippet": "I don’t often joke around with my friends.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 26,
      "prompt_id": "pr_hsq_26",
      "prompt_snippet": "It is my experience that thinking about some amusing aspect of a situation is of",
      "dimension": "hsq_agree",
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
      "index": 27,
      "prompt_id": "pr_hsq_27",
      "prompt_snippet": "If I don't like someone, I often use humor or teasing to put them down.",
      "dimension": "hsq_agree",
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
      "index": 28,
      "prompt_id": "pr_hsq_28",
      "prompt_snippet": "If I am having problems or feeling unhappy, I often cover it up by joking around",
      "dimension": "hsq_agree",
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
      "index": 29,
      "prompt_id": "pr_hsq_29",
      "prompt_snippet": "I usually can’t think of witty things to say when I’m with other people.",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 30,
      "prompt_id": "pr_hsq_30",
      "prompt_snippet": "I don’t need to be with other people to feel amused -- I can usually find things",
      "dimension": "hsq_agree",
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
      "index": 31,
      "prompt_id": "pr_hsq_31",
      "prompt_snippet": "Even if something is really funny to me, I will not laugh or joke about it if so",
      "dimension": "hsq_agree",
      "values": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "reversed": true
    },
    {
      "index": 32,
      "prompt_id": "pr_hsq_32",
      "prompt_snippet": "Letting others laugh at me is my way of keeping my friends and family in good sp",
      "dimension": "hsq_agree",
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

- Items: 32
- Dimensions: hsq_agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_hsq_1, pr_hsq_7, pr_hsq_9, pr_hsq_15, pr_hsq_16, pr_hsq_17, pr_hsq_22, pr_hsq_23, pr_hsq_25, pr_hsq_29, pr_hsq_31
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I usually don’t laugh or joke around much with other people. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 2 | If I am feeling depressed, I can usually cheer myself up with humor. | hsq_agree | 1,2,3,4,5,6,7 | no |
| 3 | If someone makes a mistake, I will often tease them about it. | hsq_agree | 1,2,3,4,5,6,7 | no |
| 4 | I let people laugh at me or make fun at my expense more than I should. | hsq_agree | 1,2,3,4,5,6,7 | no |
| 5 | I don't have to work very hard at making other people laugh -- I seem to be a na | hsq_agree | 1,2,3,4,5,6,7 | no |
| 6 | Even when I’m by myself, I’m often amused by the absurdities of life. | hsq_agree | 1,2,3,4,5,6,7 | no |
| 7 | People are never offended or hurt by my sense of humor. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 8 | I will often get carried away in putting myself down if it makes my family or fr | hsq_agree | 1,2,3,4,5,6,7 | no |
| 9 | I rarely make other people laugh by telling funny stories about myself. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 10 | If I am feeling upset or unhappy I usually try to think of something funny about | hsq_agree | 1,2,3,4,5,6,7 | no |
| 11 | When telling jokes or saying funny things, I am usually not very concerned about | hsq_agree | 1,2,3,4,5,6,7 | no |
| 12 | I often try to make people like or accept me more by saying something funny abou | hsq_agree | 1,2,3,4,5,6,7 | no |
| 13 | I laugh and joke a lot with my friends. | hsq_agree | 1,2,3,4,5,6,7 | no |
| 14 | My humorous outlook on life keeps me from getting overly upset or depressed abou | hsq_agree | 1,2,3,4,5,6,7 | no |
| 15 | I do not like it when people use humor as a way of criticizing or putting someon | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 16 | I don’t often say funny things to put myself down. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 17 | I usually don’t like to tell jokes or amuse people. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 18 | If I’m by myself and I’m feeling unhappy, I make an effort to think of something | hsq_agree | 1,2,3,4,5,6,7 | no |
| 19 | Sometimes I think of something that is so funny that I can’t stop myself from sa | hsq_agree | 1,2,3,4,5,6,7 | no |
| 20 | I often go overboard in putting myself down when I am making jokes or trying to  | hsq_agree | 1,2,3,4,5,6,7 | no |
| 21 | I enjoy making people laugh. | hsq_agree | 1,2,3,4,5,6,7 | no |
| 22 | If I am feeling sad or upset, I usually lose my sense of humor. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 23 | I never participate in laughing at others even if all my friends are doing it. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 24 | When I am with friends or family, I often seem to be the one that other people m | hsq_agree | 1,2,3,4,5,6,7 | no |
| 25 | I don’t often joke around with my friends. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 26 | It is my experience that thinking about some amusing aspect of a situation is of | hsq_agree | 1,2,3,4,5,6,7 | no |
| 27 | If I don't like someone, I often use humor or teasing to put them down. | hsq_agree | 1,2,3,4,5,6,7 | no |
| 28 | If I am having problems or feeling unhappy, I often cover it up by joking around | hsq_agree | 1,2,3,4,5,6,7 | no |
| 29 | I usually can’t think of witty things to say when I’m with other people. | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 30 | I don’t need to be with other people to feel amused -- I can usually find things | hsq_agree | 1,2,3,4,5,6,7 | no |
| 31 | Even if something is really funny to me, I will not laugh or joke about it if so | hsq_agree | 1,2,3,4,5,6,7 | yes |
| 32 | Letting others laugh at me is my way of keeping my friends and family in good sp | hsq_agree | 1,2,3,4,5,6,7 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/humor-hsq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

# Scoring — Trust in close relationships (`qst_trust`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_trust",
  "title": "Trust in close relationships",
  "short_title": "Trust in close relationships",
  "source_url": "https://us.psytoolkit.org/survey-library/trust.html",
  "publication": {
    "citation": "Rempel, J.K., Holmes, J.G. & Zanna, M.P. (1985). Trust in close relationships. Journal of\nPersonality and Social Psychology, 49 , 95-112.",
    "year": 1985
  },
  "status": "needs-research",
  "item_count": 17,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_trust_agree_7",
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
        "moderately disagree",
        "mildly disagree",
        "neutral",
        "mildly agree",
        "moderately agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_trust_13",
    "pr_trust_14",
    "pr_trust_15",
    "pr_trust_17"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_trust_1",
      "prompt_snippet": "My partner has proven to be trustworthy and I am willing to let him/her engage i",
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
      "prompt_id": "pr_trust_2",
      "prompt_snippet": "I have found that my partner is unusually dependable, especially when it comes t",
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
      "prompt_id": "pr_trust_3",
      "prompt_snippet": "I am certain that my partner would not cheat on me, even if the opportunity aros",
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
      "prompt_id": "pr_trust_4",
      "prompt_snippet": "I can rely on my partner to keep the promises he/she makes to me.",
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
      "prompt_id": "pr_trust_5",
      "prompt_snippet": "Even when my partner makes excuses which sound rather unlikely, I am confident t",
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
      "prompt_id": "pr_trust_6",
      "prompt_snippet": "Even when I don't know how my partner will react, I feel comfortable telling him",
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
      "prompt_id": "pr_trust_7",
      "prompt_snippet": "Though times may change and the future is uncertain; I know my partner will alwa",
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
      "prompt_id": "pr_trust_8",
      "prompt_snippet": "Whenever we have to make an important decision in a situation we have never enco",
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
      "prompt_id": "pr_trust_9",
      "prompt_snippet": "Even if I have no reason to expect my partner to share things with me, I still f",
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
      "prompt_id": "pr_trust_10",
      "prompt_snippet": "I can rely on my partner to react in a positive way when I expose my weaknesses ",
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
      "prompt_id": "pr_trust_11",
      "prompt_snippet": "When I share my problems with my partner, I know he/she will respond in a loving",
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
      "prompt_id": "pr_trust_12",
      "prompt_snippet": "When I am with my partner I feel secure in facing unknown new situations.",
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
      "prompt_id": "pr_trust_13",
      "prompt_snippet": "I am never certain that my partner won't do something that I dislike or will emb",
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
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_trust_14",
      "prompt_snippet": "My partner is very unpredictable. I never know how he/she is going to act from o",
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
      "reversed": true
    },
    {
      "index": 15,
      "prompt_id": "pr_trust_15",
      "prompt_snippet": "I feel very uncomfortable when my partner has to make decisions which will affec",
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
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_trust_16",
      "prompt_snippet": "My partner behaves in a very consistent manner.",
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
      "prompt_id": "pr_trust_17",
      "prompt_snippet": "I sometimes avoid my partner because he/she is unpredictable and I fear saying o",
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

- Items: 17
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_trust_13, pr_trust_14, pr_trust_15, pr_trust_17
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | My partner has proven to be trustworthy and I am willing to let him/her engage i | agree | 1,2,3,4,5,6,7 | no |
| 2 | I have found that my partner is unusually dependable, especially when it comes t | agree | 1,2,3,4,5,6,7 | no |
| 3 | I am certain that my partner would not cheat on me, even if the opportunity aros | agree | 1,2,3,4,5,6,7 | no |
| 4 | I can rely on my partner to keep the promises he/she makes to me. | agree | 1,2,3,4,5,6,7 | no |
| 5 | Even when my partner makes excuses which sound rather unlikely, I am confident t | agree | 1,2,3,4,5,6,7 | no |
| 6 | Even when I don't know how my partner will react, I feel comfortable telling him | agree | 1,2,3,4,5,6,7 | no |
| 7 | Though times may change and the future is uncertain; I know my partner will alwa | agree | 1,2,3,4,5,6,7 | no |
| 8 | Whenever we have to make an important decision in a situation we have never enco | agree | 1,2,3,4,5,6,7 | no |
| 9 | Even if I have no reason to expect my partner to share things with me, I still f | agree | 1,2,3,4,5,6,7 | no |
| 10 | I can rely on my partner to react in a positive way when I expose my weaknesses  | agree | 1,2,3,4,5,6,7 | no |
| 11 | When I share my problems with my partner, I know he/she will respond in a loving | agree | 1,2,3,4,5,6,7 | no |
| 12 | When I am with my partner I feel secure in facing unknown new situations. | agree | 1,2,3,4,5,6,7 | no |
| 13 | I am never certain that my partner won't do something that I dislike or will emb | agree | 1,2,3,4,5,6,7 | yes |
| 14 | My partner is very unpredictable. I never know how he/she is going to act from o | agree | 1,2,3,4,5,6,7 | yes |
| 15 | I feel very uncomfortable when my partner has to make decisions which will affec | agree | 1,2,3,4,5,6,7 | yes |
| 16 | My partner behaves in a very consistent manner. | agree | 1,2,3,4,5,6,7 | no |
| 17 | I sometimes avoid my partner because he/she is unpredictable and I fear saying o | agree | 1,2,3,4,5,6,7 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/trust.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

# Scoring — Toronto Empathy Questionnaire (TEQ) (`qst_teq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_teq",
  "title": "Toronto Empathy Questionnaire (TEQ)",
  "short_title": "TEQ",
  "source_url": "https://psychology-tools.com/test/toronto-empathy-questionnaire",
  "publication": {
    "citation": "Spreng RN, McKinnon MC, Mar RA, Levine B. The Toronto Empathy Questionnaire: Scale development and initial validation of a factor-analytic solution to multiple empathy measures. Journal of Personality Assessment. 2009.; 91 ( 1 ): 62-71.",
    "year": 2009
  },
  "status": "needs-research",
  "item_count": 16,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_teq_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Always"
      ]
    },
    {
      "ref": "opt_teq_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "value_range": [
        0,
        4
      ],
      "anchors": [
        "Never",
        "Rarely",
        "Sometimes",
        "Often",
        "Always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_teq_1",
      "prompt_snippet": "When someone else is feeling excited, I tend to get excited too.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_teq_2",
      "prompt_snippet": "Other people’s misfortunes do not disturb me a great deal.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_teq_3",
      "prompt_snippet": "It upsets me to see someone being treated disrespectfully.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_teq_4",
      "prompt_snippet": "I remain unaffected when someone close to me is happy.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_teq_5",
      "prompt_snippet": "I enjoy making other people feel better.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_teq_6",
      "prompt_snippet": "I have tender, concerned feelings for people less fortunate than me.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_teq_7",
      "prompt_snippet": "When a friend starts to talk about his/her problems, I try to steer the conversa",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_teq_8",
      "prompt_snippet": "I can tell when others are sad even when they do not say anything.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_teq_9",
      "prompt_snippet": "I find that I am “in tune” with other people’s moods.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_teq_10",
      "prompt_snippet": "I do not feel sympathy for people who cause their own serious illnesses.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_teq_11",
      "prompt_snippet": "I become irritated when someone cries.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_teq_12",
      "prompt_snippet": "I am not really interested in how other people feel.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_teq_13",
      "prompt_snippet": "I get a strong urge to help when I see someone who is upset.",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_teq_14",
      "prompt_snippet": "When I see someone being treated unfairly, I do not feel very much pity for them",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_teq_15",
      "prompt_snippet": "I find it silly for people to cry out of happiness.",
      "dimension": "rating",
      "values": [
        4,
        3,
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_teq_16",
      "prompt_snippet": "When I see someone being taken advantage of, I feel kind of protective towards h",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3,
        4
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

- Items: 16
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | When someone else is feeling excited, I tend to get excited too. | rating | 0,1,2,3,4 | no |
| 2 | Other people’s misfortunes do not disturb me a great deal. | rating | 4,3,2,1,0 | no |
| 3 | It upsets me to see someone being treated disrespectfully. | rating | 0,1,2,3,4 | no |
| 4 | I remain unaffected when someone close to me is happy. | rating | 4,3,2,1,0 | no |
| 5 | I enjoy making other people feel better. | rating | 0,1,2,3,4 | no |
| 6 | I have tender, concerned feelings for people less fortunate than me. | rating | 0,1,2,3,4 | no |
| 7 | When a friend starts to talk about his/her problems, I try to steer the conversa | rating | 4,3,2,1,0 | no |
| 8 | I can tell when others are sad even when they do not say anything. | rating | 0,1,2,3,4 | no |
| 9 | I find that I am “in tune” with other people’s moods. | rating | 0,1,2,3,4 | no |
| 10 | I do not feel sympathy for people who cause their own serious illnesses. | rating | 4,3,2,1,0 | no |
| 11 | I become irritated when someone cries. | rating | 4,3,2,1,0 | no |
| 12 | I am not really interested in how other people feel. | rating | 4,3,2,1,0 | no |
| 13 | I get a strong urge to help when I see someone who is upset. | rating | 0,1,2,3,4 | no |
| 14 | When I see someone being treated unfairly, I do not feel very much pity for them | rating | 4,3,2,1,0 | no |
| 15 | I find it silly for people to cry out of happiness. | rating | 4,3,2,1,0 | no |
| 16 | When I see someone being taken advantage of, I feel kind of protective towards h | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/toronto-empathy-questionnaire)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

# Scoring — Concise Conscientiousness Measure (CCM-S) (`qst_ccms`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_ccms",
  "title": "Concise Conscientiousness Measure (CCM-S)",
  "short_title": "CCM-S",
  "source_url": "https://us.psytoolkit.org/survey-library/ccms-conscientiousness.html",
  "publication": {
    "citation": "Franzen, P., Arens, A. K., Greiff, S., van der Westhuizen, L., Fischbach, A., Wollschläger, R., & Niepel, C. (2021). Developing and Validating a Short-Form Questionnaire for the Assessment of Seven Facets of Conscientiousness in Large-Scale Assessments. Journal of Personality Assessment, 1–15. Advance online publication. Link to journal",
    "year": 2021
  },
  "status": "needs-research",
  "item_count": 28,
  "dimensions": [
    "ccmsagree"
  ],
  "option_scales": [
    {
      "ref": "opt_ccms_ccmsagree_5",
      "dimension": "ccmsagree",
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
        "1. Not at all like me",
        "2. ..",
        "3. ..",
        "4. ..",
        "5. Very much like me"
      ]
    }
  ],
  "reversed_items": [
    "pr_ccms_9",
    "pr_ccms_10",
    "pr_ccms_11",
    "pr_ccms_12",
    "pr_ccms_17",
    "pr_ccms_18",
    "pr_ccms_19",
    "pr_ccms_20",
    "pr_ccms_25",
    "pr_ccms_26",
    "pr_ccms_27",
    "pr_ccms_28"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_ccms_1",
      "prompt_snippet": "I am always prepared.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_2",
      "prompt_snippet": "I do more than what's expected of me.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_3",
      "prompt_snippet": "I make an effort.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_4",
      "prompt_snippet": "I work hard.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_5",
      "prompt_snippet": "I behave properly.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_6",
      "prompt_snippet": "I look at the facts.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_7",
      "prompt_snippet": "I make careful choices.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_8",
      "prompt_snippet": "I think ahead.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_9",
      "prompt_snippet": "I act impulsively when something is bothering me.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_10",
      "prompt_snippet": "I do unexpected things.",
      "dimension": "ccmsagree",
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
      "index": 11,
      "prompt_id": "pr_ccms_11",
      "prompt_snippet": "I make a fool of myself.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_12",
      "prompt_snippet": "I make rash decisions.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_13",
      "prompt_snippet": "I continue until everything is perfect.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_14",
      "prompt_snippet": "I detect mistakes.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_15",
      "prompt_snippet": "I go straight for the goal.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_16",
      "prompt_snippet": "I try to outdo others.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_17",
      "prompt_snippet": "I am easily distracted.",
      "dimension": "ccmsagree",
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
      "index": 18,
      "prompt_id": "pr_ccms_18",
      "prompt_snippet": "I have difficulty starting tasks.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_19",
      "prompt_snippet": "I put off unpleasant tasks.",
      "dimension": "ccmsagree",
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
      "index": 20,
      "prompt_id": "pr_ccms_20",
      "prompt_snippet": "I waste my time.",
      "dimension": "ccmsagree",
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
      "index": 21,
      "prompt_id": "pr_ccms_21",
      "prompt_snippet": "I am a goal-oriented person.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_22",
      "prompt_snippet": "I do things according to a plan.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_23",
      "prompt_snippet": "I like to plan ahead.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_24",
      "prompt_snippet": "I make plans and stick to them.",
      "dimension": "ccmsagree",
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
      "prompt_id": "pr_ccms_25",
      "prompt_snippet": "I am not bothered by messy people.",
      "dimension": "ccmsagree",
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
      "index": 26,
      "prompt_id": "pr_ccms_26",
      "prompt_snippet": "I leave a mess in my room.",
      "dimension": "ccmsagree",
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
      "index": 27,
      "prompt_id": "pr_ccms_27",
      "prompt_snippet": "I leave my belongings around.",
      "dimension": "ccmsagree",
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
      "index": 28,
      "prompt_id": "pr_ccms_28",
      "prompt_snippet": "I often forget to put things in their proper place.",
      "dimension": "ccmsagree",
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

- Items: 28
- Dimensions: ccmsagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_ccms_9, pr_ccms_10, pr_ccms_11, pr_ccms_12, pr_ccms_17, pr_ccms_18, pr_ccms_19, pr_ccms_20, pr_ccms_25, pr_ccms_26, pr_ccms_27, pr_ccms_28
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I am always prepared. | ccmsagree | 1,2,3,4,5 | no |
| 2 | I do more than what's expected of me. | ccmsagree | 1,2,3,4,5 | no |
| 3 | I make an effort. | ccmsagree | 1,2,3,4,5 | no |
| 4 | I work hard. | ccmsagree | 1,2,3,4,5 | no |
| 5 | I behave properly. | ccmsagree | 1,2,3,4,5 | no |
| 6 | I look at the facts. | ccmsagree | 1,2,3,4,5 | no |
| 7 | I make careful choices. | ccmsagree | 1,2,3,4,5 | no |
| 8 | I think ahead. | ccmsagree | 1,2,3,4,5 | no |
| 9 | I act impulsively when something is bothering me. | ccmsagree | 1,2,3,4,5 | yes |
| 10 | I do unexpected things. | ccmsagree | 1,2,3,4,5 | yes |
| 11 | I make a fool of myself. | ccmsagree | 1,2,3,4,5 | yes |
| 12 | I make rash decisions. | ccmsagree | 1,2,3,4,5 | yes |
| 13 | I continue until everything is perfect. | ccmsagree | 1,2,3,4,5 | no |
| 14 | I detect mistakes. | ccmsagree | 1,2,3,4,5 | no |
| 15 | I go straight for the goal. | ccmsagree | 1,2,3,4,5 | no |
| 16 | I try to outdo others. | ccmsagree | 1,2,3,4,5 | no |
| 17 | I am easily distracted. | ccmsagree | 1,2,3,4,5 | yes |
| 18 | I have difficulty starting tasks. | ccmsagree | 1,2,3,4,5 | yes |
| 19 | I put off unpleasant tasks. | ccmsagree | 1,2,3,4,5 | yes |
| 20 | I waste my time. | ccmsagree | 1,2,3,4,5 | yes |
| 21 | I am a goal-oriented person. | ccmsagree | 1,2,3,4,5 | no |
| 22 | I do things according to a plan. | ccmsagree | 1,2,3,4,5 | no |
| 23 | I like to plan ahead. | ccmsagree | 1,2,3,4,5 | no |
| 24 | I make plans and stick to them. | ccmsagree | 1,2,3,4,5 | no |
| 25 | I am not bothered by messy people. | ccmsagree | 1,2,3,4,5 | yes |
| 26 | I leave a mess in my room. | ccmsagree | 1,2,3,4,5 | yes |
| 27 | I leave my belongings around. | ccmsagree | 1,2,3,4,5 | yes |
| 28 | I often forget to put things in their proper place. | ccmsagree | 1,2,3,4,5 | yes |

## To research (fill from https://us.psytoolkit.org/survey-library/ccms-conscientiousness.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

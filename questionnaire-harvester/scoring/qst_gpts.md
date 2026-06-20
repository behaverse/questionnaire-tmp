# Scoring — Green et al. Paranoid Thought Scales (GPTS) (`qst_gpts`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_gpts",
  "title": "Green et al. Paranoid Thought Scales (GPTS)",
  "short_title": "GPTS",
  "source_url": "https://us.psytoolkit.org/survey-library/paranoia-gpts.html",
  "publication": {
    "citation": "Green, C. E. L., Freeman, D., Kuipers, E., Bebbington, P., Fowler, D., Dunn, G., & Garety, P. A. (2008). Measuring ideas of persecution and social reference: the Green et al. Paranoid Thought Scales (GPTS). Psychological medicine, 38 , 101-111.",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 32,
  "dimensions": [
    "much"
  ],
  "option_scales": [
    {
      "ref": "opt_gpts_much_5",
      "dimension": "much",
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
        "Not at all",
        ".",
        "Somewhat",
        ".",
        "Totally"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_gpts_1",
      "prompt_snippet": "I spent time thinking about friends gossiping about me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_2",
      "prompt_snippet": "I often heard people referring to me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_3",
      "prompt_snippet": "I have been upset by friends and colleagues judging me critically",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_4",
      "prompt_snippet": "People definitely laughed at me behind my back",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_5",
      "prompt_snippet": "I have been thinking a lot about people avoiding me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_6",
      "prompt_snippet": "People have been dropping hints for me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_7",
      "prompt_snippet": "I believed that certain people were not what they seemed",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_8",
      "prompt_snippet": "People talking about me behind my back upset me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_9",
      "prompt_snippet": "I was convinced that people were singling me out",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_10",
      "prompt_snippet": "I was certain that people have followed me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_11",
      "prompt_snippet": "Certain people were hostile towards me personally",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_12",
      "prompt_snippet": "People have been checking up on me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_13",
      "prompt_snippet": "I was stressed out by people watching me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_14",
      "prompt_snippet": "I was frustrated by people laughing at me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_15",
      "prompt_snippet": "I was worried by people’s undue interest in me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_16",
      "prompt_snippet": "It was hard to stop thinking about people talking about me behind my back",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_17",
      "prompt_snippet": "Certain individuals have had it in for me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_18",
      "prompt_snippet": "I have definitely been persecuted",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_19",
      "prompt_snippet": "People have intended me harm",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_20",
      "prompt_snippet": "People wanted me to feel threatened, so they stared at me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_21",
      "prompt_snippet": "I was sure certain people did things in order to annoy me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_22",
      "prompt_snippet": "I was convinced there was a conspiracy against me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_23",
      "prompt_snippet": "I was sure someone wanted to hurt me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_24",
      "prompt_snippet": "I was distressed by people wanting to harm me in some way",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_25",
      "prompt_snippet": "I was preoccupied with thoughts of people trying to upset me deliberately",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_26",
      "prompt_snippet": "I couldn’t stop thinking about people wanting to confuse me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_27",
      "prompt_snippet": "I was distressed by being persecuted",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_28",
      "prompt_snippet": "I was annoyed because others wanted to deliberately upset me",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_29",
      "prompt_snippet": "The thought that people were persecuting me played on my mind",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_30",
      "prompt_snippet": "It was difficult to stop thinking about people wanting to make me feel bad",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_31",
      "prompt_snippet": "People have been hostile towards me on purpose",
      "dimension": "much",
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
      "prompt_id": "pr_gpts_32",
      "prompt_snippet": "I was angry that someone wanted to hurt me",
      "dimension": "much",
      "values": [
        1,
        2,
        3,
        4,
        5
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
- Dimensions: much
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I spent time thinking about friends gossiping about me | much | 1,2,3,4,5 | no |
| 2 | I often heard people referring to me | much | 1,2,3,4,5 | no |
| 3 | I have been upset by friends and colleagues judging me critically | much | 1,2,3,4,5 | no |
| 4 | People definitely laughed at me behind my back | much | 1,2,3,4,5 | no |
| 5 | I have been thinking a lot about people avoiding me | much | 1,2,3,4,5 | no |
| 6 | People have been dropping hints for me | much | 1,2,3,4,5 | no |
| 7 | I believed that certain people were not what they seemed | much | 1,2,3,4,5 | no |
| 8 | People talking about me behind my back upset me | much | 1,2,3,4,5 | no |
| 9 | I was convinced that people were singling me out | much | 1,2,3,4,5 | no |
| 10 | I was certain that people have followed me | much | 1,2,3,4,5 | no |
| 11 | Certain people were hostile towards me personally | much | 1,2,3,4,5 | no |
| 12 | People have been checking up on me | much | 1,2,3,4,5 | no |
| 13 | I was stressed out by people watching me | much | 1,2,3,4,5 | no |
| 14 | I was frustrated by people laughing at me | much | 1,2,3,4,5 | no |
| 15 | I was worried by people’s undue interest in me | much | 1,2,3,4,5 | no |
| 16 | It was hard to stop thinking about people talking about me behind my back | much | 1,2,3,4,5 | no |
| 17 | Certain individuals have had it in for me | much | 1,2,3,4,5 | no |
| 18 | I have definitely been persecuted | much | 1,2,3,4,5 | no |
| 19 | People have intended me harm | much | 1,2,3,4,5 | no |
| 20 | People wanted me to feel threatened, so they stared at me | much | 1,2,3,4,5 | no |
| 21 | I was sure certain people did things in order to annoy me | much | 1,2,3,4,5 | no |
| 22 | I was convinced there was a conspiracy against me | much | 1,2,3,4,5 | no |
| 23 | I was sure someone wanted to hurt me | much | 1,2,3,4,5 | no |
| 24 | I was distressed by people wanting to harm me in some way | much | 1,2,3,4,5 | no |
| 25 | I was preoccupied with thoughts of people trying to upset me deliberately | much | 1,2,3,4,5 | no |
| 26 | I couldn’t stop thinking about people wanting to confuse me | much | 1,2,3,4,5 | no |
| 27 | I was distressed by being persecuted | much | 1,2,3,4,5 | no |
| 28 | I was annoyed because others wanted to deliberately upset me | much | 1,2,3,4,5 | no |
| 29 | The thought that people were persecuting me played on my mind | much | 1,2,3,4,5 | no |
| 30 | It was difficult to stop thinking about people wanting to make me feel bad | much | 1,2,3,4,5 | no |
| 31 | People have been hostile towards me on purpose | much | 1,2,3,4,5 | no |
| 32 | I was angry that someone wanted to hurt me | much | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/paranoia-gpts.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

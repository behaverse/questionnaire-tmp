# Scoring — Teacher burnout (`qst_burnout`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_burnout",
  "title": "Teacher burnout",
  "short_title": "Teacher burnout",
  "source_url": "https://us.psytoolkit.org/survey-library/teacher-burnout.html",
  "publication": {
    "citation": "Campbell, L.P. (1983). Teacher burnout: Description and\nprescription. The Clearing House, 57 , pp. 111-113",
    "year": 1983
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "agree"
  ],
  "option_scales": [
    {
      "ref": "opt_burnout_agree_5",
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
        "Strongly Disagree",
        "Disagree",
        "Neutral",
        "Agree",
        "Strongly Agree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_burnout_1",
      "prompt_snippet": "I am bored with my job.",
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
      "prompt_id": "pr_burnout_2",
      "prompt_snippet": "I am tired of my students.",
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
      "prompt_id": "pr_burnout_3",
      "prompt_snippet": "I am weary with all of my job responsibilities.",
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
      "prompt_id": "pr_burnout_4",
      "prompt_snippet": "My job doesn't excite me any more.",
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
      "prompt_id": "pr_burnout_5",
      "prompt_snippet": "I dislike going to my job.",
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
      "index": 6,
      "prompt_id": "pr_burnout_6",
      "prompt_snippet": "I feel alienated at work.",
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
      "prompt_id": "pr_burnout_7",
      "prompt_snippet": "I feel frustrated at work.",
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
      "prompt_id": "pr_burnout_8",
      "prompt_snippet": "I avoid communication with students.",
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
      "prompt_id": "pr_burnout_9",
      "prompt_snippet": "I avoid communication with my colleagues.",
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
      "prompt_id": "pr_burnout_10",
      "prompt_snippet": "I communicate in a hostile manner at work.",
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
      "prompt_id": "pr_burnout_11",
      "prompt_snippet": "I feel ill at work.",
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
      "prompt_id": "pr_burnout_12",
      "prompt_snippet": "I think about calling my students ugly names.",
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
      "prompt_id": "pr_burnout_13",
      "prompt_snippet": "I avoid looking at my students.",
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
      "prompt_id": "pr_burnout_14",
      "prompt_snippet": "My students make me sick.",
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
      "prompt_id": "pr_burnout_15",
      "prompt_snippet": "I feel sick to my stomach when I think about work.",
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
      "prompt_id": "pr_burnout_16",
      "prompt_snippet": "I wish people would leave me alone at work.",
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
      "prompt_id": "pr_burnout_17",
      "prompt_snippet": "I dread going to school.",
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
      "prompt_id": "pr_burnout_18",
      "prompt_snippet": "I am apathetic about my job.",
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
      "prompt_id": "pr_burnout_19",
      "prompt_snippet": "I feel stressed at work.",
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
      "prompt_id": "pr_burnout_20",
      "prompt_snippet": "I have problems concentrating at work.",
      "dimension": "agree",
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

- Items: 20
- Dimensions: agree
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I am bored with my job. | agree | 1,2,3,4,5 | no |
| 2 | I am tired of my students. | agree | 1,2,3,4,5 | no |
| 3 | I am weary with all of my job responsibilities. | agree | 1,2,3,4,5 | no |
| 4 | My job doesn't excite me any more. | agree | 1,2,3,4,5 | no |
| 5 | I dislike going to my job. | agree | 1,2,3,4,5 | no |
| 6 | I feel alienated at work. | agree | 1,2,3,4,5 | no |
| 7 | I feel frustrated at work. | agree | 1,2,3,4,5 | no |
| 8 | I avoid communication with students. | agree | 1,2,3,4,5 | no |
| 9 | I avoid communication with my colleagues. | agree | 1,2,3,4,5 | no |
| 10 | I communicate in a hostile manner at work. | agree | 1,2,3,4,5 | no |
| 11 | I feel ill at work. | agree | 1,2,3,4,5 | no |
| 12 | I think about calling my students ugly names. | agree | 1,2,3,4,5 | no |
| 13 | I avoid looking at my students. | agree | 1,2,3,4,5 | no |
| 14 | My students make me sick. | agree | 1,2,3,4,5 | no |
| 15 | I feel sick to my stomach when I think about work. | agree | 1,2,3,4,5 | no |
| 16 | I wish people would leave me alone at work. | agree | 1,2,3,4,5 | no |
| 17 | I dread going to school. | agree | 1,2,3,4,5 | no |
| 18 | I am apathetic about my job. | agree | 1,2,3,4,5 | no |
| 19 | I feel stressed at work. | agree | 1,2,3,4,5 | no |
| 20 | I have problems concentrating at work. | agree | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/teacher-burnout.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

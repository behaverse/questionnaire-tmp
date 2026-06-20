# Scoring — Belonging, engagement, and self-confidence in higher education (BES) (`qst_besc`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_besc",
  "title": "Belonging, engagement, and self-confidence in higher education (BES)",
  "short_title": "BES",
  "source_url": "https://us.psytoolkit.org/survey-library/bes.html",
  "publication": {
    "citation": "Yorke, M. (2016). The development and initial use of a survey of student ‘belongingness’, engagement and self-confidence in UK higher education. Assessment & Evaluation in Higher Education, 41(1) , 154-166, DOI: 10.1080/02602938.2014.990415. Open access link .",
    "year": 2016
  },
  "status": "needs-research",
  "item_count": 16,
  "dimensions": [
    "besagree"
  ],
  "option_scales": [
    {
      "ref": "opt_besc_besagree_5",
      "dimension": "besagree",
      "measurement_type": "ordinal",
      "levels": 5,
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "value_range": [
        1,
        5
      ],
      "anchors": [
        "Strongly Agree",
        "Tend to Agree",
        "Neutral",
        "Tend to Disagree",
        "Strongly Disagree"
      ]
    }
  ],
  "reversed_items": [
    "pr_besc_7",
    "pr_besc_9",
    "pr_besc_13",
    "pr_besc_15"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_besc_1",
      "prompt_snippet": "I am motivated towards my studies",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_besc_2",
      "prompt_snippet": "I feel at home in this university",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_besc_3",
      "prompt_snippet": "I expect to do well on my programme",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_besc_4",
      "prompt_snippet": "Being at this university is an enriching experience",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_besc_5",
      "prompt_snippet": "I try to make connections between what I learn from different parts of my progra",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_besc_6",
      "prompt_snippet": "I try to do a bit more on the programme than it asks me to",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_besc_7",
      "prompt_snippet": "I wish I’d gone to a different university",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 8,
      "prompt_id": "pr_besc_8",
      "prompt_snippet": "I seek out academic staff in order to discuss topics relevant to my programme",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_besc_9",
      "prompt_snippet": "I worry about the difficulty of my programme",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 10,
      "prompt_id": "pr_besc_10",
      "prompt_snippet": "I put a lot of effort into the work I do",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_besc_11",
      "prompt_snippet": "I have found this department to be welcoming",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_besc_12",
      "prompt_snippet": "I use feedback on my work to help me improve what I do",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_besc_13",
      "prompt_snippet": "I doubt my ability to study at university level",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 14,
      "prompt_id": "pr_besc_14",
      "prompt_snippet": "I am shown respect by members of staff in this department",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_besc_15",
      "prompt_snippet": "Sometimes I feel I don’t belong in this university",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
      ],
      "reversed": true
    },
    {
      "index": 16,
      "prompt_id": "pr_besc_16",
      "prompt_snippet": "I’m confident of completing my programme successfully",
      "dimension": "besagree",
      "values": [
        5,
        4,
        3,
        2,
        1
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
- Dimensions: besagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_besc_7, pr_besc_9, pr_besc_13, pr_besc_15
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I am motivated towards my studies | besagree | 5,4,3,2,1 | no |
| 2 | I feel at home in this university | besagree | 5,4,3,2,1 | no |
| 3 | I expect to do well on my programme | besagree | 5,4,3,2,1 | no |
| 4 | Being at this university is an enriching experience | besagree | 5,4,3,2,1 | no |
| 5 | I try to make connections between what I learn from different parts of my progra | besagree | 5,4,3,2,1 | no |
| 6 | I try to do a bit more on the programme than it asks me to | besagree | 5,4,3,2,1 | no |
| 7 | I wish I’d gone to a different university | besagree | 5,4,3,2,1 | yes |
| 8 | I seek out academic staff in order to discuss topics relevant to my programme | besagree | 5,4,3,2,1 | no |
| 9 | I worry about the difficulty of my programme | besagree | 5,4,3,2,1 | yes |
| 10 | I put a lot of effort into the work I do | besagree | 5,4,3,2,1 | no |
| 11 | I have found this department to be welcoming | besagree | 5,4,3,2,1 | no |
| 12 | I use feedback on my work to help me improve what I do | besagree | 5,4,3,2,1 | no |
| 13 | I doubt my ability to study at university level | besagree | 5,4,3,2,1 | yes |
| 14 | I am shown respect by members of staff in this department | besagree | 5,4,3,2,1 | no |
| 15 | Sometimes I feel I don’t belong in this university | besagree | 5,4,3,2,1 | yes |
| 16 | I’m confident of completing my programme successfully | besagree | 5,4,3,2,1 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/bes.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

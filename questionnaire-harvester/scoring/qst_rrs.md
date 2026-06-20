# Scoring — Rumination Response Scale (RRS) (`qst_rrs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_rrs",
  "title": "Rumination Response Scale (RRS)",
  "short_title": "RRS",
  "source_url": "https://us.psytoolkit.org/survey-library/rumination.html",
  "publication": {
    "citation": "Nolen-Hoeksema, S. (2000). The role of rumination in depressive\ndisorders and mixed anxiety/depressive Symptoms. Journal of Abnormal\nPsychology, 109 , 504–511.",
    "year": 2000
  },
  "status": "needs-research",
  "item_count": 22,
  "dimensions": [
    "frequency"
  ],
  "option_scales": [
    {
      "ref": "opt_rrs_frequency_4",
      "dimension": "frequency",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        1,
        2,
        3,
        4
      ],
      "value_range": [
        1,
        4
      ],
      "anchors": [
        "almost never",
        "sometimes",
        "often",
        "almost always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_rrs_1",
      "prompt_snippet": "think about how alone you feel",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_rrs_2",
      "prompt_snippet": "think “I won’t be able to do my job if I don’t snap out of this”",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_rrs_3",
      "prompt_snippet": "think about your feelings of fatigue and achiness",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_rrs_4",
      "prompt_snippet": "think about how hard it is to concentrate",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_rrs_5",
      "prompt_snippet": "think “What am I doing to deserve this?”",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_rrs_6",
      "prompt_snippet": "think about how passive and unmotivated you feel.",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_rrs_7",
      "prompt_snippet": "analyze recent events to try to understand why you are depressed",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_rrs_8",
      "prompt_snippet": "think about how you don’t seem to feel anything anymore",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_rrs_9",
      "prompt_snippet": "think “Why can’t I get going?”",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_rrs_10",
      "prompt_snippet": "think “Why do I always react this way?”",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_rrs_11",
      "prompt_snippet": "go away by yourself and think about why you feel this way",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_rrs_12",
      "prompt_snippet": "write down what you are thinking about and analyze it",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_rrs_13",
      "prompt_snippet": "think about a recent situation, wishing it had gone better",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_rrs_14",
      "prompt_snippet": "think “I won’t be able to concentrate if I keep feeling this way.”",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_rrs_15",
      "prompt_snippet": "think “Why do I have problems other people don’t have?”",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_rrs_16",
      "prompt_snippet": "think “Why can’t I handle things better?”",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_rrs_17",
      "prompt_snippet": "think about how sad you feel.",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_rrs_18",
      "prompt_snippet": "think about all your shortcomings, failings, faults, mistakes",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_rrs_19",
      "prompt_snippet": "think about how you don’t feel up to doing anything",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_rrs_20",
      "prompt_snippet": "analyze your personality to try to understand why you are depressed",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_rrs_21",
      "prompt_snippet": "go someplace alone to think about your feelings",
      "dimension": "frequency",
      "values": [
        1,
        2,
        3,
        4
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_rrs_22",
      "prompt_snippet": "think about how angry you are with yourself",
      "dimension": "frequency",
      "values": [
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

- Items: 22
- Dimensions: frequency
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | think about how alone you feel | frequency | 1,2,3,4 | no |
| 2 | think “I won’t be able to do my job if I don’t snap out of this” | frequency | 1,2,3,4 | no |
| 3 | think about your feelings of fatigue and achiness | frequency | 1,2,3,4 | no |
| 4 | think about how hard it is to concentrate | frequency | 1,2,3,4 | no |
| 5 | think “What am I doing to deserve this?” | frequency | 1,2,3,4 | no |
| 6 | think about how passive and unmotivated you feel. | frequency | 1,2,3,4 | no |
| 7 | analyze recent events to try to understand why you are depressed | frequency | 1,2,3,4 | no |
| 8 | think about how you don’t seem to feel anything anymore | frequency | 1,2,3,4 | no |
| 9 | think “Why can’t I get going?” | frequency | 1,2,3,4 | no |
| 10 | think “Why do I always react this way?” | frequency | 1,2,3,4 | no |
| 11 | go away by yourself and think about why you feel this way | frequency | 1,2,3,4 | no |
| 12 | write down what you are thinking about and analyze it | frequency | 1,2,3,4 | no |
| 13 | think about a recent situation, wishing it had gone better | frequency | 1,2,3,4 | no |
| 14 | think “I won’t be able to concentrate if I keep feeling this way.” | frequency | 1,2,3,4 | no |
| 15 | think “Why do I have problems other people don’t have?” | frequency | 1,2,3,4 | no |
| 16 | think “Why can’t I handle things better?” | frequency | 1,2,3,4 | no |
| 17 | think about how sad you feel. | frequency | 1,2,3,4 | no |
| 18 | think about all your shortcomings, failings, faults, mistakes | frequency | 1,2,3,4 | no |
| 19 | think about how you don’t feel up to doing anything | frequency | 1,2,3,4 | no |
| 20 | analyze your personality to try to understand why you are depressed | frequency | 1,2,3,4 | no |
| 21 | go someplace alone to think about your feelings | frequency | 1,2,3,4 | no |
| 22 | think about how angry you are with yourself | frequency | 1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/rumination.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

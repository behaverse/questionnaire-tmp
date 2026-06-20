# Scoring — Clinical Impairment Assessment Questionnaire (CIA 3.0) (`qst_cia`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cia",
  "title": "Clinical Impairment Assessment Questionnaire (CIA 3.0)",
  "short_title": "CIA 3.0",
  "source_url": "https://us.psytoolkit.org/survey-library/eating-cia.html",
  "publication": {
    "citation": "Bohn, K., Doll, H. A., Cooper, Z., O’Connor, M., Palmer, R. L., & Fairburn, C. G. (2008). The measurement of impairment due to eating disorder psychopathology. Behaviour research and therapy, 46 , 1105-1110. This is an open-access paper, click here to download .",
    "year": 2008
  },
  "status": "needs-research",
  "item_count": 16,
  "dimensions": [
    "howmuch"
  ],
  "option_scales": [
    {
      "ref": "opt_cia_howmuch_4",
      "dimension": "howmuch",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        1,
        2,
        3
      ],
      "value_range": [
        0,
        3
      ],
      "anchors": [
        "not at all",
        "a little",
        "quite a bit",
        "a lot"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cia_1",
      "prompt_snippet": "made it difficult to concentrate?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_cia_2",
      "prompt_snippet": "made you feel critical of yourself?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_cia_3",
      "prompt_snippet": "stopped you going out with others?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_cia_4",
      "prompt_snippet": "affected your work performance (if applicable)?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_cia_5",
      "prompt_snippet": "made you forgetful?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_cia_6",
      "prompt_snippet": "affected your ability to make everyday decisions?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_cia_7",
      "prompt_snippet": "interfered with meals with family or friends?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_cia_8",
      "prompt_snippet": "made you upset?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_cia_9",
      "prompt_snippet": "made you feel ashamed of yourself?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_cia_10",
      "prompt_snippet": "made it difficult to eat out with others?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_cia_11",
      "prompt_snippet": "made you feel guilty?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_cia_12",
      "prompt_snippet": "interfered with you doing things you used to enjoy?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_cia_13",
      "prompt_snippet": "made you absent-minded?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_cia_14",
      "prompt_snippet": "made you feel a failure?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_cia_15",
      "prompt_snippet": "interfered with your relationship with others?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_cia_16",
      "prompt_snippet": "made you worry?",
      "dimension": "howmuch",
      "values": [
        0,
        1,
        2,
        3
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
- Dimensions: howmuch
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | made it difficult to concentrate? | howmuch | 0,1,2,3 | no |
| 2 | made you feel critical of yourself? | howmuch | 0,1,2,3 | no |
| 3 | stopped you going out with others? | howmuch | 0,1,2,3 | no |
| 4 | affected your work performance (if applicable)? | howmuch | 0,1,2,3 | no |
| 5 | made you forgetful? | howmuch | 0,1,2,3 | no |
| 6 | affected your ability to make everyday decisions? | howmuch | 0,1,2,3 | no |
| 7 | interfered with meals with family or friends? | howmuch | 0,1,2,3 | no |
| 8 | made you upset? | howmuch | 0,1,2,3 | no |
| 9 | made you feel ashamed of yourself? | howmuch | 0,1,2,3 | no |
| 10 | made it difficult to eat out with others? | howmuch | 0,1,2,3 | no |
| 11 | made you feel guilty? | howmuch | 0,1,2,3 | no |
| 12 | interfered with you doing things you used to enjoy? | howmuch | 0,1,2,3 | no |
| 13 | made you absent-minded? | howmuch | 0,1,2,3 | no |
| 14 | made you feel a failure? | howmuch | 0,1,2,3 | no |
| 15 | interfered with your relationship with others? | howmuch | 0,1,2,3 | no |
| 16 | made you worry? | howmuch | 0,1,2,3 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/eating-cia.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

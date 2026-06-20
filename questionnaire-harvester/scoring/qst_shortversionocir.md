# Scoring — The Obsessive–Compulsive Inventory (short version, OCI-R) (`qst_shortversionocir`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_shortversionocir",
  "title": "The Obsessive–Compulsive Inventory (short version, OCI-R)",
  "short_title": "short version, OCI-R",
  "source_url": "https://us.psytoolkit.org/survey-library/obsessiveness-oci-r.html",
  "publication": {
    "citation": "Foa, E.B., Huppert, J.D., Leiberg, S. Langner, R., Kichic, R., Hajcak,\nG., and Salkovskis, P.M. (2002). The obsessive–compulsive inventory:\nDevelopment and validation of a short version. Psychological\nAssessment, 14 , 485-496.",
    "year": 2002
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "howmuch"
  ],
  "option_scales": [
    {
      "ref": "opt_shortversionocir_howmuch_5",
      "dimension": "howmuch",
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
        "Not at all",
        "A little",
        "Moderately",
        "A lot",
        "Extremely"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_shortversionocir_1",
      "prompt_snippet": "I have saved up so many things that they get in the way.",
      "dimension": "howmuch",
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
      "prompt_id": "pr_shortversionocir_2",
      "prompt_snippet": "I check things more often than necessary.",
      "dimension": "howmuch",
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
      "index": 3,
      "prompt_id": "pr_shortversionocir_3",
      "prompt_snippet": "I get upset if objects are not arranged properly.",
      "dimension": "howmuch",
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
      "prompt_id": "pr_shortversionocir_4",
      "prompt_snippet": "I feel compelled to count while I am doing things.",
      "dimension": "howmuch",
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
      "index": 5,
      "prompt_id": "pr_shortversionocir_5",
      "prompt_snippet": "I find it difficult to touch an object when I know it has been touched by strang",
      "dimension": "howmuch",
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
      "prompt_id": "pr_shortversionocir_6",
      "prompt_snippet": "I find it difficult to control my own thoughts.",
      "dimension": "howmuch",
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
      "prompt_id": "pr_shortversionocir_7",
      "prompt_snippet": "I collect things I don’t need.",
      "dimension": "howmuch",
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
      "index": 8,
      "prompt_id": "pr_shortversionocir_8",
      "prompt_snippet": "I repeatedly check doors, windows, drawers, etc.",
      "dimension": "howmuch",
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
      "prompt_id": "pr_shortversionocir_9",
      "prompt_snippet": "I get upset if others change the way I have arranged things.",
      "dimension": "howmuch",
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
      "prompt_id": "pr_shortversionocir_10",
      "prompt_snippet": "I feel I have to repeat certain numbers.",
      "dimension": "howmuch",
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
      "index": 11,
      "prompt_id": "pr_shortversionocir_11",
      "prompt_snippet": "I sometimes have to wash or clean myself simply because I feel contaminated.",
      "dimension": "howmuch",
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
      "index": 12,
      "prompt_id": "pr_shortversionocir_12",
      "prompt_snippet": "I am upset by unpleasant thoughts that come into my mind against my will.",
      "dimension": "howmuch",
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
      "index": 13,
      "prompt_id": "pr_shortversionocir_13",
      "prompt_snippet": "I avoid throwing things away because I am afraid I might need them later.",
      "dimension": "howmuch",
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
      "prompt_id": "pr_shortversionocir_14",
      "prompt_snippet": "I repeatedly check gas and water taps and light switches after turning them off.",
      "dimension": "howmuch",
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
      "index": 15,
      "prompt_id": "pr_shortversionocir_15",
      "prompt_snippet": "I need things to be arranged in a particular way.",
      "dimension": "howmuch",
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
      "index": 16,
      "prompt_id": "pr_shortversionocir_16",
      "prompt_snippet": "I feel that there are good and bad numbers.",
      "dimension": "howmuch",
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
      "index": 17,
      "prompt_id": "pr_shortversionocir_17",
      "prompt_snippet": "I wash my hands more often and longer than necessary.",
      "dimension": "howmuch",
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
      "index": 18,
      "prompt_id": "pr_shortversionocir_18",
      "prompt_snippet": "I frequently get nasty thoughts and have difficulty in getting rid of them",
      "dimension": "howmuch",
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

- Items: 18
- Dimensions: howmuch
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I have saved up so many things that they get in the way. | howmuch | 0,1,2,3,4 | no |
| 2 | I check things more often than necessary. | howmuch | 0,1,2,3,4 | no |
| 3 | I get upset if objects are not arranged properly. | howmuch | 0,1,2,3,4 | no |
| 4 | I feel compelled to count while I am doing things. | howmuch | 0,1,2,3,4 | no |
| 5 | I find it difficult to touch an object when I know it has been touched by strang | howmuch | 0,1,2,3,4 | no |
| 6 | I find it difficult to control my own thoughts. | howmuch | 0,1,2,3,4 | no |
| 7 | I collect things I don’t need. | howmuch | 0,1,2,3,4 | no |
| 8 | I repeatedly check doors, windows, drawers, etc. | howmuch | 0,1,2,3,4 | no |
| 9 | I get upset if others change the way I have arranged things. | howmuch | 0,1,2,3,4 | no |
| 10 | I feel I have to repeat certain numbers. | howmuch | 0,1,2,3,4 | no |
| 11 | I sometimes have to wash or clean myself simply because I feel contaminated. | howmuch | 0,1,2,3,4 | no |
| 12 | I am upset by unpleasant thoughts that come into my mind against my will. | howmuch | 0,1,2,3,4 | no |
| 13 | I avoid throwing things away because I am afraid I might need them later. | howmuch | 0,1,2,3,4 | no |
| 14 | I repeatedly check gas and water taps and light switches after turning them off. | howmuch | 0,1,2,3,4 | no |
| 15 | I need things to be arranged in a particular way. | howmuch | 0,1,2,3,4 | no |
| 16 | I feel that there are good and bad numbers. | howmuch | 0,1,2,3,4 | no |
| 17 | I wash my hands more often and longer than necessary. | howmuch | 0,1,2,3,4 | no |
| 18 | I frequently get nasty thoughts and have difficulty in getting rid of them | howmuch | 0,1,2,3,4 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/obsessiveness-oci-r.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

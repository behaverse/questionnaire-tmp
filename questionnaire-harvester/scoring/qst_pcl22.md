# Scoring — Hare Psychopathy Checklist (Original) (PCL-22) (`qst_pcl22`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_pcl22",
  "title": "Hare Psychopathy Checklist (Original) (PCL-22)",
  "short_title": "Original",
  "source_url": "https://psychology-tools.com/test/pcl-22",
  "publication": {
    "citation": "Hare R D A research scale for the assessment of psychopathy in criminal populations. 1 Pers Indiv Diff 111-119 ( 1980 ).",
    "year": 1980
  },
  "status": "needs-research",
  "item_count": 22,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_pcl22_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 3,
      "values": [
        2,
        1,
        0
      ],
      "value_range": [
        0,
        2
      ],
      "anchors": [
        "Definitely Present",
        "Possibly Present",
        "Definitely Absent"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_pcl22_1",
      "prompt_snippet": "Glibness / superficial charm",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_pcl22_2",
      "prompt_snippet": "Previous diagnosis as psychopath (or similar)",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_pcl22_3",
      "prompt_snippet": "Egocentricity / grandiose sense of self-worth",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_pcl22_4",
      "prompt_snippet": "Proneness to boredom / low frustration tolerance",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_pcl22_5",
      "prompt_snippet": "Pathological lying and deception",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_pcl22_6",
      "prompt_snippet": "Conning / lack of sincerity",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_pcl22_7",
      "prompt_snippet": "Lack of remorse or guilt",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_pcl22_8",
      "prompt_snippet": "Lack of affect and emotional depth",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_pcl22_9",
      "prompt_snippet": "Callous / lack of empathy",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_pcl22_10",
      "prompt_snippet": "Parasitic lifestyle",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_pcl22_11",
      "prompt_snippet": "Short-tempered / poor behavioral controls",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_pcl22_12",
      "prompt_snippet": "Promiscuous sexual relations",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_pcl22_13",
      "prompt_snippet": "Early behavior problems",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_pcl22_14",
      "prompt_snippet": "Lack of realistic, long-term plans",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_pcl22_15",
      "prompt_snippet": "Impulsivity",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_pcl22_16",
      "prompt_snippet": "Irresponsible behavior as parent",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_pcl22_17",
      "prompt_snippet": "Frequent marital relationships",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_pcl22_18",
      "prompt_snippet": "Juvenile delinquency",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_pcl22_19",
      "prompt_snippet": "Poor probation or parole risk",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_pcl22_20",
      "prompt_snippet": "Failure to accept responsibility for own actions",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_pcl22_21",
      "prompt_snippet": "Many types of offense",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_pcl22_22",
      "prompt_snippet": "Drug or alcohol abuse not direct cause of antisocial behavior",
      "dimension": "rating",
      "values": [
        2,
        1,
        0
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
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Glibness / superficial charm | rating | 2,1,0 | no |
| 2 | Previous diagnosis as psychopath (or similar) | rating | 2,1,0 | no |
| 3 | Egocentricity / grandiose sense of self-worth | rating | 2,1,0 | no |
| 4 | Proneness to boredom / low frustration tolerance | rating | 2,1,0 | no |
| 5 | Pathological lying and deception | rating | 2,1,0 | no |
| 6 | Conning / lack of sincerity | rating | 2,1,0 | no |
| 7 | Lack of remorse or guilt | rating | 2,1,0 | no |
| 8 | Lack of affect and emotional depth | rating | 2,1,0 | no |
| 9 | Callous / lack of empathy | rating | 2,1,0 | no |
| 10 | Parasitic lifestyle | rating | 2,1,0 | no |
| 11 | Short-tempered / poor behavioral controls | rating | 2,1,0 | no |
| 12 | Promiscuous sexual relations | rating | 2,1,0 | no |
| 13 | Early behavior problems | rating | 2,1,0 | no |
| 14 | Lack of realistic, long-term plans | rating | 2,1,0 | no |
| 15 | Impulsivity | rating | 2,1,0 | no |
| 16 | Irresponsible behavior as parent | rating | 2,1,0 | no |
| 17 | Frequent marital relationships | rating | 2,1,0 | no |
| 18 | Juvenile delinquency | rating | 2,1,0 | no |
| 19 | Poor probation or parole risk | rating | 2,1,0 | no |
| 20 | Failure to accept responsibility for own actions | rating | 2,1,0 | no |
| 21 | Many types of offense | rating | 2,1,0 | no |
| 22 | Drug or alcohol abuse not direct cause of antisocial behavior | rating | 2,1,0 | no |

## To research (fill from https://psychology-tools.com/test/pcl-22)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

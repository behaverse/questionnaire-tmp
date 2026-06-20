# Scoring — Vanderbilt ADHD Diagnostic Rating Scale (VADRS) (`qst_vadrs`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_vadrs",
  "title": "Vanderbilt ADHD Diagnostic Rating Scale (VADRS)",
  "short_title": "VADRS",
  "source_url": "https://psychology-tools.com/test/vadrs-vanderbilt-adhd-diagnostic-rating-scale",
  "publication": null,
  "status": "needs-research",
  "item_count": 55,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_vadrs_rating_1",
      "dimension": "rating",
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
        "Never",
        "Occasionally",
        "Often",
        "Very Often"
      ]
    },
    {
      "ref": "opt_vadrs_rating_2",
      "dimension": "rating",
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
        "Excellent",
        "Above Average",
        "Average",
        "Somewhat of a Problem",
        "Problematic"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_vadrs_1",
      "prompt_snippet": "Does not pay attention to details or makes careless mistakes with, for example, ",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_2",
      "prompt_snippet": "Has difficulty keeping attention to what needs to be done",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_3",
      "prompt_snippet": "Does not seem to listen when spoken to directly",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_4",
      "prompt_snippet": "Does not follow through when given directions and fails to finish activities (no",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_5",
      "prompt_snippet": "Has difficulty organizing tasks and activities",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_6",
      "prompt_snippet": "Avoids, dislikes, or does not want to start tasks that require ongoing mental ef",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_7",
      "prompt_snippet": "Loses things necessary for tasks or activities (toys, assignments, pencils, or b",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_8",
      "prompt_snippet": "Is easily distracted by noises or other stimuli",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_9",
      "prompt_snippet": "Is forgetful in daily activities",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_10",
      "prompt_snippet": "Fidgets with hands or feet or squirms in seat",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_11",
      "prompt_snippet": "Leaves seat when remaining seated is expected",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_12",
      "prompt_snippet": "Runs about or climbs too much when remaining seated is expected",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_13",
      "prompt_snippet": "Has difficulty playing or beginning quiet play activities",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_14",
      "prompt_snippet": "Is “on the go” or often acts as if “driven by a motor”",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_15",
      "prompt_snippet": "Talks too much",
      "dimension": "rating",
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
      "prompt_id": "pr_vadrs_16",
      "prompt_snippet": "Blurts out answers before questions have been completed",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_vadrs_17",
      "prompt_snippet": "Has difficulty waiting his or her turn",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_vadrs_18",
      "prompt_snippet": "Interrupts or intrudes in on others’ conversations and/or activities",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_vadrs_19",
      "prompt_snippet": "Argues with adults",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_vadrs_20",
      "prompt_snippet": "Loses temper",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_vadrs_21",
      "prompt_snippet": "Actively defies or refuses to go along with adults’ requests or rules",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_vadrs_22",
      "prompt_snippet": "Deliberately annoys people",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_vadrs_23",
      "prompt_snippet": "Blames others for his or her mistakes or misbehaviors",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_vadrs_24",
      "prompt_snippet": "Is touchy or easily annoyed by others",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_vadrs_25",
      "prompt_snippet": "Is angry or resentful",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_vadrs_26",
      "prompt_snippet": "Is spiteful and wants to get even",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_vadrs_27",
      "prompt_snippet": "Bullies, threatens, or intimidates others",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_vadrs_28",
      "prompt_snippet": "Starts physical fights",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_vadrs_29",
      "prompt_snippet": "Lies to get out of trouble or to avoid obligations (i.e.,“cons” others)",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_vadrs_30",
      "prompt_snippet": "Is truant from school (skips school) without permission",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_vadrs_31",
      "prompt_snippet": "Is physically cruel to people",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_vadrs_32",
      "prompt_snippet": "Has stolen things that have value",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_vadrs_33",
      "prompt_snippet": "Deliberately destroys others’ property",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_vadrs_34",
      "prompt_snippet": "Has used a weapon that can cause serious harm (bat, knife, brick, gun)",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_vadrs_35",
      "prompt_snippet": "Is physically cruel to animals",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_vadrs_36",
      "prompt_snippet": "Has deliberately set fires to cause damage",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_vadrs_37",
      "prompt_snippet": "Has broken into someone else’s home, business, or car",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_vadrs_38",
      "prompt_snippet": "Has stayed out at night without permission",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_vadrs_39",
      "prompt_snippet": "Has run away from home overnight",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 40,
      "prompt_id": "pr_vadrs_40",
      "prompt_snippet": "Has forced someone into sexual activity",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 41,
      "prompt_id": "pr_vadrs_41",
      "prompt_snippet": "Is fearful, anxious, or worried",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 42,
      "prompt_id": "pr_vadrs_42",
      "prompt_snippet": "Is afraid to try new things for fear of making mistakes",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 43,
      "prompt_id": "pr_vadrs_43",
      "prompt_snippet": "Feels worthless or inferior",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 44,
      "prompt_id": "pr_vadrs_44",
      "prompt_snippet": "Blames self for problems, feels guilty",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 45,
      "prompt_id": "pr_vadrs_45",
      "prompt_snippet": "Feels lonely, unwanted, or unloved; complains that “no one loves him or her”",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 46,
      "prompt_id": "pr_vadrs_46",
      "prompt_snippet": "Is sad, unhappy, or depressed",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 47,
      "prompt_id": "pr_vadrs_47",
      "prompt_snippet": "Is self-conscious or easily embarrassed",
      "dimension": "rating",
      "values": [
        0,
        1,
        2,
        3
      ],
      "reversed": false
    },
    {
      "index": 48,
      "prompt_id": "pr_vadrs_48",
      "prompt_snippet": "Overall school performance",
      "dimension": "rating",
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
      "index": 49,
      "prompt_id": "pr_vadrs_49",
      "prompt_snippet": "Reading",
      "dimension": "rating",
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
      "index": 50,
      "prompt_id": "pr_vadrs_50",
      "prompt_snippet": "Writing",
      "dimension": "rating",
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
      "index": 51,
      "prompt_id": "pr_vadrs_51",
      "prompt_snippet": "Mathematics",
      "dimension": "rating",
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
      "index": 52,
      "prompt_id": "pr_vadrs_52",
      "prompt_snippet": "Relationship with parents",
      "dimension": "rating",
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
      "index": 53,
      "prompt_id": "pr_vadrs_53",
      "prompt_snippet": "Relationship with siblings",
      "dimension": "rating",
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
      "index": 54,
      "prompt_id": "pr_vadrs_54",
      "prompt_snippet": "Relationship with peers",
      "dimension": "rating",
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
      "index": 55,
      "prompt_id": "pr_vadrs_55",
      "prompt_snippet": "Participation in organized activities",
      "dimension": "rating",
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

- Items: 55
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Does not pay attention to details or makes careless mistakes with, for example,  | rating | 0,1,2,3 | no |
| 2 | Has difficulty keeping attention to what needs to be done | rating | 0,1,2,3 | no |
| 3 | Does not seem to listen when spoken to directly | rating | 0,1,2,3 | no |
| 4 | Does not follow through when given directions and fails to finish activities (no | rating | 0,1,2,3 | no |
| 5 | Has difficulty organizing tasks and activities | rating | 0,1,2,3 | no |
| 6 | Avoids, dislikes, or does not want to start tasks that require ongoing mental ef | rating | 0,1,2,3 | no |
| 7 | Loses things necessary for tasks or activities (toys, assignments, pencils, or b | rating | 0,1,2,3 | no |
| 8 | Is easily distracted by noises or other stimuli | rating | 0,1,2,3 | no |
| 9 | Is forgetful in daily activities | rating | 0,1,2,3 | no |
| 10 | Fidgets with hands or feet or squirms in seat | rating | 0,1,2,3 | no |
| 11 | Leaves seat when remaining seated is expected | rating | 0,1,2,3 | no |
| 12 | Runs about or climbs too much when remaining seated is expected | rating | 0,1,2,3 | no |
| 13 | Has difficulty playing or beginning quiet play activities | rating | 0,1,2,3 | no |
| 14 | Is “on the go” or often acts as if “driven by a motor” | rating | 0,1,2,3 | no |
| 15 | Talks too much | rating | 0,1,2,3 | no |
| 16 | Blurts out answers before questions have been completed | rating | 0,1,2,3 | no |
| 17 | Has difficulty waiting his or her turn | rating | 0,1,2,3 | no |
| 18 | Interrupts or intrudes in on others’ conversations and/or activities | rating | 0,1,2,3 | no |
| 19 | Argues with adults | rating | 0,1,2,3 | no |
| 20 | Loses temper | rating | 0,1,2,3 | no |
| 21 | Actively defies or refuses to go along with adults’ requests or rules | rating | 0,1,2,3 | no |
| 22 | Deliberately annoys people | rating | 0,1,2,3 | no |
| 23 | Blames others for his or her mistakes or misbehaviors | rating | 0,1,2,3 | no |
| 24 | Is touchy or easily annoyed by others | rating | 0,1,2,3 | no |
| 25 | Is angry or resentful | rating | 0,1,2,3 | no |
| 26 | Is spiteful and wants to get even | rating | 0,1,2,3 | no |
| 27 | Bullies, threatens, or intimidates others | rating | 0,1,2,3 | no |
| 28 | Starts physical fights | rating | 0,1,2,3 | no |
| 29 | Lies to get out of trouble or to avoid obligations (i.e.,“cons” others) | rating | 0,1,2,3 | no |
| 30 | Is truant from school (skips school) without permission | rating | 0,1,2,3 | no |
| 31 | Is physically cruel to people | rating | 0,1,2,3 | no |
| 32 | Has stolen things that have value | rating | 0,1,2,3 | no |
| 33 | Deliberately destroys others’ property | rating | 0,1,2,3 | no |
| 34 | Has used a weapon that can cause serious harm (bat, knife, brick, gun) | rating | 0,1,2,3 | no |
| 35 | Is physically cruel to animals | rating | 0,1,2,3 | no |
| 36 | Has deliberately set fires to cause damage | rating | 0,1,2,3 | no |
| 37 | Has broken into someone else’s home, business, or car | rating | 0,1,2,3 | no |
| 38 | Has stayed out at night without permission | rating | 0,1,2,3 | no |
| 39 | Has run away from home overnight | rating | 0,1,2,3 | no |
| 40 | Has forced someone into sexual activity | rating | 0,1,2,3 | no |
| 41 | Is fearful, anxious, or worried | rating | 0,1,2,3 | no |
| 42 | Is afraid to try new things for fear of making mistakes | rating | 0,1,2,3 | no |
| 43 | Feels worthless or inferior | rating | 0,1,2,3 | no |
| 44 | Blames self for problems, feels guilty | rating | 0,1,2,3 | no |
| 45 | Feels lonely, unwanted, or unloved; complains that “no one loves him or her” | rating | 0,1,2,3 | no |
| 46 | Is sad, unhappy, or depressed | rating | 0,1,2,3 | no |
| 47 | Is self-conscious or easily embarrassed | rating | 0,1,2,3 | no |
| 48 | Overall school performance | rating | 1,2,3,4,5 | no |
| 49 | Reading | rating | 1,2,3,4,5 | no |
| 50 | Writing | rating | 1,2,3,4,5 | no |
| 51 | Mathematics | rating | 1,2,3,4,5 | no |
| 52 | Relationship with parents | rating | 1,2,3,4,5 | no |
| 53 | Relationship with siblings | rating | 1,2,3,4,5 | no |
| 54 | Relationship with peers | rating | 1,2,3,4,5 | no |
| 55 | Participation in organized activities | rating | 1,2,3,4,5 | no |

## To research (fill from https://psychology-tools.com/test/vadrs-vanderbilt-adhd-diagnostic-rating-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

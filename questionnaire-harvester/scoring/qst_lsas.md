# Scoring — Liebowitz Social Anxiety Scale (`qst_lsas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_lsas",
  "title": "Liebowitz Social Anxiety Scale",
  "short_title": "Liebowitz Social Anxiety Scale",
  "source_url": "https://psychology-tools.com/test/liebowitz-social-anxiety-scale",
  "publication": null,
  "status": "needs-research",
  "item_count": 48,
  "dimensions": [
    "avoidance",
    "fear"
  ],
  "option_scales": [
    {
      "ref": "opt_lsas_fear_1",
      "dimension": "fear",
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
        "None",
        "Mild",
        "Moderate",
        "Severe"
      ]
    },
    {
      "ref": "opt_lsas_avoidance_2",
      "dimension": "avoidance",
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
        "Never (0%)",
        "Occasionally (1-33%)",
        "Often (34-66%)",
        "Usually (67-100%)"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_lsas_1",
      "prompt_snippet": "Telephoning in public.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_2",
      "prompt_snippet": "Telephoning in public.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_3",
      "prompt_snippet": "Participating in small groups.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_4",
      "prompt_snippet": "Participating in small groups.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_5",
      "prompt_snippet": "Eating in public places.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_6",
      "prompt_snippet": "Eating in public places.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_7",
      "prompt_snippet": "Drinking with others in public places.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_8",
      "prompt_snippet": "Drinking with others in public places.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_9",
      "prompt_snippet": "Talking to people in authority.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_10",
      "prompt_snippet": "Talking to people in authority.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_11",
      "prompt_snippet": "Acting, performing or giving a talk in front of an audience.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_12",
      "prompt_snippet": "Acting, performing or giving a talk in front of an audience.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_13",
      "prompt_snippet": "Going to a party.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_14",
      "prompt_snippet": "Going to a party.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_15",
      "prompt_snippet": "Working while being observed.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_16",
      "prompt_snippet": "Working while being observed.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_17",
      "prompt_snippet": "Writing while being observed.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_18",
      "prompt_snippet": "Writing while being observed.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_19",
      "prompt_snippet": "Calling someone you don’t know very well.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_20",
      "prompt_snippet": "Calling someone you don’t know very well.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_21",
      "prompt_snippet": "Talking with people you don’t know very well.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_22",
      "prompt_snippet": "Talking with people you don’t know very well.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_23",
      "prompt_snippet": "Meeting strangers.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_24",
      "prompt_snippet": "Meeting strangers.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_25",
      "prompt_snippet": "Urinating in a public bathroom.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_26",
      "prompt_snippet": "Urinating in a public bathroom.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_27",
      "prompt_snippet": "Entering a room when others are already seated.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_28",
      "prompt_snippet": "Entering a room when others are already seated.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_29",
      "prompt_snippet": "Being the center of attention.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_30",
      "prompt_snippet": "Being the center of attention.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_31",
      "prompt_snippet": "Speaking up at a meeting.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_32",
      "prompt_snippet": "Speaking up at a meeting.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_33",
      "prompt_snippet": "Taking a test.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_34",
      "prompt_snippet": "Taking a test.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_35",
      "prompt_snippet": "Expressing a disagreement or disapproval to people you don’t know very well.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_36",
      "prompt_snippet": "Expressing a disagreement or disapproval to people you don’t know very well.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_37",
      "prompt_snippet": "Looking at people you don’t know very well in the eyes.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_38",
      "prompt_snippet": "Looking at people you don’t know very well in the eyes.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_39",
      "prompt_snippet": "Giving a report to a group.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_40",
      "prompt_snippet": "Giving a report to a group.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_41",
      "prompt_snippet": "Trying to pick up someone.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_42",
      "prompt_snippet": "Trying to pick up someone.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_43",
      "prompt_snippet": "Returning goods to a store.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_44",
      "prompt_snippet": "Returning goods to a store.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_45",
      "prompt_snippet": "Giving a party.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_46",
      "prompt_snippet": "Giving a party.",
      "dimension": "avoidance",
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
      "prompt_id": "pr_lsas_47",
      "prompt_snippet": "Resisting a high pressure salesperson.",
      "dimension": "fear",
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
      "prompt_id": "pr_lsas_48",
      "prompt_snippet": "Resisting a high pressure salesperson.",
      "dimension": "avoidance",
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

- Items: 48
- Dimensions: avoidance, fear
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Telephoning in public. | fear | 0,1,2,3 | no |
| 2 | Telephoning in public. | avoidance | 0,1,2,3 | no |
| 3 | Participating in small groups. | fear | 0,1,2,3 | no |
| 4 | Participating in small groups. | avoidance | 0,1,2,3 | no |
| 5 | Eating in public places. | fear | 0,1,2,3 | no |
| 6 | Eating in public places. | avoidance | 0,1,2,3 | no |
| 7 | Drinking with others in public places. | fear | 0,1,2,3 | no |
| 8 | Drinking with others in public places. | avoidance | 0,1,2,3 | no |
| 9 | Talking to people in authority. | fear | 0,1,2,3 | no |
| 10 | Talking to people in authority. | avoidance | 0,1,2,3 | no |
| 11 | Acting, performing or giving a talk in front of an audience. | fear | 0,1,2,3 | no |
| 12 | Acting, performing or giving a talk in front of an audience. | avoidance | 0,1,2,3 | no |
| 13 | Going to a party. | fear | 0,1,2,3 | no |
| 14 | Going to a party. | avoidance | 0,1,2,3 | no |
| 15 | Working while being observed. | fear | 0,1,2,3 | no |
| 16 | Working while being observed. | avoidance | 0,1,2,3 | no |
| 17 | Writing while being observed. | fear | 0,1,2,3 | no |
| 18 | Writing while being observed. | avoidance | 0,1,2,3 | no |
| 19 | Calling someone you don’t know very well. | fear | 0,1,2,3 | no |
| 20 | Calling someone you don’t know very well. | avoidance | 0,1,2,3 | no |
| 21 | Talking with people you don’t know very well. | fear | 0,1,2,3 | no |
| 22 | Talking with people you don’t know very well. | avoidance | 0,1,2,3 | no |
| 23 | Meeting strangers. | fear | 0,1,2,3 | no |
| 24 | Meeting strangers. | avoidance | 0,1,2,3 | no |
| 25 | Urinating in a public bathroom. | fear | 0,1,2,3 | no |
| 26 | Urinating in a public bathroom. | avoidance | 0,1,2,3 | no |
| 27 | Entering a room when others are already seated. | fear | 0,1,2,3 | no |
| 28 | Entering a room when others are already seated. | avoidance | 0,1,2,3 | no |
| 29 | Being the center of attention. | fear | 0,1,2,3 | no |
| 30 | Being the center of attention. | avoidance | 0,1,2,3 | no |
| 31 | Speaking up at a meeting. | fear | 0,1,2,3 | no |
| 32 | Speaking up at a meeting. | avoidance | 0,1,2,3 | no |
| 33 | Taking a test. | fear | 0,1,2,3 | no |
| 34 | Taking a test. | avoidance | 0,1,2,3 | no |
| 35 | Expressing a disagreement or disapproval to people you don’t know very well. | fear | 0,1,2,3 | no |
| 36 | Expressing a disagreement or disapproval to people you don’t know very well. | avoidance | 0,1,2,3 | no |
| 37 | Looking at people you don’t know very well in the eyes. | fear | 0,1,2,3 | no |
| 38 | Looking at people you don’t know very well in the eyes. | avoidance | 0,1,2,3 | no |
| 39 | Giving a report to a group. | fear | 0,1,2,3 | no |
| 40 | Giving a report to a group. | avoidance | 0,1,2,3 | no |
| 41 | Trying to pick up someone. | fear | 0,1,2,3 | no |
| 42 | Trying to pick up someone. | avoidance | 0,1,2,3 | no |
| 43 | Returning goods to a store. | fear | 0,1,2,3 | no |
| 44 | Returning goods to a store. | avoidance | 0,1,2,3 | no |
| 45 | Giving a party. | fear | 0,1,2,3 | no |
| 46 | Giving a party. | avoidance | 0,1,2,3 | no |
| 47 | Resisting a high pressure salesperson. | fear | 0,1,2,3 | no |
| 48 | Resisting a high pressure salesperson. | avoidance | 0,1,2,3 | no |

## To research (fill from https://psychology-tools.com/test/liebowitz-social-anxiety-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

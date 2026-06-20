# Scoring — Fear of Spiders Questionnaire (FSQ) (`qst_fsq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_fsq",
  "title": "Fear of Spiders Questionnaire (FSQ)",
  "short_title": "FSQ",
  "source_url": "https://us.psytoolkit.org/survey-library/spider-fear-fsq.html",
  "publication": {
    "citation": "Szymanksi, J. and O’Donohue, W. (1995). Fear of spiders\nQuestionnaire. Journal of Therapy and Experimental Psychiatry,\n26(1) , 31-34.",
    "year": 1995
  },
  "status": "needs-research",
  "item_count": 18,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_fsq_rating_1",
      "dimension": "rating",
      "measurement_type": "interval",
      "levels": 0,
      "values": [],
      "value_range": [],
      "anchors": []
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_fsq_1",
      "prompt_snippet": "If I came across a spider now, I would get help from someone else to remove it.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_fsq_2",
      "prompt_snippet": "Currently, I am sometimes on the look out for spiders.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_fsq_3",
      "prompt_snippet": "If I saw a spider now, I would think it will harm me.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_fsq_4",
      "prompt_snippet": "I now think a lot about spiders.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_fsq_5",
      "prompt_snippet": "I would be somewhat afraid to enter a room now, where I have seen a spider befor",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_fsq_6",
      "prompt_snippet": "I now would do anything to try to avoid a spider.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_fsq_7",
      "prompt_snippet": "Currently, I sometimes think about getting bit by a spider.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_fsq_8",
      "prompt_snippet": "If I encountered a spider now, I wouldn't be able to deal effectively with it.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_fsq_9",
      "prompt_snippet": "If I encountered a spider now, it would take a long time to get it out of my min",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_fsq_10",
      "prompt_snippet": "If I came across a spider now, I would leave the room.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_fsq_11",
      "prompt_snippet": "If I saw a spider now, I would think it will try to jump on me.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_fsq_12",
      "prompt_snippet": "If I saw a spider now, 1 would ask someone else to kill it.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_fsq_13",
      "prompt_snippet": "If I encountered a spider now, I would have images of it trying to get me.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_fsq_14",
      "prompt_snippet": "If I saw a spider now I would be afraid of it.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_fsq_15",
      "prompt_snippet": "If I saw a spider now, I would feel very panicky.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_fsq_16",
      "prompt_snippet": "Spiders are one of my worst fears.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_fsq_17",
      "prompt_snippet": "I would feel very nervous if I saw a spider now.",
      "dimension": "rating",
      "values": [],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_fsq_18",
      "prompt_snippet": "If I saw a spider now I would probably break out in a sweat and my heart would b",
      "dimension": "rating",
      "values": [],
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
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | If I came across a spider now, I would get help from someone else to remove it. | rating |  | no |
| 2 | Currently, I am sometimes on the look out for spiders. | rating |  | no |
| 3 | If I saw a spider now, I would think it will harm me. | rating |  | no |
| 4 | I now think a lot about spiders. | rating |  | no |
| 5 | I would be somewhat afraid to enter a room now, where I have seen a spider befor | rating |  | no |
| 6 | I now would do anything to try to avoid a spider. | rating |  | no |
| 7 | Currently, I sometimes think about getting bit by a spider. | rating |  | no |
| 8 | If I encountered a spider now, I wouldn't be able to deal effectively with it. | rating |  | no |
| 9 | If I encountered a spider now, it would take a long time to get it out of my min | rating |  | no |
| 10 | If I came across a spider now, I would leave the room. | rating |  | no |
| 11 | If I saw a spider now, I would think it will try to jump on me. | rating |  | no |
| 12 | If I saw a spider now, 1 would ask someone else to kill it. | rating |  | no |
| 13 | If I encountered a spider now, I would have images of it trying to get me. | rating |  | no |
| 14 | If I saw a spider now I would be afraid of it. | rating |  | no |
| 15 | If I saw a spider now, I would feel very panicky. | rating |  | no |
| 16 | Spiders are one of my worst fears. | rating |  | no |
| 17 | I would feel very nervous if I saw a spider now. | rating |  | no |
| 18 | If I saw a spider now I would probably break out in a sweat and my heart would b | rating |  | no |

## To research (fill from https://us.psytoolkit.org/survey-library/spider-fear-fsq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

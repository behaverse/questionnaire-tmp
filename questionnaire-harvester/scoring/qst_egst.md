# Scoring — Excessive Gaming Screening Tool (EGST) (`qst_egst`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_egst",
  "title": "Excessive Gaming Screening Tool (EGST)",
  "short_title": "EGST",
  "source_url": "https://psychology-tools.com/test/excessive-gaming-screening-tool",
  "publication": {
    "citation": "R IF Brown ( 1991 ). Gaming, gambling and other addictive play. See JH Kerr & MJ Apter. Adult place: A reversal theory approach (pp. 101-118).",
    "year": 1991
  },
  "status": "needs-research",
  "item_count": 20,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_egst_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 6,
      "values": [
        0,
        1,
        2,
        3,
        4,
        5
      ],
      "value_range": [
        0,
        5
      ],
      "anchors": [
        "Not Applicable",
        "Rarely",
        "Occasionally",
        "Frequently",
        "Often",
        "Always"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_egst_1",
      "prompt_snippet": "How often do you find that you stay online longer than you intended?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_2",
      "prompt_snippet": "How often do you neglect household chores to spend more time online?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_3",
      "prompt_snippet": "How often do you prefer the excitement of the Internet to intimacy with your par",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_4",
      "prompt_snippet": "How often do you form new relationships with fellow online users?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_5",
      "prompt_snippet": "How often do others in your life complain to you about the amount of time you sp",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_6",
      "prompt_snippet": "How often do your grades or school work suffer because of the amount of time you",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_7",
      "prompt_snippet": "How often do you check your e-mail before something else that you need to do?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_8",
      "prompt_snippet": "How often does your job performance or productivity suffer because of the Intern",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_9",
      "prompt_snippet": "How often do you become defensive or secretive when anyone asks you what you do ",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_10",
      "prompt_snippet": "How often do you block out disturbing thoughts about your life with soothing tho",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_11",
      "prompt_snippet": "How often do you find yourself anticipating when you will go online again?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_12",
      "prompt_snippet": "How often do you fear that life without the Internet would be boring, empty, and",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_13",
      "prompt_snippet": "How often do you snap, yell, or act annoyed if someone bothers you while you are",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_14",
      "prompt_snippet": "How often do you lose sleep due to late-night log-ins?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_15",
      "prompt_snippet": "How often do you feel preoccupied with the Internet when off-line, or fantasize ",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_16",
      "prompt_snippet": "How often do you find yourself saying “just a few more minutes” when online?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_17",
      "prompt_snippet": "How often do you try to cut down the amount of time you spend online and fail?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_18",
      "prompt_snippet": "How often do you try to hide how long you’ve been online?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_19",
      "prompt_snippet": "How often do you choose to spend more time online over going out with others?",
      "dimension": "rating",
      "values": [
        0,
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
      "prompt_id": "pr_egst_20",
      "prompt_snippet": "How often do you feel depressed, moody, or nervous when you are off-line, which ",
      "dimension": "rating",
      "values": [
        0,
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
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | How often do you find that you stay online longer than you intended? | rating | 0,1,2,3,4,5 | no |
| 2 | How often do you neglect household chores to spend more time online? | rating | 0,1,2,3,4,5 | no |
| 3 | How often do you prefer the excitement of the Internet to intimacy with your par | rating | 0,1,2,3,4,5 | no |
| 4 | How often do you form new relationships with fellow online users? | rating | 0,1,2,3,4,5 | no |
| 5 | How often do others in your life complain to you about the amount of time you sp | rating | 0,1,2,3,4,5 | no |
| 6 | How often do your grades or school work suffer because of the amount of time you | rating | 0,1,2,3,4,5 | no |
| 7 | How often do you check your e-mail before something else that you need to do? | rating | 0,1,2,3,4,5 | no |
| 8 | How often does your job performance or productivity suffer because of the Intern | rating | 0,1,2,3,4,5 | no |
| 9 | How often do you become defensive or secretive when anyone asks you what you do  | rating | 0,1,2,3,4,5 | no |
| 10 | How often do you block out disturbing thoughts about your life with soothing tho | rating | 0,1,2,3,4,5 | no |
| 11 | How often do you find yourself anticipating when you will go online again? | rating | 0,1,2,3,4,5 | no |
| 12 | How often do you fear that life without the Internet would be boring, empty, and | rating | 0,1,2,3,4,5 | no |
| 13 | How often do you snap, yell, or act annoyed if someone bothers you while you are | rating | 0,1,2,3,4,5 | no |
| 14 | How often do you lose sleep due to late-night log-ins? | rating | 0,1,2,3,4,5 | no |
| 15 | How often do you feel preoccupied with the Internet when off-line, or fantasize  | rating | 0,1,2,3,4,5 | no |
| 16 | How often do you find yourself saying “just a few more minutes” when online? | rating | 0,1,2,3,4,5 | no |
| 17 | How often do you try to cut down the amount of time you spend online and fail? | rating | 0,1,2,3,4,5 | no |
| 18 | How often do you try to hide how long you’ve been online? | rating | 0,1,2,3,4,5 | no |
| 19 | How often do you choose to spend more time online over going out with others? | rating | 0,1,2,3,4,5 | no |
| 20 | How often do you feel depressed, moody, or nervous when you are off-line, which  | rating | 0,1,2,3,4,5 | no |

## To research (fill from https://psychology-tools.com/test/excessive-gaming-screening-tool)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

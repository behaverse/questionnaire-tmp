# Scoring — Measure of Anxiety in Selection Interviews (MASI) (`qst_masi`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_masi",
  "title": "Measure of Anxiety in Selection Interviews (MASI)",
  "short_title": "MASI",
  "source_url": "https://us.psytoolkit.org/survey-library/masi.html",
  "publication": {
    "citation": "McCarthy, J. and Goffin, R. (2004), Measuring Job Interview Anxiety: Beyond Weak Knees and Sweaty Palms. Personnel Psychology, 57, 607-637. LINK",
    "year": 2004
  },
  "status": "needs-research",
  "item_count": 30,
  "dimensions": [
    "masiagree"
  ],
  "option_scales": [
    {
      "ref": "opt_masi_masiagree_5",
      "dimension": "masiagree",
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
        "strongly disagree",
        "disagree",
        "feel neutral",
        "agree",
        "strongly agree"
      ]
    }
  ],
  "reversed_items": [
    "pr_masi_4",
    "pr_masi_6"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_masi_1",
      "prompt_snippet": "I become so apprehensive in job interviews that I am unable to express my though",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_2",
      "prompt_snippet": "I get so anxious while taking job interviews that I have trouble answering quest",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_3",
      "prompt_snippet": "During job interviews, I often can’t think of a thing to say.",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_4",
      "prompt_snippet": "I feel that my verbal communication skills are strong.",
      "dimension": "masiagree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 5,
      "prompt_id": "pr_masi_5",
      "prompt_snippet": "During job interviews I find it hard to understand what the interviewer is askin",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_6",
      "prompt_snippet": "I find it easy to communicate my personal accomplishments during a job interview",
      "dimension": "masiagree",
      "values": [
        1,
        2,
        3,
        4,
        5
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_masi_7",
      "prompt_snippet": "I often feel uneasy about my appearance when I am being interviewed for a job.",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_8",
      "prompt_snippet": "Before a job interview I am so nervous that I spend an excessive amount of time ",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_9",
      "prompt_snippet": "In job interviews, I worry that the interviewer will focus on what I consider to",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_10",
      "prompt_snippet": "If I do not look my absolute best in a job interview, I find it very hard to be ",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_11",
      "prompt_snippet": "I feel uneasy if my hair is not perfect when I walk into a job interview.",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_12",
      "prompt_snippet": "During a job interview, I worry about whether I have dressed appropriately.",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_13",
      "prompt_snippet": "While taking a job interview, I become concerned that the interviewer will perce",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_14",
      "prompt_snippet": "I become very uptight about having to socially interact with a job interviewer.",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_15",
      "prompt_snippet": "I get afraid about what kind of personal impression I am making on job interview",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_16",
      "prompt_snippet": "During a job interview, I worry that my actions will not be considered socially ",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_17",
      "prompt_snippet": "I worry about whether job interviewers will like me as a person.",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_18",
      "prompt_snippet": "When meeting a job interviewer, I worry that my handshake will not be correct.",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_19",
      "prompt_snippet": "In job interviews, I get very nervous about whether my performance is good enoug",
      "dimension": "masiagree",
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
      "prompt_id": "pr_masi_20",
      "prompt_snippet": "I am overwhelmed by thoughts of doing poorly when I am in job interview situatio",
      "dimension": "masiagree",
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
      "index": 21,
      "prompt_id": "pr_masi_21",
      "prompt_snippet": "I worry that my job interview performance will be lower than that of other appli",
      "dimension": "masiagree",
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
      "index": 22,
      "prompt_id": "pr_masi_22",
      "prompt_snippet": "During a job interview, I am so troubled by thoughts of failing that my performa",
      "dimension": "masiagree",
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
      "index": 23,
      "prompt_id": "pr_masi_23",
      "prompt_snippet": "During a job interview, I worry about what will happen if I don’t get the job.",
      "dimension": "masiagree",
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
      "index": 24,
      "prompt_id": "pr_masi_24",
      "prompt_snippet": "While taking a job interview, I worry about whether I am a good candidate for th",
      "dimension": "masiagree",
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
      "index": 25,
      "prompt_id": "pr_masi_25",
      "prompt_snippet": "During job interviews, my hands shake.",
      "dimension": "masiagree",
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
      "index": 26,
      "prompt_id": "pr_masi_26",
      "prompt_snippet": "My heartbeat is faster than usual during job interviews.",
      "dimension": "masiagree",
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
      "index": 27,
      "prompt_id": "pr_masi_27",
      "prompt_snippet": "It is hard for me to avoid fidgeting during a job interview.",
      "dimension": "masiagree",
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
      "index": 28,
      "prompt_id": "pr_masi_28",
      "prompt_snippet": "Job interviews often make me perspire (e.g., sweaty palms and underarms).",
      "dimension": "masiagree",
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
      "index": 29,
      "prompt_id": "pr_masi_29",
      "prompt_snippet": "My mouth gets very dry during job interviews.",
      "dimension": "masiagree",
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
      "index": 30,
      "prompt_id": "pr_masi_30",
      "prompt_snippet": "I often feel sick to my stomach when I am interviewed for a job.",
      "dimension": "masiagree",
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

- Items: 30
- Dimensions: masiagree
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_masi_4, pr_masi_6
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I become so apprehensive in job interviews that I am unable to express my though | masiagree | 1,2,3,4,5 | no |
| 2 | I get so anxious while taking job interviews that I have trouble answering quest | masiagree | 1,2,3,4,5 | no |
| 3 | During job interviews, I often can’t think of a thing to say. | masiagree | 1,2,3,4,5 | no |
| 4 | I feel that my verbal communication skills are strong. | masiagree | 1,2,3,4,5 | yes |
| 5 | During job interviews I find it hard to understand what the interviewer is askin | masiagree | 1,2,3,4,5 | no |
| 6 | I find it easy to communicate my personal accomplishments during a job interview | masiagree | 1,2,3,4,5 | yes |
| 7 | I often feel uneasy about my appearance when I am being interviewed for a job. | masiagree | 1,2,3,4,5 | no |
| 8 | Before a job interview I am so nervous that I spend an excessive amount of time  | masiagree | 1,2,3,4,5 | no |
| 9 | In job interviews, I worry that the interviewer will focus on what I consider to | masiagree | 1,2,3,4,5 | no |
| 10 | If I do not look my absolute best in a job interview, I find it very hard to be  | masiagree | 1,2,3,4,5 | no |
| 11 | I feel uneasy if my hair is not perfect when I walk into a job interview. | masiagree | 1,2,3,4,5 | no |
| 12 | During a job interview, I worry about whether I have dressed appropriately. | masiagree | 1,2,3,4,5 | no |
| 13 | While taking a job interview, I become concerned that the interviewer will perce | masiagree | 1,2,3,4,5 | no |
| 14 | I become very uptight about having to socially interact with a job interviewer. | masiagree | 1,2,3,4,5 | no |
| 15 | I get afraid about what kind of personal impression I am making on job interview | masiagree | 1,2,3,4,5 | no |
| 16 | During a job interview, I worry that my actions will not be considered socially  | masiagree | 1,2,3,4,5 | no |
| 17 | I worry about whether job interviewers will like me as a person. | masiagree | 1,2,3,4,5 | no |
| 18 | When meeting a job interviewer, I worry that my handshake will not be correct. | masiagree | 1,2,3,4,5 | no |
| 19 | In job interviews, I get very nervous about whether my performance is good enoug | masiagree | 1,2,3,4,5 | no |
| 20 | I am overwhelmed by thoughts of doing poorly when I am in job interview situatio | masiagree | 1,2,3,4,5 | no |
| 21 | I worry that my job interview performance will be lower than that of other appli | masiagree | 1,2,3,4,5 | no |
| 22 | During a job interview, I am so troubled by thoughts of failing that my performa | masiagree | 1,2,3,4,5 | no |
| 23 | During a job interview, I worry about what will happen if I don’t get the job. | masiagree | 1,2,3,4,5 | no |
| 24 | While taking a job interview, I worry about whether I am a good candidate for th | masiagree | 1,2,3,4,5 | no |
| 25 | During job interviews, my hands shake. | masiagree | 1,2,3,4,5 | no |
| 26 | My heartbeat is faster than usual during job interviews. | masiagree | 1,2,3,4,5 | no |
| 27 | It is hard for me to avoid fidgeting during a job interview. | masiagree | 1,2,3,4,5 | no |
| 28 | Job interviews often make me perspire (e.g., sweaty palms and underarms). | masiagree | 1,2,3,4,5 | no |
| 29 | My mouth gets very dry during job interviews. | masiagree | 1,2,3,4,5 | no |
| 30 | I often feel sick to my stomach when I am interviewed for a job. | masiagree | 1,2,3,4,5 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/masi.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

# Scoring — Hamilton Anxiety Rating Scale (HAM-A) (`qst_hama`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_hama",
  "title": "Hamilton Anxiety Rating Scale (HAM-A)",
  "short_title": "HAM-A",
  "source_url": "https://psychology-tools.com/test/hamilton-anxiety-rating-scale",
  "publication": {
    "citation": "M Hamilton. The Assessment of Anxiety States by Rating. 32 Br J Med Psychol 50-55. 1959.",
    "year": 1959
  },
  "status": "needs-research",
  "item_count": 14,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_hama_rating_1",
      "dimension": "rating",
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
        "Not Present",
        "Mild",
        "Moderate",
        "Severe",
        "Very Severe"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_hama_1",
      "prompt_snippet": "Anxious Mood Worries, anticipation of the worst, fearful anticipation, irritabil",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_2",
      "prompt_snippet": "Tension Feelings of tension, fatigability, startle response, moved to tears easi",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_3",
      "prompt_snippet": "Fears Of dark, of strangers, of being left alone, of animals, of traffic, of cro",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_4",
      "prompt_snippet": "Insomnia Difficulty in falling asleep, broken sleep, unsatisfying sleep and fati",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_5",
      "prompt_snippet": "Intellectual Difficulty in concentration, poor memory.",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_6",
      "prompt_snippet": "Depressed Mood Loss of interest, lack of pleasure in hobbies, depression, early ",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_7",
      "prompt_snippet": "Somatic (muscular) Pains and aches, twitching, stiffness, myoclonic jerks, grind",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_8",
      "prompt_snippet": "Somatic (sensory) Tinnitus, blurring of vision, hot and cold flushes, feelings o",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_9",
      "prompt_snippet": "Cardiovascular Symptoms Tachycardia, palpitations, pain in chest, throbbing of v",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_10",
      "prompt_snippet": "Respiratory Symptoms Pressure or constriction in chest, choking feelings, sighin",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_11",
      "prompt_snippet": "Gastrointestinal Symptoms Difficulty in swallowing, wind abdominal pain, burning",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_12",
      "prompt_snippet": "Genitourinary Symptoms Frequency of micturition, urgency of micturition, amenorr",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_13",
      "prompt_snippet": "Autonomic Symptoms Dry mouth, flushing, pallor, tendency to sweat, giddiness, te",
      "dimension": "rating",
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
      "prompt_id": "pr_hama_14",
      "prompt_snippet": "Behavior at Interview Fidgeting, restlessness or pacing, tremor of hands, furrow",
      "dimension": "rating",
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

- Items: 14
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Anxious Mood Worries, anticipation of the worst, fearful anticipation, irritabil | rating | 0,1,2,3,4 | no |
| 2 | Tension Feelings of tension, fatigability, startle response, moved to tears easi | rating | 0,1,2,3,4 | no |
| 3 | Fears Of dark, of strangers, of being left alone, of animals, of traffic, of cro | rating | 0,1,2,3,4 | no |
| 4 | Insomnia Difficulty in falling asleep, broken sleep, unsatisfying sleep and fati | rating | 0,1,2,3,4 | no |
| 5 | Intellectual Difficulty in concentration, poor memory. | rating | 0,1,2,3,4 | no |
| 6 | Depressed Mood Loss of interest, lack of pleasure in hobbies, depression, early  | rating | 0,1,2,3,4 | no |
| 7 | Somatic (muscular) Pains and aches, twitching, stiffness, myoclonic jerks, grind | rating | 0,1,2,3,4 | no |
| 8 | Somatic (sensory) Tinnitus, blurring of vision, hot and cold flushes, feelings o | rating | 0,1,2,3,4 | no |
| 9 | Cardiovascular Symptoms Tachycardia, palpitations, pain in chest, throbbing of v | rating | 0,1,2,3,4 | no |
| 10 | Respiratory Symptoms Pressure or constriction in chest, choking feelings, sighin | rating | 0,1,2,3,4 | no |
| 11 | Gastrointestinal Symptoms Difficulty in swallowing, wind abdominal pain, burning | rating | 0,1,2,3,4 | no |
| 12 | Genitourinary Symptoms Frequency of micturition, urgency of micturition, amenorr | rating | 0,1,2,3,4 | no |
| 13 | Autonomic Symptoms Dry mouth, flushing, pallor, tendency to sweat, giddiness, te | rating | 0,1,2,3,4 | no |
| 14 | Behavior at Interview Fidgeting, restlessness or pacing, tremor of hands, furrow | rating | 0,1,2,3,4 | no |

## To research (fill from https://psychology-tools.com/test/hamilton-anxiety-rating-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

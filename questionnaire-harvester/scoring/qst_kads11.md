# Scoring — Kutcher Adolescent Depression Scale - 11-Item (KADS-11) (`qst_kads11`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_kads11",
  "title": "Kutcher Adolescent Depression Scale - 11-Item (KADS-11)",
  "short_title": "KADS-11",
  "source_url": "https://psychology-tools.com/test/kutcher-adolescent-depression-scale",
  "publication": {
    "citation": "Sarah J Brooks, Stanley P Krulewicz, Stan Kutcher. The Kutcher Adolescent Depression Scale: ssessment of its evaluative properties over the course of an 8-week pediatric pharmacotherapy trial. 13 ( 3 ): J Child Adolesc Psychopharmacol 337-49 ( 2003 ).",
    "year": 2003
  },
  "status": "needs-research",
  "item_count": 11,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_kads11_rating_1",
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
        "hardly ever",
        "much of the time",
        "most of the time",
        "all the time"
      ]
    },
    {
      "ref": "opt_kads11_rating_2",
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
        "no thoughts or plans or actions",
        "occasional thoughts, no plans or actions",
        "frequent thoughts, no plans or actions",
        "plans and/or actions that have hurt"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_kads11_1",
      "prompt_snippet": "Low mood, sadness, feeling blah or down, depressed, just can’t be bothered.",
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
      "prompt_id": "pr_kads11_2",
      "prompt_snippet": "Irritable, loosing your temper easily, feeling pissed off, loosing it.",
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
      "prompt_id": "pr_kads11_3",
      "prompt_snippet": "Sleep difficulties - different from your usual (over the years before you got si",
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
      "prompt_id": "pr_kads11_4",
      "prompt_snippet": "Feeling decreased interest in: hanging out with friends; being with your best fr",
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
      "prompt_id": "pr_kads11_5",
      "prompt_snippet": "Feelings of worthlessness, hopelessness, letting people down, not being a good p",
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
      "prompt_id": "pr_kads11_6",
      "prompt_snippet": "Feeling tired, feeling fatigued, low in energy, hard to get motivated, have to p",
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
      "prompt_id": "pr_kads11_7",
      "prompt_snippet": "Trouble concentrating, can’t keep your mind on schoolwork or work, daydreaming w",
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
      "prompt_id": "pr_kads11_8",
      "prompt_snippet": "Feeling that life is not very much fun, not feeling good when usually (before ge",
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
      "prompt_id": "pr_kads11_9",
      "prompt_snippet": "Feeling worried, nervous, panicky, tense, keyed up, anxious.",
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
      "prompt_id": "pr_kads11_10",
      "prompt_snippet": "Physical feelings of worry like: headaches, butterflies, nausea, tingling, restl",
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
      "prompt_id": "pr_kads11_11",
      "prompt_snippet": "Thoughts, plans or actions about suicide or self-harm.",
      "dimension": "rating",
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

- Items: 11
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Low mood, sadness, feeling blah or down, depressed, just can’t be bothered. | rating | 0,1,2,3 | no |
| 2 | Irritable, loosing your temper easily, feeling pissed off, loosing it. | rating | 0,1,2,3 | no |
| 3 | Sleep difficulties - different from your usual (over the years before you got si | rating | 0,1,2,3 | no |
| 4 | Feeling decreased interest in: hanging out with friends; being with your best fr | rating | 0,1,2,3 | no |
| 5 | Feelings of worthlessness, hopelessness, letting people down, not being a good p | rating | 0,1,2,3 | no |
| 6 | Feeling tired, feeling fatigued, low in energy, hard to get motivated, have to p | rating | 0,1,2,3 | no |
| 7 | Trouble concentrating, can’t keep your mind on schoolwork or work, daydreaming w | rating | 0,1,2,3 | no |
| 8 | Feeling that life is not very much fun, not feeling good when usually (before ge | rating | 0,1,2,3 | no |
| 9 | Feeling worried, nervous, panicky, tense, keyed up, anxious. | rating | 0,1,2,3 | no |
| 10 | Physical feelings of worry like: headaches, butterflies, nausea, tingling, restl | rating | 0,1,2,3 | no |
| 11 | Thoughts, plans or actions about suicide or self-harm. | rating | 0,1,2,3 | no |

## To research (fill from https://psychology-tools.com/test/kutcher-adolescent-depression-scale)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

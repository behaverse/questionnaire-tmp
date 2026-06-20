# Scoring — Spider Fear Questionnaire (SPQ) (`qst_spq`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_spq",
  "title": "Spider Fear Questionnaire (SPQ)",
  "short_title": "SPQ",
  "source_url": "https://us.psytoolkit.org/survey-library/spider-fear-spq.html",
  "publication": {
    "citation": "Klorman, R., Weerts, T. C., Hastings, J. E., Melamed, B. G., Lang, P. J. (1974). Psychometric descriptions of some specific fear questionnaires. Behavior Therapy, 5 , 401-409.",
    "year": 1974
  },
  "status": "needs-research",
  "item_count": 31,
  "dimensions": [
    "truefalse"
  ],
  "option_scales": [
    {
      "ref": "opt_spq_truefalse_2",
      "dimension": "truefalse",
      "measurement_type": "ordinal",
      "levels": 2,
      "values": [
        1,
        0
      ],
      "value_range": [
        0,
        1
      ],
      "anchors": [
        "True",
        "False"
      ]
    }
  ],
  "reversed_items": [
    "pr_spq_6",
    "pr_spq_12",
    "pr_spq_14",
    "pr_spq_16",
    "pr_spq_17",
    "pr_spq_20",
    "pr_spq_25",
    "pr_spq_27",
    "pr_spq_28"
  ],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_spq_1",
      "prompt_snippet": "I avoid going to parks or on camping trips because there may be spiders about.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_spq_2",
      "prompt_snippet": "I would feel some anxiety holding a toy spider in my hand.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_spq_3",
      "prompt_snippet": "If a picture of a spider crawling on a person appears on the screen during a mot",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_spq_4",
      "prompt_snippet": "I dislike looking at pictures of spiders in a magazine.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_spq_5",
      "prompt_snippet": "If there is a spider on the ceiling over my bed, I cannot go to sleep unless som",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_spq_6",
      "prompt_snippet": "I enjoy watching spiders build their webs.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 7,
      "prompt_id": "pr_spq_7",
      "prompt_snippet": "I am terrified by the thought of touching a harmless spider.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_spq_8",
      "prompt_snippet": "If someone says that there are spiders anywhere about, I become alert and edgy",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_spq_9",
      "prompt_snippet": "I would not go down to the basement to get something if I thought there might be",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_spq_10",
      "prompt_snippet": "I would feel uncomfortable if a spider crawled out of my shoe as I took it out o",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_spq_11",
      "prompt_snippet": "When I see a spider, I feel tense and restless.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_spq_12",
      "prompt_snippet": "I enjoy reading articles about spiders.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 13,
      "prompt_id": "pr_spq_13",
      "prompt_snippet": "I feel sick when I see a spider.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_spq_14",
      "prompt_snippet": "Spiders are sometimes useful.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 15,
      "prompt_id": "pr_spq_15",
      "prompt_snippet": "I shudder when I think of spiders.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_spq_16",
      "prompt_snippet": "I don't mind being near a harmless spider if there is someone there in whom I ha",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 17,
      "prompt_id": "pr_spq_17",
      "prompt_snippet": "Some spiders are very attractive to look at.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 18,
      "prompt_id": "pr_spq_18",
      "prompt_snippet": "I don't believe anyone could hold a spider without some fear.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_spq_19",
      "prompt_snippet": "The way spiders move is repulsive.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_spq_20",
      "prompt_snippet": "It wouldn't bother me to touch a dead spider with a long stick.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 21,
      "prompt_id": "pr_spq_21",
      "prompt_snippet": "If I came upon a spider while cleaning the attic I would probably run.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_spq_22",
      "prompt_snippet": "I'm probably more afraid of spiders than of any other animal.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_spq_23",
      "prompt_snippet": "I would not want to travel to Mexico or Central America because of the greater p",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_spq_24",
      "prompt_snippet": "I am cautious when buying fruit because bananas may attract spiders.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_spq_25",
      "prompt_snippet": "I have no fear of non-poisonous spiders.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 26,
      "prompt_id": "pr_spq_26",
      "prompt_snippet": "I wouldn't take a course in biology if I thought I might have to handle live spi",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_spq_27",
      "prompt_snippet": "Spider webs are very artistic.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 28,
      "prompt_id": "pr_spq_28",
      "prompt_snippet": "I think that I'm no more afraid of spiders than the average person.",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": true
    },
    {
      "index": 29,
      "prompt_id": "pr_spq_29",
      "prompt_snippet": "I would prefer not to finish a story if something about spiders was introduced i",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_spq_30",
      "prompt_snippet": "Not only am I afraid of spiders but millipedes and caterpillars make me feel anx",
      "dimension": "truefalse",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_spq_31",
      "prompt_snippet": "Even if I was late for a very important appointment, the thought of spiders woul",
      "dimension": "truefalse",
      "values": [
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

- Items: 31
- Dimensions: truefalse
- Distinct scales: 1 (uniform)
- Reverse-scored items: pr_spq_6, pr_spq_12, pr_spq_14, pr_spq_16, pr_spq_17, pr_spq_20, pr_spq_25, pr_spq_27, pr_spq_28
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I avoid going to parks or on camping trips because there may be spiders about. | truefalse | 1,0 | no |
| 2 | I would feel some anxiety holding a toy spider in my hand. | truefalse | 1,0 | no |
| 3 | If a picture of a spider crawling on a person appears on the screen during a mot | truefalse | 1,0 | no |
| 4 | I dislike looking at pictures of spiders in a magazine. | truefalse | 1,0 | no |
| 5 | If there is a spider on the ceiling over my bed, I cannot go to sleep unless som | truefalse | 1,0 | no |
| 6 | I enjoy watching spiders build their webs. | truefalse | 1,0 | yes |
| 7 | I am terrified by the thought of touching a harmless spider. | truefalse | 1,0 | no |
| 8 | If someone says that there are spiders anywhere about, I become alert and edgy | truefalse | 1,0 | no |
| 9 | I would not go down to the basement to get something if I thought there might be | truefalse | 1,0 | no |
| 10 | I would feel uncomfortable if a spider crawled out of my shoe as I took it out o | truefalse | 1,0 | no |
| 11 | When I see a spider, I feel tense and restless. | truefalse | 1,0 | no |
| 12 | I enjoy reading articles about spiders. | truefalse | 1,0 | yes |
| 13 | I feel sick when I see a spider. | truefalse | 1,0 | no |
| 14 | Spiders are sometimes useful. | truefalse | 1,0 | yes |
| 15 | I shudder when I think of spiders. | truefalse | 1,0 | no |
| 16 | I don't mind being near a harmless spider if there is someone there in whom I ha | truefalse | 1,0 | yes |
| 17 | Some spiders are very attractive to look at. | truefalse | 1,0 | yes |
| 18 | I don't believe anyone could hold a spider without some fear. | truefalse | 1,0 | no |
| 19 | The way spiders move is repulsive. | truefalse | 1,0 | no |
| 20 | It wouldn't bother me to touch a dead spider with a long stick. | truefalse | 1,0 | yes |
| 21 | If I came upon a spider while cleaning the attic I would probably run. | truefalse | 1,0 | no |
| 22 | I'm probably more afraid of spiders than of any other animal. | truefalse | 1,0 | no |
| 23 | I would not want to travel to Mexico or Central America because of the greater p | truefalse | 1,0 | no |
| 24 | I am cautious when buying fruit because bananas may attract spiders. | truefalse | 1,0 | no |
| 25 | I have no fear of non-poisonous spiders. | truefalse | 1,0 | yes |
| 26 | I wouldn't take a course in biology if I thought I might have to handle live spi | truefalse | 1,0 | no |
| 27 | Spider webs are very artistic. | truefalse | 1,0 | yes |
| 28 | I think that I'm no more afraid of spiders than the average person. | truefalse | 1,0 | yes |
| 29 | I would prefer not to finish a story if something about spiders was introduced i | truefalse | 1,0 | no |
| 30 | Not only am I afraid of spiders but millipedes and caterpillars make me feel anx | truefalse | 1,0 | no |
| 31 | Even if I was late for a very important appointment, the thought of spiders woul | truefalse | 1,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/spider-fear-spq.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

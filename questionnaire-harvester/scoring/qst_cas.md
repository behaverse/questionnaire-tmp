# Scoring — Clinical Anger Scale (CAS) (`qst_cas`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_cas",
  "title": "Clinical Anger Scale (CAS)",
  "short_title": "CAS",
  "source_url": "https://us.psytoolkit.org/survey-library/anger-cas.html",
  "publication": {
    "citation": "Snell, W. E., Jr., Gum, S., Shuck, R. L., Mosley, J. A., & Kite, T. L. (1995). The clinical anger scale: Preliminary reliability and\nvalidity. Journal of Clinical Psychology, 51(2) , 215-226.",
    "year": 1995
  },
  "status": "needs-research",
  "item_count": 21,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_cas_rating_1",
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
        "A. I do not feel angry.",
        "B. I feel angry.",
        "C. I am angry most of the time now.",
        "D. I am so angry and hostile all the time that I can't stand it."
      ]
    },
    {
      "ref": "opt_cas_rating_2",
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
        "A. I am not particularly angry about my future.",
        "B. When I think about my future, I feel angry.",
        "C. I feel angry about what I have to look forward to.",
        "D. I feel intensely angry about my future, since it cannot be improved."
      ]
    },
    {
      "ref": "opt_cas_rating_3",
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
        "A. It makes me angry that I feel like such a failure.",
        "B. It makes me angry that I have failed more than the average person.",
        "C. As I look back on my life, I feel angry about my failures.",
        "D. It makes me angry to feel like a complete failure as a person."
      ]
    },
    {
      "ref": "opt_cas_rating_4",
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
        "A. I am not all that angry about things.",
        "B. I am becoming more hostile about things than I used to be.",
        "C. I am pretty angry about things these days.",
        "D. I am angry and hostile about everything."
      ]
    },
    {
      "ref": "opt_cas_rating_5",
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
        "A. I don't feel particularly hostile at others.",
        "B. I feel hostile a good deal of the time.",
        "C. I feel quite hostile most of the time.",
        "D. I feel hostile all of the time."
      ]
    },
    {
      "ref": "opt_cas_rating_6",
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
        "A. I don't feel that others are trying to annoy me.",
        "B. At times I think people are trying to annoy me.",
        "C. More people than usual are beginning to make me feel angry.",
        "D. I feel that others are constantly and intentionally making me angry."
      ]
    },
    {
      "ref": "opt_cas_rating_7",
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
        "A. I don't feel angry when I think about myself.",
        "B. I feel more angry about myself these days than I used to.",
        "C. I feel angry about myself a good deal of the time.",
        "D. When I think about myself, I feel intense anger."
      ]
    },
    {
      "ref": "opt_cas_rating_8",
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
        "A. I don't have angry feelings about others having screwed up my life.",
        "B. It's beginning to make me angry that others are screwing up my life.",
        "C. I feel angry that others prevent me from having a good life.",
        "D. I am constantly angry because others have made my life totally miserable."
      ]
    },
    {
      "ref": "opt_cas_rating_9",
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
        "A. I don't feel angry enough to hurt someone.",
        "B. Sometimes I am so angry that I feel like hurting others, but I would not really do it.",
        "C. My anger is so intense that I sometimes feel like hurting others.",
        "D. I'm so angry that I would like to hurt someone."
      ]
    },
    {
      "ref": "opt_cas_rating_10",
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
        "A. I don't shout at people any more than usual.",
        "B. I shout at others more now than I used to.",
        "C. I shout at people all the time now.",
        "D. I shout at others so often that sometimes I just can't stop."
      ]
    },
    {
      "ref": "opt_cas_rating_11",
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
        "A. Things are not more irritating to me now than usual.",
        "B. I feel slightly more irritated now than usual.",
        "C. I feel irritated a good deal of the time.",
        "D. I'm irritated all the time now."
      ]
    },
    {
      "ref": "opt_cas_rating_12",
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
        "A. My anger does not interfere with my interest in other people.",
        "B. My anger sometimes interferes with my interest in others.",
        "C. I am becoming so angry that I don't want to be around others.",
        "D. I'm so angry that I can't stand being around people."
      ]
    },
    {
      "ref": "opt_cas_rating_13",
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
        "A. I don't have any persistent angry feelings that influence my ability to make decisions.",
        "B. My feelings of anger occasionally undermine my ability to make decisions.",
        "C. I am angry to the extent that it interferes with my making good decisions.",
        "D. I'm so angry that I can't make good decisions anymore."
      ]
    },
    {
      "ref": "opt_cas_rating_14",
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
        "A. I'm not so angry and hostile that others dislike me.",
        "B. People sometimes dislike being around me since I become angry.",
        "C. More often than not, people stay away from me because I'm so hostile and angry.",
        "D. People don't like me anymore because I'm constantly angry all the time."
      ]
    },
    {
      "ref": "opt_cas_rating_15",
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
        "A. My feelings of anger do not interfere with my work.",
        "B. From time to time my feelings of anger interfere with my work.",
        "C. I feel so angry that it interferes with my capacity to work.",
        "D. My feelings of anger prevent me from doing any work at all."
      ]
    },
    {
      "ref": "opt_cas_rating_16",
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
        "A. My anger does not interfere with my sleep.",
        "B. Sometimes I don't sleep very well because I'm feeling angry.",
        "C. My anger is so great that I stay awake 1-2 hours later than usual.",
        "D. I am so intensely angry that I can't get much sleep during the night."
      ]
    },
    {
      "ref": "opt_cas_rating_17",
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
        "A. My anger does not make me feel anymore tired than usual.",
        "B. My feelings of anger are beginning to tire me out.",
        "C. My anger is intense enough that it makes me feel very tired.",
        "D. My feelings of anger leave me too tired to do anything."
      ]
    },
    {
      "ref": "opt_cas_rating_18",
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
        "A. My appetite does not suffer because of my feelings of anger.",
        "B. My feelings of anger are beginning to affect my appetite.",
        "C. My feelings of anger leave me without much of an appetite.",
        "D. My anger is so intense that it has taken away my appetite."
      ]
    },
    {
      "ref": "opt_cas_rating_19",
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
        "A. My feelings of anger don't interfere with my health.",
        "B. My feelings of anger are beginning to interfere with my health.",
        "C. My anger prevents me from devoting much time and attention to my health.",
        "D. I'm so angry at everything these days that I pay no attention to my health and well-being."
      ]
    },
    {
      "ref": "opt_cas_rating_20",
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
        "A. My ability to think clearly is unaffected by my feelings of anger.",
        "B. Sometimes my feelings of anger prevent me from thinking in a clear-headed way.",
        "C. My anger makes it hard for me to think of anything else.",
        "D. I'm so intensely angry and hostile that it completely interferes with my thinking."
      ]
    },
    {
      "ref": "opt_cas_rating_21",
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
        "A. I don't feel so angry that it interferes with my interest in sex.",
        "B. My feelings of anger leave me less interested in sex than I used to be.",
        "C. My current feelings of anger undermine my interest in sex.",
        "D. I'm so angry about my life that I've completely lost interest in sex."
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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
      "prompt_id": "pr_cas_shared",
      "prompt_snippet": "For each cluster of items, read and identify the statement that best reflects ho",
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

- Items: 21
- Dimensions: rating
- Distinct scales: 21 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 2 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 3 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 4 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 5 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 6 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 7 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 8 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 9 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 10 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 11 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 12 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 13 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 14 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 15 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 16 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 17 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 18 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 19 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 20 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |
| 21 | For each cluster of items, read and identify the statement that best reflects ho | rating | 0,1,2,3 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/anger-cas.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

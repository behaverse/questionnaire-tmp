# Scoring — Sexual Addiction Screening Test (SAST) (`qst_sast`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_sast",
  "title": "Sexual Addiction Screening Test (SAST)",
  "short_title": "SAST",
  "source_url": "https://psychology-tools.com/test/sast",
  "publication": null,
  "status": "needs-research",
  "item_count": 45,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_sast_rating_1",
      "dimension": "rating",
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
        "Yes",
        "No"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": true,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_sast_1",
      "prompt_snippet": "Were you sexually abused as a child or adolescent?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_sast_2",
      "prompt_snippet": "Did your parents have trouble with sexual behavior?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_sast_3",
      "prompt_snippet": "Do you often find yourself preoccupied with sexual thoughts?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_sast_4",
      "prompt_snippet": "Do you feel that your sexual behavior is not normal?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_sast_5",
      "prompt_snippet": "Do you ever feel bad about your sexual behavior?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_sast_6",
      "prompt_snippet": "Has your sexual behavior ever created problems for you and your family?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_sast_7",
      "prompt_snippet": "Have you ever sought help for sexual behavior you did not like?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_sast_8",
      "prompt_snippet": "Has anyone been hurt emotionally because of your sexual behavior?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_sast_9",
      "prompt_snippet": "Are any of your sexual activities against the law?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_sast_10",
      "prompt_snippet": "Have you made efforts to quit a type of sexual activity and failed?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_sast_11",
      "prompt_snippet": "Do you hide some of your sexual behaviors from others?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_sast_12",
      "prompt_snippet": "Have you attempted to stop some parts of your sexual activity?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_sast_13",
      "prompt_snippet": "Have you felt degraded by your sexual behaviors?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_sast_14",
      "prompt_snippet": "When you have sex, do you feel depressed afterwards?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_sast_15",
      "prompt_snippet": "Do you feel controlled by your sexual desire?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_sast_16",
      "prompt_snippet": "Have important parts of your life (such as job, family, friends, leisure activit",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_sast_17",
      "prompt_snippet": "Do you ever think your sexual desire is stronger than you are?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_sast_18",
      "prompt_snippet": "Is sex almost all you think about?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_sast_19",
      "prompt_snippet": "Has sex (or romantic fantasies) been a way for you to escape your problems?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_sast_20",
      "prompt_snippet": "Has sex become the most important thing in your life?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_sast_21",
      "prompt_snippet": "Are you in crisis over sexual matters?",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_sast_22",
      "prompt_snippet": "The internet has created sexual problems for me.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_sast_23",
      "prompt_snippet": "I spend too much time online for sexual purposes.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_sast_24",
      "prompt_snippet": "I have purchased services online for erotic purposes (sites for dating)",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_sast_25",
      "prompt_snippet": "I have used the internet to make romantic or erotic connections with people onli",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_sast_26",
      "prompt_snippet": "People in my life have been upset about my sexual activities online.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_sast_27",
      "prompt_snippet": "I have attempted to stop my online sexual behaviors.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_sast_28",
      "prompt_snippet": "I have subscribed to or regularly purchased or rented sexually explicit material",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_sast_29",
      "prompt_snippet": "I have been sexual with minors.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_sast_30",
      "prompt_snippet": "I have spent considerable time and money on strip clubs, adult bookstores and mo",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_sast_31",
      "prompt_snippet": "I have engaged prostitutes and escorts to satisfy my sexual needs.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_sast_32",
      "prompt_snippet": "I have spent considerable time surfing pornography online.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_sast_33",
      "prompt_snippet": "I have used magazines, videos or online pornography even when there was consider",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_sast_34",
      "prompt_snippet": "I have regularly purchased romantic novels or sexually explicit magazines.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_sast_35",
      "prompt_snippet": "I have stayed in romantic relationships after they became emotionally abusive.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_sast_36",
      "prompt_snippet": "I have traded sex for money or gifts.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_sast_37",
      "prompt_snippet": "I have maintained multiple romantic or sexual relationships at the same time.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_sast_38",
      "prompt_snippet": "After sexually acting out, I sometimes refrain from all sex for a significant pe",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_sast_39",
      "prompt_snippet": "I have regularly engaged in sadomasochistic behavior.",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 40,
      "prompt_id": "pr_sast_40",
      "prompt_snippet": "I visit sexual bath-houses, sex clubs or video/bookstores as part of my regular ",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 41,
      "prompt_id": "pr_sast_41",
      "prompt_snippet": "I have engaged in unsafe or “risky” sex even though I knew it could cause me har",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 42,
      "prompt_id": "pr_sast_42",
      "prompt_snippet": "I have cruised public restrooms, rest areas or parks looking for sex with strang",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 43,
      "prompt_id": "pr_sast_43",
      "prompt_snippet": "I believe casual or anonymous sex has kept me from having more long-term intimat",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 44,
      "prompt_id": "pr_sast_44",
      "prompt_snippet": "My sexual behavior has put me at risk for arrest for lewd conduct or public inde",
      "dimension": "rating",
      "values": [
        1,
        0
      ],
      "reversed": false
    },
    {
      "index": 45,
      "prompt_id": "pr_sast_45",
      "prompt_snippet": "I have been paid for sex.",
      "dimension": "rating",
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

- Items: 45
- Dimensions: rating
- Distinct scales: 1 (uniform)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | Were you sexually abused as a child or adolescent? | rating | 1,0 | no |
| 2 | Did your parents have trouble with sexual behavior? | rating | 1,0 | no |
| 3 | Do you often find yourself preoccupied with sexual thoughts? | rating | 1,0 | no |
| 4 | Do you feel that your sexual behavior is not normal? | rating | 1,0 | no |
| 5 | Do you ever feel bad about your sexual behavior? | rating | 1,0 | no |
| 6 | Has your sexual behavior ever created problems for you and your family? | rating | 1,0 | no |
| 7 | Have you ever sought help for sexual behavior you did not like? | rating | 1,0 | no |
| 8 | Has anyone been hurt emotionally because of your sexual behavior? | rating | 1,0 | no |
| 9 | Are any of your sexual activities against the law? | rating | 1,0 | no |
| 10 | Have you made efforts to quit a type of sexual activity and failed? | rating | 1,0 | no |
| 11 | Do you hide some of your sexual behaviors from others? | rating | 1,0 | no |
| 12 | Have you attempted to stop some parts of your sexual activity? | rating | 1,0 | no |
| 13 | Have you felt degraded by your sexual behaviors? | rating | 1,0 | no |
| 14 | When you have sex, do you feel depressed afterwards? | rating | 1,0 | no |
| 15 | Do you feel controlled by your sexual desire? | rating | 1,0 | no |
| 16 | Have important parts of your life (such as job, family, friends, leisure activit | rating | 1,0 | no |
| 17 | Do you ever think your sexual desire is stronger than you are? | rating | 1,0 | no |
| 18 | Is sex almost all you think about? | rating | 1,0 | no |
| 19 | Has sex (or romantic fantasies) been a way for you to escape your problems? | rating | 1,0 | no |
| 20 | Has sex become the most important thing in your life? | rating | 1,0 | no |
| 21 | Are you in crisis over sexual matters? | rating | 1,0 | no |
| 22 | The internet has created sexual problems for me. | rating | 1,0 | no |
| 23 | I spend too much time online for sexual purposes. | rating | 1,0 | no |
| 24 | I have purchased services online for erotic purposes (sites for dating) | rating | 1,0 | no |
| 25 | I have used the internet to make romantic or erotic connections with people onli | rating | 1,0 | no |
| 26 | People in my life have been upset about my sexual activities online. | rating | 1,0 | no |
| 27 | I have attempted to stop my online sexual behaviors. | rating | 1,0 | no |
| 28 | I have subscribed to or regularly purchased or rented sexually explicit material | rating | 1,0 | no |
| 29 | I have been sexual with minors. | rating | 1,0 | no |
| 30 | I have spent considerable time and money on strip clubs, adult bookstores and mo | rating | 1,0 | no |
| 31 | I have engaged prostitutes and escorts to satisfy my sexual needs. | rating | 1,0 | no |
| 32 | I have spent considerable time surfing pornography online. | rating | 1,0 | no |
| 33 | I have used magazines, videos or online pornography even when there was consider | rating | 1,0 | no |
| 34 | I have regularly purchased romantic novels or sexually explicit magazines. | rating | 1,0 | no |
| 35 | I have stayed in romantic relationships after they became emotionally abusive. | rating | 1,0 | no |
| 36 | I have traded sex for money or gifts. | rating | 1,0 | no |
| 37 | I have maintained multiple romantic or sexual relationships at the same time. | rating | 1,0 | no |
| 38 | After sexually acting out, I sometimes refrain from all sex for a significant pe | rating | 1,0 | no |
| 39 | I have regularly engaged in sadomasochistic behavior. | rating | 1,0 | no |
| 40 | I visit sexual bath-houses, sex clubs or video/bookstores as part of my regular  | rating | 1,0 | no |
| 41 | I have engaged in unsafe or “risky” sex even though I knew it could cause me har | rating | 1,0 | no |
| 42 | I have cruised public restrooms, rest areas or parks looking for sex with strang | rating | 1,0 | no |
| 43 | I believe casual or anonymous sex has kept me from having more long-term intimat | rating | 1,0 | no |
| 44 | My sexual behavior has put me at risk for arrest for lewd conduct or public inde | rating | 1,0 | no |
| 45 | I have been paid for sex. | rating | 1,0 | no |

## To research (fill from https://psychology-tools.com/test/sast)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

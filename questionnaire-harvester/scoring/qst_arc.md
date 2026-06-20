# Scoring — Systemizing Quotient (`qst_arc`)

> **status: needs-research.** The structure below is faithful to the harvested data. The aggregation formula, subscale membership, and cut-offs are NOT in the source and must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{
  "id": "qst_arc",
  "title": "Systemizing Quotient",
  "short_title": "Systemizing Quotient",
  "source_url": "https://us.psytoolkit.org/survey-library/systemizing-arc.html",
  "publication": null,
  "status": "needs-research",
  "item_count": 75,
  "dimensions": [
    "rating"
  ],
  "option_scales": [
    {
      "ref": "opt_arc_rating_1",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        2,
        1,
        0,
        0
      ],
      "value_range": [
        0,
        2
      ],
      "anchors": [
        "strongly agree",
        "slightly agree",
        "slightly disagree",
        "strongly disagree"
      ]
    },
    {
      "ref": "opt_arc_rating_2",
      "dimension": "rating",
      "measurement_type": "ordinal",
      "levels": 4,
      "values": [
        0,
        0,
        1,
        2
      ],
      "value_range": [
        0,
        2
      ],
      "anchors": [
        "strongly agree",
        "slightly agree",
        "slightly disagree",
        "strongly disagree"
      ]
    }
  ],
  "reversed_items": [],
  "subscales": [],
  "uniform_scale": false,
  "per_item": [
    {
      "index": 1,
      "prompt_id": "pr_arc_1",
      "prompt_snippet": "I find it very easy to use train timetables, even if this involves several conne",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 2,
      "prompt_id": "pr_arc_2",
      "prompt_snippet": "I like music or book shops because they are clearly organised.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 3,
      "prompt_id": "pr_arc_3",
      "prompt_snippet": "I would not enjoy organising events e.g. fundraising evenings, fetes, conference",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 4,
      "prompt_id": "pr_arc_4",
      "prompt_snippet": "When I read something, I always notice whether it is grammatically correct.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 5,
      "prompt_id": "pr_arc_5",
      "prompt_snippet": "I find myself categorising people into types (in my own mind).",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 6,
      "prompt_id": "pr_arc_6",
      "prompt_snippet": "I find it difficult to read and understand maps.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 7,
      "prompt_id": "pr_arc_7",
      "prompt_snippet": "When I look at a mountain, I think about how precisely it was formed.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 8,
      "prompt_id": "pr_arc_8",
      "prompt_snippet": "I am not interested in the details of exchange rates, interest rates, stocks and",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 9,
      "prompt_id": "pr_arc_9",
      "prompt_snippet": "If I were buying a car, I would want to obtain specific information about its en",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 10,
      "prompt_id": "pr_arc_10",
      "prompt_snippet": "I find it difficult to learn how to programme video recorders.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 11,
      "prompt_id": "pr_arc_11",
      "prompt_snippet": "When I like something I like to collect a lot of different examples of that type",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 12,
      "prompt_id": "pr_arc_12",
      "prompt_snippet": "When I learn a language, I become intrigued by its grammatical rules.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 13,
      "prompt_id": "pr_arc_13",
      "prompt_snippet": "I like to know how committees are structured in terms of who the different commi",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 14,
      "prompt_id": "pr_arc_14",
      "prompt_snippet": "If I had a collection (e.g. CDs, coins, stamps), it would be highly organised.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 15,
      "prompt_id": "pr_arc_15",
      "prompt_snippet": "I find it difficult to understand instruction manuals for putting appliances tog",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 16,
      "prompt_id": "pr_arc_16",
      "prompt_snippet": "When I look at a building, I am curious about the precise way it was constructed",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 17,
      "prompt_id": "pr_arc_17",
      "prompt_snippet": "I am not interested in understanding how wireless communication works (e.g. mobi",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 18,
      "prompt_id": "pr_arc_18",
      "prompt_snippet": "When travelling by train, I often wonder exactly how the rail networks are coord",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 19,
      "prompt_id": "pr_arc_19",
      "prompt_snippet": "I enjoy looking through catalogues of products to see the details of each produc",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 20,
      "prompt_id": "pr_arc_20",
      "prompt_snippet": "Whenever I run out of something at home, I always add it to a shopping list.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 21,
      "prompt_id": "pr_arc_21",
      "prompt_snippet": "I know, with reasonable accuracy, how much money has come in and gone out of my ",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 22,
      "prompt_id": "pr_arc_22",
      "prompt_snippet": "When I was young I did not enjoy collecting sets of things e.g. stickers, footba",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 23,
      "prompt_id": "pr_arc_23",
      "prompt_snippet": "I am interested in my family tree and in understanding how everyone is related t",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 24,
      "prompt_id": "pr_arc_24",
      "prompt_snippet": "When I learn about historical events, I do not focus on exact dates.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 25,
      "prompt_id": "pr_arc_25",
      "prompt_snippet": "I find it easy to grasp exactly how odds work in betting.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 26,
      "prompt_id": "pr_arc_26",
      "prompt_snippet": "I do not enjoy games that involve a high degree of strategy (e.g. chess, Risk, G",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 27,
      "prompt_id": "pr_arc_27",
      "prompt_snippet": "When I learn about a new category I like to go into detail to understand the sma",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 28,
      "prompt_id": "pr_arc_28",
      "prompt_snippet": "I do not find it distressing if people who live with me upset my routines.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 29,
      "prompt_id": "pr_arc_29",
      "prompt_snippet": "When I look at an animal, I like to know the precise species it belongs to.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 30,
      "prompt_id": "pr_arc_30",
      "prompt_snippet": "I can remember large amounts of information about a topic that interests me e.g.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 31,
      "prompt_id": "pr_arc_31",
      "prompt_snippet": "At home, I do not carefully file all important documents e.g. guarantees, insura",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 32,
      "prompt_id": "pr_arc_32",
      "prompt_snippet": "I am fascinated by how machines work.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 33,
      "prompt_id": "pr_arc_33",
      "prompt_snippet": "When I look at a piece of furniture, I do not notice the details of how it was c",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 34,
      "prompt_id": "pr_arc_34",
      "prompt_snippet": "I know very little about the different stages of the legislation process in my c",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 35,
      "prompt_id": "pr_arc_35",
      "prompt_snippet": "I do not tend to watch science documentaries on television or read articles abou",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 36,
      "prompt_id": "pr_arc_36",
      "prompt_snippet": "If someone stops to ask me the way, I'd be able to give directions to any part o",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 37,
      "prompt_id": "pr_arc_37",
      "prompt_snippet": "When I look at a painting, I do not usually think about the technique involved i",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 38,
      "prompt_id": "pr_arc_38",
      "prompt_snippet": "I prefer social interactions that are structured around a clear activity, e.g. a",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 39,
      "prompt_id": "pr_arc_39",
      "prompt_snippet": "I do not always check off receipts etc. against my bank statement.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 40,
      "prompt_id": "pr_arc_40",
      "prompt_snippet": "I am not interested in how the government is organised into different ministries",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 41,
      "prompt_id": "pr_arc_41",
      "prompt_snippet": "I am interested in knowing the path a river takes from its source to the sea.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 42,
      "prompt_id": "pr_arc_42",
      "prompt_snippet": "I have a large collection e.g. of books, CDs, videos etc.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 43,
      "prompt_id": "pr_arc_43",
      "prompt_snippet": "If there was a problem with the electrical wiring in my home, I’d be able to fix",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 44,
      "prompt_id": "pr_arc_44",
      "prompt_snippet": "My clothes are not carefully organised into different types in my wardrobe.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 45,
      "prompt_id": "pr_arc_45",
      "prompt_snippet": "I rarely read articles or webpages about new technology.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 46,
      "prompt_id": "pr_arc_46",
      "prompt_snippet": "I can easily visualise how the motorways in my region link up.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 47,
      "prompt_id": "pr_arc_47",
      "prompt_snippet": "When an election is being held, I am not interested in the results for each cons",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 48,
      "prompt_id": "pr_arc_48",
      "prompt_snippet": "I do not particularly enjoy learning about facts and figures in history.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 49,
      "prompt_id": "pr_arc_49",
      "prompt_snippet": "I do not tend to remember people's birthdays (in terms of which day and month th",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 50,
      "prompt_id": "pr_arc_50",
      "prompt_snippet": "When I am walking in the country, I am curious about how the various kinds of tr",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 51,
      "prompt_id": "pr_arc_51",
      "prompt_snippet": "I find it difficult to understand information the bank sends me on different inv",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 52,
      "prompt_id": "pr_arc_52",
      "prompt_snippet": "If I were buying a camera, I would not look carefully into the quality of the le",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 53,
      "prompt_id": "pr_arc_53",
      "prompt_snippet": "If I were buying a computer, I would want to know exact details about its hard d",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 54,
      "prompt_id": "pr_arc_54",
      "prompt_snippet": "I do not read legal documents very carefully.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 55,
      "prompt_id": "pr_arc_55",
      "prompt_snippet": "When I get to the checkout at a supermarket I pack different categories of goods",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 56,
      "prompt_id": "pr_arc_56",
      "prompt_snippet": "I do not follow any particular system when I'm cleaning at home.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 57,
      "prompt_id": "pr_arc_57",
      "prompt_snippet": "I do not enjoy in-depth political discussions.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 58,
      "prompt_id": "pr_arc_58",
      "prompt_snippet": "I am not very meticulous when I carry out D.I.Y or home improvements.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 59,
      "prompt_id": "pr_arc_59",
      "prompt_snippet": "I would not enjoy planning a business from scratch to completion.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 60,
      "prompt_id": "pr_arc_60",
      "prompt_snippet": "If I were buying a stereo, I would want to know about its precise technical feat",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 61,
      "prompt_id": "pr_arc_61",
      "prompt_snippet": "I tend to keep things that other people might throw away, in case they might be ",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 62,
      "prompt_id": "pr_arc_62",
      "prompt_snippet": "I avoid situations which I can not control.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 63,
      "prompt_id": "pr_arc_63",
      "prompt_snippet": "I do not care to know the names of the plants I see.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 64,
      "prompt_id": "pr_arc_64",
      "prompt_snippet": "When I hear the weather forecast, I am not very interested in the meteorological",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 65,
      "prompt_id": "pr_arc_65",
      "prompt_snippet": "It does not bother me if things in the house are not in their proper place.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 66,
      "prompt_id": "pr_arc_66",
      "prompt_snippet": "In maths, I am intrigued by the rules and patterns governing numbers.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 67,
      "prompt_id": "pr_arc_67",
      "prompt_snippet": "I find it difficult to learn my way around a new city.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 68,
      "prompt_id": "pr_arc_68",
      "prompt_snippet": "I could list my favourite 10 books, recalling titles and authors' names from mem",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 69,
      "prompt_id": "pr_arc_69",
      "prompt_snippet": "When I read the newspaper, I am drawn to tables of information, such as football",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 70,
      "prompt_id": "pr_arc_70",
      "prompt_snippet": "When I’m in a plane, I do not think about the aerodynamics.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 71,
      "prompt_id": "pr_arc_71",
      "prompt_snippet": "I do not keep careful records of my household bills.",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 72,
      "prompt_id": "pr_arc_72",
      "prompt_snippet": "When I have a lot of shopping to do, I like to plan which shops I am going to vi",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 73,
      "prompt_id": "pr_arc_73",
      "prompt_snippet": "When I cook, I do not think about exactly how different methods and ingredients ",
      "dimension": "rating",
      "values": [
        0,
        0,
        1,
        2
      ],
      "reversed": false
    },
    {
      "index": 74,
      "prompt_id": "pr_arc_74",
      "prompt_snippet": "When I listen to a piece of music, I always notice the way it’s structured.",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
        0
      ],
      "reversed": false
    },
    {
      "index": 75,
      "prompt_id": "pr_arc_75",
      "prompt_snippet": "I could generate a list of my favourite 10 songs from memory, including the titl",
      "dimension": "rating",
      "values": [
        2,
        1,
        0,
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

- Items: 75
- Dimensions: rating
- Distinct scales: 2 (mixed)
- Reverse-scored items: none
- Subscale refs: none

## Per-item

| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | I find it very easy to use train timetables, even if this involves several conne | rating | 2,1,0,0 | no |
| 2 | I like music or book shops because they are clearly organised. | rating | 2,1,0,0 | no |
| 3 | I would not enjoy organising events e.g. fundraising evenings, fetes, conference | rating | 0,0,1,2 | no |
| 4 | When I read something, I always notice whether it is grammatically correct. | rating | 2,1,0,0 | no |
| 5 | I find myself categorising people into types (in my own mind). | rating | 2,1,0,0 | no |
| 6 | I find it difficult to read and understand maps. | rating | 0,0,1,2 | no |
| 7 | When I look at a mountain, I think about how precisely it was formed. | rating | 2,1,0,0 | no |
| 8 | I am not interested in the details of exchange rates, interest rates, stocks and | rating | 0,0,1,2 | no |
| 9 | If I were buying a car, I would want to obtain specific information about its en | rating | 2,1,0,0 | no |
| 10 | I find it difficult to learn how to programme video recorders. | rating | 0,0,1,2 | no |
| 11 | When I like something I like to collect a lot of different examples of that type | rating | 2,1,0,0 | no |
| 12 | When I learn a language, I become intrigued by its grammatical rules. | rating | 2,1,0,0 | no |
| 13 | I like to know how committees are structured in terms of who the different commi | rating | 2,1,0,0 | no |
| 14 | If I had a collection (e.g. CDs, coins, stamps), it would be highly organised. | rating | 2,1,0,0 | no |
| 15 | I find it difficult to understand instruction manuals for putting appliances tog | rating | 0,0,1,2 | no |
| 16 | When I look at a building, I am curious about the precise way it was constructed | rating | 2,1,0,0 | no |
| 17 | I am not interested in understanding how wireless communication works (e.g. mobi | rating | 0,0,1,2 | no |
| 18 | When travelling by train, I often wonder exactly how the rail networks are coord | rating | 2,1,0,0 | no |
| 19 | I enjoy looking through catalogues of products to see the details of each produc | rating | 2,1,0,0 | no |
| 20 | Whenever I run out of something at home, I always add it to a shopping list. | rating | 2,1,0,0 | no |
| 21 | I know, with reasonable accuracy, how much money has come in and gone out of my  | rating | 2,1,0,0 | no |
| 22 | When I was young I did not enjoy collecting sets of things e.g. stickers, footba | rating | 0,0,1,2 | no |
| 23 | I am interested in my family tree and in understanding how everyone is related t | rating | 2,1,0,0 | no |
| 24 | When I learn about historical events, I do not focus on exact dates. | rating | 0,0,1,2 | no |
| 25 | I find it easy to grasp exactly how odds work in betting. | rating | 2,1,0,0 | no |
| 26 | I do not enjoy games that involve a high degree of strategy (e.g. chess, Risk, G | rating | 0,0,1,2 | no |
| 27 | When I learn about a new category I like to go into detail to understand the sma | rating | 2,1,0,0 | no |
| 28 | I do not find it distressing if people who live with me upset my routines. | rating | 0,0,1,2 | no |
| 29 | When I look at an animal, I like to know the precise species it belongs to. | rating | 2,1,0,0 | no |
| 30 | I can remember large amounts of information about a topic that interests me e.g. | rating | 2,1,0,0 | no |
| 31 | At home, I do not carefully file all important documents e.g. guarantees, insura | rating | 0,0,1,2 | no |
| 32 | I am fascinated by how machines work. | rating | 2,1,0,0 | no |
| 33 | When I look at a piece of furniture, I do not notice the details of how it was c | rating | 0,0,1,2 | no |
| 34 | I know very little about the different stages of the legislation process in my c | rating | 0,0,1,2 | no |
| 35 | I do not tend to watch science documentaries on television or read articles abou | rating | 0,0,1,2 | no |
| 36 | If someone stops to ask me the way, I'd be able to give directions to any part o | rating | 2,1,0,0 | no |
| 37 | When I look at a painting, I do not usually think about the technique involved i | rating | 0,0,1,2 | no |
| 38 | I prefer social interactions that are structured around a clear activity, e.g. a | rating | 2,1,0,0 | no |
| 39 | I do not always check off receipts etc. against my bank statement. | rating | 0,0,1,2 | no |
| 40 | I am not interested in how the government is organised into different ministries | rating | 0,0,1,2 | no |
| 41 | I am interested in knowing the path a river takes from its source to the sea. | rating | 2,1,0,0 | no |
| 42 | I have a large collection e.g. of books, CDs, videos etc. | rating | 2,1,0,0 | no |
| 43 | If there was a problem with the electrical wiring in my home, I’d be able to fix | rating | 2,1,0,0 | no |
| 44 | My clothes are not carefully organised into different types in my wardrobe. | rating | 0,0,1,2 | no |
| 45 | I rarely read articles or webpages about new technology. | rating | 0,0,1,2 | no |
| 46 | I can easily visualise how the motorways in my region link up. | rating | 2,1,0,0 | no |
| 47 | When an election is being held, I am not interested in the results for each cons | rating | 0,0,1,2 | no |
| 48 | I do not particularly enjoy learning about facts and figures in history. | rating | 0,0,1,2 | no |
| 49 | I do not tend to remember people's birthdays (in terms of which day and month th | rating | 0,0,1,2 | no |
| 50 | When I am walking in the country, I am curious about how the various kinds of tr | rating | 2,1,0,0 | no |
| 51 | I find it difficult to understand information the bank sends me on different inv | rating | 0,0,1,2 | no |
| 52 | If I were buying a camera, I would not look carefully into the quality of the le | rating | 0,0,1,2 | no |
| 53 | If I were buying a computer, I would want to know exact details about its hard d | rating | 2,1,0,0 | no |
| 54 | I do not read legal documents very carefully. | rating | 0,0,1,2 | no |
| 55 | When I get to the checkout at a supermarket I pack different categories of goods | rating | 2,1,0,0 | no |
| 56 | I do not follow any particular system when I'm cleaning at home. | rating | 0,0,1,2 | no |
| 57 | I do not enjoy in-depth political discussions. | rating | 0,0,1,2 | no |
| 58 | I am not very meticulous when I carry out D.I.Y or home improvements. | rating | 0,0,1,2 | no |
| 59 | I would not enjoy planning a business from scratch to completion. | rating | 0,0,1,2 | no |
| 60 | If I were buying a stereo, I would want to know about its precise technical feat | rating | 2,1,0,0 | no |
| 61 | I tend to keep things that other people might throw away, in case they might be  | rating | 2,1,0,0 | no |
| 62 | I avoid situations which I can not control. | rating | 2,1,0,0 | no |
| 63 | I do not care to know the names of the plants I see. | rating | 0,0,1,2 | no |
| 64 | When I hear the weather forecast, I am not very interested in the meteorological | rating | 0,0,1,2 | no |
| 65 | It does not bother me if things in the house are not in their proper place. | rating | 0,0,1,2 | no |
| 66 | In maths, I am intrigued by the rules and patterns governing numbers. | rating | 2,1,0,0 | no |
| 67 | I find it difficult to learn my way around a new city. | rating | 0,0,1,2 | no |
| 68 | I could list my favourite 10 books, recalling titles and authors' names from mem | rating | 2,1,0,0 | no |
| 69 | When I read the newspaper, I am drawn to tables of information, such as football | rating | 2,1,0,0 | no |
| 70 | When I’m in a plane, I do not think about the aerodynamics. | rating | 0,0,1,2 | no |
| 71 | I do not keep careful records of my household bills. | rating | 0,0,1,2 | no |
| 72 | When I have a lot of shopping to do, I like to plan which shops I am going to vi | rating | 2,1,0,0 | no |
| 73 | When I cook, I do not think about exactly how different methods and ingredients  | rating | 0,0,1,2 | no |
| 74 | When I listen to a piece of music, I always notice the way it’s structured. | rating | 2,1,0,0 | no |
| 75 | I could generate a list of my favourite 10 songs from memory, including the titl | rating | 2,1,0,0 | no |

## To research (fill from https://us.psytoolkit.org/survey-library/systemizing-arc.html)

- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands / interpretation.

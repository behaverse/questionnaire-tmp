"""Canonical classification vocabulary for the Library catalogue facets.

Single source of truth shared by the survey_db importer and the questionnaire-harvester
curation store, so the live Domain / Population filters use one clean, consistent vocabulary
across every catalogue entry.

- SCHEMA_DOMAIN: the schema-preferred domains (schemas/instrument/README.md).
- EXTENDED_DOMAIN: disciplined snake_case additions the corpus genuinely needs, each used by
  several instruments. Kept clean (lowercase snake_case, no prose phrases / casing dupes).
- SURVEY_DB_DOMAIN_MAP: maps the legacy survey_db free-text `topics` values onto the clean
  vocabulary; a None value means "not a real domain — drop from the domain facet" (the raw
  topic is preserved as a `tags` entry for provenance).
"""

SCHEMA_DOMAIN = {
    "anxiety", "cognition", "depression", "executive_function", "implicit_cognition",
    "memory", "mood", "personality", "quality_of_life", "screening",
    "self_efficacy", "social_psychology", "stress", "trauma", "wellbeing",
}

EXTENDED_DOMAIN = {
    # harvested corpus
    "addiction", "adhd", "aggression", "autism", "eating_disorders", "empathy",
    "impulsivity", "loneliness", "psychosis", "relationships", "resilience",
    "self_esteem", "sleep",
    # survey_db cognitive-psychology cluster
    "attention", "mind_wandering", "mindfulness",
}

PREFERRED_DOMAIN = SCHEMA_DOMAIN | EXTENDED_DOMAIN

PREFERRED_POPULATION = {
    "adults", "adolescents", "children", "older_adults", "clinical",
    "primary_care", "community", "pregnant", "perinatal", "veterans",
}

# Legacy survey_db `topics` free-text -> clean domain (keys are lowercased, stripped).
# None -> drop from the domain facet (study-context tag, not a psychological domain).
SURVEY_DB_DOMAIN_MAP = {
    # attention / mind-wandering cluster
    "attention": "attention",
    "attentional control": "attention",
    "attentional shifting": "attention",
    "attention lapse": "attention",
    "distraction": "attention",
    "distractibility": "attention",
    "failure of sustained attention": "attention",
    "false triggering": "attention",
    "mind wandering": "mind_wandering",
    "deliberate mind wandering": "mind_wandering",
    "spontaneous mind wandering": "mind_wandering",
    "absent-mindedness": "mind_wandering",
    "receptive state of mind": "mind_wandering",
    # cognition
    "cognition": "cognition",
    "cognitive complexity": "cognition",
    "cognitive instability": "cognition",
    "general cognitive ability": "cognition",
    "need for cognition": "cognition",
    "rational ability": "cognition",
    "rationality": "cognition",
    "rational engagement": "cognition",
    "experiential ability": "cognition",
    "experiential engagement": "cognition",
    "experientiality": "cognition",
    "sensitive awareness": "cognition",
    "dyslexia": "cognition",
    # executive function
    "executive control": "executive_function",
    "executive functions": "executive_function",
    "cognitive flexibility": "executive_function",
    "inhibition": "executive_function",
    # memory
    "memory failure": "memory",
    "forgetfulness": "memory",
    "cognitive failures": "memory",
    # impulsivity
    "impulsivity": "impulsivity",
    "premeditation": "impulsivity",
    "urgency": "impulsivity",
    "positive urgency": "impulsivity",
    # personality (traits, BIS/BAS + sensation-seeking facets, grit)
    "personality": "personality",
    "grit": "personality",
    "perseverance": "personality",
    "self-control": "personality",
    "sensation seeking": "personality",
    "novelty": "personality",
    "intensity": "personality",
    "drive": "personality",
    "fun seeking": "personality",
    "reward responsiveness": "personality",
    "behavioral approach system": "personality",
    "behavioral avoidance system": "personality",
    "risk": "personality",
    # mood / affect
    "positive and negative affect": "mood",
    "trait affect": "mood",
    "emotional regulation": "mood",
    # beliefs about ability
    "growth versus fixed mindset": "self_efficacy",
    # other clean mappings
    "anxiety": "anxiety",
    "depression": "depression",
    "adhd": "adhd",
    "mindfulness": "mindfulness",
    "sleepiness": "sleep",
    "insomnia": "sleep",
    "sleep": "sleep",
    "sleep disorder": "sleep",
    "well-being": "wellbeing",
    # study-context tags — not psychological domains (dropped from domain, kept as tags)
    "state": None,
    "disorders": None,
    "debrief": None,
    "demographics": None,
    "feedback": None,
    "handedness": None,
    "income": None,
    "occupation": None,
    "language": None,
    "media": None,
    "multimedia": None,
    "sport": None,
    "education": None,
    "video game playing": None,
}


def normalize_domain_value(raw):
    """Map one raw domain string to its clean vocabulary value, or None to drop it.
    Already-clean values (in PREFERRED_DOMAIN) pass through; mapped legacy values are
    rewritten; unknown values are dropped (kept elsewhere as a tag)."""
    key = (raw or "").strip().lower()
    if key in SURVEY_DB_DOMAIN_MAP:
        return SURVEY_DB_DOMAIN_MAP[key]
    if key in PREFERRED_DOMAIN:
        return key
    return None


def normalize_survey_db_domains(raw_domains):
    """Normalize a list of raw survey_db topic strings to a clean, de-duplicated domain list
    (order preserved; unmapped / dropped values removed)."""
    out = []
    for raw in raw_domains or []:
        v = normalize_domain_value(raw)
        if v and v not in out:
            out.append(v)
    return out

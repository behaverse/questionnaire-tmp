from harvester.naming import derive_short_title

def test_derive_short_title():
    assert derive_short_title("Hare Psychopathy Checklist (Original) (PCL-22)") == "PCL-22"
    assert derive_short_title("Clinical Impairment Assessment Questionnaire (CIA 3.0)") == "CIA"
    assert derive_short_title("The Obsessive–Compulsive Inventory (short version, OCI-R)") == "OCI-R"
    assert derive_short_title("Short Grit Scale (Grit-S)") == "Grit-S"
    assert derive_short_title("Autism Spectrum Quotient (AQ)") == "AQ"
    assert derive_short_title("Patient Health Questionnaire-9 (PHQ-9)") == "PHQ-9"
    assert derive_short_title("The WHO-5 Well-Being Index") == "WHO-5"
    assert derive_short_title("Aggressive behavior scale (for adolescents)") == "Aggressive behavior scale"
    assert derive_short_title("Systemizing Quotient") == "Systemizing Quotient"

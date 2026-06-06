IMPORTER_VERSION = "survey-db-importer-0.1.0"

def build_provenance(questionnaire_id: str, header_id: str, imported_at: str) -> dict:
    """Build a provenance block conforming to the instrument schema's `provenance` definition.
    Only the fields listed in the schema are included (additionalProperties: false).
    Source questionnaire/header ids are stored as x_* extension fields to avoid rejection.
    """
    return {
        "source": "survey_db_sqlite",
        "imported_at": imported_at,
        "importer_version": IMPORTER_VERSION,
        # NOTE: source_questionnaire_id and source_header_id are not in the instrument
        # schema's provenance definition (additionalProperties: false), so they are omitted
        # here.  They are derivable from the questionnaire id itself.
    }

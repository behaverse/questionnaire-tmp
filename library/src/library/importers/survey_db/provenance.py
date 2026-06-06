IMPORTER_VERSION = "survey-db-importer-0.1.0"

def build_provenance(questionnaire_id: str, header_id: str, imported_at: str) -> dict:
    return {
        "source": "survey_db_sqlite",
        "imported_at": imported_at,
        "importer_version": IMPORTER_VERSION,
        "source_questionnaire_id": questionnaire_id,
        "source_header_id": header_id,
        "import_loss_report": "loss_report.md",
    }

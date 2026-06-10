import psycopg
from psycopg.types.json import Jsonb


def insert_deployment(conn: psycopg.Connection, deployment_id: str, questionnaire_ref: str,
                      runtime_policy: dict, default_locale: str, available_locales: list[str],
                      theme_id: str | None) -> None:
    conn.execute(
        "INSERT INTO deployment (deployment_id, questionnaire_ref, runtime_policy, "
        "default_locale, available_locales, theme_id) VALUES (%s,%s,%s,%s,%s,%s)",
        (deployment_id, questionnaire_ref, Jsonb(runtime_policy), default_locale,
         Jsonb(available_locales), theme_id),
    )
    conn.commit()


def get_deployment(conn: psycopg.Connection, deployment_id: str) -> dict | None:
    row = conn.execute(
        "SELECT deployment_id, questionnaire_ref, runtime_policy, default_locale, "
        "available_locales, theme_id FROM deployment WHERE deployment_id=%s",
        (deployment_id,)).fetchone()
    if row is None:
        return None
    cols = ["deployment_id", "questionnaire_ref", "runtime_policy", "default_locale",
            "available_locales", "theme_id"]
    return dict(zip(cols, row))

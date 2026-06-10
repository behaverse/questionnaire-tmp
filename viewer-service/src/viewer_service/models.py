from pydantic import BaseModel


class DeploymentCreate(BaseModel):
    questionnaire_ref: str
    runtime_policy: dict
    default_locale: str
    available_locales: list[str]
    theme_id: str | None = None


class RuntimeRequest(BaseModel):
    viewer_id: str
    viewer_version: str
    locale: str | None = None

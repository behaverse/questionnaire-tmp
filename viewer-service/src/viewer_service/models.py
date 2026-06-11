from datetime import datetime
from pydantic import BaseModel


class DeploymentCreate(BaseModel):
    questionnaire_ref: str
    runtime_policy: dict
    default_locale: str
    available_locales: list[str]
    mode_preset: str = "anonymous_link"
    theme_id: str | None = None
    active_from: datetime | None = None
    active_until: datetime | None = None
    quota: dict | None = None
    style_overrides: dict | None = None
    flow_overrides: dict | None = None
    redirect_url: str | None = None
    confirmation_message: dict | None = None
    randomization_seed_strategy: str = "per_session"
    channels: dict | None = None
    created_by: str | None = None
    consent_text_ref: str | None = None


class DeploymentPatch(BaseModel):
    active_until: datetime | None = None
    quota: dict | None = None


class RuntimeRequest(BaseModel):
    viewer_id: str
    viewer_version: str
    locale: str | None = None


class SessionNew(BaseModel):
    deployment_id: str
    viewer_id: str
    viewer_version: str
    locale: str | None = None


class LocaleSwitch(BaseModel):
    locale: str

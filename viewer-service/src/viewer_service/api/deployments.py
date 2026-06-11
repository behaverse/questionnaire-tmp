import uuid
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from denormaliser import RuntimePolicy
from .deps import get_conn
from ..models import DeploymentCreate, DeploymentPatch
from ..modes import resolve_preset, UnsupportedPreset
from ..store import deployments as store

router = APIRouter()

_DEFAULT_CHANNELS = {"rt": True, "mouse": False, "keyboard": False, "webcam": False, "microphone": False}
_ALLOWED_STYLE = {"progress_bar", "question_numbering"}
_ALLOWED_FLOW = {"max_time_seconds"}


@router.post("/deployments", status_code=201)
def create(body: DeploymentCreate, conn=Depends(get_conn)):
    try:
        dimensions = resolve_preset(body.mode_preset)
    except UnsupportedPreset:
        return JSONResponse(status_code=422, content={"error": {
            "code": "unsupported_preset",
            "message": f"mode_preset '{body.mode_preset}' requires Identity/Platform/host integration, not yet available"}})
    if body.style_overrides and set(body.style_overrides) - _ALLOWED_STYLE:
        return JSONResponse(status_code=422, content={"error": {
            "code": "instrument_only_override", "message": "style_overrides may only set: progress_bar, question_numbering"}})
    if body.flow_overrides and set(body.flow_overrides) - _ALLOWED_FLOW:
        return JSONResponse(status_code=422, content={"error": {
            "code": "instrument_only_override", "message": "flow_overrides may only set: max_time_seconds"}})
    try:
        policy = RuntimePolicy(**body.runtime_policy).to_canonical_dict()
    except TypeError as e:
        return JSONResponse(status_code=422, content={
            "error": {"code": "invalid", "message": f"invalid runtime_policy: {e}"}})

    deployment_id = "dep_" + uuid.uuid4().hex[:8]
    store.insert_deployment(
        conn, deployment_id=deployment_id, questionnaire_ref=body.questionnaire_ref,
        runtime_policy=policy, default_locale=body.default_locale,
        available_locales=body.available_locales, theme_id=body.theme_id,
        mode_preset=body.mode_preset, dimensions=dimensions, active_from=body.active_from,
        active_until=body.active_until, quota=body.quota, style_overrides=body.style_overrides,
        flow_overrides=body.flow_overrides, redirect_url=body.redirect_url,
        confirmation_message=body.confirmation_message,
        randomization_seed_strategy=body.randomization_seed_strategy,
        channels=body.channels or _DEFAULT_CHANNELS, created_by=body.created_by,
        consent_text_ref=body.consent_text_ref)
    return {"deployment_id": deployment_id}


@router.get("/deployments")
def list_(conn=Depends(get_conn)):
    return {"items": store.list_deployments(conn)}


@router.get("/deployments/{deployment_id}")
def get(deployment_id: str, conn=Depends(get_conn)):
    dep = store.get_deployment(conn, deployment_id)
    if dep is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    return dep


@router.patch("/deployments/{deployment_id}")
def patch(deployment_id: str, body: DeploymentPatch, conn=Depends(get_conn)):
    kwargs = {}
    if "active_until" in body.model_fields_set:
        kwargs["active_until"] = body.active_until
    if "quota" in body.model_fields_set:
        kwargs["quota"] = body.quota
    ok = store.patch_deployment(conn, deployment_id, **kwargs)
    if not ok:
        raise HTTPException(status_code=404, detail="deployment not found")
    return {"deployment_id": deployment_id}

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from ..config import get_settings
from ..observability import init_sentry

_CODE_FOR = {400: "bad_request", 401: "unauthorized", 404: "not_found", 410: "gone",
             422: "unprocessable", 502: "upstream_unavailable", 503: "service_unavailable"}


def create_app() -> FastAPI:
    init_sentry("viewer-service")
    from . import viewers, deployments, runtime, admin, sessions, submission, export, themes, metrics, scorers, scoring, invites as invites_routes, me as me_routes, catalogue as catalogue_routes, comments as comments_routes, recordings as recordings_routes, replay as replay_routes, internal
    s = get_settings()
    # Interactive docs / OpenAPI schema are OFF unless ENABLE_DOCS is set (don't advertise the
    # full API surface publicly in production).
    docs = {} if s.enable_docs else {"docs_url": None, "redoc_url": None, "openapi_url": None}
    app = FastAPI(title="Questionnaire Viewer Service", version="v1", **docs)
    origins = list(s.cors_origins)
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    app.include_router(viewers.router, prefix="/v1")
    app.include_router(deployments.router, prefix="/v1")
    app.include_router(runtime.router, prefix="/v1")
    app.include_router(admin.router, prefix="/v1")
    app.include_router(sessions.router, prefix="/v1")
    app.include_router(submission.router, prefix="/v1")
    app.include_router(export.router, prefix="/v1")
    app.include_router(themes.router, prefix="/v1")
    app.include_router(metrics.router, prefix="/v1")
    app.include_router(scorers.router, prefix="/v1")
    app.include_router(scoring.router, prefix="/v1")
    app.include_router(invites_routes.router, prefix="/v1")
    app.include_router(me_routes.router, prefix="/v1")
    app.include_router(catalogue_routes.router, prefix="/v1")
    app.include_router(comments_routes.router, prefix="/v1")
    app.include_router(recordings_routes.router, prefix="/v1")
    app.include_router(replay_routes.router, prefix="/v1")
    app.include_router(internal.router)

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    @app.exception_handler(HTTPException)
    async def _http_exc(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": _CODE_FOR.get(exc.status_code, "error"),
                               "message": str(exc.detail)}},
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_exc(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "unprocessable", "message": "validation error",
                               "detail": jsonable_encoder(exc.errors())}},
        )

    return app

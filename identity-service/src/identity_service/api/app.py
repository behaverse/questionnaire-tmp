from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from ..config import get_settings
from ..observability import init_sentry

_CODE_FOR = {400: "bad_request", 401: "unauthorized", 403: "forbidden",
             404: "not_found", 409: "conflict", 422: "unprocessable"}


def create_app() -> FastAPI:
    init_sentry("identity-service")
    s = get_settings()
    # Interactive docs / OpenAPI schema are OFF unless ENABLE_DOCS is set — don't publicly
    # advertise the full auth API surface (and its example payloads) in production.
    docs = {} if s.enable_docs else {"docs_url": None, "redoc_url": None, "openapi_url": None}
    app = FastAPI(title="Questionnaire Identity Service", version="v1", **docs)
    origins = list(s.cors_origins)
    if origins:
        app.add_middleware(CORSMiddleware, allow_origins=origins,
                           allow_methods=["*"], allow_headers=["*"])

    from . import auth as auth_routes, wellknown, admin as admin_routes, internal
    app.include_router(auth_routes.router)
    app.include_router(wellknown.router)
    app.include_router(admin_routes.router)
    app.include_router(internal.router)

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    @app.exception_handler(HTTPException)
    async def _http_exc(request: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, dict) and "code" in detail and "message" in detail:
            return JSONResponse(status_code=exc.status_code,
                content={"error": {"code": detail["code"], "message": detail["message"]}})
        return JSONResponse(status_code=exc.status_code,
            content={"error": {"code": _CODE_FOR.get(exc.status_code, "error"),
                               "message": str(detail)}})

    @app.exception_handler(RequestValidationError)
    async def _validation_exc(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422,
            content={"error": {"code": "unprocessable", "message": "validation error",
                               "detail": jsonable_encoder(exc.errors())}})

    return app

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from . import questionnaires, entities, search, community
from ..config import get_settings

_CODE_FOR = {400: "bad_request", 401: "unauthorized", 403: "forbidden",
             404: "not_found", 410: "gone", 422: "unprocessable"}

def create_app() -> FastAPI:
    s = get_settings()
    # Interactive docs / OpenAPI schema OFF unless ENABLE_DOCS is set.
    docs = {} if s.enable_docs else {"docs_url": None, "redoc_url": None, "openapi_url": None}
    app = FastAPI(title="Questionnaire Library", version="v1", **docs)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(s.cors_origins),
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    app.include_router(questionnaires.router, prefix="/v1")
    app.include_router(entities.router, prefix="/v1")
    app.include_router(search.router, prefix="/v1")
    app.include_router(community.router, prefix="/v1")

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

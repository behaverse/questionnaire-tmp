from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from . import questionnaires, entities, search

_CODE_FOR = {400: "bad_request", 404: "not_found", 410: "gone", 422: "unprocessable"}

def create_app() -> FastAPI:
    app = FastAPI(title="Questionnaire Library", version="v1")
    app.include_router(questionnaires.router, prefix="/v1")
    app.include_router(entities.router, prefix="/v1")
    app.include_router(search.router, prefix="/v1")

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

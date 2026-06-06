from fastapi import FastAPI
from . import questionnaires

def create_app() -> FastAPI:
    app = FastAPI(title="Questionnaire Library", version="v1")
    app.include_router(questionnaires.router, prefix="/v1")

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    return app

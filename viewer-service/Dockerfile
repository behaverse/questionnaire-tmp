# viewer-service/Dockerfile
# Build from the repo root:  docker build -f viewer-service/Dockerfile -t vs .
FROM python:3.12-slim
WORKDIR /app
COPY . /app
RUN pip install --no-cache-dir ./questionnaire-runtime-denormaliser ./identity-service ./viewer-service
ENV PORT=8001 \
    SCHEMAS_DIR=/app/schemas \
    VS_SCORER_DIR=/app/questionnaire-scorer/dist-wasm
EXPOSE 8001
CMD ["sh", "-c", "uvicorn viewer_service.api.app:create_app --factory --host 0.0.0.0 --port ${PORT}"]

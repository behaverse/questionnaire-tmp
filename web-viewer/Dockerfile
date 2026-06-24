# web-viewer/Dockerfile  (build context = repo root)
FROM node:24-slim AS build
WORKDIR /app

# Install dependencies for the web-viewer
COPY web-viewer/package*.json ./web-viewer/
RUN cd web-viewer && npm ci

# Install dependencies for participant-session (peer React types needed by tsc)
COPY participant-session/package*.json ./participant-session/
RUN cd participant-session && npm ci

# Copy sibling packages needed by prebuild scripts and vite aliases
COPY questionnaire-scorer/host/src/ ./questionnaire-scorer/host/src/
COPY questionnaire-scorer/dist-wasm/ ./questionnaire-scorer/dist-wasm/
COPY questionnaire-expression-evaluator/web/pkg-web/ ./questionnaire-expression-evaluator/web/pkg-web/
COPY participant-session/src/ ./participant-session/src/

# Copy web-viewer source
COPY web-viewer/ ./web-viewer/

# Run prebuild step 1: vendor scorerHost.ts (pure file ops, no Rust needed)
RUN cd web-viewer && node scripts/build-scorer-host.mjs

# Fail loud if the vendored evaluator wasm is missing from the build context
# (these artifacts are tracked in git so a clean checkout builds without Rust/wasm-pack)
RUN test -f questionnaire-expression-evaluator/web/pkg-web/questionnaire_expr_web_bg.wasm || \
    (echo 'ERROR: pre-built evaluator wasm missing from build context (run: cd questionnaire-expression-evaluator/web && wasm-pack build --target web --out-dir pkg-web)' && exit 1)

# Run prebuild step 2: copy the pre-built wasm artifacts into place (skip wasm-pack rebuild)
RUN mkdir -p web-viewer/src/logic/wasm web-viewer/public/scorers && \
    cp questionnaire-expression-evaluator/web/pkg-web/questionnaire_expr_web.js web-viewer/src/logic/wasm/ && \
    cp questionnaire-expression-evaluator/web/pkg-web/questionnaire_expr_web.d.ts web-viewer/src/logic/wasm/ && \
    cp questionnaire-expression-evaluator/web/pkg-web/questionnaire_expr_web_bg.wasm web-viewer/src/logic/wasm/ && \
    cp questionnaire-expression-evaluator/web/pkg-web/questionnaire_expr_web_bg.wasm.d.ts web-viewer/src/logic/wasm/ && \
    cp web-viewer/manifest.json web-viewer/public/manifest.json && \
    cp questionnaire-scorer/dist-wasm/phq9.wasm web-viewer/public/scorers/phq9.wasm

ARG VITE_VS_BASE_URL
ARG VITE_IDENTITY_BASE_URL

# TypeScript check + vite build (manually, skipping the prebuild npm hooks)
RUN cd web-viewer && \
    ./node_modules/.bin/tsc -b && \
    ./node_modules/.bin/vite build

FROM nginx:1.27-alpine
COPY web-viewer/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/web-viewer/dist /usr/share/nginx/html
EXPOSE 80

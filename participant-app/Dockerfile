# participant-app/Dockerfile  (build context = repo root)
FROM node:24-slim AS build
WORKDIR /app

# Install dependencies for the participant-app
COPY participant-app/package*.json ./participant-app/
RUN cd participant-app && npm ci

# Install dependencies for participant-session (peer React types needed by tsc)
COPY participant-session/package*.json ./participant-session/
RUN cd participant-session && npm ci

# Copy participant-session source (shared auth/session layer)
COPY participant-session/src/ ./participant-session/src/

# Copy participant-app source
COPY participant-app/ ./participant-app/

ARG VITE_VS_BASE_URL
ARG VITE_IDENTITY_BASE_URL
ARG VITE_PLAYER_BASE_URL

# TypeScript check + vite build
RUN cd participant-app && npm run build

FROM nginx:1.27-alpine
COPY participant-app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/participant-app/dist /usr/share/nginx/html
EXPOSE 80

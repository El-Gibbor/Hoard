# syntax=docker/dockerfile:1
# Hoard web image. Build from the repository root: docker build -t hoard-web frontend
# Stages: build (Vite bundle) -> runtime (nginx serving the bundle and proxying /api)

# ---------- Stage 1: build the static bundle ----------
# Same pinned Node image as the API, so both images build on an identical base
FROM node:22.23.5-bookworm-slim@sha256:e9f565d32859f0cbfb52125eafe8be39390f24dac302dc3cdf566e8ba3ab21ee AS build

# All later paths are relative to the frontend app folder
WORKDIR /app

# Manifests first, so dependencies are cached until one of them changes
COPY package.json package-lock.json ./

# Clean install from the lockfile; the cache mount speeds up rebuilds without growing the layer
RUN --mount=type=cache,target=/root/.npm npm ci

# Only the files the build reads, so local node_modules, dist and .env never enter the image
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src

# Empty by default so the app calls /api on its own origin; declared after npm ci to keep that layer cached
ARG VITE_API_URL=""

# Type-check and bundle into dist/; Vite bakes VITE_API_URL into the JavaScript
RUN VITE_API_URL="$VITE_API_URL" npm run build

# ---------- Stage 2: runtime (default target) ----------
# Exact version plus digest; this nginx build runs as a non-root user and listens on 8080
FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime

# Alpine fixes reach the repositories before a new base image is published
USER root
RUN apk upgrade --no-cache

# Replaces the default site with SPA routing, caching rules and the /api proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Only the built bundle is copied forward; Node and the source stay in the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# The base image already uses this uid; stated here so the non-root user is explicit
USER 101

# Documents the port nginx listens on
EXPOSE 8080

# Docker marks the container unhealthy if nginx stops answering; busybox wget ships with alpine
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/healthz"]

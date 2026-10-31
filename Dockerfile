# syntax=docker/dockerfile:1
# Hoard API image. Build from the repository root: docker build -t hoard-api .

# ---------- Stage 1: install dependencies ----------
# Exact version plus digest, so every build starts from the same base image
FROM node:22.23.4-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS deps

# All later paths are relative to the backend app folder
WORKDIR /app

# Prisma only reads this to load its config during `prisma generate`; nothing connects to it
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

# Manifests and Prisma files first, so dependencies are cached until one of these changes
COPY backend/package.json backend/package-lock.json backend/prisma.config.ts ./
COPY backend/prisma ./prisma

# Clean install from the lockfile; the postinstall script generates the Prisma client
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- Stage 2: compile TypeScript ----------
FROM deps AS build

# Application source and compiler settings, copied after dependencies so code edits keep the install cached
COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src ./src

# Compile to dist/, then drop dev dependencies so only runtime packages are copied forward
RUN npm run build && npm prune --omit=dev

# ---------- Stage 3: runtime ----------
# Same base as the build stages, so the compiled bcrypt binary stays compatible
FROM node:22.23.4-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da AS runtime

# Production mode for Express and Node libraries; the API listens on 4000
ENV NODE_ENV=production \
    PORT=4000

WORKDIR /app

# Only what the API needs at runtime, owned by the unprivileged node user from the base image
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

# Drop root privileges for everything that runs from here on
USER node

# Documents the port the API listens on
EXPOSE 4000

# Docker marks the container unhealthy if /api/health stops answering; Node's fetch avoids installing curl
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# Exec form, so Node receives stop signals directly and shuts down cleanly
CMD ["node", "dist/server.js"]

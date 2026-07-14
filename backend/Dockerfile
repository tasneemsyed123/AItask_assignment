# backend/Dockerfile
# ------------------------------------------------------------------------
# Multi-stage build: install deps once, compile TypeScript in a throwaway
# stage, then ship only production dependencies + compiled JS. Keeps the
# final image free of devDependencies, TypeScript, and source .ts files.
#
# Build from the `backend/` directory:  docker build -t ai-task-platform-backend .

# ---- deps: install ALL dependencies once (cached as long as the lockfile
# doesn't change), shared by the build stage below ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: compile TypeScript with the full (dev+prod) dependency set ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- production: only prod deps + compiled output, non-root user ----
FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# logger.ts resolves its log directory as ../../../logs relative to the
# compiled file (dist/utils/logger.js -> /logs at the image root), matching
# the monorepo-relative path used in local dev (project/logs). Pre-create it
# and hand ownership to the non-root user before dropping root, since it
# won't have permission to mkdir at the filesystem root itself.
RUN mkdir -p /logs && chown node:node /logs

# node:20-alpine ships a built-in unprivileged `node` user (uid 1000) -
# reuse it instead of creating a new one.
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/server.js"]

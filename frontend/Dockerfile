# frontend/Dockerfile
# ------------------------------------------------------------------------
# Multi-stage build using Next.js's `output: standalone` (next.config.js) -
# the builder stage traces the exact runtime dependency subset needed, so
# the final image ships neither devDependencies nor the full node_modules.
#
# Build from the `frontend/` directory:  docker build -t ai-task-platform-frontend .
#
# NEXT_PUBLIC_* variables are inlined into the client JS bundle at BUILD
# time, not read at container runtime - they must be passed as a build ARG,
# not a runtime environment variable. Since the browser (not the container)
# is what actually calls the backend, this must be the backend's
# HOST-mapped URL (e.g. http://localhost:4000/api/v1), never the internal
# Docker network service name - the browser can't resolve that.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1

# ---- deps: install ALL dependencies once, shared by the builder stage ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: production Next.js build ----
FROM node:20-alpine AS builder
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: standalone server only, non-root user ----
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Next.js's own convention for the standalone image: a dedicated unprivileged
# group/user rather than reusing node-alpine's built-in `node` user. Alpine's
# BusyBox addgroup/adduser use short flags, not GNU long-option syntax.
RUN addgroup -S -g 1001 nodejs \
  && adduser -S -D -H -u 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Uncomment if/when a frontend/public directory is added:
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
# The standalone server binds to this host - 0.0.0.0 is required so it's
# reachable from outside the container via the published port mapping.
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]

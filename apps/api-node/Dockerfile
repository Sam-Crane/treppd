# Multi-stage Dockerfile for NestJS API in Turborepo monorepo
# Built from the repo root context (docker-compose uses context: .)

# --- Dependencies stage (full, for building) ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/api-node/package.json ./apps/api-node/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN npm ci --workspaces --include-workspace-root

# --- Production dependencies stage (for the runner, no devDeps) ---
FROM node:20-alpine AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/api-node/package.json ./apps/api-node/
COPY packages/shared-types/package.json ./packages/shared-types/

# --ignore-scripts skips the root `prepare: husky` hook (husky is a devDep
# that's excluded here, and git hooks aren't useful inside a container anyway).
RUN npm ci --workspaces --include-workspace-root --omit=dev --ignore-scripts

# --- Builder stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json /app/turbo.json ./
COPY packages ./packages
COPY apps/api-node ./apps/api-node
# Workspace-local node_modules hold deps that weren't hoisted (e.g. @nestjs/cli,
# jose). Copy after the source COPYs so they aren't clobbered (source COPYs
# respect .dockerignore and exclude node_modules, so this is safe).
COPY --from=deps /app/apps/api-node/node_modules ./apps/api-node/node_modules

WORKDIR /app/apps/api-node
RUN npm run build

# --- Runner stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache wget \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nestjs

# Preserve the monorepo layout so Node's module resolution walks both
# /app/apps/api-node/node_modules (workspace-local, e.g. jose) and
# /app/node_modules (hoisted) when resolving requires from dist/.
COPY --from=builder --chown=nestjs:nodejs /app/apps/api-node/dist ./apps/api-node/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api-node/package.json ./apps/api-node/
COPY --from=prod-deps --chown=nestjs:nodejs /app/package.json /app/package-lock.json ./
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nestjs:nodejs /app/apps/api-node/node_modules ./apps/api-node/node_modules

USER nestjs
WORKDIR /app/apps/api-node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/main"]

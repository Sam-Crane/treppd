# Multi-stage Dockerfile for NestJS API in Turborepo monorepo
# Built from the repo root context (docker-compose uses context: .)

# --- Dependencies stage ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY apps/api-node/package.json ./apps/api-node/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN npm ci --workspaces --include-workspace-root

# --- Builder stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/package-lock.json /app/turbo.json ./
COPY packages ./packages
COPY apps/api-node ./apps/api-node

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

COPY --from=builder --chown=nestjs:nodejs /app/apps/api-node/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api-node/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/api-node/node_modules ./node_modules

USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/main"]

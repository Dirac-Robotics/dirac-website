# syntax=docker/dockerfile:1

# ── deps ──────────────────────────────────────────────────────────────────────
# Install production + build dependencies from a reproducible lockfile.
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
# The committed lockfile resolves tarballs against an internal Microsoft npm
# proxy (ms-feed-*.pkgs.visualstudio.com/.../npm/registry/...) that CI cannot
# reach. Rewrite those URLs to the public registry. The package versions and
# integrity hashes are identical, so `npm ci` stays deterministic.
RUN sed -i -E 's#https://[^"]+/npm/registry/#https://registry.npmjs.org/#g' package-lock.json \
  && npm config set registry https://registry.npmjs.org/ \
  && npm ci --no-audit --no-fund

# ── builder ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# lib/env.ts validates required env at import time and throws if anything is
# missing, which would fail `next build`. The home/leaderboard pages are
# force-dynamic, so no real DB/network access happens during the build. These
# placeholders only satisfy the schema. Real values are supplied at RUNTIME by
# the container host and are NOT baked into the image (no NEXT_PUBLIC_* here).
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    DATABASE_URL=postgres://build:build@localhost:5432/build \
    AUTH_SECRET=build-time-placeholder \
    ACS_CONNECTION_STRING=endpoint=https://build.communication.azure.com/;accesskey=build \
    EMAIL_FROM=build@example.com \
    ADMIN_NOTIFY_EMAIL=build@example.com \
    AZURE_STORAGE_ACCOUNT=buildplaceholder \
    AZURE_STORAGE_KEY=YnVpbGQ= \
    AZURE_STORAGE_CONTAINER=media \
    SITE_URL=http://localhost:3000

RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone output ships a minimal server; static assets and public/ are copied
# alongside it.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# server.js is emitted by Next's standalone output.
CMD ["node", "server.js"]

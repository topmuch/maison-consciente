# ═══════════════════════════════════════════════════════════════
# MAISON CONSCIENTE — Production Dockerfile
# Multi-stage build: deps → build → runtime (standalone)
# Optimized for Coolify / Docker Compose
# ═══════════════════════════════════════════════════════════════

# ── Stage 1: Dependencies ──────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json bun.lock* ./
# Install production dependencies only for runtime
RUN npm install --omit=dev && mv node_modules prod_node_modules
# Install ALL dependencies (including dev) for build
RUN npm install

# ── Stage 2: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx next build

# Copy static assets into standalone output
RUN cp -r .next/static .next/standalone/.next/
RUN cp -r public .next/standalone/

# ── Stage 3: Runtime ───────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install PostgreSQL client for Prisma migrations
RUN apk add --no-cache postgresql-client

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=deps /app/prod_node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
# Copy static + public assets
COPY --from=builder /app/.next/standalone/.next ./.next
COPY --from=builder /app/.next/standalone/public ./public
# Copy Prisma schema + migrations for runtime
COPY --from=builder /app/prisma ./prisma
# Copy package.json for prisma CLI
COPY --from=builder /app/package.json ./package.json
# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Give nextjs user write access for SQLite fallback
RUN mkdir -p /app/db && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Health check (Coolify compatible)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]

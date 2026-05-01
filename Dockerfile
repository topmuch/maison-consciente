# --------- Maison Consciente — Dockerfile for Coolify (git clone) ---------
FROM node:20-alpine

RUN apk add --no-cache git libc6-compat sqlite wget curl
RUN npm install -g bun

WORKDIR /app

RUN git clone https://github.com/topmuch/maison-consciente .

RUN bun install --frozen-lockfile

RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/custom.db

RUN bun run build

# Copier les assets statiques dans le standalone (sinon Bad Gateway)
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public && \
    mkdir -p /app/data

# Copier Prisma + entrypoint dans le standalone
RUN cp -r prisma .next/standalone/prisma && \
    cp -r node_modules/.prisma .next/standalone/node_modules/.prisma && \
    cp -r node_modules/@prisma .next/standalone/node_modules/@prisma && \
    cp -r node_modules/prisma .next/standalone/node_modules/prisma && \
    cp docker-entrypoint.sh .next/standalone/docker-entrypoint.sh

EXPOSE 3000

# Démarrage depuis le dossier standalone
WORKDIR /app/.next/standalone
CMD sh -c "mkdir -p /app/data && export DATABASE_URL=file:/app/data/custom.db && export PORT=${PORT:-3000} && export HOSTNAME=0.0.0.0 && npx prisma db push --skip-generate 2>/dev/null || true && chmod +x docker-entrypoint.sh && ./docker-entrypoint.sh"

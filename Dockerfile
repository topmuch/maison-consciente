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
# Skip TypeScript checking at build (already validated locally — avoids OOM in Docker)
ENV NEXT_IGNORE_TS_ERRORS=true

RUN bun run build

# Copier les assets statiques dans le standalone (sinon Bad Gateway)
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public && \
    mkdir -p /app/data

# Copier Prisma + seed + entrypoint dans le standalone
RUN cp -r prisma .next/standalone/prisma && \
    cp -r node_modules/.prisma .next/standalone/node_modules/.prisma && \
    cp -r node_modules/@prisma .next/standalone/node_modules/@prisma && \
    cp -r node_modules/prisma .next/standalone/node_modules/prisma && \
    cp -r node_modules/argon2 .next/standalone/node_modules/argon2 && \
    cp -r node_modules/@phc/password-hasher .next/standalone/node_modules/@phc 2>/dev/null || true && \
    cp -r node_modules/@phc/password-hasher .next/standalone/node_modules/@phc/password-hasher 2>/dev/null || true && \
    cp -r node_modules/encode-uri .next/standalone/node_modules/encode-uri 2>/dev/null || true && \
    cp seed-superadmin.js .next/standalone/seed-superadmin.js && \
    cp docker-entrypoint.sh .next/standalone/docker-entrypoint.sh && \
    chmod +x .next/standalone/docker-entrypoint.sh

EXPOSE 3000

# Démarrage depuis le dossier standalone
WORKDIR /app/.next/standalone
CMD ["sh", "./docker-entrypoint.sh"]

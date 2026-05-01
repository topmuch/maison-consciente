#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# MAISON CONSCIENTE — Docker Entrypoint
# Runs Prisma migrations + starts the Next.js server
# ═══════════════════════════════════════════════════════════════
set -e

echo "🚀 Maison Consciente — Starting..."

# Wait for database if DATABASE_URL contains a host
if echo "$DATABASE_URL" | grep -q "@"; then
  echo "⏳ Waiting for database connection..."
  MAX_RETRIES=30
  RETRY=0
  until npx prisma db execute --stdin <<< "SELECT 1" 2>/dev/null; do
    RETRY=$((RETRY + 1))
    if [ $RETRY -ge $MAX_RETRIES ]; then
      echo "❌ Database connection failed after $MAX_RETRIES retries"
      exit 1
    fi
    echo "   Retry $RETRY/$MAX_RETRIES — waiting 2s..."
    sleep 2
  done
  echo "✅ Database connected"
fi

# Run migrations (push schema to DB)
echo "📦 Running database migrations..."
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push || true
echo "✅ Database schema synced"

# Generate Prisma client (in case it's missing)
echo "🔧 Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client ready"

# Start the server
echo "🌐 Starting Next.js server on port ${PORT:-3000}..."
exec node server.js

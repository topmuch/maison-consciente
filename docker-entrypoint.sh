#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# Maison Consciente — Docker Entrypoint
# ═══════════════════════════════════════════════════════════════

echo "🚀 Maison Consciente — Starting..."

mkdir -p /app/data
export DATABASE_URL="file:/app/data/custom.db"
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"

# Sync DB schema
echo "📦 Syncing database schema..."
npx prisma db push --skip-generate 2>&1
echo "✅ Database ready"

# Start Next.js in background
echo "🌐 Starting Next.js on port ${PORT}..."
node server.js &
SERVER_PID=$!

# Wait for server to be ready (max 60s)
echo "⏳ Waiting for server..."
READY=0
for i in $(seq 1 60); do
  if wget -q --spider http://localhost:${PORT}/api/health 2>/dev/null; then
    READY=1
    echo "✅ Server ready after ${i}s"
    break
  fi
  sleep 1
done

if [ "$READY" = "1" ]; then
  # Seed SuperAdmin via API
  echo "🔑 Seeding SuperAdmin..."
  SEED_RESULT=$(wget -q --post-data='' \
    --header="Content-Type: application/json" \
    --header="x-admin-seed-secret: ${ADMIN_SEED_SECRET:-maison-seed-2025}" \
    -O - \
    http://localhost:${PORT}/api/seed-admin 2>&1)
  echo "📋 Seed result: ${SEED_RESULT}"
else
  echo "⚠️ Server not ready after 60s, skipping seed"
fi

echo "✅ Startup complete"

# Keep container alive with the server
wait $SERVER_PID

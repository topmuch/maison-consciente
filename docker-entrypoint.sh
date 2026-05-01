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
npx prisma db push --skip-generate 2>&1 || echo "⚠️ Prisma push warning"
echo "✅ Database ready"

# Start Next.js in background
echo "🌐 Starting Next.js on port ${PORT}..."
node server.js &
SERVER_PID=$!

# Wait for server to be ready (max 30s)
echo "⏳ Waiting for server..."
for i in $(seq 1 30); do
  if wget -q --spider http://localhost:${PORT}/api/health 2>/dev/null; then
    echo "✅ Server ready"
    break
  fi
  sleep 1
done

# Seed SuperAdmin via API
echo "🔑 Seeding SuperAdmin..."
wget -q --post-data='' \
  --header="x-admin-seed-secret: ${ADMIN_SEED_SECRET:-maison-seed-2025}" \
  -O - \
  http://localhost:${PORT}/api/seed-admin 2>&1 || echo "⚠️ Seed warning"
echo "✅ Startup complete"

# Wait for server process
wait $SERVER_PID

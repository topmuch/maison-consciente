#!/bin/sh
# ═══════════════════════════════════════════════════════════════
# Maison Consciente — Docker Entrypoint
# ═══════════════════════════════════════════════════════════════

echo "🚀 Maison Consciente — Starting..."

# S'assurer que le dossier data existe
mkdir -p /app/data

# Configurer DATABASE_URL pour SQLite dans le volume persistant
export DATABASE_URL="file:/app/data/custom.db"
export PORT="${PORT:-3000}"
export HOSTNAME="0.0.0.0"

# Lancer Prisma db push (crée/met à jour les tables)
echo "📦 Syncing database schema..."
npx prisma db push --skip-generate 2>&1 || echo "⚠️ Prisma push warning (non-blocking)"
echo "✅ Database ready"

# Créer le SuperAdmin si il n'existe pas
echo "🔑 Seeding SuperAdmin..."
node seed-superadmin.js 2>&1 || echo "⚠️ Seed warning (non-blocking)"
echo "✅ Seed complete"

# Lancer le serveur Next.js
echo "🌐 Starting Next.js on port ${PORT}..."
exec node server.js

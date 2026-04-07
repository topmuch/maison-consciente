import { NextResponse } from 'next/server';
import { clearCacheByPrefix, getCacheStats } from '@/lib/recipe-cache';
import { getAuthUser } from '@/lib/server-auth';

/* ═══════════════════════════════════════════════════════
   API ROUTE — /api/themealdb/cache
   
   Development endpoint to inspect and clear the recipe cache.
   Protected by auth.
   ═══════════════════════════════════════════════════════ */

// GET /api/themealdb/cache — View cache stats
export async function GET() {
  const auth = await getAuthUser().catch(() => null);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const stats = await getCacheStats();
  return NextResponse.json({ success: true, ...stats });
}

// DELETE /api/themealdb/cache — Clear all cache
export async function DELETE() {
  const auth = await getAuthUser().catch(() => null);
  if (!auth) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  await clearCacheByPrefix('themealdb');
  return NextResponse.json({ success: true, message: 'Cache vidé avec succès' });
}

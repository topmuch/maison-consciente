/* ═══════════════════════════════════════════════════════
   MAISON CONSCIENTE V1 — Prisma Client Singleton
   ═══════════════════════════════════════════════════════ */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// Helper: safe JSON parse for Prisma string→Json fields
export function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

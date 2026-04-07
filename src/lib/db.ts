import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

/** @deprecated Use `prisma` instead — kept for backward compat */
export const db = prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
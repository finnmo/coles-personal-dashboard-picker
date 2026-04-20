import { PrismaClient } from '@prisma/client'

declare global {
  // Prevent multiple instances during Next.js hot reload in development
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db: PrismaClient =
  process.env.NODE_ENV === 'production'
    ? createPrismaClient()
    : (global.__prisma ??= createPrismaClient())

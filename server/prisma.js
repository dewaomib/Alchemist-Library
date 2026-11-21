import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__alchemistPrisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });

if (!globalForPrisma.__alchemistPrisma) {
  globalForPrisma.__alchemistPrisma = prisma;
}

export default prisma;

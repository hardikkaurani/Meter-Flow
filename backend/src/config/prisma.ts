import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

export async function connectPostgres(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('[PostgreSQL] Connected successfully via Prisma Client');
  } catch (error) {
    logger.error('[PostgreSQL] Connection failed:', error);
    throw error;
  }
}

export async function disconnectPostgres(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('[PostgreSQL] Disconnected safely');
  } catch (error) {
    logger.error('[PostgreSQL] Disconnection failed:', error);
  }
}

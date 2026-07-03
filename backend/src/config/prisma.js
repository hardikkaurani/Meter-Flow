// Postgres = source of truth for orgs, users, APIs, keys, plans, invoices.
import { PrismaClient } from '@prisma/client';
import { config } from './index.js';

export const prisma = new PrismaClient({
  log: config.env === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectPostgres() {
  await prisma.$connect();
  console.log('[postgres] connected via Prisma');
}

export async function disconnectPostgres() {
  await prisma.$disconnect();
}

import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Absolute path to DB — avoids Turbopack/iframe CWD issues
  const dbPath = path.join('/home/z/my-project/connect/db/custom.db');
  return new PrismaClient({
    datasourceUrl: `file:${dbPath}`,
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;

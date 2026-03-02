import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws helpful errors instead of crashing on import
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === '$connect' || prop === '$disconnect') {
          return () => Promise.resolve();
        }
        if (prop === 'then') return undefined; // Prevent Promise-like behavior
        return new Proxy(
          {},
          {
            get() {
              return () => {
                throw new Error(
                  'DATABASE_URL is not configured. Add a PostgreSQL database URL to your environment variables.'
                );
              };
            },
          }
        );
      },
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

import { PrismaClient } from '@prisma/client';
import { inMemoryPrisma, seedMemoryDb } from './inMemoryPrisma';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const isExplicitMemory = process.env.USE_MEMORY_DB === 'true';
const isTestEnv = process.env.NODE_ENV === 'test';

// If explicitly requested or running tests, use in-memory Prisma store
let prismaInstance: any;

if (isExplicitMemory || isTestEnv) {
  prismaInstance = inMemoryPrisma;
  seedMemoryDb();
} else {
  // Check if live PrismaClient should be initialized
  const client =
    global.prismaGlobal ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

  if (process.env.NODE_ENV !== 'production') {
    global.prismaGlobal = client;
  }

  // Create a resilient proxy: if live connection fails on first call, smoothly fallback to in-memory store
  prismaInstance = new Proxy(client, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver);
      if (typeof orig === 'object' && orig !== null) {
        return new Proxy(orig, {
          get(modelTarget, modelProp) {
            const method = Reflect.get(modelTarget, modelProp);
            if (typeof method === 'function') {
              return async (...args: any[]) => {
                try {
                  return await method.apply(modelTarget, args);
                } catch (dbErr: any) {
                  // If PostgreSQL server is not reachable, fallback to in-memory store
                  const msg = dbErr?.message || '';
                  if (
                    msg.includes("Can't reach database server") ||
                    msg.includes('Connection refused') ||
                    msg.includes('ECONNREFUSED') ||
                    msg.includes('P1001')
                  ) {
                    console.warn('[Prisma] PostgreSQL not reachable. Seamlessly falling back to in-memory store.');
                    await seedMemoryDb();
                    const memModel = (inMemoryPrisma as any)[prop];
                    if (memModel && typeof memModel[modelProp] === 'function') {
                      return memModel[modelProp](...args);
                    }
                  }
                  throw dbErr;
                }
              };
            }
            return method;
          },
        });
      }
      return orig;
    },
  });
}

export const prisma = prismaInstance;

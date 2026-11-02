/**
 * Global test setup for Phase 2 vitest tests.
 *
 * All Phase 2 tests hit a real PostgreSQL database.
 * - Each test file manages its OWN beforeAll/afterAll for resource cleanup.
 * - This global setup only ensures the DB connection is alive at the start
 *   and fully disconnects at the very end.
 *
 * IMPORTANT: Test files must NOT call prisma.$disconnect() in their own
 * afterAll hooks — only the global afterAll does this.
 */
import { afterAll, beforeAll } from 'vitest';
import { prisma } from '../src/prisma';

// Ensure NODE_ENV=test so the server won't start its own HTTP listener
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

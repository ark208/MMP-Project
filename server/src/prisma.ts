// Single Prisma connection pool — re-exported from config/prisma.
// All route files that import from '../prisma' now use the same instance.
export { prisma } from './config/prisma';
export { prisma as default } from './config/prisma';

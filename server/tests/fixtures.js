import { after } from 'node:test';
import { seed, prisma as seedPrisma } from '../prisma/seed.js';
import { prisma } from '../src/prisma.js';

after(async () => {
  await Promise.all([prisma.$disconnect(), seedPrisma.$disconnect()]);
});

export async function resetTestData() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('Set TEST_DATABASE_URL to a dedicated test database before running integration tests.');
  }

  await seed({ silent: true, fast: true });
}

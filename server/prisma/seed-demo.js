import { prisma, seed } from './seed.js';

try {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(534581)`;
    if (await tx.user.count() === 0) {
      await seed({ client: tx, clearExisting: false });
    }
  }, { timeout: 30_000 });
} finally {
  await prisma.$disconnect();
}

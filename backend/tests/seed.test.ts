import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { seed } from '../prisma/seed';

const adminEmail = 'admin@hoard.test';

describe('database seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('keeps the same categories and admin when the seed runs twice', async () => {
    await seed();
    const firstCount = await prisma.category.count();

    await seed();
    const secondCount = await prisma.category.count();
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    expect(secondCount).toBe(firstCount);
    expect(firstCount).toBe(11);
    expect(admin?.role).toBe('ADMIN');
    expect(admin?.passwordHash).not.toBe('test-admin-password');
  });
});

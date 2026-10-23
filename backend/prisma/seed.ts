import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/password';

const CATEGORIES = [
  { name: 'Food & Groceries', isDefault: false },
  { name: 'Transport', isDefault: false },
  { name: 'Airtime & Data', isDefault: false },
  { name: 'Rent', isDefault: false },
  { name: 'Utilities', isDefault: false },
  { name: 'Education', isDefault: false },
  { name: 'Health', isDefault: false },
  { name: 'Entertainment', isDefault: false },
  { name: 'Personal Care', isDefault: false },
  { name: 'Savings Group (Ikimina)', isDefault: false },
  { name: 'Uncategorized', isDefault: true },
] as const;

export const seed = async (): Promise<void> => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error('ADMIN_PASSWORD is required to seed the admin account');
  }
  if (!email || !name) {
    throw new Error('ADMIN_EMAIL and ADMIN_NAME are required to seed the admin account');
  }

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { isDefault: category.isDefault },
      create: { name: category.name, isDefault: category.isDefault },
    });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: 'ADMIN' },
    create: { name, email, passwordHash, role: 'ADMIN' },
  });
};

const invokedDirectly = process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/seed.ts') === true;

if (invokedDirectly) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      await prisma.$disconnect();
      process.exit(1);
    });
}

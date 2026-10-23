import { prisma } from '../lib/prisma';

export const listCategories = async () => {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, isDefault: true },
    orderBy: { name: 'asc' },
  });

  return [
    ...categories.filter((category) => category.name !== 'Uncategorized'),
    ...categories.filter((category) => category.name === 'Uncategorized'),
  ];
};

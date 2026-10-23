import { prisma } from '../lib/prisma';
import { monthRange } from '../utils/calendar';
import { toPublicUser } from './auth';

const RECENT_LIMIT = 10;
const RANKED_LIMIT = 5;

// Expense dates are stored as calendar days, so only "which month is it now" depends on Kigali time.
const currentKigaliMonth = (): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kigali', year: 'numeric', month: '2-digit' }).format(
    new Date(),
  );

export const getPlatformInsights = async () => {
  const month = monthRange(currentKigaliMonth());
  const [users, allExpenses, monthExpenses, categories, spending, recentExpenses, recentSignUps] =
    await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.expense.aggregate({ _count: { _all: true }, _sum: { amount: true } }),
      prisma.expense.aggregate({
        where: { date: { gte: month.start, lt: month.end } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.expense.groupBy({ by: ['categoryId'], _count: { _all: true }, _sum: { amount: true } }),
      prisma.expense.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          paymentMethod: true,
          category: { select: { name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
    ]);

  const spendingByCategory = new Map(spending.map((row) => [row.categoryId, row]));
  const categoryTotals = categories
    .map((category) => {
      const row = spendingByCategory.get(category.id);
      return {
        id: category.id,
        name: category.name,
        total: row?._sum.amount ?? 0,
        count: row?._count._all ?? 0,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));

  return {
    totals: {
      users,
      expenses: allExpenses._count._all,
      value: allExpenses._sum.amount ?? 0,
      expensesThisMonth: monthExpenses._count._all,
      valueThisMonth: monthExpenses._sum.amount ?? 0,
    },
    categories: categoryTotals,
    topCategories: categoryTotals.slice(0, RANKED_LIMIT),
    bottomCategories: categoryTotals.slice(-RANKED_LIMIT).reverse(),
    recentExpenses: recentExpenses.map((expense) => ({ ...expense, category: expense.category.name })),
    recentSignUps: recentSignUps.map(toPublicUser),
  };
};

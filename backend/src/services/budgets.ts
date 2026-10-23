import { prisma } from '../lib/prisma';
import { HttpError } from '../utils/http-error';
import { monthRange } from '../utils/calendar';
import { getBudgetStatus, type BudgetStatus } from './budget-status';

export type BudgetSummary = {
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: BudgetStatus;
};

const spentInMonth = async (userId: string, month: string): Promise<number> => {
  const range = monthRange(month);
  const total = await prisma.expense.aggregate({
    where: {
      userId,
      date: { gte: range.start, lt: range.end },
    },
    _sum: { amount: true },
  });
  return total._sum.amount ?? 0;
};

const summarise = async (userId: string, month: string, amount: number): Promise<BudgetSummary> => {
  const spent = await spentInMonth(userId, month);
  return {
    month,
    amount,
    spent,
    remaining: amount - spent,
    percentUsed: Math.round((spent / amount) * 1000) / 10,
    status: getBudgetStatus(spent, amount),
  };
};

export const setBudget = async (userId: string, month: string, amount: number) => {
  await prisma.budget.upsert({
    where: { userId_month: { userId, month } },
    update: { amount },
    create: { userId, month, amount },
  });

  return summarise(userId, month, amount);
};

export const getBudget = async (userId: string, month: string) => {
  const budget = await prisma.budget.findUnique({
    where: { userId_month: { userId, month } },
  });
  if (!budget) {
    throw new HttpError(404, `No budget set for ${month}`);
  }

  return summarise(userId, month, budget.amount);
};

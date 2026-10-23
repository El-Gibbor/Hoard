import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import type { CreateExpenseInput, ListExpensesQuery } from '../schemas/expenses';
import { HttpError } from '../utils/http-error';
import { calendarDate, monthRange } from '../utils/calendar';

const expenseInclude = {
  category: { select: { id: true, name: true } },
} as const;

export const createExpense = async (userId: string, input: CreateExpenseInput) => {
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new HttpError(400, 'Category not found');
  }

  return prisma.expense.create({
    data: {
      userId,
      categoryId: input.categoryId,
      title: input.title,
      amount: input.amount,
      date: calendarDate(input.date),
      paymentMethod: input.paymentMethod,
      notes: input.notes,
    },
    include: expenseInclude,
  });
};

export const listExpenses = async (userId: string, query: ListExpensesQuery) => {
  // #5 adds search, filter and sort onto this object.
  const where: Prisma.ExpenseWhereInput = { userId };
  if (query.month) {
    const range = monthRange(query.month);
    where.date = { gte: range.start, lt: range.end };
  }

  return prisma.expense.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: expenseInclude,
  });
};

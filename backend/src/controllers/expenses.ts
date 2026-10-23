import type { Request, Response } from 'express';
import { createExpenseSchema, listExpensesQuerySchema } from '../schemas/expenses';
import { createExpense, listExpenses } from '../services/expenses';
import { HttpError } from '../utils/http-error';

export const postExpense = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const body = createExpenseSchema.parse(req.body);
  const expense = await createExpense(req.user.id, body);
  res.status(201).json(expense);
};

export const getExpenses = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const query = listExpensesQuerySchema.parse(req.query);
  const expenses = await listExpenses(req.user.id, query);
  res.status(200).json(expenses);
};

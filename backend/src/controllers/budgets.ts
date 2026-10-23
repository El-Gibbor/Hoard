import type { Request, Response } from 'express';
import { budgetAmountSchema, budgetMonthSchema } from '../schemas/budgets';
import { getBudget, setBudget } from '../services/budgets';
import { HttpError } from '../utils/http-error';

export const putBudget = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const { month } = budgetMonthSchema.parse(req.params);
  const { amount } = budgetAmountSchema.parse(req.body);
  const summary = await setBudget(req.user.id, month, amount);
  res.status(200).json(summary);
};

export const getBudgetSummary = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new HttpError(401, 'Missing or invalid token');
  }

  const { month } = budgetMonthSchema.parse(req.params);
  const summary = await getBudget(req.user.id, month);
  res.status(200).json(summary);
};

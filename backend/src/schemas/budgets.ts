import { z } from 'zod';
import { amountSchema } from './amount';
import { monthSchema } from './month';

export const budgetMonthSchema = z.object({
  month: monthSchema,
});

export const budgetAmountSchema = z.object({
  amount: amountSchema,
});

export type BudgetAmountInput = z.infer<typeof budgetAmountSchema>;
